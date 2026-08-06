import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

export default function LeaveReview() {
  const { t } = useTranslation();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  // Modal state for rejection note
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/leave/');
      setLeaves(res.data);
    } catch (e) {
      console.error('Failed to fetch leave requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleReview = async (id: number, action: 'approve' | 'reject', note: string = '') => {
    setSubmitting(true);
    try {
      await apiClient.patch(`/api/leave/${id}/review/`, {
        action,
        rejection_note: note,
      });
      Alert.alert(t('common.success'), `Leave request ${action}d successfully.`);
      setRejectingItem(null);
      setRejectionNote('');
      fetchLeaves();
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Review failed';
      Alert.alert(t('common.error'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLeaves = leaves.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const renderItem = ({ item }: { item: any }) => {
    const startDate = new Date(item.start_date);
    const endDate = new Date(item.end_date);
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.workerName}>{item.worker_detail?.name || 'Employee'}</Text>
            <Text style={styles.leaveType}>{item.leave_type.replace('_', ' ')} LEAVE</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.dateText}>
            📅 {item.start_date} to {item.end_date} ({daysCount} day{daysCount > 1 ? 's' : ''})
          </Text>
        </View>

        {item.reason ? <Text style={styles.reasonText}>"{item.reason}"</Text> : null}

        {item.status === 'REJECTED' && item.rejection_note ? (
          <Text style={styles.rejectionNoteText}>Rejection note: {item.rejection_note}</Text>
        ) : null}

        {item.status === 'PENDING' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn]}
              disabled={submitting}
              onPress={() => handleReview(item.id, 'approve')}
            >
              <Text style={styles.btnText}>✓ Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              disabled={submitting}
              onPress={() => {
                setRejectingItem(item);
                setRejectionNote('');
              }}
            >
              <Text style={styles.btnText}>✗ Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leave Approvals</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.activeTab]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredLeaves}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No leave requests found for {filter.toLowerCase()}.</Text>
          }
        />
      )}

      {/* Rejection Note Modal */}
      <Modal visible={!!rejectingItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Leave Request</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejecting {rejectingItem?.worker_detail?.name}'s leave request.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Rejection reason..."
              placeholderTextColor={COLORS.lightText}
              multiline
              numberOfLines={3}
              value={rejectionNote}
              onChangeText={setRejectionNote}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setRejectingItem(null)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmRejectBtn]}
                disabled={submitting}
                onPress={() => handleReview(rejectingItem.id, 'reject', rejectionNote)}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmRejectText}>Confirm Reject</Text>
                )}
              </TouchableOpacity>
            </View>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  activeTabText: {
    color: '#ffffff',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  leaveType: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 2,
  },
  detailsRow: {
    marginVertical: 4,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.darkText,
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.lightText,
    fontStyle: 'italic',
    marginTop: 4,
  },
  rejectionNoteText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 6,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: COLORS.primary,
  },
  rejectBtn: {
    backgroundColor: COLORS.danger,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightText,
    marginTop: 40,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.lightText,
    marginVertical: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    backgroundColor: COLORS.lightGray,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalBtn: {
    backgroundColor: COLORS.lightGray,
  },
  cancelModalText: {
    color: COLORS.darkText,
    fontWeight: '600',
  },
  confirmRejectBtn: {
    backgroundColor: COLORS.danger,
  },
  confirmRejectText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
