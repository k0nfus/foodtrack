import React from 'react';
import { View } from 'react-native';
import { Button, Dialog, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchProduct, calculateKcal, Product } from '@/lib/off';
import { addEntry } from '@/lib/storage';

let BarCodeScanner: typeof import('expo-barcode-scanner').BarCodeScanner | null = null;
try {
  // Dynamic require so the app can run even if the native module is missing.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
} catch {
  console.warn(
    'expo-barcode-scanner module not found. Install it with "npx expo install expo-barcode-scanner".',
  );
}

export default function Scan() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const entryDate =
    typeof date === 'string' ? date : new Date().toISOString().slice(0, 10);
  const theme = useTheme();
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [scanned, setScanned] = React.useState(false);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [grams, setGrams] = React.useState('');

  React.useEffect(() => {
    if (!BarCodeScanner) {
      setHasPermission(false);
      return;
    }
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    const prod = await fetchProduct(data);
    if (prod) {
      setProduct(prod);
    } else {
      setScanned(false);
    }
  };

  async function save() {
    if (!product) return;
    const g = parseFloat(grams);
    if (isNaN(g)) return;
    await addEntry({
      date: entryDate,
      code: product.code,
      name: product.name,
      grams: g,
      kcal: calculateKcal(g, product.kcal100),
    });
    setProduct(null);
    router.back();
  }

  if (!BarCodeScanner) {
    return (
      <View
        style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text>
          Barcode-Scannen wird auf dieser Plattform nicht unterstützt. Installiere
          das Paket expo-barcode-scanner.
        </Text>
      </View>
    );
  }
  if (hasPermission === null) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }
  if (hasPermission === false) {
    return (
      <View
        style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text>Keine Kameraberechtigung</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {!product && BarCodeScanner && (
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={{ flex: 1 }}
        />
      )}
      <Portal>
        <Dialog visible={!!product} onDismiss={() => setProduct(null)}>
          <Dialog.Title>Gramm eingeben</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Gramm"
              value={grams}
              onChangeText={setGrams}
              keyboardType="numeric"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setProduct(null)}>Abbrechen</Button>
            <Button onPress={save}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
