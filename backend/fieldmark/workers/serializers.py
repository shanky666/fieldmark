from rest_framework import serializers
from .models import Shift, Zone, Worker, ZoneReassignmentHistory

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'


class ZoneSerializer(serializers.ModelSerializer):
    shift_detail = ShiftSerializer(source='shift', read_only=True)

    class Meta:
        model = Zone
        fields = '__all__'


class WorkerSerializer(serializers.ModelSerializer):
    zone_detail = ZoneSerializer(source='assigned_zone', read_only=True)
    shift_detail = ShiftSerializer(source='shift', read_only=True)

    class Meta:
        model = Worker
        fields = [
            'id', 'phone', 'name', 'employee_id', 'worker_type', 
            'assigned_zone', 'zone_detail', 'shift', 'shift_detail',
            'contract_start_date', 'contract_end_date', 'profile_photo_url', 
            'fcm_token', 'preferred_language', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        # Generate inactive / unusable password by default for workers
        user = Worker.objects.create_user(
            phone=validated_data['phone'],
            name=validated_data.get('name', ''),
            employee_id=validated_data.get('employee_id'),
            worker_type=validated_data.get('worker_type', Worker.WorkerType.PERMANENT),
            assigned_zone=validated_data.get('assigned_zone'),
            shift=validated_data.get('shift'),
            contract_start_date=validated_data.get('contract_start_date'),
            contract_end_date=validated_data.get('contract_end_date'),
            preferred_language=validated_data.get('preferred_language', Worker.LanguageChoices.EN),
            is_active=validated_data.get('is_active', True)
        )
        return user


class ZoneReassignmentHistorySerializer(serializers.ModelSerializer):
    from_zone_name = serializers.CharField(source='from_zone.name', read_only=True)
    to_zone_name = serializers.CharField(source='to_zone.name', read_only=True)
    reassigned_by_name = serializers.CharField(source='reassigned_by.name', read_only=True)

    class Meta:
        model = ZoneReassignmentHistory
        fields = [
            'id', 'worker', 'from_zone', 'from_zone_name', 'to_zone', 
            'to_zone_name', 'reassigned_by', 'reassigned_by_name', 
            'reassigned_at', 'reason'
        ]
        read_only_fields = ['id', 'reassigned_by', 'reassigned_at']
