import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';

type GrievanceInboxNavigationProp = StackNavigationProp<WorkerStackParamList, 'WorkerTabs'>;

interface GrievanceInboxProps {
  navigation: GrievanceInboxNavigationProp;
}

export default function GrievanceInbox({ navigation }: GrievanceInboxProps) {
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

  useEffect(() => {
    fetchThreads();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchThreads();
    });
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }: { item: any }) => {
    const timeStr = item.timestamp 
      ? new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : '';

    return (
      <TouchableOpacity
        style={styles.threadCard}
        onPress={() => navigation.navigate('GrievanceThread', { 
          threadId: item.thread_id,
          supervisorName: item.other_party?.name || 'Supervisor'
        })}
      >
        <View style={styles.leftCol}>
          <Text style={styles.subject}>{item.subject}</Text>
          <Text style={styles.lastMsg} numberOfLines={1}>{item.last_message}</Text>
          <Text style={styles.partyText}>With: {item.other_party?.name || 'Supervisor'}</Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.timeText}>{timeStr}</Text>
          
          <View style={styles.badgeRow}>
            {item.is_resolved ? (
              <View style={styles.resolvedBadge}>
                <Text style={styles.resolvedText}>{t('grievances.resolved')}</Text>
              </View>
            ) : (
              <View style={styles.openBadge}>
                <Text style={styles.openText}>{t('grievances.open')}</Text>
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
      <Text style={styles.screenTitle}>{t('grievances.inboxTitle')}</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={threads}
          renderItem={renderItem}
          keyExtractor={(item) => item.thread_id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No message threads. Tap (+) to start one.</Text>
          }
        />
      )}

      {/* FAB (+) Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewGrievance')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
  },
  list: {
    padding: 20,
    paddingBottom: 80,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 4,
  },
  partyText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 6,
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
    width: 18,
    height: 18,
    borderRadius: 9,
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
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  resolvedText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: 'bold',
  },
  openBadge: {
    backgroundColor: '#fffbeb',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  openText: {
    color: '#b45309',
    fontSize: 9,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    bottom: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightText,
    fontSize: 13,
    marginTop: 40,
  },
});
