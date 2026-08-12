import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface CameraOverlayProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address?: string | null;
}

export default function CameraOverlay({ latitude, longitude, accuracy, address }: CameraOverlayProps) {
  const formatCoord = (val: number | null) => (val !== null ? val.toFixed(5) : 'N/A');
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Target Reticle in Center */}
      <View style={styles.reticleContainer}>
        <View style={styles.reticleBorder} />
      </View>

      {/* Watermarks Container */}
      <View style={styles.watermarkRow}>
        {/* Location & GPS Coordinates (Bottom Left) */}
        <View style={styles.watermarkContainer}>
          {address ? (
            <Text style={styles.watermarkAddressText} numberOfLines={1}>📍 {address}</Text>
          ) : null}
          <Text style={styles.watermarkText}>GPS: {formatCoord(latitude)}, {formatCoord(longitude)}</Text>
          {accuracy !== null && (
            <Text style={styles.watermarkSubtext}>Acc: {accuracy.toFixed(1)}m</Text>
          )}
        </View>

        {/* Date + Time (Bottom Right) */}
        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>{dateStr}</Text>
          <Text style={styles.watermarkText}>{timeStr}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reticleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleBorder: {
    width: 250,
    height: 300,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
    borderRadius: 125, // Oval reticle for face framing
  },
  watermarkRow: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  watermarkContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    maxWidth: '65%',
  },
  watermarkAddressText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  watermarkText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  watermarkSubtext: {
    color: '#a8dba8',
    fontSize: 9,
    fontFamily: 'monospace',
  },
});
