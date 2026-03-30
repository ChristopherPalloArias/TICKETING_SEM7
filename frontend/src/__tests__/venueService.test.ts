import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getPublicRooms } from '../services/venueService';

vi.mock('axios');
const mockAxios = vi.mocked(axios, true);

describe('venueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPublicRooms calls correct endpoint with Axios', async () => {
    // GIVEN: axios.get resolves with room data
    const rooms = [
      { id: 'room-1', name: 'Teatro Real', maxCapacity: 500 },
      { id: 'room-2', name: 'Grand Opera House', maxCapacity: 300 },
    ];
    mockAxios.get.mockResolvedValueOnce({ data: rooms });

    // WHEN: calling getPublicRooms
    const result = await getPublicRooms();

    // THEN: axios.get was called with the public rooms endpoint
    expect(mockAxios.get).toHaveBeenCalledOnce();
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/rooms/public'),
    );
    expect(result).toEqual(rooms);
  });

  it('getPublicRooms does not send auth headers', async () => {
    // GIVEN: axios.get resolves
    mockAxios.get.mockResolvedValueOnce({ data: [] });

    // WHEN: calling getPublicRooms
    await getPublicRooms();

    // THEN: no Authorization header is present in the call
    const callArgs = mockAxios.get.mock.calls[0];
    expect(callArgs.length).toBe(1); // only URL, no config with headers
  });

  it('getPublicRooms propagates errors from Axios', async () => {
    // GIVEN: axios.get rejects
    const error = new Error('Network Error');
    mockAxios.get.mockRejectedValueOnce(error);

    // WHEN / THEN: error is propagated
    await expect(getPublicRooms()).rejects.toThrow('Network Error');
  });
});
