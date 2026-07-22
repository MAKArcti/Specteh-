import { EquipmentType, type Equipment } from '@spectech/shared-types';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { getBrowsableEquipment } from '@/api/equipment';
import Card from '@/components/Card';
import Chip from '@/components/Chip';
import EmptyState from '@/components/EmptyState';
import Screen from '@/components/Screen';
import StatusTag from '@/components/StatusTag';
import type { TabScreenProps } from '@/navigation/types';
import { colors, fontSizes, spacing } from '@/theme';
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_TYPE_LABELS, equipmentStatusTone } from '@/utils/labels';

type Props = TabScreenProps<'Market'>;

const TYPE_FILTERS: (EquipmentType | 'all')[] = ['all', ...Object.values(EquipmentType)];

export default function MarketListScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<EquipmentType | 'all'>('all');
  const [items, setItems] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (type: EquipmentType | 'all') => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await getBrowsableEquipment(type === 'all' ? undefined : type);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити техніку');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  return (
    <Screen title="Маркет" mode="root" scroll={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {TYPE_FILTERS.map((type) => (
          <Chip
            key={type}
            label={type === 'all' ? 'Усі' : EQUIPMENT_TYPE_LABELS[type]}
            selected={filter === type}
            onPress={() => setFilter(type)}
          />
        ))}
      </ScrollView>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => load(filter)} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!isLoading ? <EmptyState text="Немає доступної техніки" /> : null}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('EquipmentDetail', { equipmentId: item.id })}>
            <Text style={styles.title}>
              {EQUIPMENT_TYPE_LABELS[item.type]}
              {item.brand ? ` · ${item.brand} ${item.model ?? ''}`.trimEnd() : ''}
            </Text>
            <Text style={styles.subtitle}>
              {EQUIPMENT_TYPE_LABELS[item.type]}
              {item.serialNumber ? ` · №${item.serialNumber}` : ''}
            </Text>
            <Text style={styles.meta}>
              {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)} · {item.pricePerHour} грн/год
            </Text>
            <StatusTag
              label={EQUIPMENT_STATUS_LABELS[item.status]}
              tone={equipmentStatusTone(item.status)}
            />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, flexGrow: 0 },
  list: { padding: spacing.lg },
  error: { color: colors.danger, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  title: { color: colors.text, fontSize: fontSizes.md, fontWeight: '700', marginBottom: 2 },
  subtitle: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.xs },
  meta: { color: colors.textMuted, fontSize: fontSizes.xs, marginBottom: spacing.sm },
});
