import type { Equipment, EquipmentJournalEntry } from '@spectech/shared-types';
import { JournalEntryKind } from '@spectech/shared-types';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  addJournalEntry,
  assignEquipmentOperator,
  getEquipmentById,
  getEquipmentJournal,
  removeEquipmentOperator,
} from '@/api/equipment';
import { getOperators } from '@/api/users';
import type { PublicUserDto } from '@/api/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Chip from '@/components/Chip';
import InfoRow from '@/components/InfoRow';
import Screen from '@/components/Screen';
import StatusTag from '@/components/StatusTag';
import TextField from '@/components/TextField';
import type { RootScreenProps } from '@/navigation/types';
import { colors, fontSizes, radii, spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
  JOURNAL_KIND_LABELS,
  equipmentStatusTone,
} from '@/utils/labels';

type Props = RootScreenProps<'Passport'>;

export default function PassportScreen({ route }: Props) {
  const { equipmentId } = route.params;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [journal, setJournal] = useState<EquipmentJournalEntry[]>([]);
  const [operators, setOperators] = useState<PublicUserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newOperatorId, setNewOperatorId] = useState<string | null>(null);
  const [journalKind, setJournalKind] = useState<JournalEntryKind>(JournalEntryKind.WORK);
  const [journalText, setJournalText] = useState('');
  const [isSubmittingOperator, setIsSubmittingOperator] = useState(false);
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [fetchedEquipment, fetchedJournal, fetchedOperators] = await Promise.all([
        getEquipmentById(equipmentId),
        getEquipmentJournal(equipmentId),
        getOperators(),
      ]);
      setEquipment(fetchedEquipment);
      setJournal(fetchedJournal);
      setOperators(fetchedOperators);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити техпаспорт');
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemoveOperator = async (operatorId: string) => {
    try {
      await removeEquipmentOperator(equipmentId, operatorId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося відкріпити оператора');
    }
  };

  const handleAssignOperator = async () => {
    if (!newOperatorId) return;
    setIsSubmittingOperator(true);
    try {
      await assignEquipmentOperator(equipmentId, newOperatorId);
      setNewOperatorId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося закріпити оператора');
    } finally {
      setIsSubmittingOperator(false);
    }
  };

  const handleAddJournalEntry = async () => {
    if (!journalText.trim()) return;
    setIsSubmittingJournal(true);
    try {
      await addJournalEntry(equipmentId, journalKind, journalText.trim());
      setJournalText('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося додати запис');
    } finally {
      setIsSubmittingJournal(false);
    }
  };

  if (isLoading || !equipment) {
    return (
      <Screen title="Техпаспорт">
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.accent} />}
      </Screen>
    );
  }

  const assignedOperators = operators.filter((op) => equipment.assignedOperatorIds.includes(op.id));
  const unassignedOperators = operators.filter((op) => !equipment.assignedOperatorIds.includes(op.id));

  return (
    <Screen title={EQUIPMENT_TYPE_LABELS[equipment.type]}>
      <Text style={styles.title}>
        {EQUIPMENT_TYPE_LABELS[equipment.type]}
        {equipment.brand ? ` · ${equipment.brand} ${equipment.model ?? ''}`.trimEnd() : ''}
      </Text>
      <StatusTag label={EQUIPMENT_STATUS_LABELS[equipment.status]} tone={equipmentStatusTone(equipment.status)} />

      <Card style={styles.specs}>
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
        {equipment.fuelConsumption ? <InfoRow label="Витрата палива" value={equipment.fuelConsumption} /> : null}
        {equipment.oilStatus ? <InfoRow label="Стан оливи" value={equipment.oilStatus} /> : null}
      </Card>

      <Text style={styles.sectionTitle}>Закріплені оператори</Text>
      <View style={styles.chipsWrap}>
        {assignedOperators.length === 0 ? (
          <Text style={styles.emptyText}>Немає закріплених операторів</Text>
        ) : (
          assignedOperators.map((op) => (
            <View key={op.id} style={styles.operatorChip}>
              <Text style={styles.operatorChipText}>{op.fullName}</Text>
              <TouchableOpacity onPress={() => handleRemoveOperator(op.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {unassignedOperators.length > 0 ? (
        <>
          <ScrollableChips
            operators={unassignedOperators}
            selectedId={newOperatorId}
            onSelect={setNewOperatorId}
          />
          <Button
            label="Закріпити оператора"
            onPress={handleAssignOperator}
            loading={isSubmittingOperator}
            disabled={!newOperatorId}
            variant="secondary"
            style={styles.assignButton}
          />
        </>
      ) : null}

      <Text style={[styles.sectionTitle, styles.journalTitle]}>Журнал технічного обслуговування</Text>
      {journal.length === 0 ? (
        <Text style={styles.emptyText}>Записів ще немає</Text>
      ) : (
        journal.map((entry) => (
          <Card key={entry.id} style={styles.journalCard}>
            <Text style={styles.journalKind}>{JOURNAL_KIND_LABELS[entry.kind]}</Text>
            <Text style={styles.journalText}>{entry.text}</Text>
            <Text style={styles.journalMeta}>
              {entry.authorLabel} · {formatDateTime(entry.createdAt)}
            </Text>
          </Card>
        ))
      )}

      <View style={styles.chipsWrap}>
        {Object.values(JournalEntryKind).map((kind) => (
          <Chip
            key={kind}
            label={JOURNAL_KIND_LABELS[kind]}
            selected={journalKind === kind}
            onPress={() => setJournalKind(kind)}
          />
        ))}
      </View>
      <TextField
        label="Новий запис"
        value={journalText}
        onChangeText={setJournalText}
        multiline
        placeholder="Опис..."
      />
      <Button
        label="Додати запис"
        onPress={handleAddJournalEntry}
        loading={isSubmittingJournal}
        disabled={!journalText.trim()}
        variant="secondary"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

function ScrollableChips({
  operators,
  selectedId,
  onSelect,
}: {
  operators: PublicUserDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.chipsWrap}>
      {operators.map((op) => (
        <Chip
          key={op.id}
          label={op.fullName}
          selected={selectedId === op.id}
          onPress={() => onSelect(selectedId === op.id ? '' : op.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginTop: spacing.md },
  title: { color: colors.text, fontSize: fontSizes.xl, fontWeight: '800', marginBottom: spacing.sm },
  specs: { marginTop: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: fontSizes.md, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.sm },
  journalTitle: { marginTop: spacing.xxl },
  emptyText: { color: colors.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.sm },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  operatorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  operatorChipText: { color: colors.text, fontSize: fontSizes.sm, marginRight: spacing.sm },
  removeIcon: { color: colors.danger, fontWeight: '700' },
  assignButton: { marginTop: spacing.sm, marginBottom: spacing.md },
  journalCard: { marginBottom: spacing.sm },
  journalKind: { color: colors.accent, fontSize: fontSizes.xs, fontWeight: '700', marginBottom: 4 },
  journalText: { color: colors.text, fontSize: fontSizes.md, marginBottom: 4 },
  journalMeta: { color: colors.textMuted, fontSize: fontSizes.xs },
});
