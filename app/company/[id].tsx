import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { useAuthStore } from '../../src/store/authStore';
import { getOrCreateUserProfile, unlockCompany } from '../../src/lib/userService';
import { getFriends } from '../../src/lib/friendService';
import { getComments, addComment, deleteComment, type Comment } from '../../src/lib/commentService';
import { useShiftStore } from '../../src/store/shiftStore';
import type { CompanyDoc } from '../../src/lib/firestoreService';
import { addTicket } from '../../src/lib/userService';
import { RewardedAdButton } from '../../src/components/RewardedAdButton';

const PAY_METHOD_LABEL: Record<string, string> = {
  bank: '銀行振込', cash: '現金', other: 'その他',
};

const ENGLISH_LEVEL_LABEL: Record<string, string> = {
  none: '不要', basic: '日常会話', business: 'ビジネス',
};

const VISA_LABEL: Record<string, string> = {
  WHV: 'ワーホリ', Student: '学生ビザ', Work: 'ワークビザ', Other: 'その他',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'ラク', normal: '普通', hard: 'きつい',
};

function timeAgo(timestamp: any): string | null {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'たった今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}日前`;
  if (diff < 86400 * 365) return `${Math.floor(diff / (86400 * 30))}ヶ月前`;
  return `${Math.floor(diff / (86400 * 365))}年前`;
}

