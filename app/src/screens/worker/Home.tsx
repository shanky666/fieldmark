import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';
import { CONFIG } from '../../constants/config';

export default function Home({ navigation }: any) {
  const { userProfile, logout } = useAuthStore();

  const [locationText, setLocationText] = useState('Fetching location…');
  // Null until real GPS is acquired — avoids showing fake hardcoded coordinates
  const [coords, setCoords] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [address, setAddress] = useState<string>('Acquiring location…');
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [lastStamp, setLastStamp] = useState<{ photoUri: string; time: string; date: string; status: string } | null>(null);

  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationText('Location permission denied');
        setAddress('Location unavailable');
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const acc = Math.round(loc.coords.accuracy || 10);
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude, acc });
        setLocationText(`Location ready · ±${acc}m`);

        // Reverse geocode to get real address
        try {
          const geo = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (geo && geo.length > 0) {
            const g = geo[0];
            const parts = [g.name, g.street, g.subregion || g.city, g.region].filter(Boolean);
            setAddress(parts.join(', '));
          } else {
            setAddress(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
          }
        } catch {
          setAddress(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
        }
      } catch (e) {
        setLocationText('GPS unavailable');
        setAddress('Unable to get location');
      }
    })();
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/attendance/today/');
      const record = res.data?.id ? res.data : (res.data?.today_record || null);

      if (record) {
        const checkIn = new Date(record.marked_at);
        setCheckInTime(
          checkIn.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        );

        if (record.check_out_at) {
          const checkOut = new Date(record.check_out_at);
          setCheckOutTime(
            checkOut.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          );
          setIsCheckedIn(false);
          setIsCompletedToday(true);
        } else {
          setCheckOutTime(null);
          setIsCheckedIn(true);
          setIsCompletedToday(false);
        }

        if (record.photo_url) {
          let photoUri = String(record.photo_url);
          if (!photoUri.startsWith('http') && !photoUri.startsWith('data:')) {
            const cleanPath = photoUri.startsWith('/media/') ? photoUri : `/media/${photoUri.replace(/^\/+/, '')}`;
            photoUri = `${CONFIG.API_BASE_URL.replace(/\/+$/, '')}${cleanPath}`;
          }

          setLastStamp({
            photoUri,
            time: checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: record.date,
            status: record.status || 'APPROVED'
          });
        }
      } else {
        setCheckInTime(null);
        setCheckOutTime(null);
        setIsCheckedIn(false);
        setIsCompletedToday(false);
      }
    } catch (error) {
      console.error('Failed to load today attendance:', error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/attendance/me/');
      setHistory(res.data);
    } catch (error) {
      console.error('Failed to load attendance history:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTodayAttendance();
      fetchHistory();
    }, [fetchTodayAttendance, fetchHistory])
  );

  const handleCardPress = () => {
    if (isCompletedToday) {
      Alert.alert("Attendance Completed", "You have already completed check-in and check-out for today.");
      return;
    }

    if (isCheckedIn) {
      Alert.alert(
        "Check Out Confirmation",
        "Are you sure you want to check out?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Check Out", style: "destructive", onPress: performCheckout }
        ]
      );
    } else {
      navigation.navigate('MarkAttendance');
    }
  };

  const performCheckout = async () => {
    try {
      const res = await apiClient.post('/api/attendance/checkout/');
      const checkOutDate = new Date(res.data.check_out_at);
      const ts = checkOutDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      setCheckOutTime(ts);
      setIsCheckedIn(false);
      setIsCompletedToday(true);
      setCameraModalVisible(false);
      setPreviewPhoto(null);

      Alert.alert("Attendance Marked", "Checked out successfully at " + ts);
    } catch (error: any) {
      console.error('Checkout failed:', error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to check out. Please try again.';
      Alert.alert('Checkout Error', msg);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Top Greeting Row */}
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.eyebrow}>{todayStr}</Text>
            <Text style={styles.pageTitle}>Hi, {userProfile?.name ? userProfile.name.split(' ')[0] : 'Worker'} 👋</Text>
            <View style={styles.shiftChip}>
              <View style={styles.dot} />
              <Text style={styles.shiftText}>{userProfile?.shift_detail?.name || userProfile?.zone_detail?.name || userProfile?.assigned_zone || 'General Shift'}</Text>
            </View>
          </View>
          <View style={styles.avatarGroup}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userProfile?.name
                  ? userProfile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                  : 'EMP'}
              </Text>
            </View>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('MessagesTab')}>
              <Text style={styles.bellIcon}>🔔</Text>
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Check-In Action Card */}
        <TouchableOpacity style={styles.checkinCard} onPress={handleCardPress} activeOpacity={0.9}>
          <View style={styles.camBtn}>
            <Text style={styles.camIcon}>{isCompletedToday ? '✓' : isCheckedIn ? '⌛' : '📸'}</Text>
          </View>
          <Text style={styles.ciTitle}>
            {isCompletedToday ? 'Attendance Completed' : isCheckedIn ? 'Checked in' : 'Mark your attendance'}
          </Text>
          <Text style={styles.ciSub}>
            {isCompletedToday 
              ? 'Check-in and check-out completed for today'
              : isCheckedIn 
                ? 'Checked in at ' + (checkInTime || '') + ' · Tap to check out' 
                : 'Snap a geo-tagged photo to check in'}
          </Text>
          <View style={styles.locStatus}>
            <View style={styles.pulse} />
            <Text style={styles.locText}>{locationText}</Text>
          </View>
        </TouchableOpacity>

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
                <Text style={styles.stampAddr}>📍 {address}</Text>
                {coords ? (
                  <Text style={styles.stampCoords}>
                    {coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° E · ±{coords.acc}m
                  </Text>
                ) : null}
              </View>
              <View style={[
                styles.stampRibbon,
                lastStamp.status === 'REJECTED' ? styles.ribbonRejected :
                lastStamp.status === 'FLAGGED' ? styles.ribbonFlagged :
                lastStamp.status === 'PENDING' ? styles.ribbonPending : styles.ribbonApproved
              ]}>
                <Text style={styles.ribbonText}>
                  {lastStamp.status === 'REJECTED' ? '❌ REJECTED' :
                   lastStamp.status === 'FLAGGED' ? '⚠️ FLAGGED' :
                   lastStamp.status === 'PENDING' ? '⏳ PENDING' : '✓ APPROVED'}
                </Text>
              </View>
            </View>
            <View style={styles.stampFoot}>
              <Text style={styles.stampFootTime}>{lastStamp.time}</Text>
              <Text style={styles.stampFootDate}>{lastStamp.date}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.emptyCap} onPress={handleCardPress}>
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
          {history.length > 0 ? (
            history.slice(0, 3).map((item) => {
              const dateObj = new Date(item.date);
              // Handle JS date parsing timezone differences by using split
              const [year, month, day] = item.date.split('-');
              const localDate = new Date(Number(year), Number(month) - 1, Number(day));
              const dateStr = localDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
              
              let checkInStr = '--:--';
              if (item.marked_at) {
                checkInStr = new Date(item.marked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              }
              
              let checkOutStr = 'Still checked in';
              if (item.check_out_at) {
                checkOutStr = new Date(item.check_out_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              }
              
              let durationStr = item.duration_formatted || '';
              
              const isPresent = item.status === 'APPROVED' || item.status === 'PENDING';
              
              return (
                <View key={item.id} style={styles.miniRow}>
                  <View style={[styles.statusDot, { backgroundColor: isPresent ? '#2F8F5B' : '#B9791C' }]} />
                  <View style={styles.miniInfo}>
                    <Text style={styles.miniDay}>{dateStr}</Text>
                    <Text style={styles.miniHours}>
                      {checkInStr} – {checkOutStr} {durationStr ? `· ${durationStr}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.badge, isPresent ? styles.badgePresent : styles.badgeLate]}>
                    <Text style={isPresent ? styles.badgePresentText : styles.badgeLateText}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={{ textAlign: 'center', color: '#63796B', marginTop: 20 }}>No attendance history yet</Text>
          )}
        </View>

      </ScrollView>

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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ribbonApproved: {
    backgroundColor: '#2F8F5B',
  },
  ribbonRejected: {
    backgroundColor: '#C24936',
  },
  ribbonFlagged: {
    backgroundColor: '#B9791C',
  },
  ribbonPending: {
    backgroundColor: '#1A6DB5',
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









