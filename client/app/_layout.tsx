import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { QuizProvider } from '@/contexts/QuizContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <QuizProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/register" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="quiz/[id]"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="quiz/results"
                options={{ animation: 'fade', gestureEnabled: false }}
              />
            </Stack>
          </QuizProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
