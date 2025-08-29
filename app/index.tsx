import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getEntries, hasWeight } from '@/lib/storage';
import { formatDate } from '@/lib/date';

export default function Index() {
  const router = useRouter();
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
    });
  const [markedDays, setMarkedDays] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    (async () => {
      const record: Record<string, boolean> = {};
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDate(new Date(year, month, d));
        const e = await getEntries(dateStr);
        const w = await hasWeight(dateStr);
        if (e.length > 0 || w) {
          record[dateStr] = true;
        }
      }
      setMarkedDays(record);
    })();
  }, [currentMonth]);

  function changeMonth(delta: number) {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday start
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const days: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const todayStr = formatDate(new Date());

  return (
    <View
      style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}
    >
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
          const dateStr = d ? formatDate(new Date(year, month, d)) : '';
          const hasData = d && markedDays[dateStr];
          const isToday = d && dateStr === todayStr;
          return (
            <TouchableOpacity
              key={idx}
              style={{ width: `${100 / 7}%`, padding: 4 }}
              onPress={() => {
                if (d) {
                  router.push({ pathname: '/day/[date]', params: { date: dateStr } });
                }
              }}
            >
              <View
                style={{
                  aspectRatio: 1,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: hasData ? 1 : 0,
                  borderColor: theme.colors.primary,
                  backgroundColor: isToday
                    ? theme.colors.primary
                    : undefined,
                }}
              >
                <Text
                  style={{
                    color: isToday
                      ? theme.colors.onPrimary
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
  );
}
