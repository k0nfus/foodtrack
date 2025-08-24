import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import { darkTheme, lightTheme } from '@/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </SafeAreaView>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
