import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

export default function History() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Attendance History</Text>

        {/* Statistics Grid */}
        <View style={styles.statGrid}>
          <View style={styles.statTile}>
            <Text style={styles.statNum}>22</Text>
            <Text style={styles.statLbl}>Days present</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statNum}>2</Text>
            <Text style={styles.statLbl}>Days late</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statNum}>1</Text>
            <Text style={styles.statLbl}>Days absent</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statNum}>96%</Text>
            <Text style={styles.statLbl}>Attendance rate</Text>
          </View>
        </View>

        {/* Monthly History Section */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>July 2026</Text>
        </View>

        <View style={styles.miniHistory}>
          <View style={styles.miniRow}>
            <View style={[styles.statusDot, { backgroundColor: '#2F8F5B' }]} />
            <View style={styles.miniInfo}>
              <Text style={styles.miniDay}>Tuesday, 29 Jul</Text>
              <Text style={styles.miniHours}>09:02 AM – In progress</Text>
            </View>
            <View style={[styles.badge, styles.badgePresent]}>
              <Text style={styles.badgePresentText}>Present</Text>
            </View>
          </View>

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
            <View style={[styles.statusDot, { backgroundColor: '#6E56A6' }]} />
            <View style={styles.miniInfo}>
              <Text style={styles.miniDay}>Saturday, 26 Jul</Text>
              <Text style={styles.miniHours}>Approved casual leave</Text>
            </View>
            <View style={[styles.badge, styles.badgeLeave]}>
              <Text style={styles.badgeLeaveText}>Leave</Text>
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
              <Text style={styles.miniHours}>08:58 AM – 06:07 PM · 9h 09m</Text>
            </View>
            <View style={[styles.badge, styles.badgePresent]}>
              <Text style={styles.badgePresentText}>Present</Text>
            </View>
          </View>

          <View style={styles.miniRow}>
            <View style={[styles.statusDot, { backgroundColor: '#C24936' }]} />
            <View style={styles.miniInfo}>
              <Text style={styles.miniDay}>Wednesday, 23 Jul</Text>
              <Text style={styles.miniHours}>No check-in recorded</Text>
            </View>
            <View style={[styles.badge, styles.badgeAbsent]}>
              <Text style={styles.badgeAbsentText}>Absent</Text>
            </View>
          </View>
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
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16241C',
    marginBottom: 16,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 16,
    padding: 14,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16241C',
  },
  statLbl: {
    fontSize: 11.5,
    color: '#63796B',
    marginTop: 2,
  },
  sectionHead: {
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16241C',
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
  badgeAbsent: {
    backgroundColor: '#FBE5E1',
  },
  badgeAbsentText: {
    color: '#C24936',
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeLeave: {
    backgroundColor: '#EAE3F7',
  },
  badgeLeaveText: {
    color: '#6E56A6',
    fontSize: 10.5,
    fontWeight: '700',
  },
});
