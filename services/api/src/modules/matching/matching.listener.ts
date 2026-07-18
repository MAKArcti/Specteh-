import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@spectech/shared-types';
import { RequestCreatedPayload } from '../requests/requests.service';
import { MatchingService } from './matching.service';

@Injectable()
export class MatchingListener {
  constructor(private readonly matchingService: MatchingService) {}

  @OnEvent(DomainEvent.REQUEST_CREATED)
  async handleRequestCreated(payload: RequestCreatedPayload): Promise<void> {
    await this.matchingService.computeForRequest(payload.requestId);
  }
}
