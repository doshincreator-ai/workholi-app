import { getDb } from './database';
import { calcHours } from '../utils/payCalculator';
import type { Shift } from '../types';

interface ShiftRow {
  id: number;
  employer_id: number;
  employer_name: string;
  country: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  is_public_holiday: number;
  is_holiday_rest: number;
  is_shared: number;
  memo: string;
  hourly_rate: number;
  gross_pay: number;
  tax_amount: number;
  acc_levy: number;
  student_loan_deduction: number;
  net_pay: number;
  reminder_minutes: number;
  notification_id: string | null;
  holiday_pay_included: number;
  holiday_pay_separate: number;
  holiday_pay_amount: number | null;
  night_shift_allowance: number | null;
  overtime_allowance: number | null;
  firestore_id: string | null;
  created_at: string;
}

function rowToShift(row: ShiftRow): Shift {
  return {
    id: row.id,
    employerId: row.employer_id,
    employerName: row.employer_name,
    country: row.country ?? 'NZ',
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    breakMinutes: row.break_minutes,
    isPublicHoliday: row.is_public_holiday === 1,
    isHolidayRest: row.is_holiday_rest === 1,
    isShared: row.is_shared === 1,
    memo: row.memo ?? '',
    hourlyRate: row.hourly_rate,
    grossPay: row.gross_pay,
    taxAmount: row.tax_amount,
    accLevy: row.acc_levy,
    studentLoanDeduction: row.student_loan_deduction,
    netPay: row.net_pay,
    holidayPayIncluded: row.holiday_pay_included === 1,
    holidayPaySeparate: row.holiday_pay_separate === 1,
    holidayPayAmount: row.holiday_pay_amount ?? undefined,
    nightShiftAllowance: row.night_shift_allowance ?? undefined,
    overtimeAllowance: row.overtime_allowance ?? undefined,
    reminderMinutes: row.reminder_minutes ?? -1,
    notificationId: row.notification_id ?? undefined,
    firestoreId: row.firestore_id ?? undefined,
    createdAt: row.created_at,
  };
}

const SELECT_SHIFTS = `
  SELECT s.*, e.name AS employer_name
  FROM shifts s
  LEFT JOIN employers e ON s.employer_id = e.id
`;

export function getAllShifts(): Shift[] {
  const db = getDb();
  const rows = db.getAllSync<ShiftRow>(`${SELECT_SHIFTS} ORDER BY s.date DESC`);
  return rows.map(rowToShift);
}

export function getShiftById(id: number): Shift | null {
  const db = getDb();
  const row = db.getFirstSync<ShiftRow>(`${SELECT_SHIFTS} WHERE s.id = ?`, [id]);
  return row ? rowToShift(row) : null;
}

export function getShiftsByMonth(year: number, month: number): Shift[] {
  const db = getDb();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const rows = db.getAllSync<ShiftRow>(
    `${SELECT_SHIFTS} WHERE s.date LIKE ? ORDER BY s.date DESC`,
    [`${prefix}%`],
  );
  return rows.map(rowToShift);
}

export function getShiftsByWeek(mondayDate: string, sundayDate: string): Shift[] {
  const db = getDb();
  const rows = db.getAllSync<ShiftRow>(
    `${SELECT_SHIFTS} WHERE s.date BETWEEN ? AND ? ORDER BY s.date ASC`,
    [mondayDate, sundayDate],
  );
  return rows.map(rowToShift);
}

export function getShiftsByEmployer(employerId: number): Shift[] {
  const db = getDb();
  const rows = db.getAllSync<ShiftRow>(
    `${SELECT_SHIFTS} WHERE s.employer_id = ? ORDER BY s.date DESC`,
    [employerId],
  );
  return rows.map(rowToShift);
}

export interface InsertShiftData {
  employerId: number;
  country: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isPublicHoliday: boolean;
  isHolidayRest: boolean;
  isShared: boolean;
  memo: string;
  hourlyRate: number;
  grossPay: number;
  taxAmount: number;
  accLevy: number;
  studentLoanDeduction: number;
  netPay: number;
  holidayPayIncluded?: boolean;
  holidayPaySeparate?: boolean;
  holidayPayAmount?: number;
  nightShiftAllowance?: number;
  overtimeAllowance?: number;
  reminderMinutes?: number;
  notificationId?: string;
  firestoreId?: string;
}

