import React from 'react';
import { View, FlatList } from 'react-native';
import { Button, List, Text, TextInput } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { getEntries, getDailyTotalKcal, getWeightFor, setWeight, getProfile } from '@/lib/storage';
import { FoodEntry } from '@/types';

export default function Index() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [entries, setEntries] = React.useState<FoodEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [weight, setWeightState] = React.useState('');

  React.useEffect(() => {
    (async () => {
      const profile = await getProfile();
      if (!profile) {
        router.replace('/onboarding');
      }
    })();
  }, [router]);

  const load = React.useCallback(() => {
    (async () => {
      const e = await getEntries(today);
      setEntries(e);
      const t = await getDailyTotalKcal(today);
      setTotal(t);
      const w = await getWeightFor(today);
      if (w != null) {
        setWeightState(String(w));
      }
    })();
  }, [today]);

  useFocusEffect(load);

  async function saveWeight() {
    const num = parseFloat(weight);
    if (!isNaN(num)) {
      await setWeight(today, num);
    }
  }

  const renderItem = ({ item }: { item: FoodEntry }) => (
    <List.Item
      title={item.name}
      description={`${item.grams} g • ${item.kcal} kcal`}
    />
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineMedium" style={{ marginBottom: 16 }}>
        Heute: {total} kcal
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(item, idx) => `${item.code}-${idx}`}
        renderItem={renderItem}
        ListEmptyComponent={<Text>Keine Einträge</Text>}
      />
      <TextInput
        label="Gewicht (kg)"
        value={weight}
        onChangeText={setWeightState}
        onBlur={saveWeight}
        keyboardType="numeric"
        style={{ marginTop: 16 }}
      />
      <Button
        mode="contained"
        style={{ marginTop: 16 }}
        onPress={() => router.push('/search')}
      >
        Lebensmittel suchen
      </Button>
      <Button
        mode="contained"
        style={{ marginTop: 8 }}
        onPress={() => router.push('/scan')}
      >
        Barcode scannen
      </Button>
    </View>
  );
}
