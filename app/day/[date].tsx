import React from 'react';
import { View, ScrollView, PanResponder, Animated, Dimensions } from 'react-native';
import {
  Button,
  IconButton,
  List,
  Portal,
  Dialog,
  Text,
  TextInput,
  Divider,
  useTheme,
  SegmentedButtons,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  getEntries,
  getDailyTotalKcal,
  getWeightFor,
  setWeight,
  getProfile,
  removeEntry,
  updateEntry,
} from '@/lib/storage';
import { calculateBMR } from '@/lib/bmr';
import { FoodEntry } from '@/types';
import { formatDate } from '@/lib/date';

export default function DayView() {
  const router = useRouter();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const initialDate =
    typeof dateParam === 'string'
      ? dateParam
      : formatDate(new Date());
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = React.useState(initialDate);
  const [entries, setEntries] = React.useState<FoodEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [weight, setWeightState] = React.useState('');
  const [weightDialog, setWeightDialog] = React.useState(false);
  const [weightInput, setWeightInput] = React.useState('');
  const [bmr, setBmr] = React.useState(0);
  const [editIdx, setEditIdx] = React.useState<number | null>(null);
  const [editGrams, setEditGrams] = React.useState('');
  const [mealDialog, setMealDialog] = React.useState(false);
  const [mealType, setMealType] = React.useState<
    'breakfast' | 'lunch' | 'dinner' | 'snack'
  >('snack');
  const slide = React.useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  React.useEffect(() => {
    if (typeof dateParam === 'string') {
      setSelectedDate(dateParam);
    }
  }, [dateParam]);

  const load = React.useCallback(() => {
    (async () => {
      const e = await getEntries(selectedDate);
      setEntries(e);
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

  useFocusEffect(load);

  async function saveWeight() {
    const num = parseFloat(weightInput);
    if (isNaN(num)) return;
    await setWeight(selectedDate, num);
    setWeightState(weightInput);
    setWeightDialog(false);
    load();
  }

  async function saveEdit() {
    if (editIdx == null) return;
    const g = parseFloat(editGrams);
    if (isNaN(g)) return;
    await updateEntry(selectedDate, editIdx, { grams: g });
    setEditIdx(null);
    load();
  }

  const changeDate = React.useCallback(
    (delta: number) => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + delta);
      setSelectedDate(formatDate(d));
    },
    [selectedDate],
  );

  const animateChangeDate = React.useCallback(
    (delta: number) => {
      Animated.timing(slide, {
        toValue: -delta * screenWidth,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        changeDate(delta);
        slide.setValue(delta * screenWidth);
        Animated.timing(slide, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    },
    [changeDate, screenWidth, slide],
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          Math.abs(gesture.dx) > 10,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 50) animateChangeDate(-1);
          else if (gesture.dx < -50) animateChangeDate(1);
        },
      }),
    [animateChangeDate],
  );

  const mealLabels = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snack',
  } as const;
  const mealOrder: (
    | 'breakfast'
    | 'lunch'
    | 'dinner'
    | 'snack'
  )[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const grouped = React.useMemo(() => {
    const g: Record<
      'breakfast' | 'lunch' | 'dinner' | 'snack',
      FoodEntry[]
    > = { breakfast: [], lunch: [], dinner: [], snack: [] };
    entries.forEach((e) => {
      g[e.mealType].push(e);
    });
    return g;
  }, [entries]);
  const groupTotals = React.useMemo(() => {
    const t: Record<
      'breakfast' | 'lunch' | 'dinner' | 'snack',
      number
    > = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    entries.forEach((e) => {
      t[e.mealType] += e.kcal;
    });
    return t;
  }, [entries]);

  const displayDate = new Date(selectedDate).toLocaleDateString('de-DE');

  return (
    <View
      style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}
    >
      <IconButton icon="arrow-left" onPress={() => router.back()} />
      <Animated.View
        style={{ flex: 1, transform: [{ translateX: slide }] }}
        {...panResponder.panHandlers}
      >
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <Text
            variant="headlineMedium"
            style={{
              textAlign: 'center',
              backgroundColor: theme.colors.primary,
              color: theme.colors.onPrimary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}
          >
            {displayDate}
          </Text>
        </View>
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
                return (
                  <List.Item
                    key={`${item.code}-${idx}`}
                    title={`${item.name} (${item.grams}g)`}
                    description={`${item.kcal} kcal`}
                    right={() => (
                      <IconButton
                        icon="pencil"
                        onPress={() => {
                          setEditIdx(idx);
                          setEditGrams(String(item.grams));
                        }}
                      />
                    )}
                    onLongPress={() => removeEntry(selectedDate, idx).then(load)}
                  />
                );
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
              setMealDialog(true);
            }}
          />
        </View>
      </Animated.View>
      <Portal>
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
        <Dialog visible={mealDialog} onDismiss={() => setMealDialog(false)}>
          <Dialog.Title>Mahlzeit wählen</Dialog.Title>
          <Dialog.Content>
            <SegmentedButtons
              value={mealType}
              onValueChange={(v) =>
                setMealType(
                  v as 'breakfast' | 'lunch' | 'dinner' | 'snack',
                )
              }
              buttons={[
                { value: 'breakfast', label: 'Frühstück' },
                { value: 'lunch', label: 'Mittagessen' },
                { value: 'dinner', label: 'Abendessen' },
                { value: 'snack', label: 'Snack' },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMealDialog(false)}>Abbrechen</Button>
            <Button
              onPress={() => {
                setMealDialog(false);
                router.push({
                  pathname: '/search',
                  params: { date: selectedDate, meal: mealType },
                });
              }}
            >
              Weiter
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
