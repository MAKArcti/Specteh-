import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, RequestStatus } from '@spectech/shared-types';
import { Repository } from 'typeorm';
import { CreateRequestDto } from './dto/create-request.dto';
import { EquipmentRequestEntity } from './equipment-request.entity';

export interface RequestCreatedPayload {
  requestId: string;
}

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(EquipmentRequestEntity)
    private readonly requestsRepository: Repository<EquipmentRequestEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(customerId: string, dto: CreateRequestDto): Promise<EquipmentRequestEntity> {
    const request = this.requestsRepository.create({
      customerId,
      equipmentType: dto.equipmentType,
      location: { lat: dto.lat, lng: dto.lng },
      searchRadiusKm: dto.searchRadiusKm,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
    const saved = await this.requestsRepository.save(request);

    // Matching runs synchronously off this event so the offers are ready by
    // the time the client asks for them (see MatchingListener). Awaiting the
    // emit keeps the request/match computation as one logical unit of work
    // without coupling RequestsService to MatchingService directly.
    await this.eventEmitter.emitAsync(DomainEvent.REQUEST_CREATED, {
      requestId: saved.id,
    } satisfies RequestCreatedPayload);

    return saved;
  }

  findById(id: string): Promise<EquipmentRequestEntity | null> {
    return this.requestsRepository.findOneBy({ id });
  }

  markMatched(id: string): Promise<void> {
    return this.requestsRepository
      .update({ id }, { status: RequestStatus.MATCHED })
      .then(() => undefined);
  }
}
