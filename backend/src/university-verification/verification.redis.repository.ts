import { Injectable } from '@nestjs/common';
import { RedisService } from '../common/redis/redis.service';
import { UpdateVerificationSession, VerificationSession } from './types/verification-session.type';

// 학교 이메일 인증 세션용 Redis 접근
@Injectable()
export class VerificationRedisRepository {
  constructor(private readonly redis: RedisService) {}

  private getKey(id: string): string {
    return `verification:session:${id}`;
  }

  private getClient() {
    return this.redis.getClient();
  }

  // verificationId를 기준으로 Redis에 인증 세션을 저장 (send-code에서 호출)
  async setSession(id: string, data: VerificationSession, ttlSeconds: number): Promise<void> {
    const client = this.getClient();
    const key = this.getKey(id);

    // Redis Hash는 string만 저장하므로 변환
    const stringifiedData: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      stringifiedData[k] = String(v);
    }

    // TTL(15분)이 지나면 자동 삭제
    await client.hset(key, stringifiedData);
    await client.expire(key, ttlSeconds);
  }

  // verificationId로 Redis에서 인증 세션을 조회 (confirm-code에서 호출)
  async getSession(id: string): Promise<VerificationSession | null> {
    const client = this.getClient();
    const key = this.getKey(id);

    const data = await client.hgetall(key);

    // TTL 만료 또는 잘못된 ID일 시 null 반환
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      universityId: data.universityId,
      universityEmail: data.universityEmail,
      codeHash: data.codeHash,
      attemptCount: Number(data.attemptCount),
      status: data.status as 'PENDING' | 'LOCKED',
    };
  }

  // 인증 세션 업데이트 (attemptCount 증가, status 변경)
  async updateSession(id: string, data: UpdateVerificationSession): Promise<void> {
    const client = this.getClient();
    const key = this.getKey(id);

    const stringifiedData: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      stringifiedData[k] = String(v);
    }

    await client.hset(key, stringifiedData);
  }

  // 인증 세션 삭제 (signupToken 발급 시 삭제됨.)
  async deleteSession(id: string): Promise<void> {
    const client = this.getClient();
    const key = this.getKey(id);

    await client.del(key);
  }
}
