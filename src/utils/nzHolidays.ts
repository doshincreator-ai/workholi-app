/** NZの祝日を計算して YYYY-MM-DD の配列で返す */

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 日曜→翌月曜、土曜→翌々月曜（Mondayisation） */
function mondayise(year: number, month: number, day: number): Date {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() + 2); // 土→月
  else if (dow === 0) d.setDate(d.getDate() + 1); // 日→月
  return d;
}

/** 復活祭（イースター）の日曜日を返す */
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

/** N番目の曜日（例：6月の第1月曜）を返す */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const d = new Date(year, month - 1, 1);
  const first = d.getDay();
  const offset = (weekday - first + 7) % 7;
  d.setDate(1 + offset + (n - 1) * 7);
  return d;
}

// Matariki は法律で定められた日付（2025〜2030）
const MATARIKI: Record<number, string> = {
  2022: '2022-06-24',
  2023: '2023-07-14',
  2024: '2024-06-28',
  2025: '2025-06-20',
  2026: '2026-07-10',
  2027: '2027-06-25',
  2028: '2028-07-14',
  2029: '2029-07-06',
  2030: '2030-06-21',
};

export function getNZPublicHolidays(year: number): string[] {
  const holidays: string[] = [];

  // New Year's Day / Day after New Year's（Mondayise）
  const ny1 = mondayise(year, 1, 1);
  const ny2 = mondayise(year, 1, 2);
  // 元日が日曜なら翌月曜、翌日は火曜
  if (ny1.getDate() === ny2.getDate()) ny2.setDate(ny2.getDate() + 1);
  holidays.push(fmt(ny1), fmt(ny2));

  // Waitangi Day (Feb 6)
  holidays.push(fmt(mondayise(year, 2, 6)));

  // Good Friday / Easter Monday
  const easter = getEasterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  holidays.push(fmt(goodFriday), fmt(easterMonday));

  // Anzac Day (Apr 25)
  holidays.push(fmt(mondayise(year, 4, 25)));

  // King's Birthday: 1st Monday of June
  holidays.push(fmt(nthWeekday(year, 6, 1, 1)));

  // Matariki（法定日）
  if (MATARIKI[year]) holidays.push(MATARIKI[year]);

  // Labour Day: 4th Monday of October
  holidays.push(fmt(nthWeekday(year, 10, 1, 4)));

  // Christmas Day / Boxing Day（Mondayise）
  const xmas = mondayise(year, 12, 25);
  const boxing = mondayise(year, 12, 26);
  if (xmas.getDate() === boxing.getDate()) boxing.setDate(boxing.getDate() + 1);
  holidays.push(fmt(xmas), fmt(boxing));

  return holidays;
}

/** 指定した日付がNZ祝日かどうか */
export function isNZPublicHoliday(dateStr: string): boolean {
  const year = parseInt(dateStr.substring(0, 4), 10);
  return getNZPublicHolidays(year).includes(dateStr);
}

/** 祝日名を返す（表示用） */
export function getNZHolidayName(dateStr: string): string | null {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const easter = getEasterSunday(year);
  const goodFriday = fmt(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2));
  const easterMonday = fmt(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1));

  const names: Record<string, string> = {
    [fmt(mondayise(year, 1, 1))]: "New Year's Day",
    [fmt(mondayise(year, 1, 2))]: 'Day after New Year\'s',
    [fmt(mondayise(year, 2, 6))]: 'Waitangi Day',
    [goodFriday]: 'Good Friday',
    [easterMonday]: 'Easter Monday',
    [fmt(mondayise(year, 4, 25))]: 'Anzac Day',
    [fmt(nthWeekday(year, 6, 1, 1))]: "King's Birthday",
    [fmt(nthWeekday(year, 10, 1, 4))]: 'Labour Day',
    [fmt(mondayise(year, 12, 25))]: 'Christmas Day',
    [fmt(mondayise(year, 12, 26))]: 'Boxing Day',
  };
  if (MATARIKI[year]) names[MATARIKI[year]] = 'Matariki';
  return names[dateStr] ?? null;
}
