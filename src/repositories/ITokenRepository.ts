export interface ITokenRepository {
    storeRefreshToken(jti: string, familyId: string): Promise<void>;
    revokeRefreshToken(jti: string): Promise<void>;
    revokeFamily(familyId: string): Promise<void>;
    isRefreshTokenValid(jti: string): Promise<boolean>;
    addToDenyList(jti: string, ttlSeconds: number): Promise<void>;
    isAccessTokenRevoked(jti: string): Promise<boolean>;
}
