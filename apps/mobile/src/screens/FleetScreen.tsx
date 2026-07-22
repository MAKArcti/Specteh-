import { useFocusEffect } from '@react-navigation/native';
import type { Equipment, Order } from '@spectech/shared-types';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { getMyEquipment } from '@/api/equipment';
import { getActionableOrders } from '@/api/orders';
import Button from '@/components/Button';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import Screen from '@/components/Screen';
import StatusTag from '@/components/StatusTag';
import type { TabScreenProps } from '@/navigation/types';
import { colors, fontSizes, spacing } from '@/theme';
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  equipmentStatusTone,
  orderStatusTone,
} from '@/utils/labels';

type Props = TabScreenProps<'Fleet'>;

export default function FleetScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [actionable, mine] = await Promise.all([getActionableOrders(), getMyEquipment()]);
      setOrders(actionable);
      setEquipment(mine);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити дані парку');
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
    <Screen title="Техніка" mode="root" scroll={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.sectionTitle}>Потребують дій</Text>
        {orders.length === 0 ? (
          <EmptyState text="Немає завдань, що потребують дій" />
        ) : (
          orders.map((order) => (
            <Card key={order.id} onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}>
              <Text style={styles.title}>{EQUIPMENT_TYPE_LABELS[order.equipmentType]}</Text>
              <Text style={styles.meta}>{order.location}</Text>
              <StatusTag label={ORDER_STATUS_LABELS[order.status]} tone={orderStatusTone(order.status)} />
            </Card>
          ))
        )}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Мій парк техніки</Text>
        {equipment.length === 0 ? (
          <EmptyState text="У вас ще немає техніки" />
        ) : (
          equipment.map((item) => (
            <Card key={item.id} onPress={() => navigation.navigate('Passport', { equipmentId: item.id })}>
              <Text style={styles.title}>
                {EQUIPMENT_TYPE_LABELS[item.type]}
                {item.brand ? ` · ${item.brand} ${item.model ?? ''}`.trimEnd() : ''}
              </Text>
              <Text style={styles.meta}>{item.serialNumber ? `№${item.serialNumber}` : ''}</Text>
              <StatusTag
                label={EQUIPMENT_STATUS_LABELS[item.status]}
                tone={equipmentStatusTone(item.status)}
              />
            </Card>
          ))
        )}

        <Button
          label="Додати техніку"
          onPress={() => navigation.navigate('AddEquipment')}
          style={styles.addButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSizes.lg, fontWeight: '800', marginBottom: spacing.md },
  sectionSpacing: { marginTop: spacing.xl },
  title: { color: colors.text, fontSize: fontSizes.md, fontWeight: '700', marginBottom: 4 },
  meta: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.xs },
  addButton: { marginTop: spacing.xl },
});
