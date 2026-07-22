import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EquipmentStatus,
  EquipmentType,
  GeoPoint,
  JournalEntryKind,
} from '@spectech/shared-types';
import { Repository } from 'typeorm';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { EquipmentJournalEntity } from './equipment-journal.entity';
import { EquipmentOperatorEntity } from './equipment-operator.entity';
import { EquipmentEntity } from './equipment.entity';

export interface EquipmentCandidate {
  equipment: EquipmentEntity;
  distanceKm: number;
}

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(EquipmentEntity)
    private readonly equipmentRepository: Repository<EquipmentEntity>,
    @InjectRepository(EquipmentOperatorEntity)
    private readonly operatorsRepository: Repository<EquipmentOperatorEntity>,
    @InjectRepository(EquipmentJournalEntity)
    private readonly journalRepository: Repository<EquipmentJournalEntity>,
  ) {}

  async create(ownerId: string, dto: CreateEquipmentDto): Promise<EquipmentEntity> {
    const equipment = this.equipmentRepository.create({
      ownerId,
      type: dto.type,
      label: dto.label,
      pricePerHour: dto.pricePerHour,
      location: { lat: dto.lat, lng: dto.lng },
      brand: dto.brand,
      model: dto.model,
      serialNumber: dto.serialNumber,
      photoUrl: dto.photoUrl,
      mass: dto.mass,
      capacity: dto.capacity,
      conditions: dto.conditions,
    });
    const saved = await this.equipmentRepository.save(equipment);
    if (dto.operatorId) {
      await this.assignOperator(saved.id, dto.operatorId);
    }
    return saved;
  }

  findById(id: string): Promise<EquipmentEntity | null> {
    return this.equipmentRepository.findOneBy({ id });
  }

  /** Renter-facing "Маркет" browse: every non-broken machine, optionally filtered by type. */
  findBrowsable(type?: EquipmentType): Promise<EquipmentEntity[]> {
    const qb = this.equipmentRepository
      .createQueryBuilder('equipment')
      .where('equipment.status != :broken', { broken: EquipmentStatus.BROKEN })
      .orderBy('equipment.createdAt', 'DESC');
    if (type) qb.andWhere('equipment.type = :type', { type });
    return qb.getMany();
  }

  findOwnedBy(ownerId: string): Promise<EquipmentEntity[]> {
    return this.equipmentRepository.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
  }

  findAvailableOfType(type: EquipmentType): Promise<EquipmentEntity[]> {
    return this.equipmentRepository.find({
      where: { type, status: EquipmentStatus.AVAILABLE },
    });
  }

  setStatus(id: string, status: EquipmentStatus): Promise<void> {
    return this.equipmentRepository.update({ id }, { status }).then(() => undefined);
  }

  async assignedOperatorIds(equipmentId: string): Promise<string[]> {
    const rows = await this.operatorsRepository.find({ where: { equipmentId } });
    return rows.map((r) => r.operatorId);
  }

  async assignOperator(equipmentId: string, operatorId: string): Promise<void> {
    const existing = await this.operatorsRepository.findOneBy({ equipmentId, operatorId });
    if (existing) {
      throw new ConflictException('Operator already assigned to this equipment');
    }
    await this.operatorsRepository.save(this.operatorsRepository.create({ equipmentId, operatorId }));
  }

  async removeOperator(equipmentId: string, operatorId: string): Promise<void> {
    await this.operatorsRepository.delete({ equipmentId, operatorId });
  }

  addJournalEntry(
    equipmentId: string,
    authorId: string,
    authorLabel: string,
    kind: JournalEntryKind,
    text: string,
  ): Promise<EquipmentJournalEntity> {
    const entry = this.journalRepository.create({ equipmentId, authorId, authorLabel, kind, text });
    return this.journalRepository.save(entry);
  }

  findJournal(equipmentId: string): Promise<EquipmentJournalEntity[]> {
    return this.journalRepository.find({
      where: { equipmentId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Candidates for the matching engine: equipment of the requested type,
   * currently available, within `radiusKm` of `center`. Distance comes back
   * in kilometers from PostGIS's ST_Distance on the geography column.
   */
  async findAvailableCandidates(
    equipmentType: EquipmentType,
    center: GeoPoint,
    radiusKm: number,
  ): Promise<EquipmentCandidate[]> {
    const radiusMeters = radiusKm * 1000;
    const rows = await this.equipmentRepository
      .createQueryBuilder('equipment')
      .where('equipment.type = :equipmentType', { equipmentType })
      .andWhere('equipment.status = :status', { status: EquipmentStatus.AVAILABLE })
      .andWhere(
        'ST_DWithin(equipment.location, ST_MakePoint(:lng, :lat)::geography, :radiusMeters)',
        { lng: center.lng, lat: center.lat, radiusMeters },
      )
      .addSelect(
        'ST_Distance(equipment.location, ST_MakePoint(:lng, :lat)::geography) / 1000',
        'distance_km',
      )
      .getRawAndEntities();

    return rows.entities.map((equipment, index) => ({
      equipment,
      distanceKm: Number(rows.raw[index].distance_km),
    }));
  }
}
