import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { SupervisorStackParamList } from '../../navigation/SupervisorNavigator';

type LogFieldRoundNavProp = StackNavigationProp<SupervisorStackParamList, 'LogFieldRound'>;

interface LogFieldRoundProps {
  navigation: LogFieldRoundNavProp;
}

export default function LogFieldRound({ navigation }: LogFieldRoundProps) {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();

  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<number[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New states for extended field log
  const [remarks, setRemarks] = useState('');
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{latitude: number; longitude: number; accuracy: number} | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Load Zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await apiClient.get('/api/workers/zones/');
        setZones(res.data);
        
        // Auto select supervisor's assigned zone
        if (userProfile?.zone_detail) {
          const match = res.data.find((z: any) => z.id === userProfile.zone_detail.id);
          if (match) setSelectedZone(match);
        } else if (res.data.length > 0) {
          setSelectedZone(res.data[0]);
        }
      } catch (e) {
        console.error("Failed to load zones", e);
      } finally {
        setLoadingZones(false);
      }
    };
    fetchZones();
    fetchGpsLocation(); // pre-fetch GPS on load
  }, [userProfile]);

  // Load workers when selected zone changes
  useEffect(() => {
    if (!selectedZone) return;

    const fetchWorkers = async () => {
      setLoadingWorkers(true);
      try {
        const res = await apiClient.get(`/api/workers/list/?zone=${selectedZone.id}&status=active`);
        setWorkers(res.data.results || res.data || []);
        // Reset selections
        setSelectedWorkerIds([]);
      } catch (e) {
        console.error("Failed to load zone workers", e);
      } finally {
        setLoadingWorkers(false);
      }
    };
    fetchWorkers();
  }, [selectedZone]);

  const fetchGpsLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS permission is required.');
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGpsLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy || 0,
      });
    } catch (e) {
      console.warn('Failed to fetch GPS', e);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleGalleryPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const toggleWorker = (id: number) => {
    setSelectedWorkerIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedWorkerIds.length === workers.length) {
      setSelectedWorkerIds([]); // unselect all
    } else {
      setSelectedWorkerIds(workers.map(w => w.id)); // select all
    }
  };

  const handleLogRound = async () => {
    if (!selectedZone) {
      Alert.alert(t('common.error'), "Please select a zone.");
      return;
    }
    if (!gpsLocation) {
      Alert.alert(t('common.error'), "GPS location is required. Please capture GPS.");
      return;
    }

    setSubmitting(true);
    try {
      let finalPhotoUrl = "field_round_geotag.jpg";

      // Upload photo if taken
      if (photoUri) {
        const presignRes = await apiClient.post('/api/s3/presign/', {
          filename: `field_log_${Date.now()}.jpg`,
          content_type: 'image/jpeg'
        });
        const { upload_url, s3_key } = presignRes.data;

        await FileSystem.uploadAsync(upload_url, photoUri, {
          httpMethod: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT
        });
        finalPhotoUrl = s3_key;
      }

      await apiClient.post('/api/rounds/', {
        zone: selectedZone.id,
        worker_count_observed: selectedWorkerIds.length,
        associated_workers: selectedWorkerIds,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        gps_accuracy: gpsLocation.accuracy,
        start_time: startTime || null,
        photo_url: finalPhotoUrl,
        notes: `Supervisor headcount check: ${selectedWorkerIds.length} workers observed on site.`,
        remarks: remarks,
        status: 'OPEN'
      });

      Alert.alert(t('common.success'), "Field log created successfully.");
      navigation.goBack();
    } catch (e: any) {
      console.error("Log field round error", e);
      Alert.alert(t('common.error'), e?.response?.data?.error || "Failed to submit field log. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingZones) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Field Log</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Zone Picker */}
        <View style={styles.sectionBlock}>
          <Text style={styles.label}>1. Select Field Zone</Text>
          <View style={styles.pillRow}>
            {zones.map((z) => (
              <TouchableOpacity
                key={z.id}
                style={[styles.pill, selectedZone?.id === z.id && styles.activePill]}
                onPress={() => setSelectedZone(z)}
              >
                <Text style={[styles.pillLabel, selectedZone?.id === z.id && styles.activePillLabel]}>
                  {z.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* GPS & Photo */}
        <View style={styles.sectionBlock}>
          <Text style={styles.label}>2. Field Evidence</Text>
          <View style={styles.evidenceRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={fetchGpsLocation} 
                disabled={gpsLoading}
              >
                {gpsLoading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.actionBtnText}>📍 Get GPS</Text>}
              </TouchableOpacity>
              {gpsLocation ? (
                <Text style={styles.helperText}>
                  {gpsLocation.latitude.toFixed(5)}, {gpsLocation.longitude.toFixed(5)} 
                  {"\n"}±{gpsLocation.accuracy.toFixed(1)}m
                </Text>
              ) : (
                <Text style={styles.helperText}>GPS not captured</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleTakePhoto}>
                <Text style={styles.actionBtnText}>📷 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGalleryPhoto} style={{ marginTop: 6 }}>
                <Text style={[styles.helperText, { textAlign: 'center', color: COLORS.primary }]}>or pick from gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
          {photoUri && (
             <Image source={{ uri: photoUri }} style={styles.previewImage} />
          )}
        </View>

        {/* Log Details */}
        <View style={styles.sectionBlock}>
          <Text style={styles.label}>3. Log Details</Text>
          <Text style={styles.subLabel}>Start Time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="14:30"
          />
          <Text style={styles.subLabel}>Remarks / Activity Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Describe field activity..."
            multiline
          />
        </View>

        {/* Workers Checklist */}
        <View style={styles.checklistContainer}>
          <View style={styles.checklistHeader}>
            <Text style={styles.label}>4. Associate Workers</Text>
            {workers.length > 0 && (
              <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllBtn}>
                <Text style={styles.selectAllText}>
                  {selectedWorkerIds.length === workers.length ? "Unselect All" : "Select All"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingWorkers ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : workers.length === 0 ? (
            <Text style={styles.emptyText}>No active workers assigned to this zone.</Text>
          ) : (
            workers.map(item => {
              const isChecked = selectedWorkerIds.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.workerRow, isChecked && styles.workerRowChecked]}
                  onPress={() => toggleWorker(item.id)}
                >
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{item.name}</Text>
                    <Text style={styles.workerId}>Id: {item.employee_id}</Text>
                  </View>
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          disabled={submitting}
          onPress={handleLogRound}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>
              Create Field Log ({selectedWorkerIds.length} workers)
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 12,
    minHeight: 44,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  sectionBlock: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.darkText,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.lightText,
    marginTop: 6,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 10,
    resizeMode: 'cover',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 38,
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillLabel: {
    fontSize: 12,
    color: COLORS.darkText,
    fontWeight: '500',
  },
  activePillLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  checklistContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: COLORS.white,
    paddingBottom: 20,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectAllText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  workerRow: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  workerRowChecked: {
    borderColor: COLORS.accent + '88',
    backgroundColor: '#f5fcf5',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  workerId: {
    fontSize: 11,
    color: COLORS.lightText,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  checkboxTick: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: '#a8dba8',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0faf0',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightText,
    fontSize: 13,
    marginTop: 20,
  },
});
