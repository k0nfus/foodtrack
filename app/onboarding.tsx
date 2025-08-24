import React from 'react';
import { ScrollView } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { saveProfile, setWeight } from '@/lib/storage';

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [weight, setWeightInput] = React.useState('');
  const [age, setAge] = React.useState('');
  const [goal, setGoal] = React.useState('');

  async function save() {
    const profile = {
      name,
      gender,
      heightCm: parseFloat(height),
      weightKgInitial: parseFloat(weight),
      age: parseInt(age, 10),
      goalWeightKg: parseFloat(goal),
    };
    await saveProfile(profile);
    const w = parseFloat(weight);
    if (!isNaN(w)) {
      const today = new Date().toISOString().slice(0, 10);
      await setWeight(today, w);
    }
    router.replace('/');
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <TextInput label="Name" value={name} onChangeText={setName} style={{ marginBottom: 12 }} />
      <TextInput label="Geschlecht" value={gender} onChangeText={setGender} style={{ marginBottom: 12 }} />
      <TextInput label="Größe (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" style={{ marginBottom: 12 }} />
      <TextInput label="Gewicht (kg)" value={weight} onChangeText={setWeightInput} keyboardType="numeric" style={{ marginBottom: 12 }} />
      <TextInput label="Alter" value={age} onChangeText={setAge} keyboardType="numeric" style={{ marginBottom: 12 }} />
      <TextInput label="Zielgewicht (kg)" value={goal} onChangeText={setGoal} keyboardType="numeric" style={{ marginBottom: 12 }} />
      <Button mode="contained" onPress={save}>
        Speichern
      </Button>
    </ScrollView>
  );
}
