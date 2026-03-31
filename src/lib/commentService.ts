import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  setDoc,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Comment {
  id: string;
  companyId: string;
  userId: string;
  displayName: string;
  text: string;
  rating: number; // 0=なし, 1-5
  isWorkedHere: boolean;
  createdAt: any;
}

export async function getComments(companyId: string): Promise<Comment[]> {
  const q = query(
    collection(db, 'comments'),
    where('companyId', '==', companyId),
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
  return docs.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
}

export async function addComment(
  companyId: string,
  country: string,
  userId: string,
  displayName: string,
  text: string,
  rating: number,
  isWorkedHere: boolean,
): Promise<Comment> {
  const ref = await addDoc(collection(db, 'comments'), {
    companyId,
    userId,
    displayName,
    text,
    rating,
    isWorkedHere,
    createdAt: serverTimestamp(),
  });
  const companyRef = doc(db, 'countries', country, 'companies', companyId);
  await setDoc(companyRef, { reviewCount: increment(1), updatedAt: serverTimestamp() }, { merge: true });
  return { id: ref.id, companyId, userId, displayName, text, rating, isWorkedHere, createdAt: new Date() };
}

export async function deleteComment(commentId: string, companyId: string, country: string): Promise<void> {
  await deleteDoc(doc(db, 'comments', commentId));
  const companyRef = doc(db, 'countries', country, 'companies', companyId);
  await setDoc(companyRef, { reviewCount: increment(-1), updatedAt: serverTimestamp() }, { merge: true });
}
