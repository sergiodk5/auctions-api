import { Container } from "inversify";
import { IUserRepository } from "../../../src/repositories/user.repository";
import { CreateUserDto, User } from "../../../src/types/user";

export interface MockUserRepositoryConfig {
    shouldSimulateError: boolean;
    errorMessage: string;
    delay: number;
    hashPasswords: boolean;
}

export class MockUserRepository implements IUserRepository {
    private static instance: MockUserRepository;
    private config: MockUserRepositoryConfig = {
        shouldSimulateError: false,
        errorMessage: "Mock user repository error",
        delay: 0,
        hashPasswords: false,
    };
    private users: User[] = [];
    private nextId = 1;

    static getInstance(): MockUserRepository {
        if (!MockUserRepository.instance) {
            MockUserRepository.instance = new MockUserRepository();
        }
        return MockUserRepository.instance;
    }

    static bindToContainer(container: Container): void {
        const mockUser = MockUserRepository.getInstance();
        container.bind<IUserRepository>("UserRepository").toConstantValue(mockUser);
    }

    static configureInstance(config: Partial<MockUserRepositoryConfig>): void {
        const instance = MockUserRepository.getInstance();
        instance.config = { ...instance.config, ...config };
    }

    static resetInstance(): void {
        const instance = MockUserRepository.getInstance();
        instance.config = {
            shouldSimulateError: false,
            errorMessage: "Mock user repository error",
            delay: 0,
            hashPasswords: false,
        };
        instance.users = [];
        instance.nextId = 1;
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

    private hashPassword(password: string): string {
        // Simple mock hashing - just prefix with "hashed_" for testing
        return this.config.hashPasswords ? `hashed_${password}` : password;
    }

    async findAll(): Promise<User[]> {
        await this.simulateDelay();
        this.checkForError();

        // Return users without password field for safety
        return this.users.map((user) => ({
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            emailVerifiedAt: user.emailVerifiedAt,
        }));
    }

    async findById(id: number): Promise<User | undefined> {
        await this.simulateDelay();
        this.checkForError();

        const user = this.users.find((u) => u.id === id);
        if (!user) return undefined;

        // Return user without password field for safety
        return {
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            emailVerifiedAt: user.emailVerifiedAt,
        };
    }

    async findByEmail(email: string): Promise<User | undefined> {
        await this.simulateDelay();
        this.checkForError();

        const user = this.users.find((u) => u.email === email);
        if (!user) return undefined;

        // Include password for authentication purposes
        return { ...user };
    }

    async create(data: CreateUserDto): Promise<User> {
        await this.simulateDelay();
        this.checkForError();

        const hashedPassword = this.hashPassword(data.password);
        const newUser: User = {
            id: this.nextId++,
            email: data.email,
            password: hashedPassword,
            emailVerified: false,
            emailVerifiedAt: null,
        };

        this.users.push(newUser);

        // Return user without password field
        return {
            id: newUser.id,
            email: newUser.email,
            emailVerified: newUser.emailVerified,
            emailVerifiedAt: newUser.emailVerifiedAt,
        };
    }

    async update(id: number, data: Partial<CreateUserDto>): Promise<User | undefined> {
        await this.simulateDelay();
        this.checkForError();

        const userIndex = this.users.findIndex((u) => u.id === id);
        if (userIndex === -1) return undefined;

        const updates: Partial<User> = {};
        if (data.email !== undefined) updates.email = data.email;
        if (data.password !== undefined) updates.password = this.hashPassword(data.password);

        this.users[userIndex] = {
            ...this.users[userIndex],
            ...updates,
        };

        // Return user without password field
        return {
            id: this.users[userIndex].id,
            email: this.users[userIndex].email,
            emailVerified: this.users[userIndex].emailVerified,
            emailVerifiedAt: this.users[userIndex].emailVerifiedAt,
        };
    }

    async delete(id: number): Promise<boolean> {
        await this.simulateDelay();
        this.checkForError();

        const userIndex = this.users.findIndex((u) => u.id === id);
        if (userIndex === -1) return false;

        this.users.splice(userIndex, 1);
        return true;
    }

    async markEmailAsVerified(id: number): Promise<void> {
        await this.simulateDelay();
        this.checkForError();

        const user = this.users.find((u) => u.id === id);
        if (user) {
            user.emailVerified = true;
            user.emailVerifiedAt = new Date();
        }
    }

    // Test helper methods
    seedUsers(users: User[]): void {
        this.users = [...users];
        this.nextId = Math.max(...users.map((u) => u.id), 0) + 1;
    }

    getStoredUsers(): User[] {
        return [...this.users];
    }

    clearUsers(): void {
        this.users = [];
        this.nextId = 1;
    }

    findUserWithPassword(email: string): User | undefined {
        return this.users.find((u) => u.email === email);
    }

    getConfig(): MockUserRepositoryConfig {
        return { ...this.config };
    }
}
