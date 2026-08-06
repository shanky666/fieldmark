from django.utils.deprecation import MiddlewareMixin

class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # We can extract the IP address here to make it easily accessible in request
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        request.client_ip = ip
        return None
