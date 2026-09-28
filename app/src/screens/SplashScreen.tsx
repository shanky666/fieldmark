import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      {/* Background Graphic elements */}
      <View style={styles.topDecorationLeft} />
      <View style={styles.topDecorationRight} />
      <View style={styles.bottomDecoration} />

      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image 
          source={require('../../assets/images/atia_logo.png')} 
          style={styles.logo}
        />
        
        <View style={styles.loadingDotsContainer}>
          <Animated.View style={[styles.loadingDot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.loadingDot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.loadingDot, { opacity: fadeAnim }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: 250,
    height: 150,
    resizeMode: 'contain',
  },
  loadingDotsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1C7541',
  },
  topDecorationLeft: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    backgroundColor: '#E8F5E9',
    borderRadius: 100,
    opacity: 0.7,
  },
  topDecorationRight: {
    position: 'absolute',
    top: -30,
    right: -40,
    width: 150,
    height: 150,
    backgroundColor: '#A3C4B1',
    borderRadius: 75,
    opacity: 0.3,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: -100,
    width: width * 1.5,
    height: width * 1.5,
    backgroundColor: '#E8F5E9',
    borderRadius: width * 0.75,
    opacity: 0.5,
  },
});
