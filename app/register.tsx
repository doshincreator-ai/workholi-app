import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Colors } from '../src/constants/colors';
import { Spacing } from '../src/constants/spacing';

export default function RegisterScreen() {
  const { register, loading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  async function handleRegister() {
    if (!name || !email || !password || !confirm) {
      Alert.alert('入力エラー', 'すべての項目を入力してください');
      return;
    }
    if (password !== confirm) {
      Alert.alert('入力エラー', 'パスワードが一致しません');
      return;
    }
    if (password.length < 6) {
      Alert.alert('入力エラー', 'パスワードは6文字以上にしてください');
      return;
    }
    try {
      await register(email.trim(), password, name.trim());
    } catch (e: any) {
      Alert.alert('登録失敗', errorMessage(e.code));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>✈️ WorkHoli</Text>
          <Text style={styles.subtitle}>新規アカウント登録</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>ニックネーム</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="ニックネーム"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>メールアドレス</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>パスワード（6文字以上）</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="パスワード"
            secureTextEntry
          />

          <Text style={[styles.label, { marginTop: 16 }]}>パスワード（確認）</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="パスワードをもう一度"
            secureTextEntry
          />

          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? '登録中...' : 'アカウントを作成'}</Text>
          </Pressable>

          <Pressable style={styles.linkBtn} onPress={() => router.back()}>
            <Text style={styles.linkText}>ログイン画面に戻る</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'このメールアドレスはすでに使用されています';
    case 'auth/invalid-email': return 'メールアドレスの形式が正しくありません';
    case 'auth/weak-password': return 'パスワードが弱すぎます';
    default: return '登録に失敗しました';
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: '800', color: Colors.primary },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 8 },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.padding.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radius.md,
    padding: Spacing.padding.sm,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radius.md,
    padding: Spacing.padding.md,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { backgroundColor: Colors.textMuted },
  btnText: { color: Colors.textInverse, fontSize: 17, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: Colors.primary, fontSize: 14 },
});
