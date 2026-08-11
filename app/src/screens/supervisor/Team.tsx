import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';

export default function Team() {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();
  
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const zoneId = userProfile?.zone_detail?.id || userProfile?.assigned_zone_id;
        const url = zoneId ? `/api/workers/list/?zone=${zoneId}` : '/api/workers/list/';
        const res = await apiClient.get(url);
        setWorkers(res.data.results || res.data || []);
      } catch (e) {
        console.error("Failed to load supervisor team roster", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [userProfile]);

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.detail}>Id: {item.employee_id} | Type: {item.worker_type}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Field Team</Text>
      <Text style={styles.subtitle}>
        Zone: {userProfile?.zone_detail?.name || 'Assigned Zone'}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={workers}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No workers assigned to this zone.</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.lightText,
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 10,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '22',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  detail: {
    fontSize: 11,
    color: COLORS.lightText,
    marginTop: 2,
  },
  phone: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightText,
    fontSize: 13,
    marginTop: 40,
  },
});
