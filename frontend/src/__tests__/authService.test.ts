import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { login, getProfile } from '../services/authService';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  it('login_withValidCredentials_returnsToken — llama a POST /api/v1/auth/login y retorna { token, expiresIn, role }', async () => {
    // GIVEN
    const mockData = { token: 'jwt.token.here', expiresIn: 3600, role: 'ADMIN' };
    vi.mocked(axios.post).mockResolvedValue({ data: mockData });

    // WHEN
    const result = await login('user@test.com', 'password123');

    // THEN
    expect(result).toEqual(mockData);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login'),
      { email: 'user@test.com', password: 'password123' },
    );
  });

  it('login_withInvalidCredentials_throwsError — axios retorna 401 y el servicio propaga el error', async () => {
    // GIVEN
    const error = Object.assign(new Error('Request failed with status code 401'), {
      response: { status: 401, data: { message: 'Unauthorized' } },
    });
    vi.mocked(axios.post).mockRejectedValue(error);

    // WHEN / THEN
    await expect(login('bad@email.com', 'wrongpass')).rejects.toThrow(
      'Request failed with status code 401',
    );
    expect(axios.post).toHaveBeenCalledOnce();
  });

  it('login_callsCorrectEndpoint — la URL contiene /api/v1/auth/login', async () => {
    // GIVEN
    vi.mocked(axios.post).mockResolvedValue({
      data: { token: 'tk', expiresIn: 3600, role: 'ADMIN' },
    });

    // WHEN
    await login('u@test.com', 'pass');

    // THEN
    const calledUrl = vi.mocked(axios.post).mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/\/api\/v1\/auth\/login$/);
  });

  // ─── getProfile ──────────────────────────────────────────────────────────────

  it('getProfile_withValidToken_returnsUserProfile — llama a GET /api/v1/auth/me con header Authorization', async () => {
    // GIVEN
    const mockProfile = { id: 'user-1', email: 'admin@test.com', role: 'ADMIN' };
    vi.mocked(axios.get).mockResolvedValue({ data: mockProfile });

    // WHEN
    const result = await getProfile('my.jwt.token');

    // THEN
    expect(result).toEqual(mockProfile);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/me'), {
      headers: { Authorization: 'Bearer my.jwt.token' },
    });
  });
});
