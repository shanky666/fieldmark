import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { apiClient } from '../../api/client';

export default function DailyReport() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await apiClient.get(`/api/attendance/?date=${today}`);
        setRecords(res.data);
      } catch(e) { console.warn(e); }
      setLoading(false);
    };
    fetchReport();
  }, []);

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large"/></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Today's Attendance & Working Hours</Text>
      <FlatList 
        data={records}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.worker_name} ({item.worker_employee_id})</Text>
            <Text>Status: {item.status}</Text>
            <Text>Hours Worked: <Text style={{fontWeight:'bold', color:'#1C7541'}}>{item.duration_formatted || '--'}</Text></Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFCFA', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1C7541' },
  card: { padding: 16, backgroundColor: '#FFF', borderRadius: 8, marginBottom: 12, elevation: 2 },
  name: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 }
});
