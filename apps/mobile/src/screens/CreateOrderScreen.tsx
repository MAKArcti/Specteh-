import { EquipmentType } from '@spectech/shared-types';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { createOrder } from '@/api/orders';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import type { RootScreenProps } from '@/navigation/types';
import { colors, fontSizes, spacing } from '@/theme';
import { EQUIPMENT_TYPE_LABELS } from '@/utils/labels';

type Props = RootScreenProps<'CreateOrder'>;

export default function CreateOrderScreen({ route, navigation }: Props) {
  const preselectedType = route.params?.equipmentType;
  const equipmentId = route.params?.equipmentId;

  const [equipmentType, setEquipmentType] = useState<EquipmentType | undefined>(preselectedType);
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = Boolean(equipmentType) && location.trim() && dateFrom.trim() && dateTo.trim();

  const handleSubmit = async () => {
    if (!equipmentType) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const order = await createOrder({
        equipmentType,
        equipmentId,
        location: location.trim(),
        dateFrom: dateFrom.trim(),
        dateTo: dateTo.trim(),
        comment: comment.trim() || undefined,
      });
      navigation.replace('OrderDetail', { orderId: order.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося створити заявку');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title="Нова заявка">
      {preselectedType ? (
        <Text style={styles.preselected}>Техніка: {EQUIPMENT_TYPE_LABELS[preselectedType]}</Text>
      ) : (
        <>
          <Text style={styles.label}>Тип техніки</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {Object.values(EquipmentType).map((type) => (
              <Chip
                key={type}
                label={EQUIPMENT_TYPE_LABELS[type]}
                selected={equipmentType === type}
                onPress={() => setEquipmentType(type)}
              />
            ))}
          </ScrollView>
        </>
      )}

      <TextField label="Локація" value={location} onChangeText={setLocation} placeholder="Місто, адреса" />
      <TextField label="Дата з" value={dateFrom} onChangeText={setDateFrom} placeholder="01.08.2026" />
      <TextField label="Дата до" value={dateTo} onChangeText={setDateTo} placeholder="05.08.2026" />
      <TextField
        label="Коментар (необов'язково)"
        value={comment}
        onChangeText={setComment}
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Створити заявку" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preselected: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  label: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.sm },
  chipRow: { marginBottom: spacing.md, flexGrow: 0 },
  error: { color: colors.danger, marginBottom: spacing.md },
});
