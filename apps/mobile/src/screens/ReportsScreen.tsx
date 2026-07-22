import { useFocusEffect } from '@react-navigation/native';
import { OrderStatus, type Order, type Report } from '@spectech/shared-types';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getOrdersForOperator } from '@/api/orders';
import { getReportsForOrder } from '@/api/reports';
import Button from '@/components/Button';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import Screen from '@/components/Screen';
import StatusTag from '@/components/StatusTag';
import { useAutoSyncOnReconnect } from '@/hooks/useAutoSyncOnReconnect';
import { useReportQueue } from '@/hooks/useReportQueue';
import type { TabScreenProps } from '@/navigation/types';
import { getWorkStartedAt, setWorkStartedAt } from '@/storage/workTimer';
import { colors, fontSizes, spacing } from '@/theme';
import { formatDateTime, formatElapsed, minutesBetween } from '@/utils/format';
import {
  EQUIPMENT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  REPORT_SYNC_STATUS_LABELS,
  orderStatusTone,
  reportSyncTone,
} from '@/utils/labels';

type Props = TabScreenProps<'Reports'>;

interface HistoryEntry {
  order: Order;
  report: Report;
}

export default function ReportsScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [startedMap, setStartedMap] = useState<Record<string, string | null>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const { queue, isSyncing, syncError, sync } = useReportQueue();
  useAutoSyncOnReconnect(useCallback(() => sync(), [sync]));

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const fetchedOrders = await getOrdersForOperator();
      setOrders(fetchedOrders);

      const activeOrders = fetchedOrders.filter(
        (o) => o.status === OrderStatus.AGREED || o.status === OrderStatus.IN_WORK,
      );
      const startedEntries = await Promise.all(
        activeOrders.map(async (o) => [o.id, await getWorkStartedAt(o.id)] as const),
      );
      setStartedMap(Object.fromEntries(startedEntries));

      const historyOrders = fetchedOrders.filter(
        (o) => o.status === OrderStatus.IN_WORK || o.status === OrderStatus.DONE,
      );
      const reportLists = await Promise.all(
        historyOrders.map(async (order) => {
          try {
            const reports = await getReportsForOrder(order.id);
            return reports.map((report) => ({ order, report }));
          } catch {
            return [];
          }
        }),
      );
      const flattened = reportLists
        .flat()
        .sort((a, b) => new Date(b.report.receivedAt).getTime() - new Date(a.report.receivedAt).getTime());
      setHistory(flattened);
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

  const handleStartWork = async (orderId: string) => {
    const iso = new Date().toISOString();
    await setWorkStartedAt(orderId, iso);
    setStartedMap((prev) => ({ ...prev, [orderId]: iso }));
  };

  const handleFinishWork = (order: Order) => {
    const startedAt = startedMap[order.id];
    if (!startedAt) return;
    const endedAt = new Date().toISOString();
    navigation.navigate('ReportCreate', {
      orderId: order.id,
      startedAt,
      endedAt,
      durationMin: minutesBetween(startedAt, endedAt),
    });
  };

  const activeOrders = orders.filter(
    (o) => o.status === OrderStatus.AGREED || o.status === OrderStatus.IN_WORK,
  );

  return (
    <Screen title="Звіти" mode="root" scroll={false}>
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.sectionTitle}>Активна робота</Text>
        {!isLoading && activeOrders.length === 0 ? (
          <EmptyState text="Немає активних замовлень" />
        ) : (
          activeOrders.map((order) => {
            const startedAt = startedMap[order.id];
            const showFinish = order.status === OrderStatus.IN_WORK && startedAt;
            const showStart = !startedAt;
            const waitingForContract = order.status === OrderStatus.AGREED && startedAt;
            return (
              <Card key={order.id}>
                <Text style={styles.title}>{EQUIPMENT_TYPE_LABELS[order.equipmentType]}</Text>
                <StatusTag label={ORDER_STATUS_LABELS[order.status]} tone={orderStatusTone(order.status)} />
                {showFinish ? (
                  <View style={styles.timerRow}>
                    <StatusTag label={formatElapsed(startedAt, nowMs)} tone="accent" />
                  </View>
                ) : null}
                {waitingForContract ? (
                  <Text style={styles.waitingNote}>Очікує підтвердження контракту власником</Text>
                ) : null}
                <View style={styles.cardActions}>
                  {showStart ? (
                    <Button label="Почати роботу" onPress={() => handleStartWork(order.id)} variant="secondary" />
                  ) : null}
                  {showFinish ? (
                    <Button label="Завершити роботу" onPress={() => handleFinishWork(order)} />
                  ) : null}
                </View>
              </Card>
            );
          })
        )}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Історія звітів</Text>
        {!isLoading && history.length === 0 ? (
          <EmptyState text="Звітів ще немає" />
        ) : (
          history.map(({ order, report }, index) => {
            const isLatestForOrder = history.findIndex((h) => h.order.id === order.id) === index;
            const editable = isLatestForOrder && !report.confirmed;
            return (
              <Card
                key={report.id}
                onPress={
                  editable
                    ? () =>
                        navigation.navigate('ReportCreate', {
                          orderId: order.id,
                          clientReportId: report.clientReportId,
                          startedAt: report.startedAt,
                          endedAt: report.endedAt,
                          durationMin: report.durationMin,
                          initialDraft: {
                            clientReportId: report.clientReportId,
                            orderId: order.id,
                            capturedAt: report.capturedAt,
                            startedAt: report.startedAt,
                            endedAt: report.endedAt,
                            durationMin: report.durationMin,
                            text: report.text,
                            gps: report.gps,
                            photos: report.photos,
                            engineHours: report.engineHours,
                            fuelConsumption: report.fuelConsumption,
                            problem: report.problem,
                            needsService: report.needsService,
                          },
                        })
                    : undefined
                }
              >
                <Text style={styles.title}>{EQUIPMENT_TYPE_LABELS[order.equipmentType]}</Text>
                <Text style={styles.reportText}>{report.text}</Text>
                <Text style={styles.meta}>{formatDateTime(report.capturedAt)}</Text>
                <View style={styles.statusRow}>
                  <StatusTag
                    label={REPORT_SYNC_STATUS_LABELS[report.syncStatus]}
                    tone={reportSyncTone(report.syncStatus)}
                  />
                  <StatusTag
                    label={report.confirmed ? 'Підтверджено' : 'Очікує підтвердження'}
                    tone={report.confirmed ? 'success' : 'warning'}
                  />
                </View>
                {editable ? <Text style={styles.editNote}>Натисніть, щоб редагувати</Text> : null}
              </Card>
            );
          })
        )}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
          Черга синхронізації {queue.length > 0 ? `(${queue.length})` : ''}
        </Text>
        {queue.length === 0 ? (
          <EmptyState text="Усі звіти синхронізовано" />
        ) : (
          queue.map((item) => (
            <Card key={item.clientReportId}>
              <Text style={styles.reportText}>{item.text}</Text>
              <Text style={styles.meta}>{formatDateTime(item.capturedAt)}</Text>
              {item.lastRejectionReason ? (
                <Text style={styles.rejection}>Відхилено: {item.lastRejectionReason}</Text>
              ) : (
                <StatusTag label="Очікує синхронізації" tone="info" />
              )}
            </Card>
          ))
        )}
        {syncError ? <Text style={styles.error}>{syncError}</Text> : null}
        <Button
          label={`Синхронізувати зараз (${queue.length})`}
          onPress={sync}
          loading={isSyncing}
          variant="secondary"
          style={styles.syncButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  error: { color: colors.danger, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSizes.lg, fontWeight: '800', marginBottom: spacing.md },
  sectionSpacing: { marginTop: spacing.xl },
  title: { color: colors.text, fontSize: fontSizes.md, fontWeight: '700', marginBottom: spacing.xs },
  meta: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: spacing.xs },
  reportText: { color: colors.text, fontSize: fontSizes.sm, marginTop: spacing.xs },
  timerRow: { marginTop: spacing.sm },
  waitingNote: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: spacing.sm },
  cardActions: { marginTop: spacing.md, gap: spacing.sm },
  statusRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  editNote: { color: colors.accent, fontSize: fontSizes.xs, marginTop: spacing.sm },
  rejection: { color: colors.danger, fontSize: fontSizes.xs, marginTop: spacing.xs },
  syncButton: { marginTop: spacing.lg },
});
