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
    supervisor_name = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    password_reset_by_name = serializers.CharField(source='password_reset_by.name', read_only=True)
    status_changed_by_name = serializers.CharField(source='status_changed_by.name', read_only=True)

    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Worker
        fields = [
            'id', 'phone', 'name', 'employee_id', 'password', 'worker_type', 
            'assigned_zone', 'zone_detail', 'shift', 'shift_detail', 'supervisor_name',
            'contract_start_date', 'contract_end_date', 'profile_photo_url', 
            'fcm_token', 'preferred_language', 'is_active', 'is_staff', 'created_at',
            'last_password_reset_at', 'password_reset_by_name',
            'last_status_changed_at', 'status_changed_by_name', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'last_password_reset_at', 'last_status_changed_at']

    def get_supervisor_name(self, obj):
        if obj.assigned_zone:
            supervisor = Worker.objects.filter(is_staff=True, assigned_zone=obj.assigned_zone).first()
            if supervisor:
                return supervisor.name
        return None

    def create(self, validated_data):
        password = validated_data.pop('password', None) or self.initial_data.get('password')
        is_staff = validated_data.get('is_staff', False)
        if 'is_staff' in self.initial_data:
            is_staff = str(self.initial_data.get('is_staff')).lower() in ['true', '1']

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
            is_active=validated_data.get('is_active', True),
            is_staff=is_staff
        )
        if password:
            user.set_password(password)
            user.save()
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
