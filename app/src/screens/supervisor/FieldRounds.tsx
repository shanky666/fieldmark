import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { SupervisorStackParamList } from '../../navigation/SupervisorNavigator';

type FieldRoundsNavProp = StackNavigationProp<SupervisorStackParamList, 'SupervisorTabs'>;

interface FieldRoundsProps {
  navigation: FieldRoundsNavProp;
}

export default function FieldRounds({ navigation }: FieldRoundsProps) {
  const { t } = useTranslation();
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRounds = async () => {
    try {
      const res = await apiClient.get('/api/rounds/');
      setRounds(res.data);
    } catch (e) {
      console.error("Failed to load field rounds list", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRounds();
    });
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }: { item: any }) => {
    const timeStr = item.visited_at 
      ? new Date(item.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateLabel}>{item.visited_at?.split('T')[0]}</Text>
          <Text style={styles.timeLabel}>{timeStr}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.infoText}>Zone: {item.zone_detail?.name || 'N/A'}</Text>
          <Text style={styles.infoHighlight}>
            Observed Worker Count: {item.worker_count_observed}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('supervisor.rounds')}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('LogFieldRound')}
        >
          <Text style={styles.btnText}>+ Log Round</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={rounds}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No field rounds logged yet. Tap button to log your first round.</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 44, // touch target minimum
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 6,
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  cardBody: {
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.darkText,
  },
  infoHighlight: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightText,
    fontSize: 13,
    marginTop: 40,
  },
});
