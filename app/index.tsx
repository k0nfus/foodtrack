import React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import {
  Button,
  IconButton,
  List,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { getEntries, getDailyTotalKcal, getWeightFor, setWeight, getProfile } from '@/lib/storage';
import { FoodEntry } from '@/types';

export default function Index() {
  const router = useRouter();
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
      const t = await getDailyTotalKcal(selectedDate);
      setTotal(t);
      const w = await getWeightFor(selectedDate);
      if (w != null) {
        setWeightState(String(w));
      } else {
        setWeightState('');
      }
    })();
  }, [selectedDate]);

  useFocusEffect(load);

  async function saveWeight() {
    const num = parseFloat(weight);
    if (!isNaN(num)) {
      await setWeight(selectedDate, num);
    }
  }

  const renderItem = ({ item }: { item: FoodEntry }) => (
    <List.Item
      title={item.name}
      description={`${item.grams} g • ${item.kcal} kcal`}
    />
  );

  function changeMonth(offset: number) {
    setCurrentMonth((prev) =>
      new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday start
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const days: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const displayDate = new Date(selectedDate).toLocaleDateString('de-DE');

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
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
            backgroundColor: theme.colors.background,
            padding: 16,
            margin: 16,
            borderRadius: 8,
          }}
        >
          <Text variant="headlineMedium" style={{ marginBottom: 16 }}>
            {displayDate}: {total} kcal
          </Text>
          <FlatList
            data={entries}
            keyExtractor={(item, idx) => `${item.code}-${idx}`}
            renderItem={renderItem}
            ListEmptyComponent={<Text>Keine Einträge</Text>}
            style={{ maxHeight: 300 }}
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
            icon="magnify"
            mode="contained"
            textColor="#fff"
            style={{ marginTop: 16 }}
            onPress={() => {
              setModalVisible(false);
              router.push({ pathname: '/search', params: { date: selectedDate } });
            }}
          >
            Lebensmittel suchen
          </Button>
          <Button
            icon="barcode"
            mode="contained"
            textColor="#fff"
            style={{ marginTop: 8 }}
            onPress={() => {
              setModalVisible(false);
              router.push({ pathname: '/scan', params: { date: selectedDate } });
            }}
          >
            Barcode scannen
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}
