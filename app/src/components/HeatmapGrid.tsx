import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';

interface HeatmapData {
  zones: string[];
  weekdays: string[];
  matrix: number[][]; // values 0 to 100
}

interface HeatmapGridProps {
  data: HeatmapData;
  onCellPress?: (zoneName: string, weekday: string) => void;
}

export default function HeatmapGrid({ data, onCellPress }: HeatmapGridProps) {
  const getCellColor = (value: number) => {
    if (value === 0) return '#f3f4f6'; // Gray
    // Map 0-100 to green opacity levels
    const opacity = (value / 100).toFixed(2);
    return `rgba(58, 124, 58, ${opacity})`;
  };

  const getTextColor = (value: number) => {
    return value > 55 ? '#ffffff' : COLORS.darkText;
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.container}>
        {/* Header Row: Weekdays */}
        <View style={styles.row}>
          <View style={styles.zoneHeaderCell}>
            <Text style={styles.headerText}>Zone</Text>
          </View>
          {data.weekdays.map((day, idx) => (
            <View key={`day-${idx}`} style={styles.cell}>
              <Text style={styles.headerText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Matrix Rows */}
        {data.zones.map((zoneName, zoneIdx) => (
          <View key={`zone-${zoneIdx}`} style={styles.row}>
            {/* Zone Name Label */}
            <View style={styles.zoneLabelCell}>
              <Text style={styles.zoneText} numberOfLines={1}>
                {zoneName}
              </Text>
            </View>

            {/* Weekday Cells */}
            {data.matrix[zoneIdx]?.map((val, dayIdx) => {
              const bg = getCellColor(val);
              const txtColor = getTextColor(val);
              const dayLabel = data.weekdays[dayIdx];

              return (
                <TouchableOpacity
                  key={`val-${zoneIdx}-${dayIdx}`}
                  style={[styles.cell, { backgroundColor: bg }]}
                  disabled={!onCellPress}
                  onPress={() => onCellPress && onCellPress(zoneName, dayLabel)}
                >
                  <Text style={[styles.valText, { color: txtColor }]}>
                    {val}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginVertical: 12,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneHeaderCell: {
    width: 90,
    paddingVertical: 8,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  zoneLabelCell: {
    width: 90,
    paddingVertical: 8,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 4,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  cell: {
    width: 48,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: 4,
  },
  headerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.lightText,
  },
  zoneText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  valText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
