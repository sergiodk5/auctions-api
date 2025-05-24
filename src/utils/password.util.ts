import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        return hashedPassword;
    } catch (error) {
        if (process.env.NODE_ENV !== "test") {
            console.error("Error hashing password:", error);
        }
        throw new Error("Failed to hash password");
    }
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}
