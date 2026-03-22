import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, API_URL } from './api';

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

export async function register(username: string, email: string, password: string): Promise<User> {
  const data: any = await api.post('/auth/register', { username, email, password });
  
  await setToken(data.token);
  const user = { ...data, joinedAt: data.createdAt || new Date().toISOString(), quizHistory: [] };
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user as User;
}

export async function login(email: string, password: string): Promise<User> {
  const data: any = await api.post('/auth/login', { email, password });
  
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
    const profile: any = await api.get('/users/profile');
    
    let quizzes: any[] = [];
    try {
       quizzes = await api.get('/quizzes');
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
  const data = await api.put('/users/profile', updatedUser);
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ ...data as object, quizHistory: [] }));
}

export function calculateLevel(xp: number): number {
  if (xp >= 3500) return 4;
  if (xp >= 1500) return 3;
  if (xp >= 500) return 2;
  return 1;
}

export function getNextLevelXp(xp: number): { current: number; next: number; levelName: string } {
  if (xp >= 3500) return { current: 3500, next: 9999, levelName: 'Expert' };
  if (xp >= 1500) return { current: 1500, next: 3500, levelName: 'Advanced' };
  if (xp >= 500) return { current: 500, next: 1500, levelName: 'Intermediate' };
  return { current: 0, next: 500, levelName: 'Beginner' };
}
