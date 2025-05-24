export interface IMailerService {
    sendWelcomeEmail(to: string, verificationLink: string): Promise<void>;
    sendPasswordReset(to: string, resetLink: string): Promise<void>;
}
