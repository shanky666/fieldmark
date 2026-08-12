import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { AdminStackParamList } from '../../navigation/AdminNavigator';

type AdminGrievancesNavigationProp = StackNavigationProp<AdminStackParamList, 'AdminTabs'>;

interface GrievancesProps {
  navigation: AdminGrievancesNavigationProp;
}

export default function Grievances({ navigation }: GrievancesProps) {
  const { t } = useTranslation();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = async () => {
    try {
      const res = await apiClient.get('/api/grievances/me/');
      setThreads(res.data);
    } catch (e) {
      console.error("Failed to load grievance threads", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchThreads();
    }, [])
  );

  const renderItem = ({ item }: { item: any }) => {
    const timeStr = item.timestamp 
      ? new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity
        style={styles.threadCard}
        onPress={() => navigation.navigate('AdminGrievanceDetail', { 
          threadId: item.thread_id,
          employeeName: item.other_party?.name || 'Employee'
        })}
      >
        <View style={styles.leftCol}>
          <Text style={styles.subject}>{item.subject}</Text>
          <Text style={styles.lastMsg} numberOfLines={1}>{item.last_message}</Text>
          <Text style={styles.partyText}>From: {item.other_party?.name || 'Employee'}</Text>
          <Text style={styles.partyText}>Employee ID: {item.other_party?.employee_id || 'N/A'}</Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.timeText}>{timeStr}</Text>
          
          <View style={styles.badgeRow}>
            {item.is_resolved ? (
              <View style={styles.resolvedBadge}>
                <Text style={styles.resolvedText}>RESOLVED</Text>
              </View>
            ) : (
              <View style={styles.openBadge}>
                <Text style={styles.openText}>OPEN</Text>
              </View>
            )}
            
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Global Grievances</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={threads}
          renderItem={renderItem}
          keyExtractor={(item) => item.thread_id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No grievances reported across all zones.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
    paddingTop: 44,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  threadCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  leftCol: {
    flex: 1,
    paddingRight: 8,
  },
  subject: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  lastMsg: {
    fontSize: 13,
    color: COLORS.lightText,
    marginTop: 4,
  },
  partyText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 8,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.lightText,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resolvedBadge: {
    backgroundColor: COLORS.accent + '22',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  resolvedText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: 'bold',
  },
  openBadge: {
    backgroundColor: '#fffbeb',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  openText: {
    color: '#b45309',
    fontSize: 9,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightText,
    fontSize: 13,
    marginTop: 40,
  },
});
