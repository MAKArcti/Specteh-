import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EquipmentStatus, EquipmentType, GeoPoint } from '@spectech/shared-types';
import { Repository } from 'typeorm';
import { EquipmentEntity } from './equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';

export interface EquipmentCandidate {
  equipment: EquipmentEntity;
  distanceKm: number;
}

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(EquipmentEntity)
    private readonly equipmentRepository: Repository<EquipmentEntity>,
  ) {}

  create(ownerId: string, dto: CreateEquipmentDto): Promise<EquipmentEntity> {
    const equipment = this.equipmentRepository.create({
      ownerId,
      type: dto.type,
      label: dto.label,
      pricePerHour: dto.pricePerHour,
      location: { lat: dto.lat, lng: dto.lng },
    });
    return this.equipmentRepository.save(equipment);
  }

  findById(id: string): Promise<EquipmentEntity | null> {
    return this.equipmentRepository.findOneBy({ id });
  }

  setStatus(id: string, status: EquipmentStatus): Promise<void> {
    return this.equipmentRepository.update({ id }, { status }).then(() => undefined);
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
