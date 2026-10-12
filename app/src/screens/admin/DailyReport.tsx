import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView,
  TouchableOpacity, Modal, ScrollView, Image, Linking, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';

export default function DailyReport({ navigation }: any) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tracking modal states
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [selectedWorkerName, setSelectedWorkerName] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);

  // Photo viewer modal
  const [photoViewerUri, setPhotoViewerUri] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  const fetchReport = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/attendance/?date=${today}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setRecords(list);
    } catch (e) {
      console.warn('Failed to fetch daily report:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [today]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const handleOpenTracking = async (workerId: number, workerName: string) => {
    setSelectedWorkerName(workerName);
    setTrackingModalVisible(true);
    setTrackingLoading(true);
    setTrackingData(null);

    try {
      const res = await apiClient.get(`/api/attendance/tracking/?worker_id=${workerId}&date=${today}`);
      setTrackingData(res.data);
    } catch (err) {
      console.warn('Failed to load tracking trail:', err);
    } finally {
      setTrackingLoading(false);
    }
  };

  const openGoogleMapsRoute = (points: any[]) => {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      const url = `https://www.google.com/maps/search/?api=1&query=${points[0].latitude},${points[0].longitude}`;
      Linking.openURL(url);
      return;
    }
    const origin = `${points[0].latitude},${points[0].longitude}`;
    const destination = `${points[points.length - 1].latitude},${points[points.length - 1].longitude}`;
    const waypoints = points.slice(1, points.length - 1).map(p => `${p.latitude},${p.longitude}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1F6B42" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading Today's Report...</Text>
      </View>
    );
  }

  const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'APPROVED').length;
  const inProgressCount = records.filter(r => !r.check_out_at).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Daily Attendance & Hours</Text>
          <Text style={styles.headerSubtitle}>{todayFormatted}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <MaterialCommunityIcons name="refresh" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Summary KPI Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiVal}>{records.length}</Text>
          <Text style={styles.kpiLabel}>Total Marked</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiVal, { color: '#1F6B42' }]}>{presentCount}</Text>
          <Text style={styles.kpiLabel}>Present</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiVal, { color: '#E87722' }]}>{inProgressCount}</Text>
          <Text style={styles.kpiLabel}>On Field</Text>
        </View>
      </View>

      {/* Employee List */}
      <FlatList
        data={records}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-clock-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>No attendance recorded today yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const checkInStr = item.marked_at ? new Date(item.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
          const checkOutStr = item.check_out_at ? new Date(item.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress';

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.empName}>{item.worker_name || 'Employee'}</Text>
                  <Text style={styles.empSub}>ID: {item.worker_employee_id || '--'} • {item.zone_name || 'Field'}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'ABSENT' ? styles.statusBadgeAbsent : styles.statusBadgePresent]}>
                  <Text style={[styles.statusText, item.status === 'ABSENT' ? styles.statusTextAbsent : styles.statusTextPresent]}>
                    {item.status || 'PRESENT'}
                  </Text>
                </View>
              </View>

              {/* Attendance Times & Hours Worked */}
              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>CHECK-IN</Text>
                  <Text style={styles.timeVal}>{checkInStr}</Text>
                </View>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>CHECK-OUT</Text>
                  <Text style={styles.timeVal}>{checkOutStr}</Text>
                </View>
                <View style={[styles.timeCol, styles.hoursCol]}>
                  <Text style={styles.timeLabel}>HOURS WORKED</Text>
                  <Text style={styles.hoursVal}>{item.duration_formatted || '--'}</Text>
                </View>
              </View>

              {/* Photos Row (Check-in & Checkout Photos) */}
              <View style={styles.photosRow}>
                {item.photo_url ? (
                  <TouchableOpacity style={styles.photoItem} onPress={() => setPhotoViewerUri(item.photo_url)}>
                    <Image source={{ uri: item.photo_url }} style={styles.photoPreview} />
                    <Text style={styles.photoCaption}>Check-In Photo</Text>
                  </TouchableOpacity>
                ) : null}

                {item.checkout_photo_url ? (
                  <TouchableOpacity style={styles.photoItem} onPress={() => setPhotoViewerUri(item.checkout_photo_url)}>
                    <Image source={{ uri: item.checkout_photo_url }} style={styles.photoPreview} />
                    <Text style={styles.photoCaption}>Checkout Photo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Field Visit Summary */}
              {item.panchayat_visited ? (
                <View style={styles.fieldVisitBox}>
                  <Text style={styles.fieldVisitText}>
                    📍 <Text style={{ fontWeight: '700' }}>{item.panchayat_visited}</Text> ({item.village_visited || 'Village'}) • FIG: {item.fic_visited || '--'}
                  </Text>
                  {item.purpose_of_visit ? (
                    <Text style={styles.purposeText} numberOfLines={2}>Purpose: {item.purpose_of_visit}</Text>
                  ) : null}
                </View>
              ) : null}

              {/* Tracking Button */}
              <TouchableOpacity
                style={styles.trackingBtn}
                onPress={() => handleOpenTracking(item.worker, item.worker_name)}
              >
                <MaterialCommunityIcons name="map-marker-path" size={18} color="#1F6B42" style={{ marginRight: 6 }} />
                <Text style={styles.trackingBtnText}>View Full-Day Travel Route</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Full-Day Tracking Modal */}
      <Modal visible={trackingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Full-Day Travel Route</Text>
                <Text style={styles.modalSubtitle}>{selectedWorkerName} • {todayFormatted}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setTrackingModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {trackingLoading ? (
              <View style={styles.modalCenter}>
                <ActivityIndicator size="large" color="#1F6B42" />
                <Text style={{ marginTop: 12, color: '#666' }}>Fetching GPS route...</Text>
              </View>
            ) : trackingData && trackingData.points && trackingData.points.length > 0 ? (
              <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Route Summary */}
                <View style={styles.routeSummaryCard}>
                  <View style={styles.routeMetric}>
                    <Text style={styles.metricVal}>{trackingData.total_distance_km} km</Text>
                    <Text style={styles.metricLabel}>Total Distance</Text>
                  </View>
                  <View style={styles.routeMetric}>
                    <Text style={styles.metricVal}>{trackingData.total_points}</Text>
                    <Text style={styles.metricLabel}>Waypoints</Text>
                  </View>
                  <View style={styles.routeMetric}>
                    <Text style={styles.metricVal}>{trackingData.start_time || '--'}</Text>
                    <Text style={styles.metricLabel}>First Ping</Text>
                  </View>
                  <View style={styles.routeMetric}>
                    <Text style={styles.metricVal}>{trackingData.last_time || '--'}</Text>
                    <Text style={styles.metricLabel}>Last Ping</Text>
                  </View>
                </View>

                {/* Open in Google Maps */}
                <TouchableOpacity
                  style={styles.openMapsBtn}
                  onPress={() => openGoogleMapsRoute(trackingData.points)}
                >
                  <MaterialCommunityIcons name="google-maps" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.openMapsBtnText}>Open Route in Google Maps</Text>
                </TouchableOpacity>

                {/* Waypoints Timeline */}
                <Text style={styles.timelineTitle}>Recorded Timeline:</Text>
                {trackingData.points.map((pt: any, idx: number) => (
                  <View key={pt.id || idx} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.timelineTime}>{pt.time_formatted}</Text>
                      <Text style={styles.timelineCoords}>
                        Lat: {pt.latitude.toFixed(5)}, Lng: {pt.longitude.toFixed(5)}
                      </Text>
                      {pt.speed ? <Text style={styles.timelineExtra}>Speed: {pt.speed.toFixed(1)} m/s</Text> : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.modalCenter}>
                <MaterialCommunityIcons name="map-marker-off" size={50} color="#AAA" />
                <Text style={styles.emptyText}>No GPS route points recorded for today yet.</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' }}>
                  GPS points record automatically every 10 minutes while the worker is checked in.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Fullscreen Photo Viewer */}
      <Modal visible={!!photoViewerUri} transparent animationType="fade">
        <View style={styles.photoViewerOverlay}>
          <TouchableOpacity style={styles.photoViewerClose} onPress={() => setPhotoViewerUri(null)}>
            <MaterialCommunityIcons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {photoViewerUri ? (
            <Image source={{ uri: photoViewerUri }} style={styles.fullPhoto} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8F5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F8F5' },

  header: {
    backgroundColor: '#1F6B42',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: '#DCEEE2', marginTop: 2 },
  refreshBtn: { padding: 6 },

  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBE5',
    justifyContent: 'space-around',
  },
  kpiBox: { alignItems: 'center' },
  kpiVal: { fontSize: 20, fontWeight: '800', color: '#333' },
  kpiLabel: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '600' },

  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  empName: { fontSize: 16, fontWeight: '700', color: '#1F6B42' },
  empSub: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgePresent: { backgroundColor: '#E8F5E9' },
  statusBadgeAbsent: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextPresent: { color: '#1F6B42' },
  statusTextAbsent: { color: '#C62828' },

  timeRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAF8',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    justifyContent: 'space-between',
  },
  timeCol: { flex: 1, alignItems: 'center' },
  hoursCol: { borderLeftWidth: 1, borderLeftColor: '#E2EBE5' },
  timeLabel: { fontSize: 10, color: '#888', fontWeight: '700', marginBottom: 2 },
  timeVal: { fontSize: 13, fontWeight: '700', color: '#333' },
  hoursVal: { fontSize: 14, fontWeight: '900', color: '#1F6B42' },

  photosRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  photoItem: { alignItems: 'center' },
  photoPreview: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#EEE' },
  photoCaption: { fontSize: 10, color: '#666', marginTop: 4, fontWeight: '600' },

  fieldVisitBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFA000',
  },
  fieldVisitText: { fontSize: 12, color: '#5D4037' },
  purposeText: { fontSize: 11, color: '#795548', marginTop: 2, fontStyle: 'italic' },

  trackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  trackingBtnText: { color: '#1F6B42', fontSize: 13, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#888', marginTop: 12, fontWeight: '600' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1F6B42' },
  modalSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  modalCenter: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },

  routeSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-around',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  routeMetric: { alignItems: 'center' },
  metricVal: { fontSize: 16, fontWeight: '800', color: '#1F6B42' },
  metricLabel: { fontSize: 11, color: '#666', marginTop: 2 },

  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F6B42',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 16,
  },
  openMapsBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  timelineTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1F6B42', marginTop: 5 },
  timelineTime: { fontSize: 13, fontWeight: '700', color: '#1F6B42' },
  timelineCoords: { fontSize: 12, color: '#666', marginTop: 1 },
  timelineExtra: { fontSize: 11, color: '#888', marginTop: 1 },

  // Photo viewer modal
  photoViewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  photoViewerClose: { position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 8 },
  fullPhoto: { width: '90%', height: '80%' },
});
