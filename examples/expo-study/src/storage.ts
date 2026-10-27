import AsyncStorage from '@react-native-async-storage/async-storage';
import { createQueuePersistence } from './persistence.ts';

const key = 'folio-study:queue:v1';
export const queuePersistence = createQueuePersistence({
  read: () => AsyncStorage.getItem(key),
  write: value => AsyncStorage.setItem(key, value),
});
