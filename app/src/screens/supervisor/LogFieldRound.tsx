import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';

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

    setSubmitting(true);
    try {
      await apiClient.post('/api/rounds/', {
        zone: selectedZone.id,
        worker_count_observed: selectedWorkerIds.length,
        latitude: selectedZone.center_lat || 12.9716,
        longitude: selectedZone.center_lng || 77.5946,
        photo_url: "field_round_geotag.jpg",
        notes: `Supervisor headcount check: ${selectedWorkerIds.length} workers observed on site.`
      });

      Alert.alert(t('common.success'), "Field round logged successfully.");
      navigation.goBack();
    } catch (e) {
      console.error("Log field round error", e);
      Alert.alert(t('common.error'), "Failed to submit field round log. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderWorkerItem = ({ item }: { item: any }) => {
    const isChecked = selectedWorkerIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.workerRow, isChecked && styles.workerRowChecked]}
        onPress={() => toggleWorker(item.id)}
      >
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{item.name}</Text>
          <Text style={styles.workerId}>Id: {item.employee_id}</Text>
        </View>
        
        {/* Checkbox circle */}
        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
          {isChecked && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
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
        <Text style={styles.headerTitle}>Log Field Round</Text>
      </View>

      {/* Zone Picker bar */}
      <View style={styles.zoneBar}>
        <Text style={styles.label}>Select Field Zone</Text>
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

      {/* Workers Checklist */}
      <View style={styles.checklistContainer}>
        <View style={styles.checklistHeader}>
          <Text style={styles.subtitle}>Observe Workers in Field</Text>
          {workers.length > 0 && (
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllBtn}>
              <Text style={styles.selectAllText}>
                {selectedWorkerIds.length === workers.length ? "Unselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingWorkers ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={workers}
            renderItem={renderWorkerItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No active workers assigned to this zone.</Text>
            }
          />
        )}
      </View>

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
              Submit Round ({selectedWorkerIds.length} observed)
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
    marginBottom: 16,
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
  zoneBar: {
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.lightText,
    textTransform: 'uppercase',
    marginBottom: 8,
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkText,
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
  list: {
    paddingBottom: 20,
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
    minHeight: 44,
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
    marginTop: 40,
  },
});
