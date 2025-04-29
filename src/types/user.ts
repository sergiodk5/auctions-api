export interface User {
    id: number;
    email: string;
    password?: string;
}

export interface CreateUserDto {
    email: string;
    password: string;
}

export interface UpdateUserDto {
    email?: string;
    password?: string;
}
