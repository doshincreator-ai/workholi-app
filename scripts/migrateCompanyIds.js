/**
 * Firestore 企業IDマイグレーションスクリプト
 *
 * 旧: name.toLowerCase().replace(/\s+/g, '_')
 * 新: trim → lowercase → 英数字以外除去 → スペース→_
 *
 * 使い方:
 *   1. Firebase Console > プロジェクト設定 > サービスアカウント > 新しい秘密鍵を生成
 *   2. ダウンロードしたJSONを scripts/serviceAccountKey.json として配置
 *   3. npm install firebase-admin
 *   4. node scripts/migrateCompanyIds.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const COUNTRIES = ['NZ', 'AU'];

function toCompanyIdOld(name) {
  return name.toLowerCase().replace(/\s+/g, '_');
}

function toCompanyIdNew(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function migrate() {
  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const country of COUNTRIES) {
    const companiesRef = db.collection('countries').doc(country).collection('companies');
    const snap = await companiesRef.get();

    console.log(`\n[${country}] ${snap.docs.length}件の企業を確認中...`);

    for (const docSnap of snap.docs) {
      const oldId = docSnap.id;
      const data = docSnap.data();
      const name = data.name ?? '';
      const newId = toCompanyIdNew(name);

      if (oldId === newId) {
        totalSkipped++;
        continue;
      }

      console.log(`  移行: "${name}"`);
      console.log(`    旧ID: ${oldId}`);
      console.log(`    新ID: ${newId}`);

      const batch = db.batch();

      // 1. 新IDでドキュメントを作成
      const newRef = companiesRef.doc(newId);
      batch.set(newRef, { ...data, companyId: newId });

      // 2. 旧IDのドキュメントを削除
      batch.delete(docSnap.ref);

      await batch.commit();

      // 3. commentsコレクションのcompanyIdを更新
      const commentsSnap = await db.collection('comments')
        .where('companyId', '==', oldId)
        .get();

      if (!commentsSnap.empty) {
        const commentBatch = db.batch();
        commentsSnap.docs.forEach((c) => {
          commentBatch.update(c.ref, { companyId: newId });
        });
        await commentBatch.commit();
        console.log(`    → コメント ${commentsSnap.docs.length}件を更新`);
      }

      // 4. users.unlockedCompaniesのIDを更新
      const usersSnap = await db.collection('users')
        .where('unlockedCompanies', 'array-contains', oldId)
        .get();

      if (!usersSnap.empty) {
        const userBatch = db.batch();
        usersSnap.docs.forEach((u) => {
          const unlocked = u.data().unlockedCompanies ?? [];
          const updated = unlocked.map((id) => (id === oldId ? newId : id));
          userBatch.update(u.ref, { unlockedCompanies: updated });
        });
        await userBatch.commit();
        console.log(`    → ユーザー ${usersSnap.docs.length}件のunlockedCompaniesを更新`);
      }

      totalMigrated++;
    }
  }

  console.log(`\n完了: ${totalMigrated}件移行, ${totalSkipped}件スキップ（変更なし）`);

  if (totalMigrated > 0) {
    console.log('\n⚠️  ローカルのSQLiteに保存されているfirestoreIdも古いIDのままです。');
    console.log('   既存ユーザーに影響がある場合は、アプリ側で再同期処理が必要です。');
  }
}

migrate().catch(console.error);
