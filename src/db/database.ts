import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('kiwilog.db');
  }
  return db;
}

export function clearAllUserData(): void {
  const database = getDb();
  database.execSync(`
    DELETE FROM shifts;
    DELETE FROM employers;
  `);
}

export function initDatabase(): void {
  const db = getDb();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hourly_rate REAL NOT NULL,
      tax_code TEXT NOT NULL DEFAULT 'M',
      ird_number TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      break_minutes INTEGER NOT NULL DEFAULT 0,
      is_public_holiday INTEGER NOT NULL DEFAULT 0,
      is_shared INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'bank',
      rating INTEGER NOT NULL DEFAULT 0,
      memo TEXT NOT NULL DEFAULT '',
      hourly_rate REAL NOT NULL,
      gross_pay REAL NOT NULL,
      tax_amount REAL NOT NULL,
      acc_levy REAL NOT NULL,
      student_loan_deduction REAL NOT NULL DEFAULT 0,
      net_pay REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (employer_id) REFERENCES employers(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🎯',
      target_amount REAL NOT NULL,
      country TEXT NOT NULL DEFAULT 'NZ',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      earned_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('nzd_jpy_rate', '90');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('aud_jpy_rate', '95');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('use_student_loan', 'false');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('student_loan_rate', '0.12');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('current_country', 'NZ');
  `);

  // マイグレーション: 新カラムが存在しない場合に追加
  const migrations = [
    `ALTER TABLE shifts ADD COLUMN is_shared INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE shifts ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'bank'`,
    `ALTER TABLE shifts ADD COLUMN rating INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE shifts ADD COLUMN memo TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE shifts ADD COLUMN student_loan_deduction REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE employers ADD COLUMN default_start_time TEXT`,
    `ALTER TABLE employers ADD COLUMN default_end_time TEXT`,
    `ALTER TABLE employers ADD COLUMN default_break_minutes INTEGER`,
    `ALTER TABLE shifts ADD COLUMN reminder_minutes INTEGER NOT NULL DEFAULT -1`,
    `ALTER TABLE shifts ADD COLUMN notification_id TEXT`,
    `ALTER TABLE employers ADD COLUMN region TEXT`,
    `ALTER TABLE shifts ADD COLUMN holiday_pay_included INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE shifts ADD COLUMN holiday_pay_separate INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE shifts ADD COLUMN holiday_pay_amount REAL`,
    `ALTER TABLE employers ADD COLUMN is_shared INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE employers ADD COLUMN payment_method TEXT`,
    `ALTER TABLE employers ADD COLUMN job_category TEXT`,
    `ALTER TABLE employers ADD COLUMN job_description TEXT`,
    `ALTER TABLE employers ADD COLUMN english_level TEXT`,
    `ALTER TABLE employers ADD COLUMN visa_types TEXT`,
    `ALTER TABLE employers ADD COLUMN shared_at TEXT`,
    `ALTER TABLE employers ADD COLUMN public_memo TEXT`,
    `ALTER TABLE employers ADD COLUMN firestore_id TEXT`,
    `ALTER TABLE employers ADD COLUMN review_shared_at TEXT`,
    `ALTER TABLE shifts ADD COLUMN is_holiday_rest INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE employers ADD COLUMN country TEXT NOT NULL DEFAULT 'NZ'`,
    `ALTER TABLE shifts ADD COLUMN country TEXT NOT NULL DEFAULT 'NZ'`,
    `ALTER TABLE employers ADD COLUMN friends_visible INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE employers ADD COLUMN holiday_pay_included INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE employers ADD COLUMN holiday_pay_separate INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE employers ADD COLUMN night_shift_start TEXT`,
    `ALTER TABLE employers ADD COLUMN night_shift_bonus REAL`,
    `ALTER TABLE employers ADD COLUMN overtime_threshold REAL`,
    `ALTER TABLE employers ADD COLUMN overtime_multiplier REAL`,
    `ALTER TABLE shifts ADD COLUMN night_shift_allowance REAL`,
    `ALTER TABLE shifts ADD COLUMN overtime_allowance REAL`,
    `ALTER TABLE shifts ADD COLUMN firestore_id TEXT`,
    `ALTER TABLE employers ADD COLUMN has_interview INTEGER`,
    `ALTER TABLE employers ADD COLUMN difficulty TEXT`,
    `ALTER TABLE employers ADD COLUMN is_hiring INTEGER`,
    `ALTER TABLE employers ADD COLUMN address TEXT`,
    `ALTER TABLE employers ADD COLUMN contact_info TEXT`,
    `ALTER TABLE employers ADD COLUMN detail_shared_at TEXT`,
    `ALTER TABLE employers ADD COLUMN payday_type TEXT NOT NULL DEFAULT 'none'`,
    `ALTER TABLE employers ADD COLUMN payday_day INTEGER NOT NULL DEFAULT 5`,
    `ALTER TABLE settings ADD COLUMN value TEXT NOT NULL DEFAULT ''`,
  ];
  for (const sql of migrations) {
    try { db.execSync(sql); } catch { /* 既存カラムは無視 */ }
  }
}
