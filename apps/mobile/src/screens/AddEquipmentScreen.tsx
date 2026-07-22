import { EquipmentType } from '@spectech/shared-types';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { createEquipment } from '@/api/equipment';
import { getOperators } from '@/api/users';
import type { PublicUserDto } from '@/api/types';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import type { RootScreenProps } from '@/navigation/types';
import { colors, fontSizes, spacing } from '@/theme';
import { EQUIPMENT_TYPE_LABELS } from '@/utils/labels';

type Props = RootScreenProps<'AddEquipment'>;

export default function AddEquipmentScreen({ navigation }: Props) {
  const [type, setType] = useState<EquipmentType>(EquipmentType.EXCAVATOR);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [mass, setMass] = useState('');
  const [capacity, setCapacity] = useState('');
  const [conditions, setConditions] = useState('');
  const [operators, setOperators] = useState<PublicUserDto[]>([]);
  const [operatorId, setOperatorId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getOperators()
      .then(setOperators)
      .catch(() => undefined);
  }, []);

  const canSubmit =
    brand.trim().length > 0 &&
    pricePerHour.trim().length > 0 &&
    lat.trim().length > 0 &&
    lng.trim().length > 0 &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lng)) &&
    !Number.isNaN(Number(pricePerHour));

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await createEquipment({
        type,
        label: `${brand.trim()} ${model.trim()}`.trim(),
        pricePerHour: Number(pricePerHour),
        lat: Number(lat),
        lng: Number(lng),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        mass: mass.trim() || undefined,
        capacity: capacity.trim() || undefined,
        conditions: conditions.trim() || undefined,
        operatorId,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося додати техніку');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title="Додати техніку">
      <Text style={styles.label}>Тип техніки</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {Object.values(EquipmentType).map((option) => (
          <Chip
            key={option}
            label={EQUIPMENT_TYPE_LABELS[option]}
            selected={type === option}
            onPress={() => setType(option)}
          />
        ))}
      </ScrollView>

      <TextField label="Бренд" value={brand} onChangeText={setBrand} />
      <TextField label="Модель" value={model} onChangeText={setModel} />
      <TextField label="Серійний номер" value={serialNumber} onChangeText={setSerialNumber} />
      <TextField
        label="Ціна за годину (грн)"
        value={pricePerHour}
        onChangeText={setPricePerHour}
        keyboardType="decimal-pad"
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <TextField label="Широта (lat)" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
        </View>
        <View style={styles.rowItem}>
          <TextField label="Довгота (lng)" value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
        </View>
      </View>

      <TextField label="Маса" value={mass} onChangeText={setMass} />
      <TextField label="Місткість" value={capacity} onChangeText={setCapacity} />
      <TextField label="Умови" value={conditions} onChangeText={setConditions} multiline />

      {operators.length > 0 ? (
        <>
          <Text style={styles.label}>Оператор (необов&apos;язково)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {operators.map((op) => (
              <Chip
                key={op.id}
                label={op.fullName}
                selected={operatorId === op.id}
                onPress={() => setOperatorId(operatorId === op.id ? undefined : op.id)}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Додати техніку" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.sm },
  chipRow: { marginBottom: spacing.md, flexGrow: 0 },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },
  error: { color: colors.danger, marginBottom: spacing.md },
});
