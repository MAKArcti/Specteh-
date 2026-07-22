import { JournalEntryKind } from './enums';

/** One entry in an equipment's maintenance/work journal (SoW 4.3). */
export interface EquipmentJournalEntry {
  id: string;
  equipmentId: string;
  kind: JournalEntryKind;
  authorId: string;
  authorLabel: string;
  text: string;
  createdAt: string;
}

export interface CreateJournalEntryDto {
  kind: JournalEntryKind;
  text: string;
}
