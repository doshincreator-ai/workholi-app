/**
 * Firestore テストデータリセットスクリプト
 *
 * クローズドテスト開始前に実行し、テストユーザー・シフト・会社データを削除する。
 * 本番データが混入している場合は削除されるため、実行前に必ずバックアップを取ること。
 *
 * 削除対象コレクション:
 *   - users（ユーザープロフィール）
 *   - shifts（共有シフト）
 *   - friendships（フレンド関係）
 *   - friendRequests（フレンド申請）
 *   - comments（コメント）
 *   - countries/NZ/companies（NZ企業情報）
 *   - countries/AU/companies（AU企業情報）
 *   - users/{uid}/private_shifts（バックアップシフト）
 *   - users/{uid}/private_employers（バックアップ雇用主）
 *
 * 使い方:
 *   1. Firebase Console > プロジェクト設定 > サービスアカウント > 新しい秘密鍵を生成
 *   2. ダウンロードしたJSONを scripts/serviceAccountKey.json として配置
 *   3. node scripts/resetFirestoreTestData.js
 *
 * 注意: --confirm フラグなしでは実行されません（誤実行防止）
 *   node scripts/resetFirestoreTestData.js --confirm
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!process.argv.includes('--confirm')) {
  console.error('⚠️  誤実行防止: --confirm フラグをつけて実行してください');
  console.error('   node scripts/resetFirestoreTestData.js --confirm');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const BATCH_SIZE = 400;

async function deleteCollection(colRef, label) {
  let total = 0;
  while (true) {
    const snap = await colRef.limit(BATCH_SIZE).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    total += snap.size;
    console.log(`  ${label}: ${total} 件削除済み...`);
  }
  console.log(`✅ ${label}: 合計 ${total} 件削除`);
}

async function deleteSubcollections(parentSnap, subcollectionNames, label) {
  let total = 0;
  for (const docSnap of parentSnap.docs) {
    for (const subName of subcollectionNames) {
      const subCol = docSnap.ref.collection(subName);
      const subSnap = await subCol.get();
      if (subSnap.empty) continue;
      const batch = db.batch();
      subSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      total += subSnap.size;
    }
  }
  console.log(`✅ ${label} サブコレクション: 合計 ${total} 件削除`);
}

async function main() {
  console.log('🔥 Firestore テストデータリセット開始');
  console.log('対象プロジェクト:', serviceAccount.project_id);
  console.log('');

  // users のサブコレクション（private_shifts, private_employers）を先に削除
  const usersSnap = await db.collection('users').get();
  await deleteSubcollections(usersSnap, ['private_shifts', 'private_employers'], 'users サブ');

  // トップレベルコレクションを並列削除
  await Promise.all([
    deleteCollection(db.collection('users'), 'users'),
    deleteCollection(db.collection('shifts'), 'shifts'),
    deleteCollection(db.collection('friendships'), 'friendships'),
    deleteCollection(db.collection('friendRequests'), 'friendRequests'),
    deleteCollection(db.collection('comments'), 'comments'),
    deleteCollection(db.collection('countries').doc('NZ').collection('companies'), 'countries/NZ/companies'),
    deleteCollection(db.collection('countries').doc('AU').collection('companies'), 'countries/AU/companies'),
  ]);

  console.log('');
  console.log('🎉 リセット完了。テスターが初期状態でアプリを使えます。');
}

main().catch((e) => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
