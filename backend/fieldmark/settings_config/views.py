from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from .models import AnomalyRuleConfig
from .serializers import AnomalyRuleConfigSerializer

class AnomalyRuleConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Retrieve all rules configured in settings."""
        if not request.user.is_superuser:
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        rules = AnomalyRuleConfig.objects.all().order_by('rule_name')
        # If no rules exist in db, return empty list
        serializer = AnomalyRuleConfigSerializer(rules, many=True)
        return Response(serializer.data)

    def put(self, request):
        """Update multiple rules in bulk."""
        if not request.user.is_superuser:
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        rules_data = request.data.get('rules', [])
        if not isinstance(rules_data, list):
            return Response({'error': 'rules must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        updated_rules = []
        before_states = {}
        after_states = {}

        with transaction.atomic():
            for rule_item in rules_data:
                name = rule_item.get('rule_name')
                if not name:
                    continue
                
                # Fetch existing or create new
                rule_obj, created = AnomalyRuleConfig.objects.get_or_create(
                    rule_name=name,
                    defaults={
                        'is_enabled': rule_item.get('is_enabled', True),
                        'threshold_value': rule_item.get('threshold_value', 0.0),
                        'threshold_unit': rule_item.get('threshold_unit', '')
                    }
                )
                
                if not created:
                    # Save before state for auditing
                    before_states[name] = {
                        'is_enabled': rule_obj.is_enabled,
                        'threshold_value': rule_obj.threshold_value,
                        'threshold_unit': rule_obj.threshold_unit
                    }
                    
                    # Update fields
                    rule_obj.is_enabled = rule_item.get('is_enabled', rule_obj.is_enabled)
                    rule_obj.threshold_value = rule_item.get('threshold_value', rule_obj.threshold_value)
                    rule_obj.threshold_unit = rule_item.get('threshold_unit', rule_obj.threshold_unit)
                else:
                    before_states[name] = 'CREATED'

                rule_obj.updated_by = request.user
                rule_obj.save()
                updated_rules.append(rule_obj)
                
                after_states[name] = {
                    'is_enabled': rule_obj.is_enabled,
                    'threshold_value': rule_obj.threshold_value,
                    'threshold_unit': rule_obj.threshold_unit
                }

            # Write Audit Log
            from fieldmark.audit.models import AuditLog
            AuditLog.objects.create(
                action_by=request.user,
                action="UPDATE_ANOMALY_RULES",
                target_model="AnomalyRuleConfig",
                target_id=None,
                before_state=before_states,
                after_state=after_states,
                ip_address=request.META.get('REMOTE_ADDR')
            )

        serializer = AnomalyRuleConfigSerializer(updated_rules, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
