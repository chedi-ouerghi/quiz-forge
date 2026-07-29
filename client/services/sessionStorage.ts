import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCESS_TOKEN_KEY = '@quiz_token';
export const REFRESH_TOKEN_KEY = '@quiz_refresh_token';
export const CURRENT_USER_KEY = '@quiz_current_user';

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setAccessToken(token: string) {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function setRefreshToken(token: string) {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export async function setSessionTokens(accessToken: string, refreshToken?: string | null) {
  await setAccessToken(accessToken);

  if (refreshToken) {
    await setRefreshToken(refreshToken);
  }
}

export async function getCachedCurrentUser<T>() {
  const user = await AsyncStorage.getItem(CURRENT_USER_KEY);
  return user ? (JSON.parse(user) as T) : null;
}

export async function setCachedCurrentUser(user: unknown) {
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, CURRENT_USER_KEY]);
}
