import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IntroNavProp = StackNavigationProp<AuthStackParamList, 'IntroOnboarding'>;

interface Props {
  navigation: IntroNavProp;
}

const { width } = Dimensions.get('window');

export default function IntroOnboarding({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Graphic Area */}
        <View style={styles.graphicHeader}>
          <Image 
            source={require('../../../assets/images/atia_logo.png')} 
            style={styles.logo}
          />
          <Text style={styles.companyName}>Official Standard Operating Procedure</Text>
          <View style={styles.divider} />
        </View>

        {/* Content Area */}
        <View style={styles.contentCard}>
          <View style={styles.procedureStep}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="tractor" size={24} color="#1C7541" />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>1. Farmer Engagement</Text>
              <Text style={styles.stepDesc}>Establish communication and operational collaboration with farmers in authorized zones.</Text>
            </View>
          </View>

          <View style={styles.procedureStep}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="map-marker-radius" size={24} color="#1C7541" />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>2. Geotagged Field Verification</Text>
              <Text style={styles.stepDesc}>Ensure accurate presence at designated agricultural boundaries using real-time GPS synchronization.</Text>
            </View>
          </View>

          <View style={styles.procedureStep}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="face-recognition" size={24} color="#1C7541" />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>3. Biometric Authentication</Text>
              <Text style={styles.stepDesc}>Strict compliance via hardware-level facial recognition to authenticate field personnel.</Text>
            </View>
          </View>
        </View>

        <View style={styles.graphicsBottom}>
           <Text style={styles.supportedByText}>IN COLLABORATION WITH</Text>
           <Image 
              source={require('../../../assets/images/sfac_logo.png')} 
              style={styles.sfacLogo}
            />
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueBtn} 
          onPress={() => navigation.navigate('WorkerLogin')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>Proceed to Login →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  graphicHeader: {
    backgroundColor: '#E8F5E9',
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 30,
    shadowColor: '#1C7541',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 220,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C7541',
    marginTop: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: '#F2A900',
    marginTop: 10,
    borderRadius: 2,
  },
  contentCard: {
    paddingHorizontal: 24,
  },
  procedureStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3FAF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#D1E5D8',
  },
  stepIcon: {
    fontSize: 24,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2A3B30',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: '#5C7365',
    lineHeight: 18,
  },
  graphicsBottom: {
    marginTop: 40,
    alignItems: 'center',
    opacity: 0.9,
  },
  supportedByText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B8D83',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sfacLogo: {
    width: 150,
    height: 80,
    resizeMode: 'contain',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(250, 252, 250, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E2EBE5',
  },
  continueBtn: {
    backgroundColor: '#1C7541',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C7541',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
