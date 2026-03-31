import type { PayCalculation, TaxCode } from '../types';

const ACC_LEVY_RATE = 0.0139;

/**
 * 年収から PAYE 税率を計算（NZ 2024/25）
 * カジュアル雇用は週次・日次収入を年収換算して税率を適用
 */
export function calculateAnnualPAYE(annualGross: number): number {
  let tax = 0;

  // 2025年4月1日以降の税率
  if (annualGross <= 15600) {
    tax = annualGross * 0.105;
  } else if (annualGross <= 53500) {
    tax = 15600 * 0.105 + (annualGross - 15600) * 0.175;
  } else if (annualGross <= 78100) {
    tax = 15600 * 0.105 + 37900 * 0.175 + (annualGross - 53500) * 0.3;
  } else if (annualGross <= 180000) {
    tax = 15600 * 0.105 + 37900 * 0.175 + 24600 * 0.3 + (annualGross - 78100) * 0.33;
  } else {
    tax = 15600 * 0.105 + 37900 * 0.175 + 24600 * 0.3 + 101900 * 0.33 + (annualGross - 180000) * 0.39;
  }

  return tax;
}

/**
 * シフトの給与を計算する
 * @param hoursWorked 労働時間（時間単位）
 * @param hourlyRate 時給（NZD）
 * @param isPublicHoliday 公休日フラグ（時給 ×1.5）
 * @param taxCode 税コード
 * @param useStudentLoan 学生ローン控除
 * @param studentLoanRate 学生ローン控除率（デフォルト 12%）
 */
// NZ 二次収入（Secondary）税コードの定率
const SECONDARY_RATES: Partial<Record<TaxCode, number>> = {
  SB: 0.105,
  S:  0.175,
  SH: 0.30,
  ST: 0.33,
  SA: 0.45,
};

export function calculatePay(
  hoursWorked: number,
  hourlyRate: number,
  isPublicHoliday: boolean,
  taxCode: TaxCode,
  useStudentLoan: boolean,
  studentLoanRate: number = 0.12,
  extraAllowances: number = 0,
): PayCalculation {
  const effectiveRate = isPublicHoliday ? hourlyRate * 1.5 : hourlyRate;
  const grossPay = hoursWorked * effectiveRate + extraAllowances;

  // 二次収入コードは定率、M / M SL は週次年換算で累進計算
  let taxAmount: number;
  const secondaryRate = SECONDARY_RATES[taxCode];
  if (secondaryRate !== undefined) {
    taxAmount = grossPay * secondaryRate;
  } else {
    const annualGross = grossPay * 52;
    const annualTax = calculateAnnualPAYE(annualGross);
    taxAmount = annualTax / 52;
  }

  const accLevy = grossPay * ACC_LEVY_RATE;

  const studentLoanDeduction = useStudentLoan ? grossPay * studentLoanRate : 0;

  const netPay = grossPay - taxAmount - accLevy - studentLoanDeduction;

  return {
    hours: hoursWorked,
    grossPay: round2(grossPay),
    taxAmount: round2(taxAmount),
    accLevy: round2(accLevy),
    studentLoanDeduction: round2(studentLoanDeduction),
    netPay: round2(netPay),
  };
}

/**
 * AU ワーホリ給与計算（一律 15% PAYE、ACC Levy なし）
 */
export function calculatePayAU(
  hoursWorked: number,
  hourlyRate: number,
  isPublicHoliday: boolean,
  extraAllowances: number = 0,
): PayCalculation {
  const effectiveRate = isPublicHoliday ? hourlyRate * 1.5 : hourlyRate;
  const grossPay = hoursWorked * effectiveRate + extraAllowances;
  const taxAmount = grossPay * 0.15; // WHV flat rate
  const netPay = grossPay - taxAmount;

  return {
    hours: hoursWorked,
    grossPay: round2(grossPay),
    taxAmount: round2(taxAmount),
    accLevy: 0,
    studentLoanDeduction: 0,
    netPay: round2(netPay),
  };
}

/**
 * 開始・終了時刻と休憩時間から労働時間を計算
 */
export function calcHours(startTime: string, endTime: string, breakMinutes: number): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let totalMinutes = (eh * 60 + em) - (sh * 60 + sm) - breakMinutes;
  if (totalMinutes < 0) totalMinutes += 24 * 60; // 日またぎ対応
  return Math.max(0, totalMinutes / 60);
}

/**
 * 夜勤時間帯（nightShiftStart以降）の労働時間を計算
 */
export function calcNightShiftHours(
  startTime: string,
  endTime: string,
  nightShiftStart: string,
): number {
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const startMin = toMin(startTime);
  const endMin = toMin(endTime);
  const nightMin = toMin(nightShiftStart);

  const adjEnd = endMin <= startMin ? endMin + 1440 : endMin;
  const adjNight = nightMin < startMin ? nightMin + 1440 : nightMin;

  return Math.max(0, adjEnd - Math.max(startMin, adjNight)) / 60;
}

/**
 * 残業手当の追加分を計算（閾値超過時間 × 時給 × (倍率-1)）
 */
export function calcOvertimeExtra(
  hours: number,
  hourlyRate: number,
  threshold: number,
  multiplier: number,
): number {
  if (hours <= threshold) return 0;
  return (hours - threshold) * hourlyRate * (multiplier - 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
