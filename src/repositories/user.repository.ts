import { usersTable } from "@/db/users.schema";
import { TYPES } from "@/di/types";
import { type IDatabaseService } from "@/services/database.service";
import { CreateUserDto, User } from "@/types/user";
import { hashPassword } from "@/utils/password.util";
import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

export interface IUserRepository {
    findAll(): Promise<User[]>;
    findById(id: number): Promise<User | undefined>;
    findByEmail(email: string): Promise<User | undefined>;
    create(data: CreateUserDto): Promise<User>;
    update(id: number, data: Partial<CreateUserDto>): Promise<User | undefined>;
    delete(id: number): Promise<boolean>;
    markEmailAsVerified(id: number): Promise<void>;
}

@injectable()
export default class UserRepository implements IUserRepository {
    constructor(@inject(TYPES.IDatabaseService) private readonly databaseService: IDatabaseService) {}

    async findAll(): Promise<User[]> {
        const users = await this.databaseService.db
            .select({
                id: usersTable.id,
                email: usersTable.email,
                emailVerified: usersTable.emailVerified,
                emailVerifiedAt: usersTable.emailVerifiedAt,
            })
            .from(usersTable);
        return users;
    }

    async findById(id: number): Promise<User | undefined> {
        const [user] = await this.databaseService.db
            .select({
                id: usersTable.id,
                email: usersTable.email,
                emailVerified: usersTable.emailVerified,
                emailVerifiedAt: usersTable.emailVerifiedAt,
            })
            .from(usersTable)
            .where(eq(usersTable.id, id));
        return user;
    }

    async findByEmail(email: string): Promise<User | undefined> {
        const [user] = await this.databaseService.db
            .select({
                id: usersTable.id,
                email: usersTable.email,
                password: usersTable.password,
                emailVerified: usersTable.emailVerified,
                emailVerifiedAt: usersTable.emailVerifiedAt,
            })
            .from(usersTable)
            .where(eq(usersTable.email, email));
        return user;
    }

    async create(data: CreateUserDto): Promise<User> {
        const hashed = await hashPassword(data.password);
        const [user] = await this.databaseService.db
            .insert(usersTable)
            .values({ email: data.email, password: hashed })
            .returning({
                id: usersTable.id,
                email: usersTable.email,
                emailVerified: usersTable.emailVerified,
                emailVerifiedAt: usersTable.emailVerifiedAt,
            });
        return user;
    }

    async update(id: number, data: Partial<CreateUserDto>): Promise<User | undefined> {
        const [user] = await this.databaseService.db
            .update(usersTable)
            .set(data)
            .where(eq(usersTable.id, id))
            .returning({
                id: usersTable.id,
                email: usersTable.email,
                emailVerified: usersTable.emailVerified,
                emailVerifiedAt: usersTable.emailVerifiedAt,
            });
        return user;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.databaseService.db
            .delete(usersTable)
            .where(eq(usersTable.id, id))
            .returning({ id: usersTable.id });

        return !!result;
    }

    async markEmailAsVerified(id: number): Promise<void> {
        await this.databaseService.db
            .update(usersTable)
            .set({
                emailVerified: true,
                emailVerifiedAt: new Date(),
            })
            .where(eq(usersTable.id, id));
    }
}
