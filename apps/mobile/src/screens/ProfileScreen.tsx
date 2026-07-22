import { OrderStatus, UserRole } from '@spectech/shared-types';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getMyEquipment } from '@/api/equipment';
import { getMyOrders, getOrdersForOperator } from '@/api/orders';
import { getReportsForOrder } from '@/api/reports';
import Button from '@/components/Button';
import Card from '@/components/Card';
import InfoRow from '@/components/InfoRow';
import Screen from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import type { RootScreenProps } from '@/navigation/types';
import { colors, fontSizes, spacing } from '@/theme';
import { USER_ROLE_LABELS } from '@/utils/labels';

type Props = RootScreenProps<'Profile'>;

export default function ProfileScreen(_props: Props) {
  const { profile, logout } = useAuth();
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [equipmentCount, setEquipmentCount] = useState<number | null>(null);
  const [reportCount, setReportCount] = useState<number | null>(null);

  const roles = profile?.roles ?? [];

  useEffect(() => {
    if (roles.includes(UserRole.CUSTOMER)) {
      getMyOrders()
        .then((orders) => setOrderCount(orders.length))
        .catch(() => setOrderCount(null));
    }
    if (roles.includes(UserRole.EQUIPMENT_OWNER)) {
      getMyEquipment()
        .then((equipment) => setEquipmentCount(equipment.length))
        .catch(() => setEquipmentCount(null));
    }
    if (roles.includes(UserRole.OPERATOR)) {
      getOrdersForOperator()
        .then(async (orders) => {
          const relevant = orders.filter(
            (o) => o.status === OrderStatus.IN_WORK || o.status === OrderStatus.DONE,
          );
          const counts = await Promise.all(
            relevant.map((o) => getReportsForOrder(o.id).then((r) => r.length).catch(() => 0)),
          );
          setReportCount(counts.reduce((sum, n) => sum + n, 0));
        })
        .catch(() => setReportCount(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Screen title="Профіль">
      <Text style={styles.name}>{profile?.fullName || profile?.phone}</Text>
      <Text style={styles.roles}>{roles.map((r) => USER_ROLE_LABELS[r]).join(', ')}</Text>

      <Card style={styles.statsCard}>
        {roles.includes(UserRole.CUSTOMER) ? (
          <InfoRow label="Замовлень створено" value={orderCount === null ? '—' : String(orderCount)} />
        ) : null}
        {roles.includes(UserRole.EQUIPMENT_OWNER) ? (
          <InfoRow label="Техніки у парку" value={equipmentCount === null ? '—' : String(equipmentCount)} />
        ) : null}
        {roles.includes(UserRole.OPERATOR) ? (
          <InfoRow label="Подано звітів" value={reportCount === null ? '—' : String(reportCount)} />
        ) : null}
      </Card>

      <View style={styles.spacer} />
      <Button label="Вийти" variant="danger" onPress={handleLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.text, fontSize: fontSizes.xl, fontWeight: '800', marginBottom: 4 },
  roles: { color: colors.textMuted, fontSize: fontSizes.md, marginBottom: spacing.xl },
  statsCard: { marginTop: spacing.md },
  spacer: { height: spacing.xxl },
});
