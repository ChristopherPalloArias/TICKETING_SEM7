import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../services/apiClient';
import { cancelEvent, updateEvent } from '../services/adminEventService';

vi.mock('../services/apiClient', () => ({
  default: {
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('adminEventService (SPEC-021)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateEvent usa PUT con payload', async () => {
    const responseData = { id: 'event-1', title: 'Evento actualizado' };
    vi.mocked(apiClient.put).mockResolvedValue({ data: responseData });

    const payload = { title: 'Evento actualizado' };
    const result = await updateEvent('event-1', payload);

    expect(result).toEqual(responseData);
    expect(apiClient.put).toHaveBeenCalledWith(
      '/api/v1/events/event-1',
      payload,
    );
  });

  it('cancelEvent usa PATCH con cancellationReason', async () => {
    const responseData = { id: 'event-1', status: 'CANCELLED' };
    vi.mocked(apiClient.patch).mockResolvedValue({ data: responseData });

    const result = await cancelEvent('event-1', 'Motivo válido de cancelación');

    expect(result).toEqual(responseData);
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/v1/events/event-1/cancel',
      { cancellationReason: 'Motivo válido de cancelación' },
    );
  });
});
