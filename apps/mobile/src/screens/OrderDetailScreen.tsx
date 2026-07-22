import { useFocusEffect } from '@react-navigation/native';
import { OrderStatus, UserRole, type Equipment, type Order, type Report } from '@spectech/shared-types';
import { ApiError } from '@/api/client';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { getEquipmentById } from '@/api/equipment';
import { cancelOrder, getOrderById, startContract } from '@/api/orders';
import { confirmReport, getReportsForOrder } from '@/api/reports';
import { getOperators } from '@/api/users';
import Button from '@/components/Button';
import Card from '@/components/Card';
import InfoRow from '@/components/InfoRow';
import Screen from '@/components/Screen';
import StatusTag from '@/components/StatusTag';
import { useAuth } from '@/context/AuthContext';
import type { RootScreenProps } from '@/navigation/types';
import { colors, fontSizes, radii, spacing } from '@/theme';
import { formatDateTime, shortId } from '@/utils/format';
import {
  EQUIPMENT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  REPORT_SYNC_STATUS_LABELS,
  orderStatusTone,
  reportSyncTone,
} from '@/utils/labels';

type Props = RootScreenProps<'OrderDetail'>;

const TRACKING_NOTES: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.REQUEST]: 'Гео-трекінг розпочнеться після призначення техніки.',
  [OrderStatus.AGREED]: 'Гео-трекінг розпочнеться з початком контракту.',
  [OrderStatus.IN_WORK]: 'Гео-трекінг активний.',
  [OrderStatus.DONE]: 'Гео-трекінг завершено.',
};

