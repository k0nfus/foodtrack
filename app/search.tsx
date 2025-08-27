import React from 'react';
import { View, FlatList } from 'react-native';
import { Button, Dialog, List, Portal, TextInput, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { searchProducts, calculateKcal, Product } from '@/lib/off';
import { addEntry } from '@/lib/storage';

export default function Search() {
  const router = useRouter();
  const { date, meal } = useLocalSearchParams<{ date?: string; meal?: string }>();
  const entryDate =
    typeof date === 'string' ? date : new Date().toISOString().slice(0, 10);
  const mealType =
    meal === 'breakfast' || meal === 'lunch' || meal === 'dinner' || meal === 'snack'
      ? meal
      : 'snack';
  const theme = useTheme();
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
      date: entryDate,
      code: selected.code,
      name: selected.name,
      grams: g,
      kcal: calculateKcal(g, selected.kcal100),
      mealType,
    });
    setSelected(null);
    router.replace({ pathname: '/', params: { date: entryDate, open: '1' } });
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <TextInput
        label="Suche"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={performSearch}
        right={<TextInput.Icon icon="magnify" onPress={performSearch} />}
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
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
