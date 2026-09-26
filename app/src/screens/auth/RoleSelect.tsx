import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { COLORS } from '../../constants/colors';
import { useAuthStore } from '../../store/auth';
import { useTranslation } from 'react-i18next';

type RoleSelectNavProp = StackNavigationProp<AuthStackParamList, 'RoleSelect'>;

interface Props {
  navigation: RoleSelectNavProp;
}

export default function RoleSelect({ navigation }: Props) {
  const { language, setLanguage } = useAuthStore();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3FAF5" />
      
      {/* Language Switcher */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 24, paddingTop: 10, gap: 10 }}>
        <TouchableOpacity onPress={() => setLanguage('en')} style={[styles.langBtn, language === 'en' && styles.langBtnActive]}>
          <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setLanguage('te')} style={[styles.langBtn, language === 'te' && styles.langBtnActive]}>
          <Text style={[styles.langBtnText, language === 'te' && styles.langBtnTextActive]}>తెలుగు</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../../assets/images/atia_logo.png')} 
            style={{ width: 140, height: 100, resizeMode: 'contain', marginBottom: 8 }} 
          />
          <Text style={styles.title}>{t('common.appName') || 'FieldMark'}</Text>
          <Text style={styles.subtitle}>{t('auth.phoneEntrySubtitle') || 'Geotagged Field Attendance System'}</Text>
        </View>

        {/* Portal Options */}
        <View style={styles.cardContainer}>
          <Text style={styles.sectionLabel}>{t('auth.selectPortal') || 'SELECT YOUR PORTAL'}</Text>

          <TouchableOpacity 
            style={[styles.portalCard, { borderColor: '#2F8F5B' }]} 
            onPress={() => navigation.navigate('WorkerLogin')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#DCF2E3' }]}>
              <Text style={styles.portalIcon}>👷</Text>
            </View>
            <View style={styles.portalInfo}>
              <Text style={styles.portalTitle}>{t('auth.employeePortalTitle') || 'Employee Portal'}</Text>
              <Text style={styles.portalSub}>{t('auth.employeePortalSub') || 'Mark attendance, geotag entry & request leaves'}</Text>
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
              <Text style={styles.portalTitle}>{t('auth.adminPortalTitle') || 'Admin Portal'}</Text>
              <Text style={styles.portalSub}>{t('auth.adminPortalSub') || 'Verifications, employee CRUD & reports'}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.footerText') || 'Protected by Firebase Auth · GPS Verification Engine v2.4'}</Text>
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
    paddingBottom: 32,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9BAFA2',
    backgroundColor: '#FFFFFF',
  },
  langBtnActive: {
    borderColor: '#2F8F5B',
    backgroundColor: '#2F8F5B',
  },
  langBtnText: {
    fontSize: 12,
    color: '#9BAFA2',
    fontWeight: '700',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
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
