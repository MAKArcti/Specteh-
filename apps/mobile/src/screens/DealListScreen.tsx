import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Deal } from '@spectech/shared-types';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchMyDeals } from '@/api/deals';
import { useAuth } from '@/context/AuthContext';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DealList'>;

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate).toLocaleDateString();
  const end = new Date(endDate).toLocaleDateString();
  return `${start} – ${end}`;
}

export default function DealListScreen({ navigation }: Props) {
  const { token, logout } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setError(null);
    try {
      setDeals(await fetchMyDeals(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('PendingReports')}>
          <Text style={styles.headerAction}>Pending</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error} (showing offline data if cached)</Text> : null}
      <FlatList
        data={deals}
        keyExtractor={(deal) => deal.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        contentContainerStyle={deals.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={<Text style={styles.emptyText}>No deals assigned yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ReportSubmission', { dealId: item.id })}
          >
            <Text style={styles.dealId}>Deal {shortId(item.id)}</Text>
            <Text style={styles.status}>{item.status.replace(/_/g, ' ')}</Text>
            <Text style={styles.dates}>{formatDateRange(item.startDate, item.endDate)}</Text>
            <Text style={styles.price}>{item.agreedPricePerHour} UAH/hr</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerAction: { color: '#1a5276', fontSize: 16, marginRight: 12, fontWeight: '600' },
  error: { color: '#c0392b', padding: 12, textAlign: 'center' },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  dealId: { fontSize: 16, fontWeight: '700' },
  status: { fontSize: 14, color: '#1a5276', marginTop: 4, textTransform: 'capitalize' },
  dates: { fontSize: 13, color: '#666', marginTop: 4 },
  price: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#888' },
  logoutButton: { padding: 16, alignItems: 'center' },
  logoutText: { color: '#c0392b', fontSize: 15 },
});
