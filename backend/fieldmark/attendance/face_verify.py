"""
Face verification utility using DeepFace.
Compares employee check-in photos against their stored reference face.
"""
import os
import base64
import tempfile
import logging

logger = logging.getLogger(__name__)


def _save_base64_to_temp(base64_data: str, prefix: str = "face_") -> str:
    """Convert a base64 data URI or raw base64 string to a temp file path."""
    # Strip data URI prefix if present
    if ',' in base64_data:
        base64_data = base64_data.split(',', 1)[1]
    
    img_bytes = base64.b64decode(base64_data)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg', prefix=prefix)
    tmp.write(img_bytes)
    tmp.close()
    return tmp.name


def verify_face(reference_photo: str, new_photo: str, threshold: float = 0.60) -> dict:
    """
    Compare two face photos and return match result.
    
    Args:
        reference_photo: base64 string or file path of the stored reference face
        new_photo: base64 string or file path of the new check-in photo
        threshold: cosine similarity threshold (lower = stricter, 0.60 is moderate)
    
    Returns:
        dict with keys: 'verified' (bool), 'distance' (float), 'message' (str)
    """
    ref_path = None
    new_path = None
    
    try:
        from deepface import DeepFace
        
        # Convert base64 to temp files if needed
        if reference_photo.startswith('data:') or len(reference_photo) > 500:
            ref_path = _save_base64_to_temp(reference_photo, prefix="ref_")
        else:
            ref_path = reference_photo
            
        if new_photo.startswith('data:') or len(new_photo) > 500:
            new_path = _save_base64_to_temp(new_photo, prefix="new_")
        else:
            new_path = new_photo
        
        # Run face verification using VGG-Face model (lightweight, no dlib needed)
        result = DeepFace.verify(
            img1_path=ref_path,
            img2_path=new_path,
            model_name="VGG-Face",
            enforce_detection=False,  # Don't crash if face not perfectly detected
            detector_backend="opencv"  # Use OpenCV for detection (no dlib)
        )
        
        verified = result.get("verified", False)
        distance = result.get("distance", 1.0)
        
        return {
            'verified': verified,
            'distance': round(distance, 4),
            'message': 'Face matched successfully.' if verified else 'Face does NOT match the registered employee. Attendance blocked.'
        }
        
    except Exception as e:
        logger.error(f"Face verification error: {e}")
        return {
            'verified': False,
            'distance': 1.0,
            'message': f'Face verification failed: {str(e)}'
        }
    finally:
        # Clean up temp files
        for path in [ref_path, new_path]:
            if path and path.startswith(tempfile.gettempdir()):
                try:
                    os.remove(path)
                except Exception:
                    pass
