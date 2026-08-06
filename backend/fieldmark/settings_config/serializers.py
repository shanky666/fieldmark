from rest_framework import serializers
from .models import AnomalyRuleConfig

class AnomalyRuleConfigSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.name', read_only=True)

    class Meta:
        model = AnomalyRuleConfig
        fields = [
            'id', 'rule_name', 'is_enabled', 'threshold_value', 
            'threshold_unit', 'updated_by', 'updated_by_name', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_by', 'updated_at']
