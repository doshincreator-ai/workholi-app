import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyDqNi6LKwFJctYXsQDed2nXgZQVefRcu0I',
  authDomain: 'kiwilog-b6dea.firebaseapp.com',
  projectId: 'kiwilog-b6dea',
  storageBucket: 'kiwilog-b6dea.firebasestorage.app',
  messagingSenderId: '1073326044129',
  appId: '1:1073326044129:web:59c4e499faa1f154b718a0',
};

export const app = initializeApp(firebaseConfig);

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getReactNativePersistence } = require('firebase/auth');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  return initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

export const auth = createAuth();
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
