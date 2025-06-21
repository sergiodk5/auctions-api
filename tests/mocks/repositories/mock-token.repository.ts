import { Container } from "inversify";
import { ITokenRepository } from "../../../src/repositories/token.repository";

export interface MockTokenConfig {
    shouldSimulateError: boolean;
    errorMessage: string;
    delay: number;
}

export class MockTokenRepository implements ITokenRepository {
    private static instance: MockTokenRepository;
    private config: MockTokenConfig = {
        shouldSimulateError: false,
        errorMessage: "Mock token repository error",
        delay: 0,
    };

    // In-memory storage for refresh tokens
    private refreshTokens = new Map<string, string>(); // jti -> familyId
    private refreshFamilies = new Map<string, Set<string>>(); // familyId -> Set of jtis
    private revokedTokens = new Set<string>(); // revoked jtis
    private denyList = new Map<string, number>(); // jti -> expiry timestamp
    private revokedFamilies = new Set<string>(); // revoked familyIds

    static getInstance(): MockTokenRepository {
        if (!MockTokenRepository.instance) {
            MockTokenRepository.instance = new MockTokenRepository();
        }
        return MockTokenRepository.instance;
    }

    static bindToContainer(container: Container): void {
        const mockToken = MockTokenRepository.getInstance();
        container.bind<ITokenRepository>("TokenRepository").toConstantValue(mockToken);
    }

    static configureInstance(config: Partial<MockTokenConfig>): void {
        const instance = MockTokenRepository.getInstance();
        instance.config = { ...instance.config, ...config };
    }

    static resetInstance(): void {
        const instance = MockTokenRepository.getInstance();
        instance.config = {
            shouldSimulateError: false,
            errorMessage: "Mock token repository error",
            delay: 0,
        };
        instance.refreshTokens.clear();
        instance.refreshFamilies.clear();
        instance.revokedTokens.clear();
        instance.denyList.clear();
        instance.revokedFamilies.clear();
    }

    private async simulateDelay(): Promise<void> {
        if (this.config.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.config.delay));
        }
    }

    private checkForError(): void {
        if (this.config.shouldSimulateError) {
            throw new Error(this.config.errorMessage);
        }
    }

    async storeRefreshToken(jti: string, familyId: string): Promise<void> {
        await this.simulateDelay();
        this.checkForError();

        this.refreshTokens.set(jti, familyId);

        if (!this.refreshFamilies.has(familyId)) {
            this.refreshFamilies.set(familyId, new Set());
        }
        const family = this.refreshFamilies.get(familyId);
        if (family) {
            family.add(jti);
        }
    }

    async revokeRefreshToken(jti: string): Promise<void> {
        await this.simulateDelay();
        this.checkForError();

        this.revokedTokens.add(jti);
        this.refreshTokens.delete(jti);

        // Remove from family as well
        for (const [familyId, jtis] of this.refreshFamilies.entries()) {
            if (jtis.has(jti)) {
                jtis.delete(jti);
                break;
            }
        }
    }

    async revokeFamily(familyId: string): Promise<void> {
        await this.simulateDelay();
        this.checkForError();

        const jtis = this.refreshFamilies.get(familyId);
        if (jtis) {
            // Revoke all tokens in the family
            for (const jti of jtis) {
                this.revokedTokens.add(jti);
                this.refreshTokens.delete(jti);
            }
            this.refreshFamilies.delete(familyId);
        }

        this.revokedFamilies.add(familyId);
    }

    async isRefreshTokenValid(jti: string): Promise<boolean> {
        await this.simulateDelay();
        this.checkForError();

        return this.refreshTokens.has(jti) && !this.revokedTokens.has(jti);
    }

    async addToDenyList(jti: string, ttlSeconds: number): Promise<void> {
        await this.simulateDelay();
        this.checkForError();

        const expiryTime = Date.now() + ttlSeconds * 1000;
        this.denyList.set(jti, expiryTime);
    }

    async isAccessTokenRevoked(jti: string): Promise<boolean> {
        await this.simulateDelay();
        this.checkForError();

        const expiryTime = this.denyList.get(jti);
        if (!expiryTime) return false;

        // Check if token has expired in the deny list
        if (Date.now() > expiryTime) {
            this.denyList.delete(jti);
            return false;
        }

        return true;
    }

    // Test helper methods
    getStoredTokens(): Map<string, string> {
        return new Map(this.refreshTokens);
    }

    getRefreshFamilies(): Map<string, Set<string>> {
        return new Map(this.refreshFamilies);
    }

    getRevokedTokens(): Set<string> {
        return new Set(this.revokedTokens);
    }

    getDenyList(): Map<string, number> {
        return new Map(this.denyList);
    }

    clearAll(): void {
        this.refreshTokens.clear();
        this.refreshFamilies.clear();
        this.revokedTokens.clear();
        this.denyList.clear();
        this.revokedFamilies.clear();
    }

    getConfig(): MockTokenConfig {
        return { ...this.config };
    }
}
