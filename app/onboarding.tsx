import React from 'react';
import { ScrollView } from 'react-native';
import { Button, TextInput, useTheme, Menu } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { saveProfile, setWeight } from '@/lib/storage';
import { formatDate } from '@/lib/date';

export default function Onboarding() {
  const router = useRouter();
  const theme = useTheme();
  const [name, setName] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [genderMenuVisible, setGenderMenuVisible] = React.useState(false);
  const [height, setHeight] = React.useState('');
  const [weight, setWeightInput] = React.useState('');
  const [birthDate, setBirthDate] = React.useState('');
  const [goal, setGoal] = React.useState('');

  async function save() {
    let birthIso = '1985-01-16';
    const parts = birthDate.split('.');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (day && month && year) {
        birthIso = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    const profile = {
      name,
      gender,
      heightCm: parseFloat(height),
      weightKgInitial: parseFloat(weight),
      birthDate: birthIso,
      goalWeightKg: parseFloat(goal),
    };
    await saveProfile(profile);
    const w = parseFloat(weight);
    if (!isNaN(w)) {
      const today = formatDate(new Date());
      await setWeight(today, w);
    }
    router.replace('/');
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      <TextInput label="Name" value={name} onChangeText={setName} style={{ marginBottom: 12 }} />
      <Menu
        visible={genderMenuVisible}
        onDismiss={() => setGenderMenuVisible(false)}
        anchor={
          <TextInput
            label="Geschlecht"
            value={gender}
            onFocus={() => setGenderMenuVisible(true)}
            showSoftInputOnFocus={false}
            right={<TextInput.Icon icon="menu-down" />}
            style={{ marginBottom: 12 }}
          />
        }
      >
        <Menu.Item
          onPress={() => {
            setGender('m');
            setGenderMenuVisible(false);
          }}
          title="m"
        />
        <Menu.Item
          onPress={() => {
            setGender('w');
            setGenderMenuVisible(false);
          }}
          title="w"
        />
        <Menu.Item
          onPress={() => {
            setGender('d');
            setGenderMenuVisible(false);
          }}
          title="d"
        />
      </Menu>
      <TextInput label="Größe (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" style={{ marginBottom: 12 }} />
      <TextInput label="Gewicht (kg)" value={weight} onChangeText={setWeightInput} keyboardType="numeric" style={{ marginBottom: 12 }} />
      <TextInput
        label="Geburtsdatum (TT.MM.JJJJ)"
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numeric"
        style={{ marginBottom: 12 }}
      />
      <TextInput label="Zielgewicht (kg)" value={goal} onChangeText={setGoal} keyboardType="numeric" style={{ marginBottom: 12 }} />
      <Button mode="contained" onPress={save}>
        Speichern
      </Button>
    </ScrollView>
  );
}
