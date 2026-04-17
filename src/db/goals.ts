import { getDb } from './database';

interface GoalRow {
  id: number;
  name: string;
  emoji: string;
  target_amount: number;
  country: string;
  created_at: string;
}

export interface Goal {
  id: number;
  name: string;
  emoji: string;
  targetAmount: number;
  country: string;
  createdAt: string;
}

function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    targetAmount: row.target_amount,
    country: row.country,
    createdAt: row.created_at,
  };
}

export function getAllGoals(): Goal[] {
  const db = getDb();
  const rows = db.getAllSync<GoalRow>('SELECT * FROM goals ORDER BY created_at ASC');
  return rows.map(rowToGoal);
}

export function insertGoal(data: {
  name: string;
  emoji: string;
  targetAmount: number;
  country: string;
}): Goal {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO goals (name, emoji, target_amount, country, created_at) VALUES (?, ?, ?, ?, ?)',
    [data.name, data.emoji, data.targetAmount, data.country, now],
  );
  return {
    id: result.lastInsertRowId,
    name: data.name,
    emoji: data.emoji,
    targetAmount: data.targetAmount,
    country: data.country,
    createdAt: now,
  };
}

export function deleteGoal(id: number): void {
  const db = getDb();
  db.runSync('DELETE FROM goals WHERE id = ?', [id]);
}
