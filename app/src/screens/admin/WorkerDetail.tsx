import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import CalendarView from '../../components/CalendarView';
import { AdminStackParamList } from '../../navigation/AdminNavigator';

type WorkerDetailRouteProp = RouteProp<AdminStackParamList, 'WorkerDetail'>;
type WorkerDetailNavigationProp = StackNavigationProp<AdminStackParamList, 'WorkerDetail'>;

interface WorkerDetailProps {
  route: WorkerDetailRouteProp;
  navigation: WorkerDetailNavigationProp;
}

export default function WorkerDetail({ route, navigation }: WorkerDetailProps) {
  const { workerId } = route.params;
  const { t } = useTranslation();

  const [worker, setWorker] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchWorkerData = async () => {
    try {
      // 1. Fetch worker profile
      const workerRes = await apiClient.get(`/api/workers/list/${workerId}/`);
      setWorker(workerRes.data);

      // 2. Fetch all zones for reassignment dropdown
      const zonesRes = await apiClient.get('/api/workers/zones/');
      setZones(zonesRes.data);

      // 3. Fetch attendance for calendar
      const attRes = await apiClient.get(`/api/attendance/?worker=${workerId}`);
      setAttendance(attRes.data);

      // Compile calendar status map
      const compiled = attRes.data.map((rec: any) => ({
        date: rec.date,
        status: rec.status,
        is_leave: rec.is_leave
      }));
      setCalendarData(compiled);

    } catch (e) {
      console.error("Failed to load worker management details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, [workerId]);

  const handleReassignZone = async (zoneId: number, zoneName: string) => {
    Alert.alert(
      "Reassign Zone",
      `Are you sure you want to reassign ${worker?.name} to ${zoneName}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setUpdating(true);
            try {
              await apiClient.patch(`/api/workers/list/${workerId}/`, {
                assigned_zone: zoneId
              });
              Alert.alert(t('common.success'), `Successfully reassigned to ${zoneName}.`);
              fetchWorkerData();
            } catch (e) {
              Alert.alert(t('common.error'), "Failed to update assigned zone.");
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Worker not found.</Text>
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
        <Text style={styles.headerTitle}>Worker Management</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Info */}
        <View style={styles.card}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <View>
              <Text style={styles.name}>{worker.name}</Text>
              <Text style={styles.employeeId}>Employee ID: {worker.employee_id}</Text>
              <Text style={styles.phone}>{worker.phone}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{worker.worker_type}</Text>
              </View>
              {!worker.is_active && (
                <View style={[styles.typeBadge, { backgroundColor: '#fee2e2', marginTop: 4 }]}>
                   <Text style={[styles.typeBadgeText, { color: '#ef4444' }]}>INACTIVE</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.statusBtn, worker.is_active ? styles.deactivateBtn : styles.activateBtn]}
              onPress={() => {
                const action = worker.is_active ? 'deactivate' : 'activate';
                Alert.alert(
                  `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Employee`,
                  `Are you sure you want to ${action} this employee?`,
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { 
                      text: action === 'deactivate' ? 'Deactivate' : 'Activate', 
                      style: action === 'deactivate' ? 'destructive' : 'default',
                      onPress: async () => {
                        setUpdating(true);
                        try {
                          await apiClient.patch(`/api/workers/list/${workerId}/`, {
                            is_active: !worker.is_active
                          });
                          Alert.alert('Success', `Employee successfully ${action}d.`);
                          fetchWorkerData();
                        } catch (e) {
                          Alert.alert('Error', `Failed to ${action} employee.`);
                        } finally {
                          setUpdating(false);
                        }
                      }
                    }
                  ]
                );
              }}
              disabled={updating}
            >
              <Text style={styles.statusBtnText}>{worker.is_active ? 'Deactivate' : 'Activate'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Zone Reassignment */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Reassign Zone</Text>
          <Text style={styles.currentZoneText}>
            Current: {worker.zone_detail?.name || 'Unassigned'}
          </Text>
          {updating && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />}
          
          <View style={styles.pillRow}>
            {zones.map((zone) => {
              const isCurrent = worker.assigned_zone === zone.id;
              return (
                <TouchableOpacity
                  key={zone.id}
                  style={[styles.pill, isCurrent && styles.activePill]}
                  disabled={updating || isCurrent}
                  onPress={() => handleReassignZone(zone.id, zone.name)}
                >
                  <Text style={[styles.pillLabel, isCurrent && styles.activePillLabel]}>
                    {zone.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Attendance history calendar */}
        <Text style={styles.sectionHeader}>Attendance History</Text>
        <CalendarView 
          records={calendarData} 
          onDayPress={(date) => {
            const match = attendance.find(a => a.date === date);
            if (match) {
              navigation.navigate('VerificationDetail', { recordId: match.id });
            }
          }} 
        />
      </ScrollView>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  employeeId: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 4,
  },
  phone: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: COLORS.secondary,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  statusBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  activateBtn: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  deactivateBtn: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.lightText,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  currentZoneText: {
    fontSize: 13,
    color: COLORS.darkText,
    fontWeight: 'bold',
    marginBottom: 12,
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
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginTop: 10,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0faf0',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.danger,
    marginTop: 100,
  },
});
