from rest_framework import views, permissions, status
from rest_framework.response import Response
from .models import AuditLog
from rest_framework import serializers
from fieldmark.workers.serializers import WorkerSerializer

class AuditLogSerializer(serializers.ModelSerializer):
    actor_detail = WorkerSerializer(source='action_by', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'action_by', 'actor_detail', 'action', 'target_model', 
            'target_id', 'before_state', 'after_state', 'timestamp', 'ip_address'
        ]


class AuditLogListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        queryset = AuditLog.objects.all().order_by('-timestamp')

        # Filters
        action_param = request.query_params.get('action')
        actor_param = request.query_params.get('actor') # Name or ID
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        if action_param:
            queryset = queryset.filter(action__icontains=action_param)
        if actor_param:
            if actor_param.isdigit():
                queryset = queryset.filter(action_by_id=actor_param)
            else:
                queryset = queryset.filter(action_by__name__icontains=actor_param)
        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)

        serializer = AuditLogSerializer(queryset[:50], many=True) # Cap at 50 matches
        return Response(serializer.data, status=status.HTTP_200_OK)
