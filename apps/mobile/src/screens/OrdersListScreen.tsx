import type { Order } from '@spectech/shared-types';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyOrders } from '@/api/orders';
import Button from '@/components/Button';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import Screen from '@/components/Screen';
import StatusTag from '@/components/StatusTag';
import type { TabScreenProps } from '@/navigation/types';
import { colors, fontSizes, spacing } from '@/theme';
import { EQUIPMENT_TYPE_LABELS, ORDER_STATUS_LABELS, orderStatusTone } from '@/utils/labels';

type Props = TabScreenProps<'Orders'>;

export default function OrdersListScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setOrders(await getMyOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити замовлення');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen title="Замовлення" mode="root" scroll={false}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!isLoading ? <EmptyState text="У вас ще немає замовлень" /> : null}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
            <Text style={styles.title}>{EQUIPMENT_TYPE_LABELS[item.equipmentType]}</Text>
            <Text style={styles.meta}>{item.location}</Text>
            <Text style={styles.meta}>
              {item.dateFrom} – {item.dateTo}
            </Text>
            <StatusTag label={ORDER_STATUS_LABELS[item.status]} tone={orderStatusTone(item.status)} />
          </Card>
        )}
      />
      <Button label="Нова заявка" onPress={() => navigation.navigate('CreateOrder', undefined)} style={styles.newButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  error: { color: colors.danger, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  title: { color: colors.text, fontSize: fontSizes.md, fontWeight: '700', marginBottom: 4 },
  meta: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.xs },
  newButton: { margin: spacing.lg },
});
