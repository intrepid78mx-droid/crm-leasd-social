import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const API_URL = 'http://localhost:3000/api';

export default function App() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/dashboard/summary`)
      .then((response) => response.json())
      .then(setSummary)
      .catch(() => setSummary({ error: 'No se pudo conectar al backend' }));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>CRM Leads Social (Android + iOS)</Text>
        {!summary && <Text>Cargando datos...</Text>}
        {summary?.error && <Text>{summary.error}</Text>}
        {summary?.byStage?.map((item) => (
          <View key={item.stage} style={styles.card}>
            <Text style={styles.stage}>{item.stage}</Text>
            <Text style={styles.count}>{item.total} leads</Text>
          </View>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12 },
  stage: { fontSize: 16, fontWeight: '600' },
  count: { marginTop: 4, color: '#4b5563' }
});
