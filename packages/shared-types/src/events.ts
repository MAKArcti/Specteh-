/**
 * Internal domain event names emitted on the API's event bus (EventEmitter2).
 * These are the seams along which the modular monolith is designed to split
 * into separate services later (see CLAUDE.md "Service layer").
 */
export enum DomainEvent {
  REQUEST_CREATED = 'request.created',
  MATCHES_COMPUTED = 'matching.computed',
  DEAL_CONFIRMED = 'deal.confirmed',
  REPORT_INGESTED = 'report.ingested',
  DEAL_SETTLEMENT_TRIGGERED = 'deal.settlement_triggered',
}
