import React from 'react';
import { View, FlatList } from 'react-native';
import { Button, Dialog, List, Portal, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { searchProducts, calculateKcal, Product } from '@/lib/off';
import { addEntry } from '@/lib/storage';

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Product[]>([]);
  const [selected, setSelected] = React.useState<Product | null>(null);
  const [grams, setGrams] = React.useState('');

  async function performSearch() {
    const res = await searchProducts(query);
    setResults(res);
  }

  async function save() {
    if (!selected) return;
    const g = parseFloat(grams);
    if (isNaN(g)) return;
    await addEntry({
      date: new Date().toISOString().slice(0, 10),
      code: selected.code,
      name: selected.name,
      grams: g,
      kcal: calculateKcal(g, selected.kcal100),
    });
    setSelected(null);
    router.back();
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        label="Suche"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={performSearch}
        right={<TextInput.Icon icon="magnify" onPress={performSearch} />}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={`${item.kcal100} kcal/100g`}
            onPress={() => {
              setSelected(item);
              setGrams('');
            }}
          />
        )}
      />
      <Portal>
        <Dialog visible={!!selected} onDismiss={() => setSelected(null)}>
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
            <Button onPress={() => setSelected(null)}>Abbrechen</Button>
            <Button onPress={save}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
