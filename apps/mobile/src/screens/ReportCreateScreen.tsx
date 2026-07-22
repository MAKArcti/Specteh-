import type { GeoPoint, ReportPhotos } from '@spectech/shared-types';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button';
import Screen from '@/components/Screen';
import TextField from '@/components/TextField';
import { useReportQueue } from '@/hooks/useReportQueue';
import type { RootScreenProps } from '@/navigation/types';
import { clearWorkStartedAt } from '@/storage/workTimer';
import { colors, fontSizes, radii, spacing } from '@/theme';

type Props = RootScreenProps<'ReportCreate'>;

const PHOTO_SLOTS: { key: keyof ReportPhotos; label: string }[] = [
  { key: 'before', label: 'До' },
  { key: 'during', label: 'Під час' },
  { key: 'after', label: 'Після' },
];

export default function ReportCreateScreen({ route, navigation }: Props) {
  const { orderId, clientReportId, startedAt, endedAt, durationMin, initialDraft } = route.params;
  const { enqueue, sync } = useReportQueue();

  const [text, setText] = useState(initialDraft?.text ?? '');
  const [engineHours, setEngineHours] = useState(
    initialDraft?.engineHours !== undefined ? String(initialDraft.engineHours) : '',
  );
  const [fuelConsumption, setFuelConsumption] = useState(initialDraft?.fuelConsumption ?? '');
  const [problem, setProblem] = useState(initialDraft?.problem ?? false);
  const [needsService, setNeedsService] = useState(initialDraft?.needsService ?? false);
  const [photos, setPhotos] = useState<ReportPhotos>(initialDraft?.photos ?? {});
  const [gps, setGps] = useState<GeoPoint | null>(initialDraft?.gps ?? null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickPhoto = async (slot: keyof ReportPhotos) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Потрібен дозвіл', 'Надайте доступ до камери для фото.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets.length > 0) {
      setPhotos((prev) => ({ ...prev, [slot]: result.assets[0].uri }));
    }
  };

  const handleCaptureLocation = async () => {
    setIsCapturingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Потрібен дозвіл', 'Надайте доступ до геолокації.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setGps({ lat: position.coords.latitude, lng: position.coords.longitude });
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert('Опис обов’язковий', 'Додайте опис виконаних робіт.');
      return;
    }
    if (!gps) {
      Alert.alert('Потрібна GPS-позиція', 'Захопіть поточну локацію перед відправкою.');
      return;
    }

    setIsSubmitting(true);
    try {
      // capturedAt is the device clock at fill-in time, not at eventual sync
      // time — the whole point of the offline queue is that sync may happen
      // hours or days later, and the report must record when the work
      // actually happened.
      await enqueue({
        clientReportId: initialDraft?.clientReportId ?? clientReportId ?? Crypto.randomUUID(),
        orderId,
        capturedAt: initialDraft?.capturedAt ?? new Date().toISOString(),
        startedAt: initialDraft?.startedAt ?? startedAt,
        endedAt: initialDraft?.endedAt ?? endedAt,
        durationMin: initialDraft?.durationMin ?? durationMin,
        text: text.trim(),
        gps,
        photos,
        engineHours: engineHours ? Number(engineHours) : undefined,
        fuelConsumption: fuelConsumption.trim() || undefined,
        problem,
        needsService,
      });

      if (startedAt) {
        await clearWorkStartedAt(orderId);
      }

      sync().catch(() => {
        // Best-effort: submission has already succeeded locally regardless
        // of whether this opportunistic sync attempt reaches the server.
      });

      Alert.alert('Звіт збережено', 'Він синхронізується автоматично або вручну зі списку черги.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title={clientReportId || initialDraft ? 'Редагувати звіт' : 'Новий звіт'}>
      <TextField
        label="Опис виконаних робіт"
        value={text}
        onChangeText={setText}
        multiline
        placeholder="Що зроблено..."
      />
      <TextField
        label="Мотогодини"
        value={engineHours}
        onChangeText={setEngineHours}
        keyboardType="decimal-pad"
      />
      <TextField label="Витрата палива" value={fuelConsumption} onChangeText={setFuelConsumption} />

      <ToggleRow label="Є проблема" value={problem} onChange={setProblem} />
      <ToggleRow label="Потребує обслуговування" value={needsService} onChange={setNeedsService} />

      <Text style={styles.label}>Фото</Text>
      <View style={styles.photoRow}>
        {PHOTO_SLOTS.map((slot) => (
          <TouchableOpacity key={slot.key} style={styles.photoSlot} onPress={() => handlePickPhoto(slot.key)}>
            {photos[slot.key] ? (
              <Image source={{ uri: photos[slot.key] }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoSlotLabel}>{slot.label}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Button
        label={gps ? `GPS: ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : 'Захопити GPS'}
        onPress={handleCaptureLocation}
        variant="secondary"
        loading={isCapturingLocation}
        style={styles.gpsButton}
      />

      <Button label="Зберегти звіт" onPress={handleSubmit} loading={isSubmitting} disabled={!gps} />
    </Screen>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleOptions}>
        <TouchableOpacity
          style={[styles.toggleOption, value && styles.toggleOptionSelected]}
          onPress={() => onChange(true)}
        >
          <Text style={[styles.toggleText, value && styles.toggleTextSelected]}>Так</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, !value && styles.toggleOptionSelected]}
          onPress={() => onChange(false)}
        >
          <Text style={[styles.toggleText, !value && styles.toggleTextSelected]}>Ні</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.sm },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  toggleLabel: { color: colors.text, fontSize: fontSizes.md },
  toggleOptions: { flexDirection: 'row' },
  toggleOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  toggleOptionSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  toggleText: { color: colors.textMuted, fontSize: fontSizes.sm },
  toggleTextSelected: { color: '#fff', fontWeight: '700' },
  photoRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  photoSlot: {
    flex: 1,
    height: 90,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoSlotLabel: { color: colors.textMuted, fontSize: fontSizes.sm },
  photoPreview: { width: '100%', height: '100%' },
  gpsButton: { marginBottom: spacing.lg },
});
