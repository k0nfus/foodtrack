import React from 'react';
import { View, ScrollView, TouchableOpacity, PanResponder } from 'react-native';
import {
  Button,
  IconButton,
  List,
  Modal,
  Portal,
  Dialog,
  Text,
  TextInput,
  Divider,
  useTheme,
  SegmentedButtons,
} from 'react-native-paper';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import {
  getEntries,
  getDailyTotalKcal,
  getWeightFor,
  setWeight,
  getProfile,
  removeEntry,
  updateEntry,
  addEntry,
} from '@/lib/storage';
import { searchProducts, calculateKcal, Product } from '@/lib/off';
import { calculateBMR } from '@/lib/bmr';
import { FoodEntry } from '@/types';

export default function Index() {
  const router = useRouter();
  const { date: dateParam, open } = useLocalSearchParams<{
    date?: string;
    open?: string;
  }>();
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = React.useState(
    new Date().toISOString().slice(0, 10),
  );
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [entries, setEntries] = React.useState<FoodEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [weight, setWeightState] = React.useState('');
  const [modalVisible, setModalVisible] = React.useState(false);
  const [weightDialog, setWeightDialog] = React.useState(false);
  const [weightInput, setWeightInput] = React.useState('');
  const [bmr, setBmr] = React.useState(0);
  const [editIdx, setEditIdx] = React.useState<number | null>(null);
  const [editGrams, setEditGrams] = React.useState('');
  const [daysWithEntries, setDaysWithEntries] = React.useState<
    Record<string, boolean>
  >({});
  const [addDialog, setAddDialog] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null,
  );
  const [gramsInput, setGramsInput] = React.useState('');
  const [mealType, setMealType] = React.useState<
    'breakfast' | 'lunch' | 'dinner' | 'snack'
  >('snack');

  React.useEffect(() => {
    if (typeof dateParam === 'string') {
      setSelectedDate(dateParam);
      if (open === '1') {
        setModalVisible(true);
      }
    }
  }, [dateParam, open]);

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
      const e = await getEntries(selectedDate);
      setEntries(e);
      setDaysWithEntries((prev) => ({
        ...prev,
        [selectedDate]: e.length > 0,
      }));
      const t = await getDailyTotalKcal(selectedDate);
      setTotal(t);
      const w = await getWeightFor(selectedDate);
      if (w != null) {
        setWeightState(String(w));
      } else {
        setWeightState('');
      }
      const profile = await getProfile();
      if (profile && w != null) {
        setBmr(calculateBMR(profile, w));
      } else {
        setBmr(0);
      }
    })();
  }, [selectedDate]);

  React.useEffect(() => {
    (async () => {
      const record: Record<string, boolean> = {};
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = new Date(year, month, d).toISOString().slice(0, 10);
        const e = await getEntries(dateStr);
        if (e.length > 0) {
          record[dateStr] = true;
        }
      }
      setDaysWithEntries(record);
    })();
  }, [currentMonth]);

  useFocusEffect(load);

  async function saveWeight() {
    const num = parseFloat(weightInput);
    if (!isNaN(num)) {
      await setWeight(selectedDate, num);
      setWeightState(weightInput);
      setWeightDialog(false);
      load();
    }
  }

  function renderEntry(item: FoodEntry, index: number) {
    return (
      <List.Item
        key={`${item.code}-${index}`}
        title={item.name}
        description={`${item.grams} g • ${item.kcal} kcal`}
        right={() => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
              icon="pencil"
              iconColor={theme.colors.primary}
              onPress={() => {
                setEditIdx(index);
                setEditGrams(String(item.grams));
              }}
            />
            <IconButton
              icon="delete"
              iconColor={theme.colors.error}
              onPress={() => handleDelete(index)}
            />
          </View>
        )}
      />
    );
  }

  async function handleDelete(idx: number) {
    await removeEntry(selectedDate, idx);
    load();
  }

  async function saveEdit() {
    if (editIdx == null) return;
    const g = parseFloat(editGrams);
    if (isNaN(g)) return;
    const entry = entries[editIdx];
    const kcalPerGram = entry.kcal / entry.grams;
    await updateEntry(selectedDate, editIdx, {
      ...entry,
      grams: g,
      kcal: Math.round(kcalPerGram * g),
    });
    setEditIdx(null);
    load();
  }

  async function performSearch() {
    const res = await searchProducts(searchQuery);
    setResults(res);
  }

  async function saveNewEntry() {
    if (!selectedProduct) return;
    const g = parseFloat(gramsInput);
    if (isNaN(g)) return;
    await addEntry({
      date: selectedDate,
      code: selectedProduct.code,
      name: selectedProduct.name,
      grams: g,
      kcal: calculateKcal(g, selectedProduct.kcal100),
      mealType,
    });
    setSelectedProduct(null);
    setAddDialog(false);
    setSearchQuery('');
    setResults([]);
    load();
  }

  function changeMonth(offset: number) {
    setCurrentMonth((prev) =>
      new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  }

  function changeDay(offset: number) {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + offset);
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      return d.toISOString().slice(0, 10);
    });
  }

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 20,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 50) {
          changeDay(-1);
        } else if (gesture.dx < -50) {
          changeDay(1);
        }
      },
    }),
  ).current;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday start
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const days: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const displayDate = new Date(selectedDate).toLocaleDateString('de-DE');

  const mealLabels = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snack',
  } as const;
  const mealOrder: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = [
    'breakfast',
    'lunch',
    'dinner',
    'snack',
  ];
  const grouped = React.useMemo(() => {
    const g: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', FoodEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    entries.forEach((e) => {
      g[e.mealType].push(e);
    });
    return g;
  }, [entries]);
  const groupTotals = React.useMemo(() => {
    const t: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };
    entries.forEach((e) => {
      t[e.mealType] += e.kcal;
    });
    return t;
  }, [entries]);

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
      }}
    >
      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <IconButton
            icon="chevron-left"
            onPress={() => changeMonth(-1)}
            accessibilityLabel="Vorheriger Monat"
          />
          <Text variant="titleMedium">
            {currentMonth.toLocaleDateString('de-DE', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <IconButton
            icon="chevron-right"
            onPress={() => changeMonth(1)}
            accessibilityLabel="Nächster Monat"
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {dayNames.map((d) => (
            <Text
              key={d}
              style={{
                width: `${100 / 7}%`,
                textAlign: 'center',
                color: theme.colors.onBackground,
              }}
            >
              {d}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {days.map((d, idx) => {
            const dateStr = d
              ? new Date(year, month, d).toISOString().slice(0, 10)
              : '';
            const selected = d && dateStr === selectedDate;
            const hasEntries = d && daysWithEntries[dateStr];
            return (
              <TouchableOpacity
                key={idx}
                style={{ width: `${100 / 7}%`, padding: 4 }}
                onPress={() => {
                  if (d) {
                    setSelectedDate(dateStr);
                    setModalVisible(true);
                  }
                }}
              >
                <View
                  style={{
                    aspectRatio: 1,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected
                      ? theme.colors.primary
                      : 'transparent',
                    borderWidth: hasEntries ? 1 : 0,
                    borderColor: theme.colors.primary,
                  }}
                >
                  <Text
                    style={{
                      color: selected
                        ? theme.colors.onPrimary || '#fff'
                        : theme.colors.onBackground,
                    }}
                  >
                    {d ?? ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={{
            flex: 1,
            backgroundColor: theme.colors.background,
            padding: 16,
          }}
        >
          <View style={{ flex: 1 }} {...panResponder.panHandlers}>
            <Text
              variant="headlineMedium"
              style={{ marginBottom: 4, textAlign: 'center' }}
            >
              {displayDate}
            </Text>
            <Text style={{ marginBottom: 16, textAlign: 'center' }}>
              Gewicht: {weight ? `${weight} kg` : '--'}
            </Text>
            <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <Text>Grundumsatz</Text>
                <Text style={{ textAlign: 'right' }}>{bmr} kcal</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <Text>Gesamt</Text>
                <Text style={{ textAlign: 'right' }}>{total} kcal</Text>
              </View>
              <Divider style={{ marginVertical: 4 }} />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <Text>Differenz</Text>
                <Text style={{ textAlign: 'right' }}>{total - bmr} kcal</Text>
              </View>
            </View>
            <ScrollView style={{ flex: 1 }}>
              {mealOrder.map((mt) => (
                <List.Section key={mt}>
                  <List.Subheader>
                    {mealLabels[mt]} ({groupTotals[mt]} kcal)
                  </List.Subheader>
                  {grouped[mt].map((item) => {
                    const idx = entries.indexOf(item);
                    return renderEntry(item, idx);
                  })}
                </List.Section>
              ))}
            </ScrollView>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 16,
                marginHorizontal: 16,
              }}
            >
              <IconButton
                icon="scale-bathroom"
                mode="contained-tonal"
                iconColor={theme.colors.primary}
                onPress={() => {
                  setWeightInput(weight);
                  setWeightDialog(true);
                }}
              />
              <IconButton
                icon="plus"
                mode="contained-tonal"
                iconColor={theme.colors.primary}
                onPress={() => {
                  setMealType('snack');
                  setAddDialog(true);
                }}
              />
            </View>
          </View>
        </Modal>
        <Modal
          visible={addDialog}
          onDismiss={() => setAddDialog(false)}
          contentContainerStyle={{
            flex: 1,
            backgroundColor: theme.colors.background,
            padding: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge">Neuer Eintrag</Text>
            <SegmentedButtons
              style={{ marginTop: 16 }}
              value={mealType}
              onValueChange={(v) =>
                setMealType(v as 'breakfast' | 'lunch' | 'dinner' | 'snack')
              }
              buttons={[
                { value: 'breakfast', label: 'Frühstück' },
                { value: 'lunch', label: 'Mittagessen' },
                { value: 'dinner', label: 'Abendessen' },
                { value: 'snack', label: 'Snack' },
              ]}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <TextInput
                style={{ flex: 1 }}
                label="Suche"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={performSearch}
                right={<TextInput.Icon icon="magnify" onPress={performSearch} />}
              />
              <IconButton
                icon="barcode"
                onPress={() => {
                  setAddDialog(false);
                  router.push({
                    pathname: '/scan',
                    params: { date: selectedDate, meal: mealType },
                  });
                }}
              />
            </View>
            <ScrollView style={{ flex: 1, marginTop: 16 }}>
              {results.map((item) => (
                <List.Item
                  key={item.code}
                  title={item.name}
                  description={`${item.kcal100} kcal/100g`}
                  onPress={() => {
                    setSelectedProduct(item);
                    setGramsInput('');
                  }}
                />
              ))}
            </ScrollView>
            <Button onPress={() => setAddDialog(false)}>Schließen</Button>
          </View>
        </Modal>
        <Dialog
          visible={!!selectedProduct}
          onDismiss={() => setSelectedProduct(null)}
        >
          <Dialog.Title>Gramm eingeben</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Gramm"
              value={gramsInput}
              onChangeText={setGramsInput}
              keyboardType="numeric"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedProduct(null)}>Abbrechen</Button>
            <Button onPress={saveNewEntry}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={weightDialog} onDismiss={() => setWeightDialog(false)}>
          <Dialog.Title>Gewicht aktualisieren</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Gewicht (kg)"
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setWeightDialog(false)}>Abbrechen</Button>
            <Button onPress={saveWeight}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={editIdx != null} onDismiss={() => setEditIdx(null)}>
          <Dialog.Title>Eintrag bearbeiten</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Gramm"
              value={editGrams}
              onChangeText={setEditGrams}
              keyboardType="numeric"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditIdx(null)}>Abbrechen</Button>
            <Button onPress={saveEdit}>Speichern</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
