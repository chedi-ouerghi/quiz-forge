import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { QuizProvider } from '@/contexts/QuizContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { StatusBar } from 'expo-status-bar';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <AlertProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <NotificationProvider>
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
          </NotificationProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </AlertProvider>
    </GlobalErrorBoundary>
  );
}
