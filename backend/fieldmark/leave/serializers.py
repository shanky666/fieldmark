from rest_framework import serializers
from fieldmark.workers.serializers import WorkerSerializer
from .models import LeaveRequest, LeaveBalance

class LeaveRequestSerializer(serializers.ModelSerializer):
    worker_detail = WorkerSerializer(source='worker', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'worker', 'worker_detail', 'leave_type', 'start_date', 
            'end_date', 'reason', 'status', 'approved_by', 
            'approved_by_name', 'approved_at', 'rejection_note', 'created_at'
        ]
        read_only_fields = ['id', 'worker', 'status', 'approved_by', 'approved_at', 'created_at']

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user:
            data['worker'] = request.user
            
        start = data.get('start_date')
        end = data.get('end_date')
        
        if start and end and start > end:
            raise serializers.ValidationError("Start date must be before or equal to end date.")
            
        return data


class LeaveBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveBalance
        fields = '__all__'
