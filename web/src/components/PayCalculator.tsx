'use client';

import { useState, useMemo } from 'react';
import { calculatePay, calculatePayAU, type TaxCode } from '../utils/payCalculator';

export default function PayCalculator() {
  const [country, setCountry] = useState<'NZ' | 'AU'>('NZ');
  const [hours, setHours] = useState('8');
  const [rate, setRate] = useState(country === 'NZ' ? '23.95' : '24.95');
  const [taxCode, setTaxCode] = useState<TaxCode>('M');
  const [isPublicHoliday, setIsPublicHoliday] = useState(false);

  const result = useMemo(() => {
    const h = parseFloat(hours) || 0;
    const r = parseFloat(rate) || 0;
    if (h <= 0 || r <= 0) return null;
    if (country === 'NZ') {
      return calculatePay(h, r, isPublicHoliday, taxCode, false);
    } else {
      return calculatePayAU(h, r, isPublicHoliday);
    }
  }, [country, hours, rate, taxCode, isPublicHoliday]);

  const minWage = country === 'NZ' ? '23.95' : '24.95';
  const currency = country === 'NZ' ? 'NZD' : 'AUD';

  function handleCountryChange(c: 'NZ' | 'AU') {
    setCountry(c);
    setRate(c === 'NZ' ? '23.95' : '24.95');
    setTaxCode('M');
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 max-w-lg mx-auto">
      {/* Country toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
        {(['NZ', 'AU'] as const).map((c) => (
          <button
            key={c}
            onClick={() => handleCountryChange(c)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              country === c
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {c === 'NZ' ? '🇳🇿 ニュージーランド' : '🇦🇺 オーストラリア'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">労働時間</label>
          <div className="relative">
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              max="24"
              step="0.5"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">時間</span>
          </div>
        </div>

        {/* Hourly rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            時給 <span className="text-gray-400 font-normal">（最低賃金: ${minWage}）</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              min="0"
              step="0.05"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 pl-8 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* NZ Tax code */}
        {country === 'NZ' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">税コード</label>
            <select
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value as TaxCode)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="M">M（メイン雇用）</option>
              <option value="M SL">M SL（メイン + 学生ローン）</option>
              <option value="SB">SB（副収入 10.5%）</option>
              <option value="S">S（副収入 17.5%）</option>
              <option value="SH">SH（副収入 30%）</option>
              <option value="ST">ST（副収入 33%）</option>
              <option value="SA">SA（副収入 45%）</option>
            </select>
          </div>
        )}

        {/* Public holiday */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsPublicHoliday(!isPublicHoliday)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isPublicHoliday ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              isPublicHoliday ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </div>
          <span className="text-sm font-medium text-gray-700">
            公休日{country === 'NZ' ? '（×1.5）' : '（×2.5）'}
          </span>
        </label>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 bg-green-50 rounded-xl p-5 border border-green-100">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>総収入（グロス）</span>
              <span className="font-medium">${result.grossPay.toFixed(2)} {currency}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>税金（PAYE）</span>
              <span className="text-red-500">−${result.taxAmount.toFixed(2)}</span>
            </div>
            {result.accLevy > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>ACC Levy</span>
                <span className="text-red-500">−${result.accLevy.toFixed(2)}</span>
              </div>
            )}
            {result.studentLoanDeduction > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>学生ローン</span>
                <span className="text-red-500">−${result.studentLoanDeduction.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-green-200 pt-3 mt-3 flex justify-between">
              <span className="font-bold text-gray-900 text-base">手取り</span>
              <span className="font-bold text-green-700 text-xl">${result.netPay.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
