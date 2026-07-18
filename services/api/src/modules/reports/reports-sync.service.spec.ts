import { ReportSyncStatus, WorkVolumeUnit } from '@spectech/shared-types';
import { ReportDraftDto } from './dto/report-draft.dto';
import { ReportsSyncService } from './reports-sync.service';

function buildDraft(overrides: Partial<ReportDraftDto> = {}): ReportDraftDto {
  return Object.assign(new ReportDraftDto(), {
    clientReportId: '11111111-1111-1111-1111-111111111111',
    dealId: '22222222-2222-2222-2222-222222222222',
    capturedAt: new Date(Date.now() - 60_000).toISOString(),
    lat: 50.45,
    lng: 30.52,
    photoUrls: ['https://example.com/photo.jpg'],
    workVolume: { value: 8, unit: WorkVolumeUnit.HOURS },
    ...overrides,
  });
}

describe('ReportsSyncService', () => {
  let repository: { findOneBy: jest.Mock; create: jest.Mock; save: jest.Mock };
  let queue: { add: jest.Mock };
  let service: ReportsSyncService;

  beforeEach(() => {
    repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ id: 'server-generated-id', ...data })),
    };
    queue = { add: jest.fn().mockResolvedValue(undefined) };
    service = new ReportsSyncService(repository as never, queue as never);
  });

  it('persists a new report and enqueues it for ingestion', async () => {
    const results = await service.syncBatch('operator-1', [buildDraft()]);

    expect(results).toEqual([
      { clientReportId: buildDraft().clientReportId, accepted: true, reportId: 'server-generated-id' },
    ]);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(queue.add).toHaveBeenCalledWith('ingest-report', { reportId: 'server-generated-id' });
  });

  it('is idempotent on clientReportId: a replayed batch does not create a duplicate', async () => {
    repository.findOneBy.mockResolvedValue({
      id: 'server-generated-id',
      syncStatus: ReportSyncStatus.SYNCED,
    });

    const results = await service.syncBatch('operator-1', [buildDraft()]);

    expect(results).toEqual([
      { clientReportId: buildDraft().clientReportId, accepted: true, reportId: 'server-generated-id', rejectionReason: undefined },
    ]);
    expect(repository.save).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('rejects a report with an invalid capturedAt without touching the queue', async () => {
    const results = await service.syncBatch('operator-1', [
      buildDraft({ capturedAt: 'not-a-date' }),
    ]);

    expect(results[0].accepted).toBe(false);
    expect(results[0].rejectionReason).toMatch(/valid date/);
    expect(repository.save).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('rejects a report claiming to be captured far in the future', async () => {
    const results = await service.syncBatch('operator-1', [
      buildDraft({ capturedAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() }),
    ]);

    expect(results[0].accepted).toBe(false);
    expect(results[0].rejectionReason).toMatch(/future/);
  });

  it('processes a batch of multiple offline-queued reports independently', async () => {
    const results = await service.syncBatch('operator-1', [
      buildDraft({ clientReportId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }),
      buildDraft({ clientReportId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }),
    ]);

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.accepted)).toBe(true);
    expect(queue.add).toHaveBeenCalledTimes(2);
  });
});