export default function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { profile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const isOwner = Boolean(profile?.roles.includes(UserRole.EQUIPMENT_OWNER));

  const load = useCallback(async () => {
    setError(null);
    try {
      const fetchedOrder = await getOrderById(orderId);
      setOrder(fetchedOrder);

      if (fetchedOrder.equipmentId) {
        getEquipmentById(fetchedOrder.equipmentId)
          .then(setEquipment)
          .catch(() => undefined);
      }

      const canSeeReports =
        fetchedOrder.status === OrderStatus.IN_WORK || fetchedOrder.status === OrderStatus.DONE;
      if (canSeeReports) {
        getReportsForOrder(orderId)
          .then(setReports)
          .catch(() => undefined);
      }

      if (fetchedOrder.operatorId && isOwner) {
        getOperators()
          .then((operators) => {
            const match = operators.find((op) => op.id === fetchedOrder.operatorId);
            if (match) setOperatorName(match.fullName);
          })
          .catch(() => undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити замовлення');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, isOwner]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleStartContract = async () => {
    setIsActing(true);
    try {
      const updated = await startContract(orderId);
      setOrder(updated);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        Alert.alert('Оператор зайнятий', 'Цей оператор вже працює на іншому замовленні.');
      } else {
        Alert.alert('Помилка', err instanceof Error ? err.message : 'Не вдалося розпочати контракт');
      }
    } finally {
      setIsActing(false);
    }
  };

  const handleCancel = async () => {
    setIsActing(true);
    try {
      const updated = await cancelOrder(orderId);
      setOrder(updated);
    } catch (err) {
      Alert.alert('Помилка', err instanceof Error ? err.message : 'Не вдалося скасувати замовлення');
    } finally {
      setIsActing(false);
    }
  };

  const handleConfirmReport = async (reportId: string) => {
    setIsActing(true);
    try {
      await confirmReport(reportId);
      await load();
    } catch (err) {
      Alert.alert('Помилка', err instanceof Error ? err.message : 'Не вдалося підтвердити звіт');
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading || !order) {
    return (
      <Screen title="Замовлення">
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.accent} />}
      </Screen>
    );
  }

  const title = `${EQUIPMENT_TYPE_LABELS[order.equipmentType]}${
    equipment?.brand ? ` · ${equipment.brand} ${equipment.model ?? ''}`.trimEnd() : ''
  }`;

  const currentStepIndex = ORDER_STATUS_STEPS.indexOf(
    order.status as (typeof ORDER_STATUS_STEPS)[number],
  );
  const latestReport = reports[0];
  const canAssign = isOwner && order.status === OrderStatus.REQUEST && !order.equipmentId;
  const canStartContract =
    isOwner && order.status === OrderStatus.AGREED && order.ownerId === profile?.id;
  const canCancel =
    (order.renterId === profile?.id || order.ownerId === profile?.id) &&
    order.status !== OrderStatus.DONE &&
    order.status !== OrderStatus.CANCELLED;
  const canConfirmLatestReport = isOwner && latestReport && !latestReport.confirmed;

  return (
    <Screen title={title}>
      <Text style={styles.dates}>
        {order.dateFrom} – {order.dateTo}
      </Text>
      <StatusTag label={ORDER_STATUS_LABELS[order.status]} tone={orderStatusTone(order.status)} />

      {order.status === OrderStatus.CANCELLED ? (
        <Text style={styles.cancelledNote}>Це замовлення було скасовано.</Text>
      ) : (
        <View style={styles.timeline}>
          {ORDER_STATUS_STEPS.map((step, index) => (
            <View key={step} style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  index <= currentStepIndex && styles.timelineDotActive,
                ]}
              />
              <Text
                style={[
                  styles.timelineLabel,
                  index <= currentStepIndex && styles.timelineLabelActive,
                ]}
              >
                {ORDER_STATUS_LABELS[step]}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Card style={styles.infoCard}>
        <InfoRow label="Локація" value={order.location} />
        <InfoRow label="Замовник" value={order.renterId === profile?.id ? 'Ви' : shortId(order.renterId)} />
        <InfoRow
          label="Оператор"
          value={
            order.operatorId
              ? operatorName ?? shortId(order.operatorId)
              : 'не призначено'
          }
        />
      </Card>

      {order.comment ? (
        <Card>
          <Text style={styles.commentLabel}>Коментар</Text>
          <Text style={styles.commentText}>{order.comment}</Text>
        </Card>
      ) : null}

      {latestReport ? (
        <Card>
          <Text style={styles.commentLabel}>Останній звіт</Text>
          <Text style={styles.commentText}>{latestReport.text}</Text>
          <Text style={styles.reportMeta}>{formatDateTime(latestReport.capturedAt)}</Text>
          <StatusTag
            label={REPORT_SYNC_STATUS_LABELS[latestReport.syncStatus]}
            tone={reportSyncTone(latestReport.syncStatus)}
          />
        </Card>
      ) : null}

      {order.status !== OrderStatus.CANCELLED && TRACKING_NOTES[order.status] ? (
        <Text style={styles.trackingNote}>{TRACKING_NOTES[order.status]}</Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {canAssign ? (
          <Button
            label="Призначити техніку та оператора"
            onPress={() => navigation.navigate('AssignOrder', { orderId, equipmentType: order.equipmentType })}
          />
        ) : null}
        {canStartContract ? (
          <Button label="Розпочати контракт" onPress={handleStartContract} loading={isActing} />
        ) : null}
        {canConfirmLatestReport ? (
          <Button
            label="Підтвердити звіт і завершити замовлення"
            onPress={() => handleConfirmReport(latestReport.id)}
            loading={isActing}
          />
        ) : null}
        <Button
          label="Перейти в чат"
          variant="secondary"
          onPress={() => navigation.navigate('Chat', { orderId, title })}
        />
        {canCancel ? (
          <Button label="Скасувати замовлення" variant="danger" onPress={handleCancel} loading={isActing} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: spacing.md },
  dates: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.sm },
  cancelledNote: { color: colors.danger, marginTop: spacing.md, fontWeight: '600' },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  timelineDotActive: { backgroundColor: colors.accent },
  timelineLabel: { color: colors.textMuted, fontSize: fontSizes.xs, textAlign: 'center' },
  timelineLabelActive: { color: colors.text, fontWeight: '700' },
  infoCard: { marginTop: spacing.md },
  commentLabel: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.xs },
  commentText: { color: colors.text, fontSize: fontSizes.md },
  reportMeta: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: spacing.xs, marginBottom: spacing.sm },
  trackingNote: { color: colors.info, fontSize: fontSizes.sm, marginBottom: spacing.lg },
  actions: { marginTop: spacing.lg, gap: spacing.md },
});
