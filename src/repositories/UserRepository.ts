import { db } from "@/config/database";
import { usersTable } from "@/db/usersSchema";
import { eq } from "drizzle-orm";
import { IUserRepository } from "./IUserRepository";
import { CreateUserDto, User } from "@/types/user";
import { hashPassword } from "@/utils/password";

export class UserRepository implements IUserRepository {
    async findAll(): Promise<User[]> {
        const users = await db.select().from(usersTable);
        return users;
    }

    async findById(id: number): Promise<User | undefined> {
        const [user] = await db
            .select({ id: usersTable.id, email: usersTable.email })
            .from(usersTable)
            .where(eq(usersTable.id, id));
        return user;
    }

    async findByEmail(email: string): Promise<User | undefined> {
        const [user] = await db
            .select({ id: usersTable.id, email: usersTable.email })
            .from(usersTable)
            .where(eq(usersTable.email, email));
        return user;
    }

    async create(data: CreateUserDto): Promise<User> {
        const hashed = await hashPassword(data.password);
        const [user] = await db
            .insert(usersTable)
            .values({ email: data.email, password: hashed })
            .returning({ id: usersTable.id, email: usersTable.email });
        return user;
    }

    async update(id: number, data: Partial<CreateUserDto>): Promise<User | undefined> {
        const [user] = await db
            .update(usersTable)
            .set(data)
            .where(eq(usersTable.id, id))
            .returning({ id: usersTable.id, email: usersTable.email });
        return user;
    }

    async delete(id: number): Promise<boolean> {
        const result = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });

        return !!result;
    }
}
