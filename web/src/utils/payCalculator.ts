const ACC_LEVY_RATE = 0.0167;

export type TaxCode = 'M' | 'M SL' | 'SB' | 'S' | 'SH' | 'ST' | 'SA';

export interface PayCalculation {
  hours: number;
  grossPay: number;
  taxAmount: number;
  accLevy: number;
  studentLoanDeduction: number;
  netPay: number;
}

export function calculateAnnualPAYE(annualGross: number): number {
  let tax = 0;
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

export function calculateAnnualWHMTax(annualGross: number): number {
  if (annualGross <= 45000) return annualGross * 0.15;
  if (annualGross <= 135000) return 45000 * 0.15 + (annualGross - 45000) * 0.325;
  if (annualGross <= 190000) return 45000 * 0.15 + 90000 * 0.325 + (annualGross - 135000) * 0.37;
  return 45000 * 0.15 + 90000 * 0.325 + 55000 * 0.37 + (annualGross - 190000) * 0.45;
}

const SECONDARY_RATES: Partial<Record<TaxCode, number>> = {
  SB: 0.105, S: 0.175, SH: 0.30, ST: 0.33, SA: 0.45,
};

export function calculatePay(
  hoursWorked: number,
  hourlyRate: number,
  isPublicHoliday: boolean,
  taxCode: TaxCode,
  useStudentLoan: boolean,
  studentLoanRate: number = 0.12,
  extraAllowances: number = 0,
  weeksPerYear: number = 52,
): PayCalculation {
  const effectiveRate = isPublicHoliday ? hourlyRate * 1.5 : hourlyRate;
  const grossPay = hoursWorked * effectiveRate + extraAllowances;
  let taxAmount: number;
  const secondaryRate = SECONDARY_RATES[taxCode];
  if (secondaryRate !== undefined) {
    taxAmount = grossPay * secondaryRate;
  } else {
    const annualGross = grossPay * weeksPerYear;
    const annualTax = calculateAnnualPAYE(annualGross);
    taxAmount = annualTax / weeksPerYear;
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

export function calculatePayAU(
  hoursWorked: number,
  hourlyRate: number,
  isPublicHoliday: boolean,
  extraAllowances: number = 0,
  weeksPerYear: number = 52,
): PayCalculation {
  const effectiveRate = isPublicHoliday ? hourlyRate * 2.5 : hourlyRate;
  const grossPay = hoursWorked * effectiveRate + extraAllowances;
  const annualGross = grossPay * weeksPerYear;
  const annualTax = calculateAnnualWHMTax(annualGross);
  const taxAmount = annualTax / weeksPerYear;
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
