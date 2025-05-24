export interface IMailerService {
    sendWelcome?(to: string, data: any): Promise<void>;
    sendPasswordReset(to: string, resetLink: string): Promise<void>;
}
