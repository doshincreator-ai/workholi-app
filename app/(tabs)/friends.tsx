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
import { useShiftStore } from '../../src/store/shiftStore';
import { useBadgeStore } from '../../src/store/badgeStore';
import { useSocialStore } from '../../src/store/socialStore';
import { getOrCreateUserProfile } from '../../src/lib/userService';
import { earnBadge } from '../../src/db/badges';
import { getWeekStart } from '../../src/lib/socialService';
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
import { Colors } from '../../src/constants/colors';

type Tab = 'friends' | 'ranking' | 'feed';

function timeAgo(ts: unknown): string {
  if (!ts || typeof (ts as { toDate?: unknown }).toDate !== 'function') return '';
  const d = (ts as { toDate: () => Date }).toDate();
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}時間前`;
  return `${Math.floor(diffH / 24)}日前`;
}

export default function FriendsScreen() {
  const { user } = useAuthStore();
  const { shifts } = useShiftStore();
  const { load: loadBadges } = useBadgeStore();
  const { feed, feedLoading, rankings, rankingsLoading, subscribeFeed, unsubscribeFeed, loadRankings, syncWeeklyStats } = useSocialStore();

  const [activeTab, setActiveTab] = useState<Tab>('friends');
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

  const weekStart = getWeekStart();
  const myWeeklyNetPay = shifts
    .filter((s) => s.date >= weekStart)
    .reduce((sum, s) => sum + s.netPay, 0);

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

  useEffect(() => {
    if (friends.length === 0) return;
    const uids = friends.map((f) => f.uid);
    subscribeFeed(uids);
    return () => unsubscribeFeed();
  }, [friends.length]);

  useEffect(() => {
    if (!user || loading) return;
    syncWeeklyStats(user.uid, myWeeklyNetPay);
  }, [user, loading, myWeeklyNetPay]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === 'ranking' && user && friends.length > 0) {
      loadRankings(user.uid, myName || (user.displayName ?? ''), myWeeklyNetPay, friends);
    }
  }

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
      const isFirst = friends.length === 0 && requests.length === 1;
      if (isFirst) {
        const isNew = earnBadge('first_friend');
        if (isNew) loadBadges();
      }
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
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {shiftsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : friendEmployers.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>公開している勤務先がありません</Text>
                <Text style={styles.emptyHint}>雇用主設定で「友達に公開」をONにすると表示されます</Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                {friendEmployers.map((e, i) => (
                  <View key={i} style={styles.employerItem}>
                    <Ionicons name="business-outline" size={16} color={Colors.primary} />
                    <Text style={styles.employerItemText}>{e.employerName}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>友達</Text>
        <View style={styles.tabBar}>
          {(['friends', 'ranking', 'feed'] as Tab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'friends' ? 'フレンド' : tab === 'ranking' ? 'ランキング' : 'フィード'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── フレンドタブ ── */}
        {activeTab === 'friends' && (
          <>
            {/* 自分の招待コード */}
            <Text style={styles.sectionLabel}>あなたの招待コード</Text>
            <View style={styles.codeCard}>
              {loading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Text style={styles.codeText}>{inviteCode}</Text>
                  <View style={styles.codeActions}>
                    <Pressable style={styles.codeActionBtn} onPress={handleCopyCode}>
                      <Ionicons name="copy-outline" size={16} color={Colors.primary} />
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
                placeholderTextColor={Colors.textMuted}
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
                <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} />
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
                            <Ionicons name="location-outline" size={11} color={Colors.primary} />
                            <Text style={styles.regionBadgeText}>{f.currentRegion}</Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginRight: 4 }} />
                      <Pressable style={styles.removeBtn} onPress={() => handleRemoveFriend(f)}>
                        <Ionicons name="person-remove-outline" size={16} color={Colors.negative} />
                      </Pressable>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* ── ランキングタブ ── */}
        {activeTab === 'ranking' && (
          <>
            <Text style={styles.sectionLabel}>今週の収入ランキング</Text>
            <Text style={styles.hint}>月曜日からの累計手取り額（オプトアウトしたメンバーは非表示）</Text>
            {friends.length === 0 ? (
              <View style={[styles.listCard, styles.emptyCard]}>
                <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>友達を追加するとランキングが表示されます</Text>
                <Pressable style={styles.inviteHintBtn} onPress={() => setActiveTab('friends')}>
                  <Text style={styles.inviteHintText}>招待コードで友達を追加 →</Text>
                </Pressable>
              </View>
            ) : rankingsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
            ) : (
              <View style={styles.listCard}>
                {rankings.map((entry, i) => (
                  <View key={entry.uid}>
                    {i > 0 && <View style={styles.rowSep} />}
                    <View style={[styles.rankRow, entry.isMe && styles.rankRowMe]}>
                      <Text style={[styles.rankNum, i === 0 && styles.rankNumGold]}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                      </Text>
                      <View style={styles.rankInfo}>
                        <Text style={[styles.rankName, entry.isMe && styles.rankNameMe]}>
                          {entry.displayName}{entry.isMe ? '（自分）' : ''}
                        </Text>
                      </View>
                      <Text style={[styles.rankPay, entry.isMe && styles.rankPayMe]}>
                        ${entry.weeklyNetPay.toFixed(0)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── フィードタブ ── */}
        {activeTab === 'feed' && (
          <>
            <Text style={styles.sectionLabel}>フレンドのアクティビティ</Text>
            {friends.length === 0 ? (
              <View style={[styles.listCard, styles.emptyCard]}>
                <Ionicons name="newspaper-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>友達を追加するとフィードが表示されます</Text>
              </View>
            ) : feedLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
            ) : feed.length === 0 ? (
              <View style={[styles.listCard, styles.emptyCard]}>
                <Text style={styles.emptyText}>まだアクティビティがありません</Text>
                <Text style={styles.emptyHint}>友達がシフトを登録するとここに表示されます</Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                {feed.map((item, i) => (
                  <View key={item.id}>
                    {i > 0 && <View style={styles.rowSep} />}
                    <View style={styles.feedRow}>
                      <View style={styles.feedAvatar}>
                        <Text style={styles.feedAvatarText}>{item.displayName?.[0] ?? '?'}</Text>
                      </View>
                      <View style={styles.feedContent}>
                        <Text style={styles.feedText}>
                          {item.type === 'shift'
                            ? `${item.displayName}がシフトを登録`
                            : item.type === 'badge_earned'
                              ? `${item.displayName}が ${item.badgeEmoji} ${item.badgeName} を獲得`
                              : `${item.displayName}が ${item.badgeEmoji} ${item.badgeName} をシェア`
                          }
                        </Text>
                        <Text style={styles.feedTime}>{timeAgo(item.createdAt)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  tabBar: { flexDirection: 'row', gap: 4 },
  tabBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabBtnTextActive: { color: Colors.primary },

  scroll: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 4, marginBottom: 12 },

  codeCard: {
    backgroundColor: Colors.primarySubtle, borderRadius: 14, padding: 16,
    gap: 12, borderWidth: 1, borderColor: Colors.primaryMuted,
  },
  codeText: { fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: 4, textAlign: 'center' },
  codeActions: { flexDirection: 'row', gap: 8 },
  codeActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 10, paddingVertical: 8,
  },
  shareActionBtn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  copyText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  shareText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    fontSize: 16, borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary,
    letterSpacing: 2,
  },
  sendBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 20, justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 15 },

  listCard: {
    backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyCard: { padding: 32, alignItems: 'center', gap: 12 },
  rowSep: { height: 1, backgroundColor: Colors.border },

  requestRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  requestName: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  acceptBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  acceptBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: 13 },

  friendRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  friendAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primarySubtle, alignItems: 'center', justifyContent: 'center',
  },
  friendAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  friendInfo: { flex: 1, gap: 3 },
  friendName: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  regionBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start' },
  regionBadgeText: { fontSize: 11, color: Colors.primary },
  removeBtn: { padding: 6 },

  rankRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rankRowMe: { backgroundColor: Colors.primarySubtle },
  rankNum: { fontSize: 18, width: 30, textAlign: 'center', color: Colors.textSecondary, fontWeight: '700' },
  rankNumGold: { color: Colors.warning },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  rankNameMe: { color: Colors.primary, fontWeight: '700' },
  rankPay: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  rankPayMe: { color: Colors.primary },

  feedRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  feedAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  feedAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  feedContent: { flex: 1 },
  feedText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  feedTime: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  inviteHintBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.primary,
  },
  inviteHintText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  empty: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  emptyHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },

  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { padding: 4 },
  modalScroll: { padding: 16, paddingBottom: 40 },
  employerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  employerItemText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
});
