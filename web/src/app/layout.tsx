import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WorkHoli — NZワーホリのシフト管理アプリ',
  description: 'NZワーキングホリデーメーカー向けシフト・給与管理アプリ。NZ/AU税計算対応、フレンドとシフト共有。',
  openGraph: {
    title: 'WorkHoli — NZワーホリのシフト管理アプリ',
    description: 'NZワーキングホリデーメーカー向けシフト・給与管理アプリ。NZ/AU税計算対応、フレンドとシフト共有。',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
