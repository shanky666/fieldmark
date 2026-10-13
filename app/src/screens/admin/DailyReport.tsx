import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, SafeAreaView,
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
        <Text style={{ marginTop: 12, color: '#666' }}>Loading Today's Attendance Sheet...</Text>
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
          <Text style={styles.headerTitle}>Daily Attendance Register</Text>
          <Text style={styles.headerSubtitle}>{todayFormatted} • All Employees</Text>
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
        <View style={styles.scrollHintBox}>
          <MaterialCommunityIcons name="arrow-left-right" size={14} color="#666" />
          <Text style={styles.scrollHintText}>Swipe table to scroll</Text>
        </View>
      </View>

      {/* Main Single Scrollable Table View */}
      <ScrollView
        style={styles.verticalScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
          <View style={styles.tableContainer}>
            {/* Table Header Row */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, styles.colIndex]}>#</Text>
              <Text style={[styles.thText, styles.colEmp]}>EMPLOYEE</Text>
              <Text style={[styles.thText, styles.colDesig]}>DESIGNATION</Text>
              <Text style={[styles.thText, styles.colTime]}>CHECK-IN</Text>
              <Text style={[styles.thText, styles.colTime]}>CHECK-OUT</Text>
              <Text style={[styles.thText, styles.colHours]}>HOURS WORKED</Text>
              <Text style={[styles.thText, styles.colStatus]}>STATUS</Text>
              <Text style={[styles.thText, styles.colPhoto]}>IN PHOTO</Text>
              <Text style={[styles.thText, styles.colPhoto]}>OUT PHOTO</Text>
              <Text style={[styles.thText, styles.colVisit]}>FIELD VISIT</Text>
              <Text style={[styles.thText, styles.colRoute]}>ROUTE</Text>
            </View>

            {/* Table Body Rows */}
            {records.length === 0 ? (
              <View style={styles.tableEmpty}>
                <MaterialCommunityIcons name="account-clock-outline" size={48} color="#AAA" />
                <Text style={styles.emptyText}>No attendance records found for today.</Text>
              </View>
            ) : (
              records.map((item, index) => {
                const checkInStr = item.marked_at
                  ? new Date(item.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--';
                const checkOutStr = item.check_out_at
                  ? new Date(item.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'In Progress';

                const isEven = index % 2 === 0;

                return (
                  <View key={item.id} style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}>
                    {/* Index */}
                    <Text style={[styles.tdText, styles.colIndex, { color: '#888' }]}>{index + 1}</Text>

                    {/* Employee Name & ID */}
                    <View style={styles.colEmp}>
                      <Text style={styles.empNameText} numberOfLines={1}>
                        {item.worker_name || 'Staff'}
                      </Text>
                      <Text style={styles.empIdText}>ID: {item.worker_employee_id || '--'}</Text>
                    </View>

                    {/* Designation */}
                    <View style={styles.colDesig}>
                      <Text style={styles.desigText} numberOfLines={1}>
                        {item.worker_detail?.designation || item.designation || 'VCO'}
                      </Text>
                      <Text style={styles.zoneSubText} numberOfLines={1}>
                        {item.zone_name || 'Field'}
                      </Text>
                    </View>

                    {/* Check In */}
                    <Text style={[styles.tdText, styles.colTime]}>{checkInStr}</Text>

                    {/* Check Out */}
                    <Text style={[styles.tdText, styles.colTime, checkOutStr === 'In Progress' && { color: '#E87722', fontWeight: '700' }]}>
                      {checkOutStr}
                    </Text>

                    {/* Hours Worked */}
                    <View style={[styles.colHours, styles.hoursWrap]}>
                      <Text style={styles.hoursText}>{item.duration_formatted || '--'}</Text>
                    </View>

                    {/* Status Badge */}
                    <View style={styles.colStatus}>
                      <View style={[styles.statusBadge, item.status === 'ABSENT' ? styles.statusBadgeAbsent : styles.statusBadgePresent]}>
                        <Text style={[styles.statusText, item.status === 'ABSENT' ? styles.statusTextAbsent : styles.statusTextPresent]}>
                          {item.status || 'PRESENT'}
                        </Text>
                      </View>
                    </View>

                    {/* In Photo */}
                    <View style={styles.colPhoto}>
                      {item.photo_url ? (
                        <TouchableOpacity onPress={() => setPhotoViewerUri(item.photo_url)}>
                          <Image source={{ uri: item.photo_url }} style={styles.photoThumb} />
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.dashText}>--</Text>
                      )}
                    </View>

                    {/* Out Photo */}
                    <View style={styles.colPhoto}>
                      {item.checkout_photo_url ? (
                        <TouchableOpacity onPress={() => setPhotoViewerUri(item.checkout_photo_url)}>
                          <Image source={{ uri: item.checkout_photo_url }} style={styles.photoThumb} />
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.dashText}>--</Text>
                      )}
                    </View>

                    {/* Field Visit */}
                    <View style={styles.colVisit}>
                      <Text style={styles.visitText} numberOfLines={2}>
                        {item.panchayat_visited ? `${item.panchayat_visited} (${item.village_visited || ''})` : '--'}
                      </Text>
                    </View>

                    {/* GPS Route Button */}
                    <View style={styles.colRoute}>
                      <TouchableOpacity
                        style={styles.routeBtn}
                        onPress={() => handleOpenTracking(item.worker, item.worker_name)}
                      >
                        <MaterialCommunityIcons name="map-marker-path" size={16} color="#1F6B42" />
                        <Text style={styles.routeBtnText}>Route</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </ScrollView>

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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 12, color: '#DCEEE2', marginTop: 2 },
  refreshBtn: { padding: 6 },

  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBE5',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiBox: { alignItems: 'center' },
  kpiVal: { fontSize: 18, fontWeight: '800', color: '#333' },
  kpiLabel: { fontSize: 11, color: '#666', marginTop: 1, fontWeight: '600' },
  scrollHintBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scrollHintText: { fontSize: 11, color: '#666', fontWeight: '500' },

  verticalScroll: { flex: 1 },
  horizontalScroll: { flex: 1 },

  tableContainer: {
    backgroundColor: '#FFF',
    minWidth: 1020,
  },

  // Table Columns Widths
  colIndex: { width: 45, textAlign: 'center' },
  colEmp: { width: 170, paddingHorizontal: 8 },
  colDesig: { width: 110, paddingHorizontal: 6 },
  colTime: { width: 95, textAlign: 'center' },
  colHours: { width: 115, alignItems: 'center', justifyContent: 'center' },
  colStatus: { width: 95, alignItems: 'center', justifyContent: 'center' },
  colPhoto: { width: 75, alignItems: 'center', justifyContent: 'center' },
  colVisit: { width: 150, paddingHorizontal: 6 },
  colRoute: { width: 85, alignItems: 'center', justifyContent: 'center' },

  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1F6B42',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#175132',
    alignItems: 'center',
  },
  thText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EFEA',
    alignItems: 'center',
  },
  rowEven: { backgroundColor: '#FFFFFF' },
  rowOdd: { backgroundColor: '#F9FBF9' },

  tdText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },

  empNameText: { fontSize: 13, fontWeight: '700', color: '#1F6B42' },
  empIdText: { fontSize: 11, color: '#777', marginTop: 2 },

  desigText: { fontSize: 12, fontWeight: '700', color: '#333' },
  zoneSubText: { fontSize: 10, color: '#888', marginTop: 1 },

  hoursWrap: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'center',
  },
  hoursText: { fontSize: 12, fontWeight: '900', color: '#1F6B42' },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusBadgePresent: { backgroundColor: '#E8F5E9' },
  statusBadgeAbsent: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusTextPresent: { color: '#1F6B42' },
  statusTextAbsent: { color: '#C62828' },

  photoThumb: { width: 36, height: 36, borderRadius: 6, borderWidth: 1, borderColor: '#DCEEE2', backgroundColor: '#EEE' },
  dashText: { color: '#BBB', fontSize: 12 },

  visitText: { fontSize: 11, color: '#555', lineHeight: 14 },

  routeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 3,
  },
  routeBtnText: { fontSize: 11, fontWeight: '700', color: '#1F6B42' },

  tableEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, minWidth: 1020 },
  emptyText: { fontSize: 14, color: '#888', marginTop: 10, fontWeight: '600' },

  // Tracking Modal styles
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
