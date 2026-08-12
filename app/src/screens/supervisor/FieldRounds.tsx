import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { SupervisorStackParamList } from '../../navigation/SupervisorNavigator';

type FieldRoundsNavProp = StackNavigationProp<SupervisorStackParamList, 'SupervisorTabs'>;

interface FieldRoundsProps {
  navigation: FieldRoundsNavProp;
}

export default function FieldRounds({ navigation }: FieldRoundsProps) {
  const { t } = useTranslation();
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Edit states
  const [editRemarks, setEditRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchRounds = async () => {
    try {
      const res = await apiClient.get('/api/rounds/');
      setRounds(res.data.results || res.data || []);
    } catch (e) {
      console.error("Failed to load field logs list", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRounds();
    }, [])
  );

  const openLogDetails = (log: any) => {
    setSelectedLog(log);
    setEditRemarks(log.remarks || log.notes || '');
    setModalVisible(true);
  };

  const handleUpdateLog = async (status: 'OPEN' | 'COMPLETED') => {
    if (!selectedLog) return;
    setUpdating(true);
    try {
      const res = await apiClient.patch(`/api/rounds/${selectedLog.id}/`, {
        remarks: editRemarks,
        status: status
      });
      setModalVisible(false);
      fetchRounds(); // refresh list
      Alert.alert('Success', `Field Log ${status === 'COMPLETED' ? 'marked completed' : 'updated'}.`);
    } catch (e: any) {
      console.error("Update log failed", e);
      Alert.alert('Error', e.response?.data?.error || 'Failed to update field log.');
    } finally {
      setUpdating(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const timeStr = item.visited_at 
      ? new Date(item.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    
    const isOpen = item.status === 'OPEN';

    return (
      <TouchableOpacity style={styles.card} onPress={() => openLogDetails(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateLabel}>{item.visited_at?.split('T')[0]}</Text>
          <View style={styles.badgeRow}>
             <View style={[styles.statusBadge, isOpen ? styles.badgeOpen : styles.badgeCompleted]}>
                <Text style={styles.statusBadgeText}>{isOpen ? 'OPEN' : 'COMPLETED'}</Text>
             </View>
             <Text style={styles.timeLabel}>{item.start_time ? item.start_time.substring(0, 5) : timeStr}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.infoText}>📍 {item.zone_detail?.name || 'N/A'}</Text>
          <Text style={styles.infoHighlight}>
            Workers Present: {item.associated_workers?.length || item.worker_count_observed}
          </Text>
          {(item.remarks || item.notes) ? (
            <Text style={styles.infoRemarks} numberOfLines={1}>
              "{item.remarks || item.notes}"
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Field Logs</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('LogFieldRound')}
        >
          <Text style={styles.btnText}>+ Create Log</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={rounds}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No field logs recorded. Tap "+ Create Log" to start.</Text>
          }
        />
      )}

      {/* Detail & Edit Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            {selectedLog && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                   <Text style={styles.modalTitle}>Field Log Details</Text>
                   <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                     <Text style={styles.closeBtnText}>✕</Text>
                   </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                   <Text style={styles.detailLabel}>Zone / Site</Text>
                   <Text style={styles.detailValue}>{selectedLog.zone_detail?.name}</Text>

                   <Text style={styles.detailLabel}>Timestamp</Text>
                   <Text style={styles.detailValue}>{new Date(selectedLog.visited_at).toLocaleString()}</Text>

                   <Text style={styles.detailLabel}>GPS Coordinate</Text>
                   <Text style={styles.detailValue}>
                     Lat: {selectedLog.latitude}, Lng: {selectedLog.longitude} 
                     {selectedLog.gps_accuracy ? ` (±${selectedLog.gps_accuracy.toFixed(1)}m)` : ''}
                   </Text>

                   <Text style={styles.detailLabel}>Workers Present ({selectedLog.associated_workers_detail?.length || 0})</Text>
                   <View style={styles.workerList}>
                     {selectedLog.associated_workers_detail?.map((w: any) => (
                       <Text key={w.id} style={styles.workerListItem}>• {w.name} (ID: {w.employee_id})</Text>
                     ))}
                   </View>

                   {selectedLog.photo_url && !selectedLog.photo_url.includes('geotag.jpg') && (
                     <View>
                        <Text style={styles.detailLabel}>Evidence Photo</Text>
                        <Text style={{fontSize:11, color:COLORS.lightText}}>Photo stored in S3</Text>
                     </View>
                   )}

                   <Text style={styles.detailLabel}>Remarks / Notes</Text>
                   {selectedLog.status === 'COMPLETED' ? (
                     <Text style={styles.detailValue}>{selectedLog.remarks || selectedLog.notes || 'No remarks provided.'}</Text>
                   ) : (
                     <TextInput
                       style={styles.remarksInput}
                       multiline
                       value={editRemarks}
                       onChangeText={setEditRemarks}
                       placeholder="Update remarks..."
                     />
                   )}
                </View>

                {selectedLog.status === 'OPEN' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.saveBtn} 
                      onPress={() => handleUpdateLog('OPEN')}
                      disabled={updating}
                    >
                      <Text style={styles.saveBtnText}>Save Draft</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.completeBtn} 
                      onPress={() => handleUpdateLog('COMPLETED')}
                      disabled={updating}
                    >
                      <Text style={styles.completeBtnText}>Mark Completed</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {updating && <ActivityIndicator size="small" color={COLORS.primary} style={{marginTop: 10}}/>}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 8,
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeOpen: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  badgeCompleted: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  cardBody: {
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.darkText,
    fontWeight: '500',
  },
  infoHighlight: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  infoRemarks: {
    fontSize: 12,
    color: COLORS.lightText,
    fontStyle: 'italic'
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  workerList: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  workerListItem: {
    fontSize: 13,
    color: COLORS.darkText,
    marginVertical: 2,
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  saveBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  completeBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  }
});
