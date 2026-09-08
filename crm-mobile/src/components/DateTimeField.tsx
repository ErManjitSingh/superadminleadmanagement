import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Mode = 'date' | 'time' | 'datetime';

type Props = {
  value: Date;
  onChange: (next: Date) => void;
  mode?: Mode;
  label?: string;
  minimumDate?: Date;
};

export function DateTimeField({
  value,
  onChange,
  mode = 'datetime',
  label,
  minimumDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [androidStep, setAndroidStep] = useState<'date' | 'time'>('date');

  const display =
    mode === 'date'
      ? format(value, 'dd MMM yyyy')
      : mode === 'time'
        ? format(value, 'h:mm a')
        : format(value, 'dd MMM yyyy · h:mm a');

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setOpen(false);
        setAndroidStep('date');
        return;
      }
      if (!selected) return;

      if (mode === 'datetime' && androidStep === 'date') {
        const merged = new Date(value);
        merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        onChange(merged);
        setAndroidStep('time');
        return;
      }

      if (mode === 'datetime' && androidStep === 'time') {
        const merged = new Date(value);
        merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        onChange(merged);
        setOpen(false);
        setAndroidStep('date');
        return;
      }

      onChange(selected);
      setOpen(false);
      return;
    }

    if (selected) onChange(selected);
  };

  const pickerMode =
    Platform.OS === 'android' && mode === 'datetime' ? androidStep : mode === 'datetime' ? 'datetime' : mode;

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Ionicons name="calendar-outline" size={18} color="#7C3AED" />
        <Text style={styles.value}>{display}</Text>
        <Ionicons name="chevron-down" size={16} color="#94A3B8" />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value}
          mode={pickerMode as 'date' | 'time' | 'datetime'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
          minimumDate={minimumDate}
        />
      ) : null}
      {Platform.OS === 'ios' && open ? (
        <Pressable style={styles.done} onPress={() => setOpen(false)}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: '700', color: '#64748B' },
  field: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  value: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },
  done: {
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
