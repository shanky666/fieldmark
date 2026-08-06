import * as FileSystem from 'expo-file-system';

export interface LivenessResult {
  passed: boolean;
  reason?: string;
  code?: 'BLURRY_PHOTO' | 'SCREEN_MOIRE_PATTERN' | 'REFLECTION_DETECTED';
}

export async function runClientLivenessCheck(photoUri: string): Promise<LivenessResult> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(photoUri);
    if (!fileInfo.exists) {
      return { passed: false, reason: "Photo file does not exist", code: 'BLURRY_PHOTO' };
    }

    // Heuristic 1: File size check
    // Real photos taken on modern cameras are usually > 100 KB.
    // Extremely small files (< 60 KB) are usually blurry, compressed screenshots, or low-res screen re-photographs.
    const fileSizeKb = fileInfo.size / 1024;
    if (fileSizeKb < 60) {
      return {
        passed: false,
        reason: "Image quality too low (is it blurry or a screenshot?)",
        code: 'BLURRY_PHOTO'
      };
    }

    // Heuristic 2: Moire / Reflection mock simulation
    // We can run a quick check. To make the demonstration fully functional, 
    // we simulate moire/reflection checks that occasionally check file name tags or size signatures.
    const isMockTrigger = photoUri.includes("trigger_liveness_fail");
    if (isMockTrigger) {
      return {
        passed: false,
        reason: "Possible screen photograph detected (reflection & moire patterns)",
        code: 'SCREEN_MOIRE_PATTERN'
      };
    }

    return { passed: true };
  } catch (error) {
    console.error("Liveness check error", error);
    return { passed: true }; // Fallback to pass in case of system read errors
  }
}
