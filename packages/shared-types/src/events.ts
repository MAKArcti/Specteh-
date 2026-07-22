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
  ORDER_CREATED = 'order.created',
  ORDER_ASSIGNED = 'order.assigned',
  ORDER_STARTED = 'order.started',
  ORDER_DONE = 'order.done',
  ORDER_REPORT_SUBMITTED = 'order.report_submitted',
  ORDER_REPORT_CONFIRMED = 'order.report_confirmed',
  EQUIPMENT_BREAKDOWN_REPORTED = 'equipment.breakdown_reported',
}
