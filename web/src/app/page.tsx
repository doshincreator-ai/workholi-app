import PayCalculator from '../components/PayCalculator';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.workholiday.app';

const features = [
  {
    icon: '📋',
    title: 'シフト記録',
    desc: '出勤・退勤・休憩を記録。日またぎシフトも自動計算。',
  },
  {
    icon: '💰',
    title: 'NZ/AU給与計算',
    desc: 'NZ 2025/26 PAYEとAU WHMビザの税率に完全対応。手取りをリアルタイム確認。',
  },
  {
    icon: '👥',
    title: 'フレンド共有',
    desc: '招待コードでフレンドと繋がり、シフトをシェア。',
  },
  {
    icon: '📊',
    title: 'レポート',
    desc: '月次・週次の労働時間・手取りをグラフで確認。',
  },
  {
    icon: '🏆',
    title: 'レベルシステム',
    desc: '累計手取りでレベルアップ。🥚→🐣→🐤→🐔→🦅',
  },
  {
    icon: '🏢',
    title: 'コミュニティ',
    desc: '地域・業種で会社情報をシェア。求人情報も確認できる。',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦅</span>
            <span className="font-bold text-gray-900 text-lg">WorkHoli</span>
          </div>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
          >
            無料ダウンロード
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-6xl mb-6">🦅</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            NZワーホリの<br className="md:hidden" />シフト管理を<br />もっとシンプルに
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            シフト記録・給与計算・フレンド共有がひとつに。<br />
            NZ/AU両対応の税計算で手取りをすぐ確認。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-green-600 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-11.99-2.56-2.56L3.18 23.76zM21.37 10.3L18.6 8.73l-2.89 2.75 2.89 2.75 2.78-1.57c.79-.45.79-1.91-.01-2.36zM2.01 1.05C1.76 1.3 1.6 1.7 1.6 2.24v19.52c0 .54.16.94.41 1.19l.07.06 10.94-10.94v-.26L2.08 1.05l-.07-.0z"/>
              </svg>
              Google Play で入手
            </a>
            <a
              href="#calculator"
              className="inline-flex items-center justify-center gap-2 border-2 border-green-600 text-green-700 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-green-50 transition-colors"
            >
              給与計算を試す
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">Android 対応・無料</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">主な機能</h2>
          <p className="text-center text-gray-500 mb-12">ワーホリ生活をサポートする機能が揃っています</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Demo */}
      <section id="calculator" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">給与計算を試してみよう</h2>
          <p className="text-center text-gray-500 mb-10">
            NZ・AU両対応。アプリでは毎シフト自動で計算されます。
          </p>
          <PayCalculator />
          <p className="text-center text-sm text-gray-400 mt-6">
            NZ: 2025/26 PAYE税率 + ACC Levy 1.67%　/　AU: ATO Schedule 15（417・462ビザ）
          </p>
        </div>
      </section>

      {/* Tester CTA */}
      <section className="py-20 px-4 bg-green-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-6">🧪</div>
          <h2 className="text-3xl font-bold mb-4">アルファテスターになりませんか？</h2>
          <p className="text-green-100 text-lg mb-8 leading-relaxed">
            現在、Google Play クローズドテスト（Alpha）で公開中です。<br />
            ご意見・フィードバックをお待ちしています。
          </p>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-white text-green-700 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-green-50 transition-colors shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-11.99-2.56-2.56L3.18 23.76zM21.37 10.3L18.6 8.73l-2.89 2.75 2.89 2.75 2.78-1.57c.79-.45.79-1.91-.01-2.36zM2.01 1.05C1.76 1.3 1.6 1.7 1.6 2.24v19.52c0 .54.16.94.41 1.19l.07.06 10.94-10.94v-.26L2.08 1.05l-.07-.0z"/>
            </svg>
            Google Play でテストに参加
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-center">
        <p className="text-gray-400 text-sm">
          © 2026 WorkHoli — NZワーキングホリデーメーカー向けシフト管理アプリ
        </p>
        <p className="text-gray-600 text-xs mt-2">
          税額計算はあくまで目安です。正確な税務については IRD（NZ）/ ATO（AU）にご確認ください。
        </p>
      </footer>
    </div>
  );
}
