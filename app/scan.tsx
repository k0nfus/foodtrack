import React from 'react';
import { View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Button, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { fetchProduct, calculateKcal, Product } from '@/lib/off';
import { addEntry } from '@/lib/storage';

export default function Scan() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [scanned, setScanned] = React.useState(false);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [grams, setGrams] = React.useState('');

  React.useEffect(() => {
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
      date: new Date().toISOString().slice(0, 10),
      code: product.code,
      name: product.name,
      grams: g,
      kcal: calculateKcal(g, product.kcal100),
    });
    setProduct(null);
    router.back();
  }

  if (hasPermission === null) {
    return <View style={{ flex: 1 }} />;
  }
  if (hasPermission === false) {
    return <Text>Keine Kameraberechtigung</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      {!product && (
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
