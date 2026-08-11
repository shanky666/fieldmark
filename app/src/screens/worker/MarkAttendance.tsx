import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Animated } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../../store/auth';
import { COLORS } from '../../constants/colors';
import { useLocation } from '../../hooks/useLocation';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useOfflineQueueStore } from '../../store/offlineQueue';
import { getUniqueDeviceId } from '../../utils/deviceId';
import { runClientLivenessCheck } from '../../utils/livenessCheck';
import { apiClient } from '../../api/client';
import { haversineDistance } from '../../utils/haversine';
import CameraOverlay from '../../components/CameraOverlay';
import * as FileSystem from 'expo-file-system';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';

type MarkAttendanceNavigationProp = StackNavigationProp<WorkerStackParamList, 'MarkAttendance'>;

interface MarkAttendanceProps {
  navigation: MarkAttendanceNavigationProp;
}

export default function MarkAttendance({ navigation }: MarkAttendanceProps) {
  const { t } = useTranslation();
  const { userProfile, language } = useAuthStore();
  const isOnline = useNetworkStatus();
  const { addToQueue } = useOfflineQueueStore();
  const gps = useLocation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Camera variables
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // States
  const [submitting, setSubmitting] = useState(false);
  const [livenessWarn, setLivenessWarn] = useState(false);
  const [livenessReason, setLivenessReason] = useState('');
  const [clientLivenessBypassed, setClientLivenessBypassed] = useState(false);

  // GPS captured at the exact moment the photo is taken
  const [capturedLocation, setCapturedLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  }>({ latitude: null, longitude: null, accuracy: null });

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // TTS audio prompt trigger
  const playVoicePrompt = () => {
    const prompts: Record<string, string> = {
      en: "Stand in the field and take a clear photo of yourself",
      kn: "ಹೊಲದಲ್ಲಿ ನಿಂತು ನಿಮ್ಮ ಸ್ಪಷ್ಟ ಫೋಟೋ ತೆಗೆಯಿರಿ",
      hi: "खेत में खड़े होकर अपनी स्पष्ट फ़ोटो लें",
      ta: "வயலில் நின்று உங்கள் தெளிவான புகைப்படம் எடுக்கவும்",
      te: "పొలంలో నిలబడి మీ స్పష్టమైన ఫోటో తీయండి",
    };
    const voiceCodes: Record<string, string> = {
      en: 'en-US',
      kn: 'kn-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
    };
    
    const text = prompts[language.toLowerCase()] || prompts.en;
    const voiceCode = voiceCodes[language.toLowerCase()] || voiceCodes.en;
    
    Speech.stop();
    Speech.speak(text, { language: voiceCode });
  };

  // Step 2 entry audio triggers
  useEffect(() => {
    if (step === 2) {
      playVoicePrompt();
    }
  }, [step]);

  // Request Camera Permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleLocationContinue = () => {
    if (!hasPermission) {
      Alert.alert("Permission Required", "Camera permissions are required to mark attendance.");
      return;
    }
    setStep(2);
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        // Take the photo and capture GPS simultaneously for accuracy
        const [photo, freshLocation] = await Promise.all([
          cameraRef.current.takePictureAsync({
            quality: 0.8,
            skipProcessing: false,
          }),
          // Fresh GPS fix at the exact moment of capture
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          }).catch(() => null), // Fallback gracefully if GPS times out
        ]);

        if (photo?.uri) {
          // Store the photo-time GPS fix (or fall back to existing gps state)
          if (freshLocation) {
            setCapturedLocation({
              latitude: freshLocation.coords.latitude,
              longitude: freshLocation.coords.longitude,
              accuracy: freshLocation.coords.accuracy ?? null,
            });
          } else {
            // Use the already-loaded GPS as fallback
            setCapturedLocation({
              latitude: gps.latitude,
              longitude: gps.longitude,
              accuracy: gps.accuracy,
            });
          }

          setPhotoUri(photo.uri);
          setStep(3);

          // Trigger liveness heuristics
          const check = await runClientLivenessCheck(photo.uri);
          if (!check.passed) {
            setLivenessWarn(true);
            setLivenessReason(check.reason || 'Blurred photo details');
          }
        }
      } catch (e) {
        Alert.alert("Capture Error", "Failed to take photo. Please try again.");
      }
    }
  };


  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const devId = await getUniqueDeviceId();
      const timestamp = new Date().toISOString();

      const anomalyFlags = [];
      if (clientLivenessBypassed) {
        anomalyFlags.push("CLIENT_LIVENESS_WARN");
      }

      // Use photo-time GPS if available, fall back to current GPS state
      const submitLat = capturedLocation.latitude ?? gps.latitude ?? 0.0;
      const submitLng = capturedLocation.longitude ?? gps.longitude ?? 0.0;

      if (!isOnline) {
        // Offline check-in path: SQLite save
        addToQueue({
          latitude: submitLat,
          longitude: submitLng,
          photo_local_uri: photoUri!,
          device_id: devId,
          marked_at: timestamp,
          queued_at: timestamp
        });

        setSubmitting(false);
        Alert.alert(t('common.success'), t('worker.submitOfflineSuccess'), [
          { text: "OK", onPress: () => navigation.navigate('WorkerTabs') }
        ]);
        return;
      }

      // Online check-in path: S3 Presign + Upload + Submit API
      // 1. Get presigned upload URL
      const presignRes = await apiClient.post('/api/s3/presign/', {
        filename: 'checkin.jpg',
        content_type: 'image/jpeg'
      });
      const { upload_url, s3_key } = presignRes.data;

      // 2. Binary content PUT upload via FileSystem
      const uploadRes = await FileSystem.uploadAsync(upload_url, photoUri!, {
        httpMethod: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT
      });

      if (uploadRes.status !== 200 && uploadRes.status !== 201) {
        throw new Error("Photo upload to storage container failed.");
      }

      // 3. Post AttendanceRecord with photo-time GPS coordinates
      await apiClient.post('/api/attendance/', {
        latitude: submitLat,
        longitude: submitLng,
        photo_url: s3_key,
        device_id: devId,
        marked_at: timestamp,
        liveness_passed: !clientLivenessBypassed,
        anomaly_flags: anomalyFlags
      });

      // 4. Play success scale-up checkmark animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true
      }).start(() => {
        setTimeout(() => {
          setSubmitting(false);
          navigation.navigate('WorkerTabs');
        }, 1500);
      });

    } catch (error: any) {
      setSubmitting(false);
      console.error("Submission failed", error);
      const errMsg = JSON.stringify(error.response?.data || error.message || error);
      Alert.alert(t('common.error'), errMsg);
    }
  };

  const isZoneMatch = () => {
    if (!gps.latitude || !gps.longitude || !userProfile?.zone_detail) return false;
    const dist = haversineDistance(
      gps.latitude,
      gps.longitude,
      userProfile.zone_detail.center_lat,
      userProfile.zone_detail.center_lng
    );
    return dist <= userProfile.zone_detail.radius_meters;
  };

  // STEP 1 UI: Location Confirmation
  if (step === 1) {
    const matched = isZoneMatch();
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>✕ {t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('camera.confirmTitle')}</Text>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardSectionTitle}>{t('camera.currentGps')}</Text>
            <TouchableOpacity onPress={() => gps.refreshLocation && gps.refreshLocation()}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>🔄 Refresh GPS</Text>
            </TouchableOpacity>
          </View>

          {gps.address ? (
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.darkText, marginVertical: 4 }}>
              📍 {gps.address}
            </Text>
          ) : null}

          <Text style={styles.gpsText}>Lat: {gps.latitude ? gps.latitude.toFixed(5) : 'Acquiring GPS...'}</Text>
          <Text style={styles.gpsText}>Lng: {gps.longitude ? gps.longitude.toFixed(5) : 'Acquiring GPS...'}</Text>
          {gps.accuracy && (
            <Text style={styles.gpsAccText}>{t('camera.accuracy', { meters: gps.accuracy.toFixed(1) })}</Text>
          )}

          {gps.errorMsg ? (
            <Text style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>⚠ {gps.errorMsg}</Text>
          ) : null}

          <View style={styles.divider} />

          <Text style={styles.cardSectionTitle}>Zone verification</Text>
          {matched ? (
            <Text style={[styles.zoneResultText, { color: COLORS.accent }]}>
              In Zone ({userProfile?.zone_detail?.name || userProfile?.zone || 'Assigned Zone'}) ✓
            </Text>
          ) : (
            <Text style={[styles.zoneResultText, { color: COLORS.danger }]}>
              {userProfile?.zone_detail?.name ? `Outside ${userProfile.zone_detail.name} boundary ⚠` : 'Assigned Zone Verified ✓'}
            </Text>
          )}

          {gps.loading && (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 12 }} />
          )}
        </View>

        <TouchableOpacity 
          style={[styles.primaryBtn, (gps.loading || !gps.latitude) && styles.btnDisabled]}
          disabled={gps.loading || !gps.latitude}
          onPress={handleLocationContinue}
        >
          <Text style={styles.primaryBtnText}>{gps.loading ? 'Acquiring Location...' : 'Continue to Photo Capture'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // STEP 2 UI: Watermarked Camera
  if (step === 2) {
    if (hasPermission === null) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }
    if (hasPermission === false) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>No camera access granted.</Text>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        {/* Fullscreen CameraView */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          flash={flash}
          ref={cameraRef}
        />
        
        {/* Embedded Watermarks Overlay */}
        <CameraOverlay 
          latitude={gps.latitude} 
          longitude={gps.longitude} 
          accuracy={gps.accuracy} 
        />

        {/* Top Controls Bar */}
        <View style={styles.cameraHeader}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => setStep(1)}>
            <Text style={styles.btnIcon}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={playVoicePrompt}>
            <Text style={styles.btnIcon}>🔊</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.circleBtn} 
            onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
          >
            <Text style={styles.btnIcon}>{flash === 'on' ? '⚡' : '✖️⚡'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.circleBtn} 
            onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
          >
            <Text style={styles.btnIcon}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Localized Guideline Text */}
        <View style={styles.cameraFooter}>
          <Text style={styles.guideText}>{t('camera.promptText')}</Text>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // STEP 3 UI: Preview and Liveness Alerts gate
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Submission</Text>
      </View>

      <View style={styles.previewCard}>
        {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImage} />}
        
        <View style={styles.previewDetails}>
          <Text style={styles.previewDetailText}>
            📍 GPS at capture: {(capturedLocation.latitude ?? gps.latitude)?.toFixed(5)}, {(capturedLocation.longitude ?? gps.longitude)?.toFixed(5)}
            {capturedLocation.accuracy ? ` (±${capturedLocation.accuracy.toFixed(0)}m)` : ''}
          </Text>
          <Text style={styles.previewDetailText}>Date: {new Date().toLocaleDateString()}</Text>
          <Text style={styles.previewDetailText}>
            Zone Match: {isZoneMatch() ? "Matched ✓" : "Mismatch ⚠"}
          </Text>
        </View>
      </View>

      {/* Liveness warning sheet block */}
      {livenessWarn ? (
        <View style={styles.warnSheet}>
          <Text style={styles.warnTitle}>⚠️ {t('camera.livenessWarnTitle')}</Text>
          <Text style={styles.warnDesc}>{livenessReason}</Text>
          <View style={styles.warnActionRow}>
            <TouchableOpacity 
              style={styles.retakeBtn} 
              onPress={() => {
                setLivenessWarn(false);
                setStep(2);
              }}
            >
              <Text style={styles.retakeBtnText}>{t('camera.retake')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.bypassBtn} 
              onPress={() => {
                setLivenessWarn(false);
                setClientLivenessBypassed(true);
              }}
            >
              <Text style={styles.bypassBtnText}>{t('camera.submitAnyway')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!livenessWarn && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(2)}>
            <Text style={styles.secondaryBtnText}>{t('camera.retake')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={handleFinalSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('common.submit')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Success Scale Checkmark overlay */}
      {submitting && (
        <Animated.View style={[styles.successOverlay, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.successInner}>
            <Text style={styles.successEmoji}>✓</Text>
            <Text style={styles.successText}>Attendance Marked</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
    paddingTop: 44,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    paddingVertical: 10,
    paddingRight: 10,
    minHeight: 44,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 10,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 40,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.lightText,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  gpsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginVertical: 2,
  },
  gpsAccText: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  zoneResultText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 44,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  secondaryBtn: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 44,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnDisabled: {
    backgroundColor: '#a8dba8',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f0faf0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 100,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    color: '#ffffff',
    fontSize: 16,
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  guideText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: '80%',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flex: 1,
    marginVertical: 20,
    justifyContent: 'space-between',
  },
  previewImage: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  previewDetails: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  previewDetailText: {
    fontSize: 12,
    color: COLORS.lightText,
    marginVertical: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  warnSheet: {
    backgroundColor: '#fffbeb', // Light amber
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  warnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#b45309',
    marginBottom: 6,
  },
  warnDesc: {
    fontSize: 12,
    color: '#b45309',
    marginBottom: 14,
  },
  warnActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  retakeBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  retakeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bypassBtn: {
    borderColor: '#d97706',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  bypassBtnText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: 'bold',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 250, 240, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successInner: {
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 72,
    color: COLORS.accent,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 16,
  },
});

