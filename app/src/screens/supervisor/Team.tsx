import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';

export default function Team() {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();
  
  const [workers, setWorkers] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchTeamAndAttendance = async () => {
    try {
      const zoneId = userProfile?.zone_detail?.id || userProfile?.assigned_zone_id;
      const url = zoneId ? `/api/workers/list/?zone=${zoneId}` : '/api/workers/list/';
      
      const today = new Date().toISOString().split('T')[0];
      
      const [workersRes, attendanceRes] = await Promise.all([
        apiClient.get(url),
        apiClient.get(`/api/attendance/?date=${today}`)
      ]);

      setWorkers(workersRes.data.results || workersRes.data || []);
      
      const records = attendanceRes.data.results || attendanceRes.data || [];
      const map: Record<number, any> = {};
      records.forEach((r: any) => {
        if (r.worker?.id) {
          map[r.worker.id] = r;
        } else if (typeof r.worker === 'number') {
           map[r.worker] = r;
        }
      });
      setAttendanceMap(map);
    } catch (e) {
      console.error("Failed to load supervisor team roster", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTeamAndAttendance();
    }, [userProfile])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeamAndAttendance();
  };

  const openWorkerDetail = (worker: any) => {
    setSelectedWorker(worker);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: any }) => {
    const attendance = attendanceMap[item.id];
    let statusText = 'NOT CHECKED IN';
    let statusColor = '#A02020';
    let timeStr = '';

    if (attendance) {
      if (attendance.check_out_at) {
        statusText = 'CHECKED OUT';
        statusColor = '#B9791C';
        timeStr = `In: ${new Date(attendance.marked_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} | Out: ${new Date(attendance.check_out_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
      } else {
        statusText = 'CHECKED IN';
        statusColor = '#2F8F5B';
        timeStr = `In: ${new Date(attendance.marked_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
      }
    }

    return (
      <TouchableOpacity style={styles.card} onPress={() => openWorkerDetail(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.detail}>Id: {item.employee_id} | Shift: {item.shift_detail?.name || 'N/A'}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'space-between'}}>
             <Text style={[styles.statusTag, { color: statusColor, borderColor: statusColor }]}>{statusText}</Text>
             {timeStr ? <Text style={styles.timeStr}>{timeStr}</Text> : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Field Team</Text>
      <Text style={styles.subtitle}>
        Zone: {userProfile?.zone_detail?.name || 'Assigned Zone'}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={workers}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No workers assigned to this zone.</Text>
          }
        />
      )}

      {/* Worker Detail Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            {selectedWorker && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                   <View style={{flexDirection: 'row', alignItems: 'center'}}>
                     <View style={[styles.avatar, {width: 50, height: 50, borderRadius: 25, marginRight: 10}]}>
                        <Text style={[styles.avatarText, {fontSize: 22}]}>{selectedWorker.name.charAt(0).toUpperCase()}</Text>
                     </View>
                     <View>
                        <Text style={styles.modalTitle}>{selectedWorker.name}</Text>
                        <Text style={styles.detailValue}>ID: {selectedWorker.employee_id}</Text>
                     </View>
                   </View>
                   <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                     <Text style={styles.closeBtnText}>✕</Text>
                   </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                   <Text style={styles.detailLabel}>Contact</Text>
                   <Text style={styles.detailValue}>{selectedWorker.phone}</Text>

                   <Text style={styles.detailLabel}>Worker Type</Text>
                   <Text style={styles.detailValue}>{selectedWorker.worker_type}</Text>

                   <Text style={styles.detailLabel}>Shift</Text>
                   <Text style={styles.detailValue}>{selectedWorker.shift_detail?.name || 'N/A'}</Text>
                   
                   <Text style={styles.detailLabel}>Today's Attendance Status</Text>
                   {(() => {
                      const attendance = attendanceMap[selectedWorker.id];
                      if (!attendance) return <Text style={[styles.detailValue, {color: '#A02020'}]}>Not Checked In</Text>;
                      return (
                        <View>
                           <Text style={[styles.detailValue, {color: attendance.check_out_at ? '#B9791C' : '#2F8F5B', fontWeight: 'bold'}]}>
                             {attendance.check_out_at ? 'Checked Out' : 'Checked In'}
                           </Text>
                           <Text style={{fontSize: 13, color: COLORS.lightText, marginTop: -4}}>
                             In: {new Date(attendance.marked_at).toLocaleTimeString()}
                           </Text>
                           {attendance.check_out_at && (
                             <Text style={{fontSize: 13, color: COLORS.lightText}}>
                               Out: {new Date(attendance.check_out_at).toLocaleTimeString()}
                               {"\n"}Duration: {attendance.duration_formatted || 'N/A'}
                             </Text>
                           )}
                        </View>
                      )
                   })()}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
    paddingTop: 44,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.lightText,
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 10,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '22',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  detail: {
    fontSize: 11,
    color: COLORS.lightText,
    marginTop: 2,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: 'bold',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeStr: {
    fontSize: 10,
    color: COLORS.lightText,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightText,
    fontSize: 13,
    marginTop: 40,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 18,
    color: COLORS.lightText,
  },
  modalContent: {
    gap: 12,
    paddingBottom: 20,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.lightText,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.darkText,
    marginBottom: 8,
  }
});
