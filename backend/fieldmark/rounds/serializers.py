from rest_framework import serializers
from fieldmark.workers.serializers import ZoneSerializer, WorkerSerializer
from .models import FieldRound

class FieldRoundSerializer(serializers.ModelSerializer):
    supervisor_detail = WorkerSerializer(source='supervisor', read_only=True)
    zone_detail = ZoneSerializer(source='zone', read_only=True)
    associated_workers_detail = WorkerSerializer(source='associated_workers', many=True, read_only=True)

    class Meta:
        model = FieldRound
        fields = [
            'id', 'supervisor', 'supervisor_detail', 'zone', 'zone_detail', 
            'visited_at', 'start_time', 'latitude', 'longitude', 'gps_accuracy', 'photo_url', 
            'worker_count_observed', 'associated_workers', 'associated_workers_detail', 
            'notes', 'remarks', 'status'
        ]
        read_only_fields = ['id', 'supervisor', 'visited_at']

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user:
            data['supervisor'] = request.user
        return data
