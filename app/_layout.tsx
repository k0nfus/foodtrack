import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { darkTheme } from '@/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const theme = darkTheme;
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