function formatDate(timestamp: any): string | null {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

export default function CompanyDetailScreen() {
  const { id, country = 'NZ' } = useLocalSearchParams<{ id: string; country: string }>();
  const { user } = useAuthStore();
  const localShifts = useShiftStore((s) => s.shifts);
  const [company, setCompany] = useState<CompanyDoc | null>(null);
  const [tickets, setTickets] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockedByFriend, setUnlockedByFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    loadData();
  }, [user, id]);

  async function loadData() {
    setLoading(true);
    try {
      const companySnap = await getDoc(doc(db, 'countries', country, 'companies', id));
      if (!companySnap.exists()) { setLoading(false); return; }
      const companyData = { companyId: companySnap.id, ...companySnap.data() } as CompanyDoc;
      setCompany(companyData);

      const [profile, friends, fetchedComments] = await Promise.all([
        getOrCreateUserProfile(user!.uid, user!.displayName ?? ''),
        getFriends(user!.uid).catch(() => [] as import('../../src/lib/friendService').Friend[]),
        getComments(id).catch(() => [] as import('../../src/lib/commentService').Comment[]),
      ]);
      setTickets(profile.tickets ?? 0);
      const unlockedList: string[] = (profile as any)?.unlockedCompanies ?? [];
      setUnlocked(unlockedList.includes(id));
      setComments(fetchedComments);

      // 友達が勤務実績を持つ企業はチケット不要
      const friendUids = new Set(friends.map((f) => f.uid));
      const workerUids: string[] = companyData.workerUids ?? [];
      if (workerUids.some((uid) => friendUids.has(uid))) {
        setUnlockedByFriend(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAdRewarded() {
    if (!user) return;
    await addTicket(user.uid).catch(() => {});
    setTickets((t) => t + 1);
    Alert.alert('チケット獲得！', '広告視聴でチケットを1枚獲得しました 🎟');
  }

  async function handleUnlock() {
    if (tickets <= 0) {
      Alert.alert('チケット不足', 'チケットが残っていません。\nシフトを共有するとチケットがもらえます。');
      return;
    }
    Alert.alert(
      `チケットを使う（残り${tickets}枚）`,
      `「${company?.name}」の詳細情報（時給・英語力・ビザ情報など）を解除しますか？\n一度解除すると以降は無料で閲覧できます。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除する',
          onPress: async () => {
            setUnlocking(true);
            const ok = await unlockCompany(user!.uid, id);
            if (ok) {
              setUnlocked(true);
              setTickets((t) => t - 1);
            } else {
              Alert.alert('失敗', 'チケットの使用に失敗しました');
            }
            setUnlocking(false);
          },
        },
      ],
    );
  }

  // この企業で働いた実績があるか（ローカルシフトで確認）
  const workedHere = useMemo(
    () => company ? localShifts.some((s) => s.employerName === company.name) : false,
    [localShifts, company],
  );
  const canComment = unlocked || unlockedByFriend || workedHere;

  async function handleAddComment() {
    if (!commentText.trim()) return;
    if (!user || !company) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(
        company.companyId,
        company.country,
        user.uid,
        user.displayName ?? user.email ?? '匿名',
        commentText.trim(),
        commentRating,
        workedHere,
      );
      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
      setCommentRating(0);
    } catch {
      Alert.alert('エラー', 'コメントの投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    Alert.alert('削除', 'このコメントを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive', onPress: async () => {
          await deleteComment(commentId, company!.companyId, company!.country).catch(() => {});
          setComments((prev) => prev.filter((c) => c.id !== commentId));
        },
      },
    ]);
  }

  const ratedComments = useMemo(() => comments.filter((c) => c.rating > 0), [comments]);
  const avgRating = ratedComments.length > 0
    ? ratedComments.reduce((s, c) => s + c.rating, 0) / ratedComments.length
    : 0;
  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    ratedComments.forEach((c) => { if (c.rating >= 1 && c.rating <= 5) dist[c.rating - 1]++; });
    return dist.reverse(); // 5→1
  }, [ratedComments]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>
      </SafeAreaView>
    );
  }

  if (!company) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><Text style={styles.emptyText}>企業情報が見つかりません</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 戻るボタン */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#16a34a" />
          <Text style={styles.backText}>戻る</Text>
        </Pressable>

        {/* ヘッダー */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>{company.name}</Text>
          <View style={styles.badgeRow}>
            {company.region && (
              <View style={styles.badge}>
                <Ionicons name="location-outline" size={13} color="#2563eb" />
                <Text style={[styles.badgeText, { color: '#2563eb' }]}> {company.region}</Text>
              </View>
            )}
            {(company.workerCount ?? 0) > 0 && (
              <View style={styles.badge}>
                <Ionicons name="people-outline" size={13} color="#16a34a" />
                <Text style={styles.badgeText}> {company.workerCount}人が勤務済み</Text>
              </View>
            )}
            {avgRating > 0 && (
              <View style={styles.badge}>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.badgeText}> {avgRating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 公開情報 */}
        <Text style={styles.sectionTitle}>公開情報</Text>
        <View style={styles.card}>
          {company.jobCategory && (
            <>
              <InfoRow label="業種" value={company.jobCategory} />
              <View style={styles.rowSep} />
            </>
          )}
          <InfoRow
            label="勤務実績"
            value={`${company.workerCount ?? 0}人が経験あり`}
          />
          {avgRating > 0 && (
            <>
              <View style={styles.rowSep} />
              <InfoRow label="平均評価" value={`★ ${avgRating.toFixed(1)} / 5`} />
              <View style={styles.rowSep} />
              <View style={styles.ratingDistRow}>
                {[5, 4, 3, 2, 1].map((star, i) => {
                  const count = ratingDist[i];
                  const pct = ratedComments.length > 0 ? count / ratedComments.length : 0;
                  return (
                    <View key={star} style={styles.ratingBarRow}>
                      <Text style={styles.ratingBarLabel}>★{star}</Text>
                      <View style={styles.ratingBarTrack}>
                        <View style={[styles.ratingBarFill, { width: `${pct * 100}%` }]} />
                      </View>
                      <Text style={styles.ratingBarCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
          {company.isHiring && (
            <>
              <View style={styles.rowSep} />
              <InfoRow label="募集状況" value="🟢 現在募集中" />
            </>
          )}
          {company.hasInterview != null && (
            <>
              <View style={styles.rowSep} />
              <InfoRow label="面接" value={company.hasInterview ? 'あり' : 'なし'} />
            </>
          )}
          {company.difficulty && (
            <>
              <View style={styles.rowSep} />
              <InfoRow label="難易度" value={DIFFICULTY_LABEL[company.difficulty] ?? company.difficulty} />
            </>
          )}
          {company.createdAt && (
            <>
              <View style={styles.rowSep} />
              <InfoRow label="公開日" value={formatDate(company.createdAt) ?? ''} />
            </>
          )}
          {company.updatedAt && (
            <>
              <View style={styles.rowSep} />
              <InfoRow label="最終更新" value={`${timeAgo(company.updatedAt)}`} />
            </>
          )}
          {company.jobDescription && (
            <>
              <View style={styles.rowSep} />
              <View style={styles.descRow}>
                <Text style={styles.infoLabel}>仕事内容</Text>
                <Text style={styles.descText}>{company.jobDescription}</Text>
              </View>
            </>
          )}
          {company.publicMemo && (
            <>
              <View style={styles.rowSep} />
              <View style={styles.descRow}>
                <Text style={styles.infoLabel}>メモ</Text>
                <Text style={styles.descText}>{company.publicMemo}</Text>
              </View>
            </>
          )}
        </View>

        {/* 詳細情報（ロック/アンロック） */}
        <Text style={styles.sectionTitle}>詳細情報</Text>
        {(unlocked || unlockedByFriend) ? (
          // ── アンロック済み ──
          <>
          {unlockedByFriend && (
            <View style={styles.friendBadge}>
              <Ionicons name="people" size={14} color="#2563eb" />
              <Text style={styles.friendBadgeText}> 友達が公開した企業のため無料で閲覧中</Text>
            </View>
          )}
          <View style={styles.card}>
            {company.hourlyRate != null && (
              <>
                <InfoRow label="時給" value={`$${company.hourlyRate.toFixed(2)}/h`} />
                <View style={styles.rowSep} />
              </>
            )}
            {company.paymentMethod && (
              <>
                <InfoRow label="支払方法" value={PAY_METHOD_LABEL[company.paymentMethod] ?? company.paymentMethod} />
                <View style={styles.rowSep} />
              </>
            )}
            {(company.typicalStartTime && company.typicalEndTime) && (
              <>
                <InfoRow label="典型的な勤務時間" value={`${company.typicalStartTime} – ${company.typicalEndTime}`} />
                <View style={styles.rowSep} />
              </>
            )}
            {company.englishLevel && (
              <>
                <InfoRow label="英語力" value={ENGLISH_LEVEL_LABEL[company.englishLevel] ?? company.englishLevel} />
                <View style={styles.rowSep} />
              </>
            )}
            {company.visaTypes && (
              <>
                <View style={styles.rowSep} />
                <InfoRow
                  label="対応ビザ"
                  value={company.visaTypes.split(',').map((v) => VISA_LABEL[v] ?? v).join(' / ')}
                />
              </>
            )}
            {company.address && (
              <>
                <View style={styles.rowSep} />
                <Pressable
                  style={styles.descRow}
                  onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(company.address!)}`)}
                >
                  <Text style={styles.infoLabel}>住所</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 4 }}>
                    <Text style={[styles.descText, { flex: 1, textAlign: 'right' }]}>{company.address}</Text>
                    <Ionicons name="map-outline" size={14} color="#2563eb" />
                  </View>
                </Pressable>
              </>
            )}
            {company.contactInfo && (
              <>
                <View style={styles.rowSep} />
                <View style={styles.descRow}>
                  <Text style={styles.infoLabel}>連絡先</Text>
                  <Text style={styles.descText}>{company.contactInfo}</Text>
                </View>
              </>
            )}
          </View>

          {/* コメントセクション */}
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>コメント</Text>

          {/* コメント一覧 */}
          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>まだコメントがありません</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {comments.map((c, i) => (
                <View key={c.id}>
                  {i > 0 && <View style={styles.rowSep} />}
                  <View style={styles.commentRow}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentName}>{c.displayName}</Text>
                      {c.isWorkedHere && (
                        <View style={styles.workedBadge}>
                          <Text style={styles.workedBadgeText}>勤務実績あり</Text>
                        </View>
                      )}
                      {c.rating > 0 && (
                        <Text style={styles.commentRating}>
                          {'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}
                        </Text>
                      )}
                      {c.userId === user?.uid && (
                        <Pressable onPress={() => handleDeleteComment(c.id)} style={styles.deleteCommentBtn}>
                          <Ionicons name="trash-outline" size={14} color="#ef4444" />
                        </Pressable>
                      )}
                    </View>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* コメント入力 */}
          {canComment ? (
            <View style={styles.commentInputCard}>
              <Text style={styles.commentInputTitle}>コメントを書く</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setCommentRating(commentRating === star ? 0 : star)}>
                    <Text style={[styles.star, star <= commentRating && styles.starActive]}>★</Text>
                  </Pressable>
                ))}
                {commentRating > 0 && <Text style={styles.ratingHint}>{commentRating}/5</Text>}
              </View>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="職場の雰囲気・仕事内容・注意点など..."
                multiline
                numberOfLines={3}
              />
              <Pressable
                style={[styles.commentSubmitBtn, (!commentText.trim() || submitting) && styles.commentSubmitBtnDisabled]}
                onPress={handleAddComment}
                disabled={!commentText.trim() || submitting}
              >
                <Text style={styles.commentSubmitText}>{submitting ? '投稿中...' : '投稿する'}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.commentLocked}>
              <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" />
              <Text style={styles.commentLockedText}>
                チケットで解除するとコメントできます
              </Text>
            </View>
          )}
          </>
        ) : (
          // ── ロック中（ブラープレビュー + 解除CTA） ──
          <View style={styles.lockWrapper}>
            {/* プレビュー（ぼかし演出） */}
            <View style={styles.previewCard} pointerEvents="none">
              {[...Array(3)].map((_, i) => (
                <View key={i}>
                  {i > 0 && <View style={styles.rowSep} />}
                  <View style={styles.shiftRow}>
                    <View style={styles.shiftLeft}>
                      <View style={[styles.blurLine, { width: 80 }]} />
                      <View style={[styles.blurLine, { width: 100, marginTop: 6 }]} />
                      <View style={[styles.blurLine, { width: 60, marginTop: 6 }]} />
                    </View>
                    <View style={styles.shiftRight}>
                      <View style={[styles.blurLine, { width: 70 }]} />
                      <View style={[styles.blurLine, { width: 90, marginTop: 8 }]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* オーバーレイ */}
            <View style={styles.lockOverlay}>
              <View style={styles.lockIconWrap}>
                <Ionicons name="lock-closed" size={28} color="#fff" />
              </View>
              <Text style={styles.lockTitle}>詳細情報はロック中</Text>
              <Text style={styles.lockDesc}>
                給与・勤務時間・評価の詳細を{'\n'}チケット1枚で解除できます
              </Text>
              <View style={styles.ticketBadge}>
                <Ionicons name="ticket-outline" size={15} color="#16a34a" />
                <Text style={styles.ticketBadgeText}> 残り {tickets}枚</Text>
              </View>
              <Pressable
                style={[styles.unlockBtn, (tickets <= 0 || unlocking) && styles.unlockBtnDisabled]}
                onPress={handleUnlock}
                disabled={tickets <= 0 || unlocking}
              >
                <Ionicons name="lock-open-outline" size={18} color="#fff" />
                <Text style={styles.unlockBtnText}>
                  {unlocking ? '処理中...' : 'チケットを使って解除'}
                </Text>
              </Pressable>
              {tickets <= 0 && (
                <>
                  <Text style={styles.noTicketHint}>
                    雇用主を公開するとチケットがもらえます
                  </Text>
                  <RewardedAdButton onRewarded={handleAdRewarded} />
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { color: '#16a34a', fontSize: 15 },

  companyHeader: { marginBottom: 20 },
  companyName: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0fdf4', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  starIcon: { color: '#fbbf24', fontSize: 13 },

  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#9ca3af',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, textAlign: 'right' },
  descRow: { padding: 14, gap: 6 },
  descText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  rowSep: { height: 1, backgroundColor: '#f3f4f6' },

  // 評価分布
  ratingDistRow: { padding: 14, gap: 6 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBarLabel: { fontSize: 12, color: '#6b7280', width: 24 },
  ratingBarTrack: { flex: 1, height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  ratingBarFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 4 },
  ratingBarCount: { fontSize: 12, color: '#9ca3af', width: 20, textAlign: 'right' },

  // シフト行
  shiftRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  shiftLeft: { flex: 1 },
  shiftDate: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  shiftTime: { fontSize: 14, color: '#374151', marginBottom: 4 },
  shiftTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  holidayBadge: { backgroundColor: '#dcfce7', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  holidayBadgeText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  payMethod: { fontSize: 12, color: '#9ca3af' },
  shiftRight: { alignItems: 'flex-end', gap: 4 },
  rating: { fontSize: 12, color: '#fbbf24' },
  shiftRate: { fontSize: 12, color: '#6b7280' },
  shiftNet: { fontSize: 16, fontWeight: '700', color: '#16a34a' },

  // ロック
  lockWrapper: { marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  previewCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#e5e7eb',
    opacity: 0.35,
  },
  blurLine: { height: 12, backgroundColor: '#d1d5db', borderRadius: 6 },
  lockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 10,
    borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb',
  },
  lockIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#374151',
    alignItems: 'center', justifyContent: 'center',
  },
  lockTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  lockDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  ticketBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0fdf4', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  ticketBadgeText: { fontSize: 14, color: '#16a34a', fontWeight: '700' },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#16a34a', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  unlockBtnDisabled: { backgroundColor: '#d1d5db' },
  unlockBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  noTicketHint: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },

  emptyText: { color: '#9ca3af', textAlign: 'center', padding: 16 },
  // コメント
  emptyComments: {
    backgroundColor: '#fff', borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12,
  },
  emptyCommentsText: { color: '#9ca3af', fontSize: 14 },
  commentRow: { padding: 14 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  commentName: { fontSize: 13, fontWeight: '700', color: '#374151' },
  workedBadge: {
    backgroundColor: '#f0fdf4', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  workedBadgeText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  commentRating: { fontSize: 12, color: '#fbbf24' },
  deleteCommentBtn: { marginLeft: 'auto' as any },
  commentText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  commentInputCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12, gap: 12,
  },
  commentInputTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { fontSize: 28, color: '#e5e7eb' },
  starActive: { color: '#fbbf24' },
  ratingHint: { fontSize: 13, color: '#6b7280', marginLeft: 4 },
  commentInput: {
    backgroundColor: '#f9fafb', borderRadius: 10, padding: 12,
    fontSize: 14, borderWidth: 1, borderColor: '#e5e7eb',
    color: '#111827', minHeight: 80, textAlignVertical: 'top',
  },
  commentSubmitBtn: {
    backgroundColor: '#16a34a', borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  commentSubmitBtnDisabled: { backgroundColor: '#d1d5db' },
  commentSubmitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  commentLocked: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f9fafb', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12,
  },
  commentLockedText: { fontSize: 13, color: '#9ca3af' },

  friendBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eff6ff', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 10,
  },
  friendBadgeText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
});
