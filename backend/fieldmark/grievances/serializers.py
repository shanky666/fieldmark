from rest_framework import serializers
from fieldmark.workers.serializers import WorkerSerializer
from .models import GrievanceMessage

class GrievanceMessageSerializer(serializers.ModelSerializer):
    sender_detail = WorkerSerializer(source='sender', read_only=True)
    recipient_detail = WorkerSerializer(source='recipient', read_only=True)

    class Meta:
        model = GrievanceMessage
        fields = [
            'id', 'sender', 'sender_detail', 'recipient', 'recipient_detail', 
            'subject', 'message', 'attachment_url', 'is_read', 
            'is_resolved', 'created_at', 'thread_id'
        ]
        read_only_fields = ['id', 'sender', 'recipient', 'is_read', 'created_at', 'thread_id']


class GrievanceThreadSerializer(serializers.Serializer):
    thread_id = serializers.UUIDField()
    subject = serializers.CharField()
    is_resolved = serializers.BooleanField()
    last_message = serializers.CharField()
    timestamp = serializers.DateTimeField()
    unread_count = serializers.IntegerField()
    other_party = WorkerSerializer(allow_null=True, required=False)
