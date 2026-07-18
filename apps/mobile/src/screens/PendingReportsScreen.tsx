import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useAutoSyncOnReconnect } from '@/hooks/useAutoSyncOnReconnect';
import { useReportQueue } from '@/hooks/useReportQueue';
import type { RootStackParamList } from '@/navigation/types';
import type { QueuedReportDraft } from '@/storage/reportQueue';

type Props = NativeStackScreenProps<RootStackParamList, 'PendingReports'>;

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export default function PendingReportsScreen(_props: Props) {
  const { token } = useAuth();
  const { queue, isSyncing, syncError, sync, refresh } = useReportQueue(token);

  useAutoSyncOnReconnect(
    useCallback(() => {
      sync();
    }, [sync]),
  );

  const renderItem = ({ item }: { item: QueuedReportDraft }) => (
    <View style={styles.card}>
      <Text style={styles.dealId}>Deal {shortId(item.dealId)}</Text>
      <Text style={styles.meta}>
        {item.workVolume.value} {item.workVolume.unit} · captured{' '}
        {new Date(item.capturedAt).toLocaleString()}
      </Text>
      {item.engineHours !== undefined ? (
        <Text style={styles.meta}>Engine hours: {item.engineHours}</Text>
      ) : null}
      {item.notes ? <Text style={styles.meta}>{item.notes}</Text> : null}
      <Text style={styles.meta}>
        GPS {item.gps.lat.toFixed(5)}, {item.gps.lng.toFixed(5)} · {item.photoUrls.length} photo
        {item.photoUrls.length === 1 ? '' : 's'}
      </Text>
      {item.lastRejectionReason ? (
        <Text style={styles.rejected}>Rejected: {item.lastRejectionReason}</Text>
      ) : (
        <Text style={styles.queued}>Queued, awaiting sync</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {syncError ? <Text style={styles.error}>{syncError}</Text> : null}
      <FlatList
        data={queue}
        keyExtractor={(item) => item.clientReportId}
        onRefresh={refresh}
        refreshing={false}
        contentContainerStyle={queue.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending reports. All synced.</Text>}
        renderItem={renderItem}
      />
      <TouchableOpacity
        style={[styles.syncButton, isSyncing && styles.buttonDisabled]}
        onPress={sync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.syncButtonText}>Sync now ({queue.length})</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  dealId: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, color: '#555', marginTop: 4 },
  rejected: { color: '#c0392b', marginTop: 8, fontWeight: '600' },
  queued: { color: '#b9770e', marginTop: 8, fontWeight: '600' },
  error: { color: '#c0392b', padding: 12, textAlign: 'center' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#888' },
  syncButton: {
    margin: 16,
    backgroundColor: '#1a5276',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  syncButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
