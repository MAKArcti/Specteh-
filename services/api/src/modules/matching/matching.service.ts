import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '@spectech/shared-types';
import { Repository } from 'typeorm';
import { EquipmentService } from '../equipment/equipment.service';
import { RequestsService } from '../requests/requests.service';
import { MatchOfferEntity } from './match-offer.entity';
import { scoreCandidates } from './matching.scoring';

export interface MatchesComputedPayload {
  requestId: string;
  offerCount: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectRepository(MatchOfferEntity)
    private readonly matchOffersRepository: Repository<MatchOfferEntity>,
    private readonly equipmentService: EquipmentService,
    private readonly requestsService: RequestsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async computeForRequest(requestId: string): Promise<MatchOfferEntity[]> {
    const request = await this.requestsService.findById(requestId);
    if (!request) {
      this.logger.warn(`computeForRequest called for unknown request ${requestId}`);
      return [];
    }

    const candidates = await this.equipmentService.findAvailableCandidates(
      request.equipmentType,
      request.location,
      request.searchRadiusKm,
    );

    const scored = scoreCandidates(
      candidates.map(({ equipment, distanceKm }) => ({
        equipmentId: equipment.id,
        distanceKm,
        pricePerHour: equipment.pricePerHour,
        ratingAvg: equipment.ratingAvg,
        ratingCount: equipment.ratingCount,
      })),
      request.searchRadiusKm,
    );

    await this.matchOffersRepository.delete({ requestId });
    const offers = this.matchOffersRepository.create(
      scored.map((candidate) => ({ requestId, ...candidate })),
    );
    const saved = await this.matchOffersRepository.save(offers);

    if (saved.length > 0) {
      await this.requestsService.markMatched(requestId);
    }

    await this.eventEmitter.emitAsync(DomainEvent.MATCHES_COMPUTED, {
      requestId,
      offerCount: saved.length,
    } satisfies MatchesComputedPayload);

    return saved;
  }

  findOffersForRequest(requestId: string): Promise<MatchOfferEntity[]> {
    return this.matchOffersRepository.find({
      where: { requestId },
      order: { rank: 'ASC' },
    });
  }

  findOfferById(id: string): Promise<MatchOfferEntity | null> {
    return this.matchOffersRepository.findOneBy({ id });
  }
}
