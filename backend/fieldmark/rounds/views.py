from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import FieldRound
from .serializers import FieldRoundSerializer

class FieldRoundViewSet(viewsets.ModelViewSet):
    queryset = FieldRound.objects.all().order_by('-visited_at')
    serializer_class = FieldRoundSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Role restriction: Workers cannot view field rounds. 
        # Supervisors and Admins can see rounds.
        if not (user.is_superuser or user.is_staff):
            return queryset.none()

        zone = self.request.query_params.get('zone')
        date_param = self.request.query_params.get('date')

        if zone:
            queryset = queryset.filter(zone_id=zone)
        if date_param:
            queryset = queryset.filter(visited_at__date=date_param)

        return queryset

    @action(detail=False, methods=['get'], url_path='me')
    def my_rounds(self, request):
        user = request.user
        queryset = FieldRound.objects.filter(supervisor=user).order_by('-visited_at')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
