import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI!;

async function withDb<T>(fn: (db: ReturnType<MongoClient['db']>) => Promise<T>): Promise<T> {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    return await fn(client.db('test'));
  } finally {
    await client.close();
  }
}

export async function deleteInitiatedPayments(gbId: string): Promise<void> {
  await withDb(async (db) => {
    const result = await db
      .collection('payments')
      .deleteMany({ gbId: new ObjectId(gbId), status: 'INITIATED' });
    if (result.deletedCount > 0) {
      console.log(`[db] INITIATED payments 삭제: ${result.deletedCount}건 (gbId=${gbId})`);
    }
  });
}

export interface ParticipantSnapshot {
  userId: string;
  count: number;
}

export async function clearParticipants(gbId: string): Promise<ParticipantSnapshot[]> {
  return withDb(async (db) => {
    const docs = await db
      .collection('participants')
      .find({ gbId: new ObjectId(gbId) })
      .toArray();
    const snapshot: ParticipantSnapshot[] = docs.map((d) => ({
      userId: d.userId.toString(),
      count: d.count ?? 1,
    }));
    await db.collection('participants').deleteMany({ gbId: new ObjectId(gbId) });
    console.log(`[db] participants 전체 제거: ${snapshot.length}명 (gbId=${gbId})`);
    return snapshot;
  });
}

export async function restoreParticipants(
  gbId: string,
  snapshot: ParticipantSnapshot[],
): Promise<void> {
  if (snapshot.length === 0) return;
  await withDb(async (db) => {
    for (const p of snapshot) {
      await db.collection('participants').updateOne(
        { gbId: new ObjectId(gbId), userId: new ObjectId(p.userId) },
        {
          $setOnInsert: {
            gbId: new ObjectId(gbId),
            userId: new ObjectId(p.userId),
            count: p.count,
            joinedDate: new Date(),
          },
        },
        { upsert: true },
      );
    }
    console.log(`[db] participants 복원: ${snapshot.length}명 (gbId=${gbId})`);
  });
}

export async function resetGbToConfirmed(gbId: string): Promise<void> {
  await withDb(async (db) => {
    await db.collection('groupbuyings').updateOne(
      { _id: new ObjectId(gbId) },
      {
        $set: { groupBuyingStatus: 'CONFIRMED' },
        $unset: { pickupTime: '', pickupPlace: '' },
      },
    );
    console.log(`[db] ${gbId} → CONFIRMED 리셋 완료`);
  });
}
