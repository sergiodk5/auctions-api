export interface User {
    id: number;
    email: string;
    password?: string;
    emailVerified: boolean;
    emailVerifiedAt?: Date | null;
}

export interface CreateUserDto {
    email: string;
    password: string;
}

export interface UpdateUserDto {
    email?: string;
    password?: string;
}
