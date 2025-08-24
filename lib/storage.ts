import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Profile {
  name: string;
  gender: string;
  heightCm: number;
  weightKgInitial: number;
  age: number;
  goalWeightKg: number;
}

export interface FoodEntry {
  date: string; // YYYY-MM-DD
  code: string;
  name: string;
  grams: number;
  kcal: number;
}

const PROFILE_KEY = 'profile';
const ENTRIES_KEY = 'entries';
const WEIGHTS_KEY = 'weights';

export async function saveProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getProfile(): Promise<Profile | null> {
  const data = await AsyncStorage.getItem(PROFILE_KEY);
  return data ? (JSON.parse(data) as Profile) : null;
}

async function getAllEntries(): Promise<FoodEntry[]> {
  const data = await AsyncStorage.getItem(ENTRIES_KEY);
  return data ? (JSON.parse(data) as FoodEntry[]) : [];
}

export async function addEntry(entry: FoodEntry): Promise<void> {
  const entries = await getAllEntries();
  entries.push(entry);
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export async function updateEntry(
  date: string,
  idx: number,
  entry: FoodEntry,
): Promise<void> {
  const entries = await getAllEntries();
  let count = -1;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].date === date) {
      count++;
      if (count === idx) {
        entries[i] = entry;
        break;
      }
    }
  }
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export async function removeEntry(date: string, idx: number): Promise<void> {
  const entries = await getAllEntries();
  let count = -1;
  const filtered = entries.filter((e) => {
    if (e.date === date) {
      count++;
      return count !== idx;
    }
    return true;
  });
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
}

export async function getEntries(date: string): Promise<FoodEntry[]> {
  const entries = await getAllEntries();
  return entries.filter((e) => e.date === date);
}

export async function getDailyTotalKcal(date: string): Promise<number> {
  const entries = await getEntries(date);
  return entries.reduce((sum, e) => sum + e.kcal, 0);
}

async function getAllWeights(): Promise<Record<string, number>> {
  const data = await AsyncStorage.getItem(WEIGHTS_KEY);
  return data ? (JSON.parse(data) as Record<string, number>) : {};
}

export async function setWeight(date: string, kg: number): Promise<void> {
  const weights = await getAllWeights();
  weights[date] = kg;
  await AsyncStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
}

export async function getWeightFor(date: string): Promise<number | null> {
  const weights = await getAllWeights();
  if (weights[date] != null) {
    return weights[date];
  }
  let d = new Date(date);
  while (true) {
    d.setDate(d.getDate() - 1);
    const key = d.toISOString().slice(0, 10);
    if (weights[key] != null) {
      return weights[key];
    }
    if (d.getTime() <= 0) {
      break;
    }
  }
  const profile = await getProfile();
  return profile ? profile.weightKgInitial : null;
}
