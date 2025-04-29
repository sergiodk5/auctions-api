import { CreateUserDto, User } from "@/types/user";

export interface IUserRepository {
    findAll(): Promise<User[]>;
    findById(id: number): Promise<User | undefined>;
    findByEmail(email: string): Promise<User | undefined>;
    create(data: CreateUserDto): Promise<User>;
    update(id: number, data: Partial<CreateUserDto>): Promise<User | undefined>;
    delete(id: number): Promise<boolean>;
}
