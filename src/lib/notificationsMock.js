// Expo Go 用モック（expo-notifications はSDK53以降Expo Goで動作しない）
export const AndroidImportance = { HIGH: 4, MAX: 5 };
export const SchedulableTriggerInputTypes = { TIME_INTERVAL: 'timeInterval', DATE: 'date' };
export function setNotificationHandler() {}
export function setNotificationChannelAsync() { return Promise.resolve(); }
export function requestPermissionsAsync() { return Promise.resolve({ status: 'denied' }); }
export function scheduleNotificationAsync() { return Promise.resolve(''); }
export function cancelScheduledNotificationAsync() { return Promise.resolve(); }
export function addNotificationReceivedListener() { return { remove: () => {} }; }
export function addNotificationResponseReceivedListener() { return { remove: () => {} }; }
