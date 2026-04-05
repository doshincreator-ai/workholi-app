import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getOrCreateUserProfile } from '../../src/lib/userService';
import {
  findUserByInviteCode,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  getFriends,
  removeFriend,
  getFriendEmployers,
  type FriendRequest,
  type Friend,
  type FriendEmployer,
  type SendRequestResult,
} from '../../src/lib/friendService';

export default function FriendsScreen() {
  const { user } = useAuthStore();
  const [inviteCode, setInviteCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myName, setMyName] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendEmployers, setFriendEmployers] = useState<FriendEmployer[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profile = await getOrCreateUserProfile(user.uid, user.displayName ?? '');
      setInviteCode(profile.inviteCode);
      setMyName(profile.displayName);
      const [f, r] = await Promise.all([
        getFriends(user.uid),
        getPendingRequests(user.uid),
      ]);
      setFriends(f);
      setRequests(r);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleCopyCode() {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('コピーしました', `招待コード: ${inviteCode}`);
  }

  async function handleShareCode() {
    await Share.share({
      message: `WorkHoliで一緒に給与管理しよう！\n招待コード: ${inviteCode}\nhttps://play.google.com/store/apps/details?id=com.workholiday.app`,
    });
  }

  async function handleSendRequest() {
    const code = inputCode.trim().toUpperCase();
    if (!code) return;
    setSending(true);
    try {
      const target = await findUserByInviteCode(code);
      if (!target) {
        Alert.alert('見つかりません', 'そのコードのユーザーは存在しません');
        return;
      }
      if (target.uid === user!.uid) {
        Alert.alert('エラー', '自分自身には申請できません');
        return;
      }
      const result: SendRequestResult = await sendFriendRequest(user!.uid, myName, target.uid);
      if (result === 'already_friends') {
        Alert.alert('すでに友達です', `${target.displayName}さんとはすでに友達です`);
      } else if (result === 'already_requested') {
        Alert.alert('申請済みです', `${target.displayName}さんにはすでに申請を送っています`);
      } else {
        Alert.alert('申請しました', `${target.displayName}さんに友達申請を送りました`);
        setInputCode('');
      }
    } catch {
      Alert.alert('エラー', '申請に失敗しました');
    } finally {
      setSending(false);
    }
  }

  async function handleViewShifts(friend: Friend) {
    setSelectedFriend(friend);
    setShiftsLoading(true);
    setFriendEmployers([]);
    try {
      const employers = await getFriendEmployers(friend.uid);
      setFriendEmployers(employers);
    } catch {
      Alert.alert('エラー', '勤務履歴の取得に失敗しました');
    } finally {
      setShiftsLoading(false);
    }
  }

  async function handleRemoveFriend(friend: Friend) {
    Alert.alert(
      '友達を削除',
      `${friend.displayName}さんを友達から削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive', onPress: async () => {
            try {
              await removeFriend(friend.id);
              setFriends((prev) => prev.filter((f) => f.id !== friend.id));
            } catch {
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ],
    );
  }

  async function handleAccept(req: FriendRequest) {
    try {
      await acceptFriendRequest(req.id, req.fromUid, user!.uid, req.fromName, myName);
      Alert.alert('承認しました', `${req.fromName}さんと友達になりました`);
      load();
    } catch {
      Alert.alert('エラー', '承認に失敗しました');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 友達のシフトモーダル */}
      <Modal
        visible={selectedFriend !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedFriend(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedFriend?.displayName}さんのシフト</Text>
            <Pressable onPress={() => setSelectedFriend(null)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {shiftsLoading ? (
              <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
            ) : friendEmployers.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>公開している勤務先がありません</Text>
                <Text style={styles.emptyHint}>雇用主設定で「友達に公開」をONにすると表示されます</Text>
              </View>
            ) : (
              <View style={styles.employerList}>
                {friendEmployers.map((e, i) => (
                  <View key={i} style={styles.employerItem}>
                    <Ionicons name="business-outline" size={16} color="#16a34a" />
                    <Text style={styles.employerItemText}>{e.employerName}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>友達</Text>

        {/* 自分の招待コード */}
        <Text style={styles.sectionLabel}>あなたの招待コード</Text>
        <View style={styles.codeCard}>
          {loading ? (
            <ActivityIndicator color="#16a34a" />
          ) : (
            <>
              <Text style={styles.codeText}>{inviteCode}</Text>
              <View style={styles.codeActions}>
                <Pressable style={styles.codeActionBtn} onPress={handleCopyCode}>
                  <Ionicons name="copy-outline" size={16} color="#16a34a" />
                  <Text style={styles.copyText}>コピー</Text>
                </Pressable>
                <Pressable style={[styles.codeActionBtn, styles.shareActionBtn]} onPress={handleShareCode}>
                  <Ionicons name="share-outline" size={16} color="#fff" />
                  <Text style={styles.shareText}>シェア</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
        <Text style={styles.hint}>このコードを友達に教えてください</Text>

        {/* 友達追加 */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>友達を追加</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputCode}
            onChangeText={setInputCode}
            placeholder="友達の招待コードを入力"
            autoCapitalize="characters"
            maxLength={8}
          />
          <Pressable
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={handleSendRequest}
            disabled={sending}
          >
            <Text style={styles.sendBtnText}>{sending ? '送信中' : '申請'}</Text>
          </Pressable>
        </View>

        {/* 受信した申請 */}
        {requests.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
              友達申請 ({requests.length})
            </Text>
            <View style={styles.listCard}>
              {requests.map((req, i) => (
                <View key={req.id}>
                  {i > 0 && <View style={styles.rowSep} />}
                  <View style={styles.requestRow}>
                    <Text style={styles.requestName}>{req.fromName}</Text>
                    <Pressable style={styles.acceptBtn} onPress={() => handleAccept(req)}>
                      <Text style={styles.acceptBtnText}>承認</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 友達一覧 */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
          友達一覧 ({friends.length})
        </Text>
        <View style={styles.listCard}>
          {loading ? (
            <ActivityIndicator color="#16a34a" style={{ padding: 16 }} />
          ) : friends.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>まだ友達がいません</Text>
              <Text style={styles.emptyHint}>招待コードで友達を追加しましょう</Text>
            </View>
          ) : (
            friends.map((f, i) => (
              <View key={f.uid}>
                {i > 0 && <View style={styles.rowSep} />}
                <Pressable style={styles.friendRow} onPress={() => handleViewShifts(f)}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{f.displayName?.[0] ?? '?'}</Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{f.displayName}</Text>
                    {f.currentRegion && (
                      <View style={styles.regionBadge}>
                        <Ionicons name="location-outline" size={11} color="#2563eb" />
                        <Text style={styles.regionBadgeText}>{f.currentRegion}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#d1d5db" style={{ marginRight: 4 }} />
                  <Pressable style={styles.removeBtn} onPress={() => handleRemoveFriend(f)}>
                    <Ionicons name="person-remove-outline" size={16} color="#ef4444" />
                  </Pressable>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 6 },

  codeCard: {
    backgroundColor: '#f0fdf4', borderRadius: 14, padding: 16,
    gap: 12, borderWidth: 1, borderColor: '#bbf7d0',
  },
  codeText: { fontSize: 28, fontWeight: '800', color: '#16a34a', letterSpacing: 4, textAlign: 'center' },
  codeActions: { flexDirection: 'row', gap: 8 },
  codeActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: '#16a34a', borderRadius: 10, paddingVertical: 8,
  },
  shareActionBtn: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  copyText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  shareText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
    fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827',
    letterSpacing: 2,
  },
  sendBtn: {
    backgroundColor: '#16a34a', borderRadius: 12,
    paddingHorizontal: 20, justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#d1d5db' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  listCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  rowSep: { height: 1, backgroundColor: '#f3f4f6' },
  requestRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  requestName: { fontSize: 15, color: '#111827', fontWeight: '500' },
  acceptBtn: {
    backgroundColor: '#16a34a', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  acceptBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  friendRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  friendAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center',
  },
  friendAvatarText: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
  friendInfo: { flex: 1, gap: 3 },
  friendName: { fontSize: 15, color: '#111827', fontWeight: '500' },
  regionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    alignSelf: 'flex-start',
  },
  regionBadgeText: { fontSize: 11, color: '#2563eb' },
  removeBtn: { padding: 6 },

  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalClose: { padding: 4 },
  modalScroll: { padding: 16, paddingBottom: 40 },
  employerList: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden',
  },
  employerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  employerItemText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#9ca3af', marginBottom: 4 },
  emptyHint: { fontSize: 13, color: '#d1d5db' },
});
