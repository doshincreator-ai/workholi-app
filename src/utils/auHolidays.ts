/** オーストラリアの祝日を計算して YYYY-MM-DD の配列で返す */

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 日曜→翌月曜、土曜→翌月曜（Australian Mondayisation） */
function mondayise(year: number, month: number, day: number): Date {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() + 2); // 土→月
  else if (dow === 0) d.setDate(d.getDate() + 1); // 日→月
  return d;
}

/** イースターサンデーを返す */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** N番目の曜日（例：6月の第2月曜）を返す */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const d = new Date(year, month - 1, 1);
  const first = d.getDay();
  const offset = (weekday - first + 7) % 7;
  d.setDate(1 + offset + (n - 1) * 7);
  return d;
}

/** その月の最後の指定曜日を返す */
function lastWeekday(year: number, month: number, weekday: number): Date {
  const d = new Date(year, month, 0); // 月末日
  const dow = d.getDay();
  const diff = (dow - weekday + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

/** date以降の最初の月曜日を返す */
function nextMonday(year: number, month: number, day: number): Date {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  if (dow !== 1) d.setDate(d.getDate() + ((1 - dow + 7) % 7));
  return d;
}

type State = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'NT' | 'ACT' | 'TAS';

/** 地域文字列から州コードを抽出（例: "Sydney/NSW" → "NSW"） */
export function getStateFromRegion(region: string): State | null {
  const states: State[] = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'NT', 'ACT', 'TAS'];
  for (const s of states) {
    if (region.toUpperCase().includes(s)) return s;
  }
  return null;
}

export function getAUPublicHolidays(year: number, region?: string): string[] {
  const state = region ? getStateFromRegion(region) : null;
  const holidays: string[] = [];

  const easter = getEasterSunday(year);
  const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2);
  const easterSaturday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 1);
  const easterMonday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1);

  // === 全州共通 ===
  holidays.push(fmt(mondayise(year, 1, 1)));   // New Year's Day
  holidays.push(fmt(mondayise(year, 1, 26)));  // Australia Day
  holidays.push(fmt(goodFriday));              // Good Friday
  holidays.push(fmt(easterMonday));            // Easter Monday
  holidays.push(fmt(mondayise(year, 4, 25)));  // Anzac Day
  holidays.push(fmt(mondayise(year, 12, 25))); // Christmas Day
  holidays.push(fmt(mondayise(year, 12, 26))); // Boxing Day

  // === 州別 ===
  switch (state) {
    case 'NSW':
      holidays.push(fmt(easterSaturday));           // Easter Saturday
      holidays.push(fmt(nthWeekday(year, 6, 1, 2)));  // King's Birthday（6月第2月曜）
      holidays.push(fmt(nthWeekday(year, 8, 1, 1)));  // Bank Holiday（8月第1月曜）
      break;

    case 'VIC':
      holidays.push(fmt(easterSaturday));              // Easter Saturday
      holidays.push(fmt(nthWeekday(year, 6, 1, 2)));   // King's Birthday（6月第2月曜）
      holidays.push(fmt(nthWeekday(year, 11, 2, 1)));  // Melbourne Cup Day（11月第1火曜）
      break;

    case 'QLD':
      holidays.push(fmt(easterSaturday));                // Easter Saturday
      holidays.push(fmt(lastWeekday(year, 10, 1)));      // King's Birthday（10月最終月曜）
      break;

    case 'SA':
      holidays.push(fmt(easterSaturday));                // Easter Saturday
      holidays.push(fmt(nthWeekday(year, 5, 1, 2)));    // Adelaide Cup（5月第2月曜）
      holidays.push(fmt(nthWeekday(year, 6, 1, 2)));    // King's Birthday（6月第2月曜）
      break;

    case 'WA':
      holidays.push(fmt(nthWeekday(year, 6, 1, 1)));    // Foundation Day（6月第1月曜）
      holidays.push(fmt(lastWeekday(year, 9, 1)));       // King's Birthday（9月最終月曜）
      break;

    case 'NT':
      holidays.push(fmt(easterSaturday));               // Easter Saturday
      holidays.push(fmt(nthWeekday(year, 6, 1, 2)));    // King's Birthday（6月第2月曜）
      holidays.push(fmt(nthWeekday(year, 8, 1, 1)));    // Picnic Day（8月第1月曜）
      break;

    case 'ACT':
      holidays.push(fmt(easterSaturday));               // Easter Saturday
      holidays.push(fmt(nthWeekday(year, 3, 1, 2)));    // Canberra Day（3月第2月曜）
      holidays.push(fmt(nextMonday(year, 5, 27)));       // Reconciliation Day（5/27以降最初の月曜）
      holidays.push(fmt(nthWeekday(year, 6, 1, 2)));    // King's Birthday（6月第2月曜）
      break;

    case 'TAS':
      holidays.push(fmt(easterSaturday));               // Easter Saturday
      holidays.push(fmt(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 2))); // Easter Tuesday
      holidays.push(fmt(nthWeekday(year, 3, 1, 2)));    // Eight Hours Day（3月第2月曜）
      holidays.push(fmt(nthWeekday(year, 6, 1, 2)));    // King's Birthday（6月第2月曜）
      break;

    default:
      // 州不明の場合は全州共通のみ + King's Birthday（6月第2月曜）
      holidays.push(fmt(nthWeekday(year, 6, 1, 2)));
      break;
  }

  return [...new Set(holidays)];
}

/** 指定した日付がAU祝日かどうか */
export function isAUPublicHoliday(dateStr: string, region?: string): boolean {
  const year = parseInt(dateStr.substring(0, 4), 10);
  return getAUPublicHolidays(year, region).includes(dateStr);
}

/** 祝日名を返す（表示用） */
export function getAUHolidayName(dateStr: string, region?: string): string | null {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const state = region ? getStateFromRegion(region) : null;
  const easter = getEasterSunday(year);

  const names: Record<string, string> = {
    [fmt(mondayise(year, 1, 1))]:   "New Year's Day",
    [fmt(mondayise(year, 1, 26))]:  'Australia Day',
    [fmt(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2))]: 'Good Friday',
    [fmt(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 1))]: 'Easter Saturday',
    [fmt(easter)]:                  'Easter Sunday',
    [fmt(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1))]: 'Easter Monday',
    [fmt(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 2))]: 'Easter Tuesday',
    [fmt(mondayise(year, 4, 25))]:  'Anzac Day',
    [fmt(mondayise(year, 12, 25))]: 'Christmas Day',
    [fmt(mondayise(year, 12, 26))]: 'Boxing Day',
    [fmt(nthWeekday(year, 6, 1, 2))]: "King's Birthday",
    [fmt(nthWeekday(year, 8, 1, 1))]: state === 'NT' ? 'Picnic Day' : 'Bank Holiday',
    [fmt(nthWeekday(year, 11, 2, 1))]: 'Melbourne Cup Day',
    [fmt(lastWeekday(year, 10, 1))]: "King's Birthday",
    [fmt(lastWeekday(year, 9, 1))]:  "King's Birthday",
    [fmt(nthWeekday(year, 6, 1, 1))]: 'Foundation Day',
    [fmt(nthWeekday(year, 5, 1, 2))]: 'Adelaide Cup',
    [fmt(nthWeekday(year, 3, 1, 2))]: state === 'ACT' ? 'Canberra Day' : 'Eight Hours Day',
    [fmt(nextMonday(year, 5, 27))]:  'Reconciliation Day',
  };

  return names[dateStr] ?? null;
}
