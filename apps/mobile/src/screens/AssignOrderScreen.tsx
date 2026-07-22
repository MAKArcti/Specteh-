import type { Equipment } from '@spectech/shared-types';
import { EquipmentStatus } from '@spectech/shared-types';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMyEquipment } from '@/api/equipment';
import { assignOrder } from '@/api/orders';
import { getOperators } from '@/api/users';
import type { PublicUserDto } from '@/api/types';
import Button from '@/components/Button';
import Screen from '@/components/Screen';
import { colors, fontSizes, radii, spacing } from '@/theme';
import { EQUIPMENT_TYPE_LABELS } from '@/utils/labels';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'AssignOrder'>;

function RadioRow({
  label,
  subtitle,
  selected,
  onPress,
}: {
  label: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]} />
      <View style={styles.radioTextWrap}>
        <Text style={styles.radioLabel}>{label}</Text>
        {subtitle ? <Text style={styles.radioSubtitle}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function AssignOrderScreen({ route, navigation }: Props) {
  const { orderId, equipmentType } = route.params;
  const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<PublicUserDto[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [equipment, operators] = await Promise.all([getMyEquipment(), getOperators()]);
      setEquipmentOptions(
        equipment.filter((e) => e.type === equipmentType && e.status === EquipmentStatus.AVAILABLE),
      );
      setOperatorOptions(operators);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити дані');
    } finally {
      setIsLoading(false);
    }
  }, [equipmentType]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!selectedEquipmentId || !selectedOperatorId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await assignOrder(orderId, { equipmentId: selectedEquipmentId, operatorId: selectedOperatorId });
      navigation.replace('OrderDetail', { orderId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося призначити');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title="Призначення">
      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Техніка ({EQUIPMENT_TYPE_LABELS[equipmentType]})</Text>
          {equipmentOptions.length === 0 ? (
            <Text style={styles.emptyText}>Немає вільної техніки цього типу</Text>
          ) : (
            equipmentOptions.map((item) => (
              <RadioRow
                key={item.id}
                label={`${item.brand ?? EQUIPMENT_TYPE_LABELS[item.type]} ${item.model ?? ''}`.trim()}
                subtitle={item.serialNumber ? `№${item.serialNumber}` : undefined}
                selected={selectedEquipmentId === item.id}
                onPress={() => setSelectedEquipmentId(item.id)}
              />
            ))
          )}

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Оператор</Text>
          {operatorOptions.length === 0 ? (
            <Text style={styles.emptyText}>Немає доступних операторів</Text>
          ) : (
            operatorOptions.map((op) => (
              <RadioRow
                key={op.id}
                label={op.fullName}
                subtitle={op.phone}
                selected={selectedOperatorId === op.id}
                onPress={() => setSelectedOperatorId(op.id)}
              />
            ))
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Призначити"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!selectedEquipmentId || !selectedOperatorId}
            style={styles.submitButton}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.text, fontSize: fontSizes.md, fontWeight: '700', marginBottom: spacing.sm },
  sectionSpacing: { marginTop: spacing.xl },
  emptyText: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.md },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  radioCircleSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
  radioTextWrap: { flex: 1 },
  radioLabel: { color: colors.text, fontSize: fontSizes.md, fontWeight: '600' },
  radioSubtitle: { color: colors.textMuted, fontSize: fontSizes.xs },
  error: { color: colors.danger, marginTop: spacing.md },
  submitButton: { marginTop: spacing.xl },
});
