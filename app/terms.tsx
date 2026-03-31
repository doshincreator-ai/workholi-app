import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#16a34a" />
        </Pressable>
        <Text style={styles.headerTitle}>利用規約</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>最終更新日：2025年4月1日</Text>

        <Text style={styles.section}>1. 利用条件</Text>
        <Text style={styles.body}>
          本アプリ WorkHoli をご利用いただくことで、本利用規約に同意したものとみなされます。同意されない場合は本アプリのご利用をお控えください。
        </Text>

        <Text style={styles.section}>2. サービスの内容</Text>
        <Text style={styles.body}>
          本アプリはワーキングホリデー・就労者向けのシフト・給与管理ツールです。提供する給与計算・税金計算はあくまで参考値であり、正確な税額については各国税務機関またはお勤め先にご確認ください。
        </Text>

        <Text style={styles.section}>3. 禁止事項</Text>
        <Text style={styles.body}>
          以下の行為を禁止します。{'\n\n'}
          ・虚偽・不正確な情報のコミュニティへの投稿{'\n'}
          ・他ユーザーへの嫌がらせ・誹謗中傷{'\n'}
          ・本アプリのリバースエンジニアリング・不正アクセス{'\n'}
          ・スパム・広告目的の利用{'\n'}
          ・法令に違反する行為
        </Text>

        <Text style={styles.section}>4. 免責事項</Text>
        <Text style={styles.body}>
          本アプリが提供する給与計算・税金計算・還付金シミュレーターは参考情報であり、正確性を保証するものではありません。本アプリの利用により生じた損害について、開発者は一切の責任を負いません。
        </Text>

        <Text style={styles.section}>5. サービスの変更・終了</Text>
        <Text style={styles.body}>
          開発者はいつでも予告なくサービスの内容を変更・終了できるものとします。
        </Text>

        <Text style={styles.section}>6. 準拠法</Text>
        <Text style={styles.body}>
          本規約は日本法に準拠します。
        </Text>

        <Text style={styles.section}>7. お問い合わせ</Text>
        <Text style={styles.body}>
          本規約に関するお問い合わせは、アプリ内のお問い合わせ機能またはメールにてご連絡ください。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 20, paddingBottom: 40 },
  updated: { fontSize: 12, color: '#9ca3af', marginBottom: 20 },
  section: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
