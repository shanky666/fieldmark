import { useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const takePhoto = async (): Promise<string | null> => {
    if (!cameraRef.current || isCapturing) return null;
    
    setIsCapturing(true);
    try {
      const options = {
        quality: 0.85,
        skipProcessing: false,
      };
      
      const photo = await cameraRef.current.takePictureAsync(options);
      setIsCapturing(false);
      return photo?.uri ?? null;
    } catch (e) {
      console.error("Camera capture failed", e);
      setIsCapturing(false);
      return null;
    }
  };

  return {
    permission,
    requestPermission,
    cameraRef,
    isCapturing,
    takePhoto
  };
}
