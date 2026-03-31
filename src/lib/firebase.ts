import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore getReactNativePersistence is available in React Native via Metro's react-native condition
import { getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDqNi6LKwFJctYXsQDed2nXgZQVefRcu0I',
  authDomain: 'kiwilog-b6dea.firebaseapp.com',
  projectId: 'kiwilog-b6dea',
  storageBucket: 'kiwilog-b6dea.firebasestorage.app',
  messagingSenderId: '1073326044129',
  appId: '1:1073326044129:web:59c4e499faa1f154b718a0',
};

export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
