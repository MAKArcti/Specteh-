import { EquipmentStatus, type Equipment } from '@spectech/shared-types';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { getEquipmentById } from '@/api/equipment';
import Button from '@/components/Button';
import InfoRow from '@/components/InfoRow';
import Screen from '@/components/Screen';
import StatusTag from '@/components/StatusTag';
import type { RootScreenProps } from '@/navigation/types';
import { colors, fontSizes, radii, spacing } from '@/theme';
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_TYPE_LABELS, equipmentStatusTone } from '@/utils/labels';
import { shortId } from '@/utils/format';

type Props = RootScreenProps<'EquipmentDetail'>;

export default function EquipmentDetailScreen({ route, navigation }: Props) {
  const { equipmentId } = route.params;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setEquipment(await getEquipmentById(equipmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити техніку');
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen title={equipment ? EQUIPMENT_TYPE_LABELS[equipment.type] : 'Техніка'}>
      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : equipment ? (
        <>
          {equipment.photoUrl ? (
            <Image source={{ uri: equipment.photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Фото відсутнє</Text>
            </View>
          )}

          <Text style={styles.title}>
            {EQUIPMENT_TYPE_LABELS[equipment.type]}
            {equipment.brand ? ` · ${equipment.brand} ${equipment.model ?? ''}`.trimEnd() : ''}
          </Text>
          <Text style={styles.subtitle}>
            {EQUIPMENT_TYPE_LABELS[equipment.type]}
            {equipment.serialNumber ? ` · №${equipment.serialNumber}` : ''}
          </Text>
          <StatusTag
            label={EQUIPMENT_STATUS_LABELS[equipment.status]}
            tone={equipmentStatusTone(equipment.status)}
          />

          <View style={styles.specs}>
            <InfoRow label="Ціна" value={`${equipment.pricePerHour} грн/год`} />
            {equipment.serialNumber ? <InfoRow label="Серійний номер" value={equipment.serialNumber} /> : null}
            {equipment.mass ? <InfoRow label="Маса" value={equipment.mass} /> : null}
            {equipment.capacity ? <InfoRow label="Місткість" value={equipment.capacity} /> : null}
            {equipment.conditions ? <InfoRow label="Умови" value={equipment.conditions} /> : null}
            <InfoRow
              label="Локація"
              value={`${equipment.location.lat.toFixed(4)}, ${equipment.location.lng.toFixed(4)}`}
            />
            {equipment.engineHours !== undefined ? (
              <InfoRow label="Мотогодини" value={String(equipment.engineHours)} />
            ) : null}
            {equipment.fuelConsumption ? (
              <InfoRow label="Витрата палива" value={equipment.fuelConsumption} />
            ) : null}
            {equipment.oilStatus ? <InfoRow label="Стан оливи" value={equipment.oilStatus} /> : null}
            <InfoRow label="Власник" value={shortId(equipment.ownerId)} />
          </View>

          {equipment.status === EquipmentStatus.AVAILABLE ? (
            <Button
              label="Створити заявку на цю техніку"
              onPress={() =>
                navigation.navigate('CreateOrder', {
                  equipmentType: equipment.type,
                  equipmentId: equipment.id,
                })
              }
              style={styles.actionButton}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  photo: { width: '100%', height: 200, borderRadius: radii.lg, marginBottom: spacing.lg },
  photoPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: { color: colors.textMuted, fontSize: fontSizes.sm },
  title: { color: colors.text, fontSize: fontSizes.xl, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.md },
  specs: { marginTop: spacing.lg },
  actionButton: { marginTop: spacing.xl },
});
