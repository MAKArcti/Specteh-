import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DealStatus, DomainEvent, EquipmentStatus } from '@spectech/shared-types';
import { Repository } from 'typeorm';
import { EquipmentService } from '../equipment/equipment.service';
import { MatchingService } from '../matching/matching.service';
import { RequestsService } from '../requests/requests.service';
import { DealEntity } from './deal.entity';

export interface DealConfirmedPayload {
  dealId: string;
}

/** Forward-only transitions; CANCELLED/DISPUTED are reached via separate escape hatches, not this map. */
const NEXT_STATUS: Partial<Record<DealStatus, DealStatus>> = {
  [DealStatus.PENDING_CONFIRMATION]: DealStatus.CONFIRMED,
  [DealStatus.CONFIRMED]: DealStatus.IN_PROGRESS,
  [DealStatus.IN_PROGRESS]: DealStatus.COMPLETED,
  [DealStatus.COMPLETED]: DealStatus.SETTLED,
};

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(DealEntity)
    private readonly dealsRepository: Repository<DealEntity>,
    private readonly matchingService: MatchingService,
    private readonly requestsService: RequestsService,
    private readonly equipmentService: EquipmentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async confirmFromOffer(customerId: string, matchOfferId: string): Promise<DealEntity> {
    const offer = await this.matchingService.findOfferById(matchOfferId);
    if (!offer) {
      throw new NotFoundException('Match offer not found');
    }

    const request = await this.requestsService.findById(offer.requestId);
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.customerId !== customerId) {
      throw new ForbiddenException('This request does not belong to you');
    }

    const equipment = await this.equipmentService.findById(offer.equipmentId);
    if (!equipment || equipment.status !== EquipmentStatus.AVAILABLE) {
      throw new BadRequestException('Equipment is no longer available');
    }

    const deal = this.dealsRepository.create({
      requestId: request.id,
      equipmentId: equipment.id,
      customerId,
      // MVP simplification: the equipment owner operates their own machine.
      // Assigning a distinct hired operator is a later-phase feature.
      operatorId: equipment.ownerId,
      status: DealStatus.CONFIRMED,
      agreedPricePerHour: equipment.pricePerHour,
      startDate: request.startDate,
      endDate: request.endDate,
    });
    const saved = await this.dealsRepository.save(deal);

    await this.equipmentService.setStatus(equipment.id, EquipmentStatus.BOOKED);

    await this.eventEmitter.emitAsync(DomainEvent.DEAL_CONFIRMED, {
      dealId: saved.id,
    } satisfies DealConfirmedPayload);

    return saved;
  }

  findById(id: string): Promise<DealEntity | null> {
    return this.dealsRepository.findOneBy({ id });
  }

  findForOperator(operatorId: string): Promise<DealEntity[]> {
    return this.dealsRepository.find({ where: { operatorId }, order: { createdAt: 'DESC' } });
  }

  /** Advances a deal to the next forward status, unless it's already at or past it. */
  async advanceStatus(dealId: string, atLeast: DealStatus): Promise<DealEntity | null> {
    const deal = await this.findById(dealId);
    if (!deal) return null;

    const order = Object.values(DealStatus);
    if (order.indexOf(deal.status) >= order.indexOf(atLeast)) {
      return deal;
    }

    const nextStatus = NEXT_STATUS[deal.status] ?? atLeast;
    await this.dealsRepository.update({ id: dealId }, { status: nextStatus });
    const updated = await this.findById(dealId);

    if (updated && updated.status === DealStatus.COMPLETED) {
      await this.eventEmitter.emitAsync(DomainEvent.DEAL_SETTLEMENT_TRIGGERED, { dealId });
    }

    return updated;
  }
}
