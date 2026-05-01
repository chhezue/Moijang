export interface AccessTokenPayload {
  typ: 'access';
  sub: string;
  name: string;
}

export interface RefreshTokenPayload {
  typ: 'refresh';
  sub: string;
  name: string;
}

export interface SignupTokenPayload {
  typ: 'signup';
  universityId: string;
  universityEmail: string;
}
