import { getDb } from './database';
import type { Employer } from '../types';

interface EmployerRow {
  id: number;
  name: string;
  country: string;
  hourly_rate: number;
  tax_code: string;
  ird_number: string | null;
  default_start_time: string | null;
  default_end_time: string | null;
  default_break_minutes: number | null;
  region: string | null;
  friends_visible: number;
  holiday_pay_included: number;
  holiday_pay_separate: number;
  night_shift_start: string | null;
  night_shift_bonus: number | null;
  overtime_threshold: number | null;
  overtime_multiplier: number | null;
  is_shared: number;
  payment_method: string | null;
  job_category: string | null;
  job_description: string | null;
  english_level: string | null;
  visa_types: string | null;
  public_memo: string | null;
  has_interview: number | null;
  difficulty: string | null;
  is_hiring: number | null;
  address: string | null;
  contact_info: string | null;
  shared_at: string | null;
  firestore_id: string | null;
  review_shared_at: string | null;
  detail_shared_at: string | null;
  created_at: string;
}

function rowToEmployer(row: EmployerRow): Employer {
  return {
    id: row.id,
    name: row.name,
    country: row.country ?? 'NZ',
    hourlyRate: row.hourly_rate,
    taxCode: row.tax_code as Employer['taxCode'],
    irdNumber: row.ird_number ?? undefined,
    defaultStartTime: row.default_start_time ?? undefined,
    defaultEndTime: row.default_end_time ?? undefined,
    defaultBreakMinutes: row.default_break_minutes ?? undefined,
    region: row.region ?? undefined,
    friendsVisible: row.friends_visible === 1,
    holidayPayIncluded: row.holiday_pay_included === 1,
    holidayPaySeparate: row.holiday_pay_separate === 1,
    nightShiftStart: row.night_shift_start ?? undefined,
    nightShiftBonus: row.night_shift_bonus ?? undefined,
    overtimeThreshold: row.overtime_threshold ?? undefined,
    overtimeMultiplier: row.overtime_multiplier ?? undefined,
    isShared: row.is_shared === 1,
    paymentMethod: (row.payment_method ?? undefined) as Employer['paymentMethod'],
    jobCategory: row.job_category ?? undefined,
    jobDescription: row.job_description ?? undefined,
    englishLevel: row.english_level ?? undefined,
    visaTypes: row.visa_types ?? undefined,
    publicMemo: row.public_memo ?? undefined,
    hasInterview: row.has_interview != null ? row.has_interview === 1 : undefined,
    difficulty: (row.difficulty ?? undefined) as Employer['difficulty'],
    isHiring: row.is_hiring != null ? row.is_hiring === 1 : undefined,
    address: row.address ?? undefined,
    contactInfo: row.contact_info ?? undefined,
    sharedAt: row.shared_at ?? undefined,
    firestoreId: row.firestore_id ?? undefined,
    reviewSharedAt: row.review_shared_at ?? undefined,
    detailSharedAt: row.detail_shared_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function getAllEmployers(): Employer[] {
  const db = getDb();
  const rows = db.getAllSync<EmployerRow>(
    'SELECT * FROM employers ORDER BY name ASC',
  );
  return rows.map(rowToEmployer);
}

export function getEmployerById(id: number): Employer | null {
  const db = getDb();
  const row = db.getFirstSync<EmployerRow>(
    'SELECT * FROM employers WHERE id = ?',
    [id],
  );
  return row ? rowToEmployer(row) : null;
}

export function insertEmployer(
  data: Omit<Employer, 'id' | 'createdAt'>,
): Employer {
  const db = getDb();
  const result = db.runSync(
    `INSERT INTO employers (name, country, hourly_rate, tax_code, ird_number, default_start_time, default_end_time, default_break_minutes, region, friends_visible, holiday_pay_included, holiday_pay_separate, night_shift_start, night_shift_bonus, overtime_threshold, overtime_multiplier, is_shared, payment_method, job_category, job_description, english_level, visa_types, public_memo, has_interview, difficulty, is_hiring, address, contact_info, shared_at, firestore_id, review_shared_at, detail_shared_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name, data.country ?? 'NZ', data.hourlyRate, data.taxCode, data.irdNumber ?? null,
      data.defaultStartTime ?? null, data.defaultEndTime ?? null, data.defaultBreakMinutes ?? null,
      data.region ?? null,
      data.friendsVisible ? 1 : 0,
      data.holidayPayIncluded ? 1 : 0,
      data.holidayPaySeparate ? 1 : 0,
      data.nightShiftStart ?? null,
      data.nightShiftBonus ?? null,
      data.overtimeThreshold ?? null,
      data.overtimeMultiplier ?? null,
      data.isShared ? 1 : 0,
      data.paymentMethod ?? null,
      data.jobCategory ?? null,
      data.jobDescription ?? null,
      data.englishLevel ?? null,
      data.visaTypes ?? null,
      data.publicMemo ?? null,
      data.hasInterview != null ? (data.hasInterview ? 1 : 0) : null,
      data.difficulty ?? null,
      data.isHiring != null ? (data.isHiring ? 1 : 0) : null,
      data.address ?? null,
      data.contactInfo ?? null,
      data.sharedAt ?? null,
      data.firestoreId ?? null,
      data.reviewSharedAt ?? null,
      data.detailSharedAt ?? null,
    ],
  );
  const inserted = getEmployerById(result.lastInsertRowId);
  if (!inserted) throw new Error('Failed to insert employer');
  return inserted;
}

export function updateEmployer(
  id: number,
  data: Partial<Omit<Employer, 'id' | 'createdAt'>>,
): void {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.country !== undefined) { fields.push('country = ?'); values.push(data.country); }
  if (data.hourlyRate !== undefined) { fields.push('hourly_rate = ?'); values.push(data.hourlyRate); }
  if (data.taxCode !== undefined) { fields.push('tax_code = ?'); values.push(data.taxCode); }
  if (data.irdNumber !== undefined) { fields.push('ird_number = ?'); values.push(data.irdNumber ?? null); }
  if (data.defaultStartTime !== undefined) { fields.push('default_start_time = ?'); values.push(data.defaultStartTime ?? null); }
  if (data.defaultEndTime !== undefined) { fields.push('default_end_time = ?'); values.push(data.defaultEndTime ?? null); }
  if (data.defaultBreakMinutes !== undefined) { fields.push('default_break_minutes = ?'); values.push(data.defaultBreakMinutes ?? null); }
  if (data.region !== undefined) { fields.push('region = ?'); values.push(data.region ?? null); }
  if (data.friendsVisible !== undefined) { fields.push('friends_visible = ?'); values.push(data.friendsVisible ? 1 : 0); }
  if (data.holidayPayIncluded !== undefined) { fields.push('holiday_pay_included = ?'); values.push(data.holidayPayIncluded ? 1 : 0); }
  if (data.holidayPaySeparate !== undefined) { fields.push('holiday_pay_separate = ?'); values.push(data.holidayPaySeparate ? 1 : 0); }
  if (data.nightShiftStart !== undefined) { fields.push('night_shift_start = ?'); values.push(data.nightShiftStart ?? null); }
  if (data.nightShiftBonus !== undefined) { fields.push('night_shift_bonus = ?'); values.push(data.nightShiftBonus ?? null); }
  if (data.overtimeThreshold !== undefined) { fields.push('overtime_threshold = ?'); values.push(data.overtimeThreshold ?? null); }
  if (data.overtimeMultiplier !== undefined) { fields.push('overtime_multiplier = ?'); values.push(data.overtimeMultiplier ?? null); }
  if (data.isShared !== undefined) { fields.push('is_shared = ?'); values.push(data.isShared ? 1 : 0); }
  if (data.paymentMethod !== undefined) { fields.push('payment_method = ?'); values.push(data.paymentMethod ?? null); }
  if (data.jobCategory !== undefined) { fields.push('job_category = ?'); values.push(data.jobCategory ?? null); }
  if (data.jobDescription !== undefined) { fields.push('job_description = ?'); values.push(data.jobDescription ?? null); }
  if (data.englishLevel !== undefined) { fields.push('english_level = ?'); values.push(data.englishLevel ?? null); }
  if (data.visaTypes !== undefined) { fields.push('visa_types = ?'); values.push(data.visaTypes ?? null); }
  if (data.publicMemo !== undefined) { fields.push('public_memo = ?'); values.push(data.publicMemo ?? null); }
  if (data.hasInterview !== undefined) { fields.push('has_interview = ?'); values.push(data.hasInterview != null ? (data.hasInterview ? 1 : 0) : null); }
  if (data.difficulty !== undefined) { fields.push('difficulty = ?'); values.push(data.difficulty ?? null); }
  if (data.isHiring !== undefined) { fields.push('is_hiring = ?'); values.push(data.isHiring != null ? (data.isHiring ? 1 : 0) : null); }
  if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address ?? null); }
  if (data.contactInfo !== undefined) { fields.push('contact_info = ?'); values.push(data.contactInfo ?? null); }
  if (data.sharedAt !== undefined) { fields.push('shared_at = ?'); values.push(data.sharedAt ?? null); }
  if (data.firestoreId !== undefined) { fields.push('firestore_id = ?'); values.push(data.firestoreId ?? null); }
  if (data.reviewSharedAt !== undefined) { fields.push('review_shared_at = ?'); values.push(data.reviewSharedAt ?? null); }
  if (data.detailSharedAt !== undefined) { fields.push('detail_shared_at = ?'); values.push(data.detailSharedAt ?? null); }

  if (fields.length === 0) return;
  values.push(id);
  db.runSync(`UPDATE employers SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function deleteEmployer(id: number): void {
  const db = getDb();
  db.runSync('DELETE FROM shifts WHERE employer_id = ?', [id]);
  db.runSync('DELETE FROM employers WHERE id = ?', [id]);
}
