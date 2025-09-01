export class JwtPayloadDto {
  sub: string; // uuid
  name: string; // displayName
  iat?: number; // 토큰 발급 시간
  exp?: number; // 토큰 만료 시간
}
