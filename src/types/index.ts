export type TaxCode = 'M' | 'M SL' | 'SB' | 'S' | 'SH' | 'ST' | 'SA';
export type PaymentMethod = 'bank' | 'cash' | 'other';

export interface Employer {
  id: number;
  name: string;
  country: string; // 'NZ' | 'AU' | ...
  hourlyRate: number;
  taxCode: TaxCode;
  irdNumber?: string;
  defaultStartTime?: string; // HH:MM
  defaultEndTime?: string;   // HH:MM
  defaultBreakMinutes?: number;
  region?: string;
  // 友達への勤務履歴公開設定
  friendsVisible?: boolean;
  // Holiday Pay設定（NZのみ）
  holidayPayIncluded: boolean;  // 時給にHP 8%が含まれている
  holidayPaySeparate: boolean;  // HP別途支給
  // 手当設定
  nightShiftStart?: string;     // 夜勤開始時刻 HH:MM
  nightShiftBonus?: number;     // 夜勤割増額 $/h
  overtimeThreshold?: number;   // 残業閾値（時間）
  overtimeMultiplier?: number;  // 残業割増率（例: 1.25）
  // コミュニティ公開設定
  isShared: boolean;
  paymentMethod?: PaymentMethod;
  jobCategory?: string;
  jobDescription?: string;
  englishLevel?: string; // 'none' | 'basic' | 'business'
  visaTypes?: string;    // カンマ区切り例: 'WHV,Student'
  publicMemo?: string;   // 自由メモ（電子レンジあり、など）
  hasInterview?: boolean;  // 面接の有無
  difficulty?: 'easy' | 'normal' | 'hard'; // 仕事の難易度
  isHiring?: boolean;      // 募集中
  address?: string;        // 住所（チケットで閲覧）
  contactInfo?: string;    // 連絡先（チケットで閲覧）
  sharedAt?: string;       // 初回公開日時（チケット重複防止）
  reviewSharedAt?: string; // 初回レビュー更新日時（チケット重複防止）
  detailSharedAt?: string; // 初回詳細情報（住所・連絡先）追加日時
  firestoreId?: string;    // Firestoreドキュメント ID（名前変更に対応）
  createdAt: string;
}

export interface Shift {
  id: number;
  employerId: number;
  employerName?: string; // join用
  country: string; // 'NZ' | 'AU' | ...
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakMinutes: number;
  isPublicHoliday: boolean;  // 公休日出勤（×1.5）
  isHolidayRest: boolean;    // 公休日休業手当（出勤なし・通常給与）
  isShared: boolean;
  memo: string;
  hourlyRate: number; // NZD（記録時点）
  grossPay: number; // NZD
  taxAmount: number; // NZD
  accLevy: number; // NZD
  studentLoanDeduction: number; // NZD
  netPay: number; // NZD
  holidayPayIncluded?: boolean;  // 時給にHP 8%が含まれている
  holidayPaySeparate?: boolean;  // HP別途支給
  holidayPayAmount?: number;    // 別途支給の受取額（NZD）
  nightShiftAllowance?: number; // 夜勤手当（自動計算）
  overtimeAllowance?: number;   // 残業手当（自動計算）
  reminderMinutes?: number; // -1=なし, 0=当日朝8時, 15/30/60/120=開始X分前
  notificationId?: string;
  firestoreId?: string;
  createdAt: string;
}

export interface Settings {
  currentCountry: string; // 'NZ' | 'AU' | ...
  nzdJpyRate: number;
  audJpyRate: number;
  useStudentLoan: boolean;
  studentLoanRate: number; // default 0.12
  paydayType: string;  // 'none' | 'weekly' | 'biweekly' | 'monthly'
  paydayDay: number;   // weekday 0-6 for weekly/biweekly, day 1-28 for monthly
}

export interface PayCalculation {
  hours: number;
  grossPay: number;
  taxAmount: number;
  accLevy: number;
  studentLoanDeduction: number;
  netPay: number;
}
