import { api } from './api';
import {
  clearSession,
  getAccessToken,
  getCachedCurrentUser,
  getRefreshToken,
  setAccessToken,
  setCachedCurrentUser,
  setRefreshToken,
} from './sessionStorage';

export interface User {
  id: string;
  username: string;
  email: string;
  xp: number;
  level: string;
  quizzesCompleted: number;
  avatar: string;
  country?: string;
  joinedAt?: string;
  quizHistory: any[];
  streak?: number;
  lastProfileUpdate?: string;
}

export async function getToken() {
  return await getAccessToken();
}

export async function setToken(token: string) {
  await setAccessToken(token);
}

export async function setRefreshSessionToken(token: string) {
  await setRefreshToken(token);
}

export async function removeToken() {
  await clearSession();
}

export async function register(username: string, email: string, password: string): Promise<User> {
  const data: any = await api.post('/auth/register', { username, email, password });
  const { accessToken, refreshToken, token, success, ...userPayload } = data;
  
  await setToken(accessToken || token);
  if (refreshToken) {
    await setRefreshSessionToken(refreshToken);
  }
  const user = { ...userPayload, joinedAt: userPayload.createdAt || new Date().toISOString(), quizHistory: [] };
  await setCachedCurrentUser(user);
  return user as User;
}

export async function login(email: string, password: string): Promise<User> {
  const data: any = await api.post('/auth/login', { email, password });
  const { accessToken, refreshToken, token, success, ...userPayload } = data;
  
  await setToken(accessToken || token);
  if (refreshToken) {
    await setRefreshSessionToken(refreshToken);
  }
  const user = { ...userPayload, joinedAt: userPayload.createdAt || new Date().toISOString(), quizHistory: [] };
  await setCachedCurrentUser(user);
  return user as User;
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } catch {
    // La session locale doit quand même être nettoyée même si le serveur est indisponible
  } finally {
    await clearSession();
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const [accessToken, refreshToken] = await Promise.all([getToken(), getRefreshToken()]);
  if (!accessToken && !refreshToken) return null;
  
  try {
    const profile: any = await api.get('/users/profile');
    
    let quizzes: any[] = [];
    try {
       quizzes = await api.get('/quizzes');
    } catch {}

    const quizHistory = (profile.results || []).map((r: any) => {
      const q = quizzes.find((x) => x.id === r.quizId);
      return {
        quizId: r.quizId,
        quizTitle: q?.title || 'Quiz',
        score: r.score,
        maxScore: 100,
        xpEarned: r.xpEarned,
        completedAt: r.completedAt,
        difficulty: q?.difficulty || 'beginner',
      };
    });

    const user = { ...profile, joinedAt: profile.createdAt || new Date().toISOString(), quizHistory };
    await setCachedCurrentUser(user);
    return user as User;
  } catch (err: any) {
    if (err?.status === 401) {
      await clearSession();
      return null;
    }

    return getCachedCurrentUser<User>();
  }
}

export async function updateUser(updatedUser: Partial<User>): Promise<User> {
  const data = await api.put('/users/profile', updatedUser);
  const user = { ...(data as any), quizHistory: [] } as User;
  await setCachedCurrentUser(user);
  return user;
}

export function calculateLevel(xp: number): number {
  if (xp >= 1200) return 4;
  if (xp >= 600) return 3;
  if (xp >= 200) return 2;
  return 1;
}

export function getNextLevelXp(xp: number): { current: number; next: number; levelName: string } {
  if (xp >= 1200) return { current: 1200, next: 9999, levelName: 'Expert' };
  if (xp >= 600) return { current: 600, next: 1200, levelName: 'Advanced' };
  if (xp >= 200) return { current: 200, next: 600, levelName: 'Intermediate' };
  return { current: 0, next: 200, levelName: 'Beginner' };
}