export function insertShift(data: InsertShiftData): Shift {
  const db = getDb();
  const firestoreId = data.firestoreId ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const result = db.runSync(
    `INSERT INTO shifts (
      employer_id, country, date, start_time, end_time, break_minutes,
      is_public_holiday, is_holiday_rest, is_shared, memo,
      hourly_rate, gross_pay, tax_amount,
      acc_levy, student_loan_deduction, net_pay,
      reminder_minutes, notification_id,
      holiday_pay_included, holiday_pay_separate,
      holiday_pay_amount, night_shift_allowance, overtime_allowance,
      firestore_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.employerId,
      data.country ?? 'NZ',
      data.date,
      data.startTime,
      data.endTime,
      data.breakMinutes,
      data.isPublicHoliday ? 1 : 0,
      data.isHolidayRest ? 1 : 0,
      data.isShared ? 1 : 0,
      data.memo,
      data.hourlyRate,
      data.grossPay,
      data.taxAmount,
      data.accLevy,
      data.studentLoanDeduction,
      data.netPay,
      data.reminderMinutes ?? -1,
      data.notificationId ?? null,
      data.holidayPayIncluded ? 1 : 0,
      data.holidayPaySeparate ? 1 : 0,
      data.holidayPayAmount ?? null,
      data.nightShiftAllowance ?? null,
      data.overtimeAllowance ?? null,
      firestoreId,
    ],
  );
  const inserted = getShiftById(result.lastInsertRowId);
  if (!inserted) throw new Error('Failed to insert shift');
  return inserted;
}

export function updateShift(id: number, data: InsertShiftData): void {
  const db = getDb();
  db.runSync(
    `UPDATE shifts SET
      employer_id = ?, country = ?, date = ?, start_time = ?, end_time = ?,
      break_minutes = ?, is_public_holiday = ?, is_holiday_rest = ?, is_shared = ?,
      memo = ?,
      hourly_rate = ?, gross_pay = ?, tax_amount = ?, acc_levy = ?,
      student_loan_deduction = ?, net_pay = ?,
      reminder_minutes = ?, notification_id = ?,
      holiday_pay_included = ?, holiday_pay_separate = ?,
      holiday_pay_amount = ?, night_shift_allowance = ?, overtime_allowance = ?
    WHERE id = ?`,
    [
      data.employerId,
      data.country ?? 'NZ',
      data.date,
      data.startTime,
      data.endTime,
      data.breakMinutes,
      data.isPublicHoliday ? 1 : 0,
      data.isHolidayRest ? 1 : 0,
      data.isShared ? 1 : 0,
      data.memo,
      data.hourlyRate,
      data.grossPay,
      data.taxAmount,
      data.accLevy,
      data.studentLoanDeduction,
      data.netPay,
      data.reminderMinutes ?? -1,
      data.notificationId ?? null,
      data.holidayPayIncluded ? 1 : 0,
      data.holidayPaySeparate ? 1 : 0,
      data.holidayPayAmount ?? null,
      data.nightShiftAllowance ?? null,
      data.overtimeAllowance ?? null,
      id,
    ],
  );
}

export function deleteShift(id: number): void {
  const db = getDb();
  db.runSync('DELETE FROM shifts WHERE id = ?', [id]);
}

export interface MonthlySummary {
  grossPay: number;
  taxAmount: number;
  accLevy: number;
  studentLoanDeduction: number;
  netPay: number;
  totalHours: number;
  shiftCount: number;
}

export function getMonthlySummary(year: number, month: number): MonthlySummary {
  const db = getDb();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const row = db.getFirstSync<{
    gross: number;
    tax: number;
    acc: number;
    sl: number;
    net: number;
    count: number;
  }>(
    `SELECT
      SUM(gross_pay) AS gross,
      SUM(tax_amount) AS tax,
      SUM(acc_levy) AS acc,
      SUM(student_loan_deduction) AS sl,
      SUM(net_pay) AS net,
      COUNT(*) AS count
    FROM shifts WHERE date LIKE ?`,
    [`${prefix}%`],
  );

  // 総時間は shifts の start/end/break から計算
  const shifts = getShiftsByMonth(year, month);
  const totalHours = shifts.reduce((sum, s) => sum + calcHours(s.startTime, s.endTime, s.breakMinutes), 0);

  return {
    grossPay: row?.gross ?? 0,
    taxAmount: row?.tax ?? 0,
    accLevy: row?.acc ?? 0,
    studentLoanDeduction: row?.sl ?? 0,
    netPay: row?.net ?? 0,
    totalHours: Math.round(totalHours * 10) / 10,
    shiftCount: row?.count ?? 0,
  };
}
