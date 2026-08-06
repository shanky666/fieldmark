from django.utils import timezone
from rest_framework import serializers
from fieldmark.workers.serializers import WorkerSerializer
from .models import CorrectionRequest

class CorrectionRequestSerializer(serializers.ModelSerializer):
    worker_detail = WorkerSerializer(source='worker', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True)

    class Meta:
        model = CorrectionRequest
        fields = [
            'id', 'worker', 'worker_detail', 'date', 'reason', 
            'reason_detail', 'status', 'reviewed_by', 
            'reviewed_by_name', 'reviewed_at', 'rejection_note', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'reviewed_by', 'reviewed_at', 'created_at']

    def validate_reason_detail(self, value):
        if len(value) < 20:
            raise serializers.ValidationError("Reason detail must be at least 20 characters long.")
        return value

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user:
            data['worker'] = request.user
            
        date_requested = data.get('date')
        if date_requested and date_requested > timezone.now().date():
            raise serializers.ValidationError("Cannot request correction for a future date.")
        return data
