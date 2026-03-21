import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://localhost:3001/api';

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
}

const CURRENT_USER_KEY = '@quiz_current_user';
const TOKEN_KEY = '@quiz_token';

export async function getToken() {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  } as HeadersInit;
  return fetch(url, { ...options, headers });
}

export async function register(username: string, email: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error registering');
  await setToken(data.token);
  const user = { ...data, joinedAt: data.createdAt || new Date().toISOString(), quizHistory: [] };
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user as User;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error logging in');
  await setToken(data.token);
  const user = { ...data, joinedAt: data.createdAt || new Date().toISOString(), quizHistory: [] };
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user as User;
}

export async function logout(): Promise<void> {
  await removeToken();
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await authFetch(`${API_URL}/users/profile`);
    if (!res.ok) return null;
    const profile = await res.json();
    
    let quizzes: any[] = [];
    try {
       const qres = await fetch(`${API_URL}/quizzes`);
       if(qres.ok) quizzes = await qres.json();
    } catch(e) {}

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
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user as User;
  } catch (err) {
    const data = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  }
}

export async function updateUser(updatedUser: Partial<User>): Promise<void> {
  const res = await authFetch(`${API_URL}/users/profile`, {
    method: 'PUT',
    body: JSON.stringify(updatedUser)
  });
  if (res.ok) {
    const data = await res.json();
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ ...data, quizHistory: [] }));
  }
}

export function calculateLevel(xp: number): string {
  if (xp >= 390) return 'Expert';
  if (xp >= 180) return 'Advanced';
  if (xp >= 60) return 'Intermediate';
  return 'Beginner';
}

export function getNextLevelXp(xp: number): { current: number; next: number; levelName: string } {
  if (xp >= 390) return { current: 390, next: 9999, levelName: 'Expert' };
  if (xp >= 180) return { current: 180, next: 390, levelName: 'Advanced' };
  if (xp >= 60) return { current: 60, next: 180, levelName: 'Intermediate' };
  return { current: 0, next: 60, levelName: 'Beginner' };
}
