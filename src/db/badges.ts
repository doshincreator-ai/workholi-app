import { getDb } from './database';

export type BadgeId =
  | 'first_shift'
  | 'hours_50' | 'hours_100' | 'hours_500'
  | 'income_1000' | 'income_5000' | 'income_10000'
  | 'streak_7' | 'streak_30'
  | 'first_friend';

export interface BadgeDef {
  id: BadgeId;
  emoji: string;
  name: string;
  description: string;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_shift',   emoji: '🥚', name: '最初の一歩',     description: '初めてシフトを登録' },
  { id: 'hours_50',      emoji: '⏱️', name: '50時間達成',     description: '累計労働時間50時間' },
  { id: 'hours_100',     emoji: '💪', name: '100時間達成',    description: '累計労働時間100時間' },
  { id: 'hours_500',     emoji: '🏋️', name: '500時間達成',    description: '累計労働時間500時間' },
  { id: 'income_1000',   emoji: '💵', name: '$1,000 突破',    description: '累計収入NZD 1,000' },
  { id: 'income_5000',   emoji: '💎', name: '$5,000 突破',    description: '累計収入NZD 5,000' },
  { id: 'income_10000',  emoji: '🦅', name: '$10,000 突破',   description: '累計収入NZD 10,000' },
  { id: 'streak_7',      emoji: '🔥', name: '7日連続',        description: '7日連続シフト登録' },
  { id: 'streak_30',     emoji: '🌋', name: '30日連続',       description: '30日連続シフト登録' },
  { id: 'first_friend',  emoji: '🤝', name: 'ファースト友達', description: '初めてフレンドを追加' },
];

export interface EarnedBadge {
  id: BadgeId;
  earnedAt: string;
}

export function getAllEarnedBadges(): EarnedBadge[] {
  const db = getDb();
  const rows = db.getAllSync<{ id: string; earned_at: string }>(
    'SELECT id, earned_at FROM badges ORDER BY earned_at ASC',
  );
  return rows.map((r) => ({ id: r.id as BadgeId, earnedAt: r.earned_at }));
}

export function earnBadge(id: BadgeId): boolean {
  const db = getDb();
  const existing = db.getFirstSync<{ id: string }>(
    'SELECT id FROM badges WHERE id = ?', [id],
  );
  if (existing) return false;
  db.runSync(
    'INSERT OR IGNORE INTO badges (id, earned_at) VALUES (?, ?)',
    [id, new Date().toISOString()],
  );
  return true;
}

export function getStreak(shifts: { date: string }[]): number {
  if (shifts.length === 0) return 0;
  const today = new Date();
  const todayStr = localDate(today);
  const dates = new Set(shifts.map((s) => s.date));
  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const key = localDate(cursor);
    if (dates.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  if (!dates.has(todayStr)) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yStr = localDate(yesterday);
    if (dates.has(yStr)) {
      let s = 0;
      const c2 = new Date(yesterday);
      while (true) {
        const k = localDate(c2);
        if (dates.has(k)) { s++; c2.setDate(c2.getDate() - 1); }
        else break;
      }
      return s;
    }
    return 0;
  }
  return streak;
}

function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
