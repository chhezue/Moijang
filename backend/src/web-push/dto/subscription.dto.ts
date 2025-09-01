import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SubscriptionKeysDto {
  @IsString()
  p256dh: string; // 클라이언트 공개 키 (브라우저가 푸시 메시지를 복호화할 때 사용)

  @IsString()
  auth: string; // 인증 토큰 (보안 강화를 위한 용도)
}

export class CreateSubscriptionDto {
  // 푸시 메시지를 전송할 수 있는 고유한 URL입니다. 브라우저마다 이 URL이 다릅니다.
  @IsString()
  endpoint: string;

  // 구독의 만료 시점입니다. (null일 수도 있음)
  @IsNumber()
  @IsOptional()
  expirationTime?: number;

  @IsObject()
  @ValidateNested() // keys 객체 내부까지 유효성 검사를 진행합니다.
  @Type(() => SubscriptionKeysDto)
  keys: SubscriptionKeysDto;
}

export class SubscriptionDto {
  @ValidateNested()
  @Type(() => CreateSubscriptionDto)
  subscription: CreateSubscriptionDto;
}
