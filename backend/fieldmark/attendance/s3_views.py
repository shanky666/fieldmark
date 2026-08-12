import os
import uuid
import boto3
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

class S3PresignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        filename = request.data.get('filename', 'photo.jpg')
        content_type = request.data.get('content_type', 'image/jpeg')

        # Generate a unique S3 key
        unique_id = str(uuid.uuid4())
        s3_key = f"attendance/{unique_id}_{filename}"

        # If AWS credentials are set, generate real S3 presigned URL (works for R2 as well)
        if getattr(settings, 'AWS_ACCESS_KEY_ID', None) and getattr(settings, 'AWS_SECRET_ACCESS_KEY', None) and not settings.AWS_S3_ENDPOINT_URL.startswith("http://r2-endpoint-placeholder"):
            try:
                # Initialize s3 client (can override endpoint for R2)
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                    config=boto3.session.Config(signature_version='s3v4')
                )
                
                upload_url = s3_client.generate_presigned_url(
                    'put_object',
                    Params={
                        'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                        'Key': s3_key,
                        'ContentType': content_type
                    },
                    ExpiresIn=3600 # 1 hour expiry
                )
            except Exception as e:
                return Response({'error': f"Failed to generate real presigned URL: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Fallback: Local mock upload url (points to our LocalMockUploadView)
            # Resolve request absolute URI to hit correct host
            host_url = request.build_absolute_uri('/')[:-1] # strip trailing slash
            upload_url = f"{host_url}/api/s3/mock-upload/?key={s3_key}"

        return Response({
            'upload_url': upload_url,
            's3_key': s3_key
        }, status=status.HTTP_200_OK)


class LocalMockUploadView(APIView):
    """
    Accepts binary PUT uploads from the mobile application and saves them 
    directly into Django's MEDIA_ROOT directory.
    """
    permission_classes = [permissions.AllowAny]

    def put(self, request):
        s3_key = request.query_params.get('key')
        if not s3_key:
            return Response({'error': 'Missing query parameter key'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_data = request.body
            if not file_data:
                return Response({'error': 'Empty file payload'}, status=status.HTTP_400_BAD_REQUEST)

            # Ensure parent directories exist under MEDIA_ROOT
            clean_key = s3_key.lstrip('/')
            target_path = os.path.join(settings.MEDIA_ROOT, clean_key)
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            
            with open(target_path, 'wb') as f:
                f.write(file_data)
            
            return Response({'message': 'File uploaded successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f"Failed to save upload: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
