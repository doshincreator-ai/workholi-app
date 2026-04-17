import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>プライバシーポリシー</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>最終更新日：2025年4月1日</Text>

        <Text style={styles.section}>1. 収集する情報</Text>
        <Text style={styles.body}>
          WorkHoli（以下「本アプリ」）は以下の情報を収集します。{'\n\n'}
          【ユーザーが入力する情報】{'\n'}
          ・氏名（表示名）、メールアドレス{'\n'}
          ・シフト情報（日付・時間・給与）{'\n'}
          ・雇用主情報（職場名・時給・地域など）{'\n\n'}
          【自動的に収集される情報】{'\n'}
          ・デバイス情報（OS、モデル）{'\n'}
          ・アプリの使用状況（クラッシュレポートなど）{'\n'}
          ・広告識別子（AdMob による広告配信のため）
        </Text>

        <Text style={styles.section}>2. 情報の利用目的</Text>
        <Text style={styles.body}>
          収集した情報は以下の目的で利用します。{'\n\n'}
          ・シフト・給与管理機能の提供{'\n'}
          ・コミュニティ機能（職場情報の共有）の提供{'\n'}
          ・友達機能の提供{'\n'}
          ・広告の配信（Google AdMob）{'\n'}
          ・アプリの品質改善
        </Text>

        <Text style={styles.section}>3. 情報の共有</Text>
        <Text style={styles.body}>
          本アプリは以下の場合を除き、個人情報を第三者に提供しません。{'\n\n'}
          ・ユーザーが「コミュニティに公開する」を有効にした職場情報（他ユーザーが閲覧可能）{'\n'}
          ・ユーザーが友達登録した相手への表示名・地域情報{'\n'}
          ・法令に基づく開示が必要な場合{'\n\n'}
          広告配信のため、Google AdMob を利用しています。AdMob のプライバシーポリシーについては Google のサイトをご確認ください。
        </Text>

        <Text style={styles.section}>4. データの保存</Text>
        <Text style={styles.body}>
          シフト・雇用主データはお使いのデバイス内（SQLite）に保存されます。{'\n'}
          コミュニティ機能・友達機能に関するデータは Firebase（Google Cloud）に保存されます。{'\n'}
          アカウント削除時、Firebase 上のデータも削除されます。
        </Text>

        <Text style={styles.section}>5. セキュリティ</Text>
        <Text style={styles.body}>
          Firebase Authentication による認証を使用し、各ユーザーは自分のデータのみアクセスできます。通信は HTTPS/TLS で暗号化されています。
        </Text>

        <Text style={styles.section}>6. お問い合わせ</Text>
        <Text style={styles.body}>
          プライバシーに関するお問い合わせは、アプリ内のお問い合わせ機能またはメールにてご連絡ください。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: 20, paddingBottom: 40 },
  updated: { fontSize: 12, color: Colors.textMuted, marginBottom: 20 },
  section: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
});
