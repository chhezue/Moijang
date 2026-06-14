import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGO_URI!;

async function withDb<T>(fn: (db: ReturnType<MongoClient["db"]>) => Promise<T>): Promise<T> {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    return await fn(client.db("test"));
  } finally {
    await client.close();
  }
}

export async function resetGbToConfirmed(gbId: string): Promise<void> {
  await withDb(async (db) => {
    await db.collection("groupbuyings").updateOne(
      { _id: new ObjectId(gbId) },
      {
        $set: { groupBuyingStatus: "CONFIRMED" },
        $unset: { pickupTime: "", pickupPlace: "" },
      },
    );
    console.log(`[db] ${gbId} → CONFIRMED 리셋 완료`);
  });
}

export async function setGbStatus(
  gbId: string,
  status: "RECRUITING" | "CONFIRMED" | "ORDERED" | "SHIPPED" | "COMPLETED" | "CANCELLED",
  extra?: Record<string, unknown>,
): Promise<void> {
  await withDb(async (db) => {
    await db
      .collection("groupbuyings")
      .updateOne({ _id: new ObjectId(gbId) }, { $set: { groupBuyingStatus: status, ...extra } });
    console.log(`[db] ${gbId} → ${status}`);
  });
}

export async function getUserIdByLoginId(loginId: string): Promise<string> {
  return withDb(async (db) => {
    const user = await db.collection("users").findOne({ loginId });
    if (!user) throw new Error(`유저를 찾을 수 없음: ${loginId}`);
    return user._id.toString();
  });
}

export async function seedParticipant(gbId: string, userId: string, count = 1): Promise<void> {
  await withDb(async (db) => {
    await db.collection("participants").updateOne(
      { gbId: new ObjectId(gbId), userId: new ObjectId(userId) },
      {
        $setOnInsert: {
          gbId: new ObjectId(gbId),
          userId: new ObjectId(userId),
          count,
          joinedDate: new Date(),
        },
      },
      { upsert: true },
    );
    console.log(`[db] participant 시딩 완료: userId=${userId}, gbId=${gbId}`);
  });
}

export async function removeParticipant(gbId: string, userId: string): Promise<void> {
  await withDb(async (db) => {
    await db.collection("participants").deleteOne({
      gbId: new ObjectId(gbId),
      userId: new ObjectId(userId),
    });
    console.log(`[db] participant 삭제 완료: userId=${userId}, gbId=${gbId}`);
  });
}
