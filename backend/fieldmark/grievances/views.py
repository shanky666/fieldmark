import uuid
from django.db import transaction
from django.db.models import Max, Q, Count, OuterRef, Subquery
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from fieldmark.workers.models import Worker
from fieldmark.notifications.fcm import send_push_notification
from .models import GrievanceMessage
from .serializers import GrievanceMessageSerializer, GrievanceThreadSerializer

class GrievanceViewSet(viewsets.ModelViewSet):
    queryset = GrievanceMessage.objects.all()
    serializer_class = GrievanceMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser:
            return GrievanceMessage.objects.all()

        # Retrieve all messages where user is either sender or recipient
        queryset = GrievanceMessage.objects.filter(Q(sender=user) | Q(recipient=user))
        
        # If supervisor, they can see messages of workers in their zone as well
        if hasattr(user, 'is_staff') and user.is_staff and user.assigned_zone:
            queryset = GrievanceMessage.objects.filter(
                Q(sender=user) | 
                Q(recipient=user) | 
                Q(sender__assigned_zone=user.assigned_zone) | 
                Q(recipient__assigned_zone=user.assigned_zone)
            )
        return queryset

    def create(self, request, *args, **kwargs):
        """Creates a new grievance thread starting with an initial message."""
        user = request.user
        subject = request.data.get('subject', 'General Inquiry')
        message_text = request.data.get('message')
        attachment_url = request.data.get('attachment_url')

        if not message_text:
            return Response({'error': 'Message text is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Auto-routing recipient:
        # Find a supervisor (is_staff=True) in the worker's zone.
        # Fallback to any supervisor, or any admin (is_superuser=True)
        recipient = None
        if user.assigned_zone:
            recipient = Worker.objects.filter(
                assigned_zone=user.assigned_zone,
                is_staff=True
            ).exclude(id=user.id).first()

        if not recipient:
            recipient = Worker.objects.filter(is_staff=True).exclude(id=user.id).first()
        if not recipient:
            recipient = Worker.objects.filter(is_superuser=True).exclude(id=user.id).first()

        if not recipient:
            return Response({'error': 'No supervisor or admin available to receive grievance'}, status=status.HTTP_400_BAD_REQUEST)

        thread_id = uuid.uuid4()

        with transaction.atomic():
            msg = GrievanceMessage.objects.create(
                sender=user,
                recipient=recipient,
                subject=subject,
                message=message_text,
                attachment_url=attachment_url,
                thread_id=thread_id
            )

        # Notify supervisor
        if recipient.fcm_token:
            send_push_notification(
                token=recipient.fcm_token,
                title=f"New Grievance: {subject}",
                body=f"From {user.name}: {message_text[:60]}...",
                data={'type': 'GRIEVANCE_NEW', 'thread_id': str(thread_id)},
                lang=recipient.preferred_language
            )

        return Response(GrievanceMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='me')
    def my_threads(self, request):
        """Returns the list of active conversation threads for the current user."""
        user = request.user
        
        # Determine the base query for messages this user has access to
        if user.is_superuser:
            user_msgs = GrievanceMessage.objects.all()
        elif hasattr(user, 'is_staff') and user.is_staff and user.assigned_zone:
            user_msgs = GrievanceMessage.objects.filter(
                Q(sender=user) | 
                Q(recipient=user) | 
                Q(sender__assigned_zone=user.assigned_zone) | 
                Q(recipient__assigned_zone=user.assigned_zone)
            )
        else:
            user_msgs = GrievanceMessage.objects.filter(Q(sender=user) | Q(recipient=user))
        
        # Group by thread_id and find the latest message properties
        threads_query = user_msgs.values('thread_id').annotate(
            latest_date=Max('created_at')
        ).order_by('-latest_date')

        thread_list = []
        for t in threads_query:
            t_id = t['thread_id']
            # Get latest message
            latest_msg = GrievanceMessage.objects.filter(thread_id=t_id).order_by('-created_at').first()
            if not latest_msg:
                continue
                
            # Determine other party
            first_msg = GrievanceMessage.objects.filter(thread_id=t_id).order_by('created_at').first()
            thread_creator = first_msg.sender
            
            if user == thread_creator:
                other_party = None
            else:
                other_party = thread_creator
            
            # Count unread messages for the user
            unread_count = GrievanceMessage.objects.filter(
                thread_id=t_id,
                recipient=user,
                is_read=False
            ).count()

            thread_list.append({
                'thread_id': t_id,
                'subject': latest_msg.subject,
                'is_resolved': latest_msg.is_resolved,
                'last_message': latest_msg.message,
                'timestamp': latest_msg.created_at,
                'unread_count': unread_count,
                'other_party': other_party
            })

        serializer = GrievanceThreadSerializer(thread_list, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='messages')
    def get_messages(self, request, pk=None):
        """Retrieve all messages in a specific thread."""
        thread_id = pk
        messages = GrievanceMessage.objects.filter(thread_id=thread_id).order_by('created_at')
        
        # Verify access
        user = request.user
        if not user.is_superuser and not messages.filter(Q(sender=user) | Q(recipient=user)).exists():
            # Supervisors can access threads from workers in their zone
            if not (hasattr(user, 'is_staff') and user.is_staff and user.assigned_zone and 
                    messages.filter(Q(sender__assigned_zone=user.assigned_zone) | Q(recipient__assigned_zone=user.assigned_zone)).exists()):
                return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GrievanceMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        """Send a reply inside an existing thread."""
        thread_id = pk
        user = request.user
        message_text = request.data.get('message')
        attachment_url = request.data.get('attachment_url')

        if not message_text:
            return Response({'error': 'Message text is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch latest message in thread to identify subject and other party
        thread_msgs = GrievanceMessage.objects.filter(thread_id=thread_id).order_by('-created_at')
        first_msg = thread_msgs.last()
        latest_msg = thread_msgs.first()

        if not first_msg:
            return Response({'error': 'Thread not found'}, status=status.HTTP_404_NOT_FOUND)

        # Verify access
        if not user.is_superuser and not thread_msgs.filter(Q(sender=user) | Q(recipient=user)).exists():
            # Supervisors can reply to threads from workers in their zone
            if not (hasattr(user, 'is_staff') and user.is_staff and user.assigned_zone and 
                    thread_msgs.filter(Q(sender__assigned_zone=user.assigned_zone) | Q(recipient__assigned_zone=user.assigned_zone)).exists()):
                return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        # Recipient is the other party of the latest message
        recipient = latest_msg.recipient if latest_msg.sender == user else latest_msg.sender

        with transaction.atomic():
            reply_msg = GrievanceMessage.objects.create(
                sender=user,
                recipient=recipient,
                subject=first_msg.subject,
                message=message_text,
                attachment_url=attachment_url,
                thread_id=thread_id,
                is_resolved=first_msg.is_resolved # Inherit status
            )

        # Notify recipient of reply
        if recipient.fcm_token:
            send_push_notification(
                token=recipient.fcm_token,
                title=f"Reply: {first_msg.subject}",
                body=f"{user.name}: {message_text[:60]}...",
                data={'type': 'GRIEVANCE_REPLY', 'thread_id': str(thread_id)},
                lang=recipient.preferred_language
            )

        return Response(GrievanceMessageSerializer(reply_msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        """Mark all messages in thread as read for the current user."""
        thread_id = pk
        user = request.user
        
        updated_count = GrievanceMessage.objects.filter(
            thread_id=thread_id,
            recipient=user,
            is_read=False
        ).update(is_read=True)

        return Response({'message': f'Marked {updated_count} messages as read'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='resolve')
    def resolve(self, request, pk=None):
        """Mark grievance thread as resolved."""
        thread_id = pk
        user = request.user

        # Only supervisor or admin can resolve a grievance
        if not (user.is_superuser or user.is_staff):
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        updated_count = GrievanceMessage.objects.filter(thread_id=thread_id).update(is_resolved=True)
        return Response({'message': f'Thread resolved successfully'}, status=status.HTTP_200_OK)
