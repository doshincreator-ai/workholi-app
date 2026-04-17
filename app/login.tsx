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
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../src/lib/firebase';
import { useAuthStore } from '../src/store/authStore';
import { Colors } from '../src/constants/colors';

export default function LoginScreen() {
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handlePasswordReset() {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('メールアドレスを入力', 'リセットメールを送るメールアドレスを入力してください');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, trimmed);
      Alert.alert('送信しました', `${trimmed} にパスワードリセットメールを送りました`);
    } catch {
      Alert.alert('エラー', 'メールの送信に失敗しました。メールアドレスを確認してください');
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert('ログイン失敗', errorMessage(e.code));
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
          <Text style={styles.subtitle}>ワーホリの勤務記録・情報共有アプリ</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>メールアドレス</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>パスワード</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="パスワード"
            secureTextEntry
          />

          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'ログイン中...' : 'ログイン'}</Text>
          </Pressable>

          <Pressable style={styles.linkBtn} onPress={handlePasswordReset}>
            <Text style={styles.linkTextSub}>パスワードを忘れた方</Text>
          </Pressable>

          <Pressable style={styles.linkBtn} onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>アカウントをお持ちでない方は新規登録</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'メールアドレスの形式が正しくありません';
    case 'auth/user-not-found': return 'このメールアドレスは登録されていません';
    case 'auth/wrong-password': return 'パスワードが間違っています';
    case 'auth/invalid-credential': return 'メールアドレスまたはパスワードが間違っています';
    case 'auth/too-many-requests': return 'しばらくしてから再試行してください';
    default: return 'ログインに失敗しました';
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: '800', color: Colors.primary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { backgroundColor: Colors.textMuted },
  btnText: { color: Colors.textInverse, fontSize: 17, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: Colors.primary, fontSize: 14 },
  linkTextSub: { color: Colors.textMuted, fontSize: 13 },
});
