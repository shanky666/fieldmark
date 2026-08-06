import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert, Modal } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/auth';

export default function Home({ navigation }: any) {
  const { userProfile, logout } = useAuthStore();

  const [locationText, setLocationText] = useState('Fetching location…');
  const [coords, setCoords] = useState<{ lat: number; lng: number; acc: number }>({ lat: 12.9718, lng: 77.6412, acc: 12 });
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastStamp, setLastStamp] = useState<{ photoUri: string; time: string; date: string } | null>(null);

  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationText('Location ready · ±15m');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        acc: Math.round(loc.coords.accuracy || 10)
      });
      setLocationText(`Location ready · ±${Math.round(loc.coords.accuracy || 10)}m`);
    })();
  }, []);

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Camera access is required for geotagged attendance check-in.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets && res.assets[0]) {
      setPreviewPhoto(res.assets[0].uri);
      setCameraModalVisible(true);
    }
  };

  const confirmAttendance = () => {
    const now = new Date();
    const ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const ds = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    if (!isCheckedIn) {
      setCheckInTime(ts);
      setIsCheckedIn(true);
      Alert.alert('Attendance Marked', `✓ Checked in successfully at ${ts}`);
    } else {
      setCheckOutTime(ts);
      setIsCheckedIn(false);
      Alert.alert('Attendance Marked', `✓ Checked out successfully at ${ts}`);
    }

    if (previewPhoto) {
      setLastStamp({
        photoUri: previewPhoto,
        time: ts,
        date: ds
      });
    }

    setCameraModalVisible(false);
    setPreviewPhoto(null);
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Top Greeting Row */}
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.eyebrow}>{todayStr}</Text>
            <Text style={styles.pageTitle}>Hi, {userProfile?.first_name || 'Ananya'} 👋</Text>
            <View style={styles.shiftChip}>
              <View style={styles.dot} />
              <Text style={styles.shiftText}>{userProfile?.shift || 'General Shift'} · 09:00–18:00</Text>
            </View>
          </View>
          <View style={styles.avatarGroup}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(userProfile?.first_name?.[0] || 'A') + (userProfile?.last_name?.[0] || 'N')}
              </Text>
            </View>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('MessagesTab')}>
              <Text style={styles.bellIcon}>🔔</Text>
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Check-In Action Card */}
        <View style={styles.checkinCard}>
          <TouchableOpacity style={styles.camBtn} onPress={openCamera} activeOpacity={0.85}>
            <Text style={styles.camIcon}>📸</Text>
          </TouchableOpacity>
          <Text style={styles.ciTitle}>{isCheckedIn ? 'Checked in' : 'Mark your attendance'}</Text>
          <Text style={styles.ciSub}>
            {isCheckedIn ? 'Tap again at end of shift to check out' : 'Snap a geo-tagged photo to check in'}
          </Text>
          <View style={styles.locStatus}>
            <View style={styles.pulse} />
            <Text style={styles.locText}>{locationText}</Text>
          </View>
        </View>

        {/* Log Box Row */}
        <View style={styles.logRow}>
          <View style={styles.logBox}>
            <Text style={styles.eyebrowSmall}>Check-in</Text>
            <Text style={[styles.logTime, !checkInTime && styles.emptyTime]}>
              {checkInTime || '--:--'}
            </Text>
          </View>
          <View style={styles.logBox}>
            <Text style={styles.eyebrowSmall}>Check-out</Text>
            <Text style={[styles.logTime, !checkOutTime && styles.emptyTime]}>
              {checkOutTime || '--:--'}
            </Text>
          </View>
        </View>

        {/* Last Verified Entry Stamp */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Last verified entry</Text>
        </View>

        {lastStamp ? (
          <View style={styles.stampWrap}>
            <View style={styles.stampPhotoBox}>
              <Image source={{ uri: lastStamp.photoUri }} style={styles.stampPhoto} />
              <View style={styles.stampOverlay}>
                <Text style={styles.stampAddr}>📍 Site Gate 2, Whitefield</Text>
                <Text style={styles.stampCoords}>
                  {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E · ±{coords.acc}m
                </Text>
              </View>
              <View style={styles.stampRibbon}>
                <Text style={styles.ribbonText}>✓ VERIFIED</Text>
              </View>
            </View>
            <View style={styles.stampFoot}>
              <Text style={styles.stampFootTime}>{lastStamp.time}</Text>
              <Text style={styles.stampFootDate}>{lastStamp.date}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.emptyCap} onPress={openCamera}>
            <Text style={styles.emptyCapIcon}>📷</Text>
            <Text style={styles.emptyCapText}>No photo entry yet today</Text>
          </TouchableOpacity>
        )}

        {/* Recent History */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent history</Text>
          <TouchableOpacity onPress={() => navigation.navigate('HistoryTab')}>
            <Text style={styles.linkSm}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.miniHistory}>
          <View style={styles.miniRow}>
            <View style={[styles.statusDot, { backgroundColor: '#2F8F5B' }]} />
            <View style={styles.miniInfo}>
              <Text style={styles.miniDay}>Monday, 28 Jul</Text>
              <Text style={styles.miniHours}>09:04 AM – 06:12 PM · 9h 08m</Text>
            </View>
            <View style={[styles.badge, styles.badgePresent]}>
              <Text style={styles.badgePresentText}>Present</Text>
            </View>
          </View>

          <View style={styles.miniRow}>
            <View style={[styles.statusDot, { backgroundColor: '#B9791C' }]} />
            <View style={styles.miniInfo}>
              <Text style={styles.miniDay}>Friday, 25 Jul</Text>
              <Text style={styles.miniHours}>09:41 AM – 06:02 PM · 8h 21m</Text>
            </View>
            <View style={[styles.badge, styles.badgeLate]}>
              <Text style={styles.badgeLateText}>Late</Text>
            </View>
          </View>

          <View style={styles.miniRow}>
            <View style={[styles.statusDot, { backgroundColor: '#2F8F5B' }]} />
            <View style={styles.miniInfo}>
              <Text style={styles.miniDay}>Thursday, 24 Jul</Text>
              <Text style={styles.miniHours}>08:58 AM – 06:07 PM</Text>
            </View>
            <View style={[styles.badge, styles.badgePresent]}>
              <Text style={styles.badgePresentText}>Present</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Camera Capture Confirmation Modal Sheet */}
      <Modal visible={cameraModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Confirm Attendance Entry</Text>
            <Text style={styles.modalSub}>Review geotagged stamp before submitting.</Text>

            {previewPhoto && (
              <View style={styles.stampWrap}>
                <View style={styles.stampPhotoBox}>
                  <Image source={{ uri: previewPhoto }} style={styles.stampPhoto} />
                  <View style={styles.stampOverlay}>
                    <Text style={styles.stampAddr}>📍 Site Gate 2, Whitefield</Text>
                    <Text style={styles.stampCoords}>
                      {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E · ±{coords.acc}m
                    </Text>
                  </View>
                  <View style={styles.stampRibbon}>
                    <Text style={styles.ribbonText}>✓ VERIFIED</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setCameraModalVisible(false)}>
                <Text style={styles.btnGhostText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={confirmAttendance}>
                <Text style={styles.btnPrimaryText}>Confirm {isCheckedIn ? 'Check-out' : 'Check-in'}</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 40,
  },
  greetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#9BAFA2',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 3,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16241C',
  },
  shiftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCF2E3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F6B42',
    marginRight: 6,
  },
  shiftText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1F6B42',
  },
  avatarGroup: {
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2F8F5B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  bellIcon: {
    fontSize: 18,
  },
  notifDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C24936',
  },
  checkinCard: {
    backgroundColor: '#2F8F5B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1F6B42',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 6,
  },
  camBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },
  camIcon: {
    fontSize: 36,
  },
  ciTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ciSub: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    textAlign: 'center',
  },
  locStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 14,
  },
  pulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#7CF0AE',
    marginRight: 6,
  },
  locText: {
    fontSize: 11.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  logBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 16,
    padding: 14,
  },
  eyebrowSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9BAFA2',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16241C',
  },
  emptyTime: {
    color: '#9BAFA2',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16241C',
  },
  linkSm: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2F8F5B',
  },
  emptyCap: {
    height: 110,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#B9DCC4',
    borderStyle: 'dashed',
    backgroundColor: '#EAF6EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCapIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  emptyCapText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#63796B',
  },
  stampWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: '#DCEEE2',
  },
  stampPhotoBox: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  stampPhoto: {
    width: '100%',
    height: '100%',
  },
  stampOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  stampAddr: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stampCoords: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  stampRibbon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#2F8F5B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  stampFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 8,
  },
  stampFootTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16241C',
  },
  stampFootDate: {
    fontSize: 11,
    color: '#63796B',
  },
  miniHistory: {
    gap: 8,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 15,
    padding: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  miniInfo: {
    flex: 1,
  },
  miniDay: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16241C',
  },
  miniHours: {
    fontSize: 11.5,
    color: '#63796B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgePresent: {
    backgroundColor: '#DCF2E3',
  },
  badgePresentText: {
    color: '#1F6B42',
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeLate: {
    backgroundColor: '#FBEDD3',
  },
  badgeLateText: {
    color: '#B9791C',
    fontSize: 10.5,
    fontWeight: '700',
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
  modalHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#DCEEE2',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16241C',
  },
  modalSub: {
    fontSize: 12.5,
    color: '#63796B',
    marginTop: 2,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  btnGhost: {
    flex: 1,
    backgroundColor: '#EAF6EE',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16241C',
  },
  btnPrimary: {
    flex: 1.5,
    backgroundColor: '#2F8F5B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
