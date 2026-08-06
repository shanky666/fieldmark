import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { COLORS } from '../../constants/colors';

type RoleSelectNavProp = StackNavigationProp<AuthStackParamList, 'RoleSelect'>;

interface Props {
  navigation: RoleSelectNavProp;
}

export default function RoleSelect({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3FAF5" />
      <View style={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>📍</Text>
          </View>
          <Text style={styles.title}>FieldMark</Text>
          <Text style={styles.subtitle}>Geotagged Field Attendance System</Text>
        </View>

        {/* Portal Options */}
        <View style={styles.cardContainer}>
          <Text style={styles.sectionLabel}>SELECT YOUR PORTAL</Text>

          <TouchableOpacity 
            style={[styles.portalCard, { borderColor: '#2F8F5B' }]} 
            onPress={() => navigation.navigate('WorkerLogin')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#DCF2E3' }]}>
              <Text style={styles.portalIcon}>👷</Text>
            </View>
            <View style={styles.portalInfo}>
              <Text style={styles.portalTitle}>Employee Portal</Text>
              <Text style={styles.portalSub}>Mark attendance, geotag entry & request leaves</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.portalCard, { borderColor: '#B9791C' }]} 
            onPress={() => navigation.navigate('SupervisorLogin')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FBEDD3' }]}>
              <Text style={styles.portalIcon}>📋</Text>
            </View>
            <View style={styles.portalInfo}>
              <Text style={styles.portalTitle}>Supervisor Portal</Text>
              <Text style={styles.portalSub}>Field rounds, team headcount & daily logs</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.portalCard, { borderColor: '#6E56A6' }]} 
            onPress={() => navigation.navigate('AdminLogin')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#EAE3F7' }]}>
              <Text style={styles.portalIcon}>🗂</Text>
            </View>
            <View style={styles.portalInfo}>
              <Text style={styles.portalTitle}>Admin Portal</Text>
              <Text style={styles.portalSub}>Verifications, employee CRUD & reports</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Protected by Firebase Auth · GPS Verification Engine v2.4</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3FAF5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#2F8F5B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#2F8F5B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16241C',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#63796B',
    marginTop: 4,
    fontWeight: '500',
  },
  cardContainer: {
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9BAFA2',
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: 'center',
  },
  portalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    shadowColor: '#184A31',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalIcon: {
    fontSize: 22,
  },
  portalInfo: {
    flex: 1,
    marginLeft: 14,
  },
  portalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16241C',
  },
  portalSub: {
    fontSize: 12,
    color: '#63796B',
    marginTop: 2,
    lineHeight: 16,
  },
  arrow: {
    fontSize: 22,
    color: '#9BAFA2',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#9BAFA2',
    fontWeight: '600',
  },
});
