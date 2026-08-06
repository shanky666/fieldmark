from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

def get_decimal_from_dms(dms, ref):
    """Convert degrees, minutes, seconds and reference direction to decimal degrees."""
    degrees = float(dms[0])
    minutes = float(dms[1])
    seconds = float(dms[2])
    
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal


def extract_exif_gps(image_file):
    """
    Extract GPS decimal coordinates from an image file.
    Returns (latitude, longitude) or (None, None).
    """
    try:
        img = Image.open(image_file)
        exif_data = img._getexif()
        if not exif_data:
            return None, None
        
        gps_info = {}
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)
            if tag_name == "GPSInfo":
                for gps_tag_id in value:
                    gps_tag_name = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_info[gps_tag_name] = value[gps_tag_id]
        
        if not gps_info:
            return None, None
            
        lat_dms = gps_info.get("GPSLatitude")
        lat_ref = gps_info.get("GPSLatitudeRef")
        lng_dms = gps_info.get("GPSLongitude")
        lng_ref = gps_info.get("GPSLongitudeRef")
        
        if lat_dms and lat_ref and lng_dms and lng_ref:
            lat = get_decimal_from_dms(lat_dms, lat_ref)
            lng = get_decimal_from_dms(lng_dms, lng_ref)
            return lat, lng
            
    except Exception as e:
        print(f"Error extracting EXIF GPS: {str(e)}")
        
    return None, None
