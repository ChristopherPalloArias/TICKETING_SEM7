import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  fetchNotifications,
  markAllRead,
  fetchUnreadCount,
  archiveAll,
} from '../services/notificationService';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedGet = vi.mocked(axios.get);
const mockedPatch = vi.mocked(axios.patch);

const BUYER_ID = 'buyer-123';

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchNotifications calls correct endpoint', async () => {
    // GIVEN: backend returns paged notifications
    const pagedResponse = {
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
    };
    mockedGet.mockResolvedValue({ data: pagedResponse });

    // WHEN
    const result = await fetchNotifications(BUYER_ID);

    // THEN: GET to buyer notifications endpoint with correct params and header
    expect(mockedGet).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/notifications/buyer/${BUYER_ID}`),
      expect.objectContaining({
        params: { page: 0, size: 20 },
        headers: { 'X-User-Id': BUYER_ID },
      }),
    );
    expect(result).toEqual(pagedResponse);
  });

  it('markAllRead sends PATCH request', async () => {
    // GIVEN: backend acknowledges read-all
    mockedPatch.mockResolvedValue({ data: { updatedCount: 3 } });

    // WHEN
    const result = await markAllRead(BUYER_ID);

    // THEN: PATCH to read-all endpoint with X-User-Id header
    expect(mockedPatch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/notifications/buyer/${BUYER_ID}/read-all`),
      null,
      expect.objectContaining({
        headers: { 'X-User-Id': BUYER_ID },
      }),
    );
    expect(result).toEqual({ updatedCount: 3 });
  });

  it('fetchUnreadCount calls correct endpoint', async () => {
    // GIVEN: backend returns unread count
    mockedGet.mockResolvedValue({ data: { unreadCount: 5 } });

    // WHEN
    const result = await fetchUnreadCount(BUYER_ID);

    // THEN: GET to unread-count endpoint with X-User-Id header
    expect(mockedGet).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/notifications/buyer/${BUYER_ID}/unread-count`),
      expect.objectContaining({
        headers: { 'X-User-Id': BUYER_ID },
      }),
    );
    expect(result).toEqual({ unreadCount: 5 });
  });

  it('archiveAll sends PATCH request', async () => {
    // GIVEN: backend acknowledges archive-all
    mockedPatch.mockResolvedValue({ data: { archivedCount: 4 } });

    // WHEN
    const result = await archiveAll(BUYER_ID);

    // THEN: PATCH to archive-all endpoint with X-User-Id header
    expect(mockedPatch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/notifications/buyer/${BUYER_ID}/archive-all`),
      null,
      expect.objectContaining({
        headers: { 'X-User-Id': BUYER_ID },
      }),
    );
    expect(result).toEqual({ archivedCount: 4 });
  });
});
