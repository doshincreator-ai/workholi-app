import { useLocalSearchParams } from 'expo-router';
import { ShiftForm } from '../../../src/components/ShiftForm';

export default function AddShiftScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return <ShiftForm initialDate={date} />;
}
