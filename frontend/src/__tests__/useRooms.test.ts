import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRooms } from '../hooks/useRooms';

vi.mock('../services/adminEventService');
vi.mock('../hooks/useAuth');

import * as adminEventService from '../services/adminEventService';
import { useAuth } from '../hooks/useAuth';

const mockListAllRooms = vi.mocked(adminEventService.listAllRooms);
const mockCreateRoom = vi.mocked(adminEventService.createRoom);
const mockUpdateRoom = vi.mocked(adminEventService.updateRoom);
const mockDeleteRoom = vi.mocked(adminEventService.deleteRoom);
const mockUseAuth = vi.mocked(useAuth);

const mockAuthAdmin = {
  isAuthenticated: true,
  isLoading: false,
  role: 'ADMIN' as const,
  userId: 'admin-1',
  email: 'admin@sem7.com',
  token: 'tok',
  login: vi.fn(),
  logout: vi.fn(),
  registerBuyer: vi.fn(),
};

const room1 = { id: 'r1', name: 'Teatro Real', maxCapacity: 300 };
const room2 = { id: 'r2', name: 'Grand Opera', maxCapacity: 500 };

describe('useRooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthAdmin);
    mockListAllRooms.mockResolvedValue([room1, room2]);
  });

  it('loads rooms on mount', async () => {
    // GIVEN / WHEN
    const { result } = renderHook(() => useRooms());

    // THEN
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rooms).toHaveLength(2);
    expect(result.current.rooms[0].name).toBe('Teatro Real');
    expect(result.current.error).toBeNull();
  });

  it('starts in loading state', () => {
    // GIVEN service is pending
    mockListAllRooms.mockReturnValue(new Promise(() => {}));

    // WHEN
    const { result } = renderHook(() => useRooms());

    // THEN
    expect(result.current.loading).toBe(true);
    expect(result.current.rooms).toHaveLength(0);
  });

  it('does not fetch when userId is null', async () => {
    // GIVEN
    mockUseAuth.mockReturnValue({ ...mockAuthAdmin, userId: null });

    // WHEN
    renderHook(() => useRooms());

    // THEN — loading stays true (early return without fetching)
    expect(mockListAllRooms).not.toHaveBeenCalled();
  });

  it('sets error on fetch failure', async () => {
    // GIVEN
    mockListAllRooms.mockRejectedValue(new Error('Network error'));

    // WHEN
    const { result } = renderHook(() => useRooms());

    // THEN
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
    expect(result.current.rooms).toHaveLength(0);
  });

  it('sets fallback error message when error has no message', async () => {
    // GIVEN
    mockListAllRooms.mockRejectedValue('failure');

    // WHEN
    const { result } = renderHook(() => useRooms());

    // THEN
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Error al cargar salas');
  });

  // --- CRUD operations ---

  it('createNewRoom adds room to list', async () => {
    // GIVEN rooms loaded
    const { result } = renderHook(() => useRooms());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newRoom = { id: 'r3', name: 'Sala VIP', maxCapacity: 150 };
    mockCreateRoom.mockResolvedValue(newRoom);

    // WHEN
    await act(() => result.current.createNewRoom({ name: 'Sala VIP', maxCapacity: 150 }));

    // THEN
    expect(result.current.rooms).toHaveLength(3);
    expect(result.current.rooms[2]).toEqual(newRoom);
  });

  it('createNewRoom throws error with message on failure', async () => {
    // GIVEN
    const { result } = renderHook(() => useRooms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockCreateRoom.mockRejectedValue(new Error('Nombre duplicado'));

    // WHEN / THEN
    await expect(
      act(() => result.current.createNewRoom({ name: 'Dup', maxCapacity: 100 }))
    ).rejects.toThrow('Nombre duplicado');
  });

  it('updateExistingRoom replaces room in list', async () => {
    // GIVEN
    const { result } = renderHook(() => useRooms());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updated = { id: 'r1', name: 'Teatro Principal', maxCapacity: 400 };
    mockUpdateRoom.mockResolvedValue(updated);

    // WHEN
    await act(() =>
      result.current.updateExistingRoom('r1', { name: 'Teatro Principal', maxCapacity: 400 })
    );

    // THEN
    expect(result.current.rooms.find((r) => r.id === 'r1')?.name).toBe('Teatro Principal');
    expect(result.current.rooms).toHaveLength(2);
  });

  it('updateExistingRoom throws on failure', async () => {
    // GIVEN
    const { result } = renderHook(() => useRooms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockUpdateRoom.mockRejectedValue(new Error('Not found'));

    // WHEN / THEN
    await expect(
      act(() => result.current.updateExistingRoom('r99', { name: 'X', maxCapacity: 1 }))
    ).rejects.toThrow('Not found');
  });

  it('deleteExistingRoom removes room from list', async () => {
    // GIVEN
    const { result } = renderHook(() => useRooms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockDeleteRoom.mockResolvedValue(undefined);

    // WHEN
    await act(() => result.current.deleteExistingRoom('r1'));

    // THEN
    expect(result.current.rooms).toHaveLength(1);
    expect(result.current.rooms[0].id).toBe('r2');
  });

  it('deleteExistingRoom throws on failure', async () => {
    // GIVEN
    const { result } = renderHook(() => useRooms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockDeleteRoom.mockRejectedValue(new Error('Sala tiene eventos asociados'));

    // WHEN / THEN
    await expect(
      act(() => result.current.deleteExistingRoom('r1'))
    ).rejects.toThrow('Sala tiene eventos asociados');
  });

  it('refetch re-loads rooms from service', async () => {
    // GIVEN
    const { result } = renderHook(() => useRooms());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const refreshed = [{ id: 'r9', name: 'Nueva Sala', maxCapacity: 100 }];
    mockListAllRooms.mockResolvedValue(refreshed);

    // WHEN
    await act(() => result.current.refetch());

    // THEN
    await waitFor(() => expect(result.current.rooms).toHaveLength(1));
    expect(result.current.rooms[0].name).toBe('Nueva Sala');
    expect(mockListAllRooms).toHaveBeenCalledTimes(2);
  });
});
