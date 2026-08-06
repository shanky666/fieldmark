import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, Alert, Modal, ActivityIndicator, FlatList, Platform } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';

export default function Profile() {
  const { userProfile, logout, fetchUserProfile } = useAuthStore();

  const [pushNotif, setPushNotif] = useState(true);
  const [offlineReminder, setOfflineReminder] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  // Modals state
  const [locationModal, setLocationModal] = useState(false);
  const [shiftModal, setShiftModal] = useState(false);
  const [photosModal, setPhotosModal] = useState(false);

  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchMyPhotos = async () => {
    setPhotosModal(true);
    setLoadingPhotos(true);
    try {
      const res = await apiClient.get('/api/attendance/my-photos/');
      setPhotos(res.data || []);
    } catch (e) {
      console.warn("Failed to fetch verified photos", e);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out of FieldMark?')) {
        logout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of FieldMark?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
      ]);
    }
  };

  const nameInitial = userProfile?.name
    ? userProfile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'EMP';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>My Profile</Text>

        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{nameInitial}</Text>
          </View>
          <Text style={styles.name}>{userProfile?.name || 'Employee Profile'}</Text>
          <Text style={styles.roleSub}>
            {userProfile?.role || 'Field Worker'} · {userProfile?.zone_detail?.name || userProfile?.zone || 'Assigned Zone'}
          </Text>
          
          <View style={styles.idChip}>
            <View style={styles.dot} />
            <Text style={styles.idText}>ID: {userProfile?.employee_id || 'GRW-1042'}</Text>
          </View>
        </View>

        {/* Preferences / Toggles */}
        <View style={styles.toggleGroup}>
          <View style={styles.toggleWrap}>
            <Text style={styles.toggleLabel}>Push notifications</Text>
            <Switch 
              value={pushNotif} 
              onValueChange={setPushNotif}
              trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleWrap}>
            <Text style={styles.toggleLabel}>Offline mode reminder</Text>
            <Switch 
              value={offlineReminder} 
              onValueChange={setOfflineReminder}
              trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.toggleWrap, { borderBottomWidth: 0 }]}>
            <Text style={styles.toggleLabel}>Weekly summary</Text>
            <Switch 
              value={weeklySummary} 
              onValueChange={setWeeklySummary}
              trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsList}>
          <TouchableOpacity style={styles.settingsItem} onPress={() => setLocationModal(true)}>
            <Text style={styles.settingsIcon}>📍</Text>
            <Text style={styles.settingsLabel}>Work location & assigned zone</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setShiftModal(true)}>
            <Text style={styles.settingsIcon}>📅</Text>
            <Text style={styles.settingsLabel}>Shift schedule</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={fetchMyPhotos}>
            <Text style={styles.settingsIcon}>📸</Text>
            <Text style={styles.settingsLabel}>My verified photos</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} onPress={handleSignOut}>
            <Text style={styles.settingsIcon}>🚪</Text>
            <Text style={[styles.settingsLabel, { color: '#C24936' }]}>Sign out</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal 1: Work Location & Assigned Zone */}
      <Modal visible={locationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>📍 Work Location & Zone</Text>
            <Text style={styles.modalDesc}>Your geotagged attendance boundary</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>ASSIGNED ZONE</Text>
              <Text style={styles.infoVal}>{userProfile?.zone_detail?.name || userProfile?.zone || 'Zone A - Primary Site'}</Text>

              <Text style={[styles.infoLabel, { marginTop: 10 }]}>ZONE BOUNDARY RADIUS</Text>
              <Text style={styles.infoVal}>{userProfile?.zone_detail?.radius_meters ? `${userProfile.zone_detail.radius_meters} meters` : '500 meters geofence'}</Text>

              <Text style={[styles.infoLabel, { marginTop: 10 }]}>CENTER COORDINATES</Text>
              <Text style={styles.infoVal}>
                Lat: {userProfile?.zone_detail?.center_lat || '12.9716'}, Lng: {userProfile?.zone_detail?.center_lng || '77.5946'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setLocationModal(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Shift Schedule */}
      <Modal visible={shiftModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>📅 Shift Schedule</Text>
            <Text style={styles.modalDesc}>Your official work hours & check-in windows</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>SHIFT NAME</Text>
              <Text style={styles.infoVal}>{userProfile?.shift_detail?.name || userProfile?.shift || 'Morning Shift A'}</Text>

              <Text style={[styles.infoLabel, { marginTop: 10 }]}>WINDOW START</Text>
              <Text style={styles.infoVal}>{userProfile?.shift_detail?.window_start || '08:00 AM'}</Text>

              <Text style={[styles.infoLabel, { marginTop: 10 }]}>WINDOW END</Text>
              <Text style={styles.infoVal}>{userProfile?.shift_detail?.window_end || '05:00 PM'}</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShiftModal(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 3: My Verified Photos */}
      <Modal visible={photosModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>📸 Verified Attendance Photos</Text>
            <Text style={styles.modalDesc}>Geotagged photos stored & automatically purged weekly</Text>

            {loadingPhotos ? (
              <ActivityIndicator color="#2F8F5B" style={{ marginVertical: 30 }} />
            ) : photos.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#63796B' }}>No attendance photos recorded for this week.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 250, marginVertical: 10 }}>
                {photos.map((item) => (
                  <View key={item.id} style={styles.photoRow}>
                    <View style={styles.photoBadge}>
                      <Text style={{ fontSize: 16 }}>📷</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#16241C' }}>{item.date}</Text>
                      <Text style={{ fontSize: 11, color: '#63796B' }}>Time: {item.marked_at}</Text>
                      <Text style={{ fontSize: 11, color: item.status === 'APPROVED' ? '#1F6B42' : '#C24936' }}>
                        Status: {item.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setPhotosModal(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3FAF5',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16241C',
    marginBottom: 14,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#184A31',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2F8F5B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16241C',
  },
  roleSub: {
    fontSize: 12.5,
    color: '#63796B',
    marginTop: 3,
  },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCF2E3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F6B42',
    marginRight: 6,
  },
  idText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1F6B42',
  },
  toggleGroup: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  toggleWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DCEEE2',
  },
  toggleLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#16241C',
  },
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DCEEE2',
  },
  settingsIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#16241C',
  },
  arrow: {
    fontSize: 18,
    color: '#9BAFA2',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 14, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#F3FAF5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16241C',
  },
  modalDesc: {
    fontSize: 12.5,
    color: '#63796B',
    marginTop: 2,
    marginBottom: 14,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCEEE2',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#63796B',
    letterSpacing: 0.5,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16241C',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#2F8F5B',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCEEE2',
    marginBottom: 8,
  },
  photoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCF2E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
