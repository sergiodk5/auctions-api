import { Container } from "inversify";
import { IMailerService } from "../../../src/services/IMailerService";

export interface MockMailerConfig {
    shouldSimulateError: boolean;
    errorMessage: string;
    delay: number;
}

export class MockMailerService implements IMailerService {
    private static instance: MockMailerService;
    private config: MockMailerConfig = {
        shouldSimulateError: false,
        errorMessage: "Mock mailer error",
        delay: 0,
    };
    private sentEmails: {
        to: string;
        subject: string;
        body: string;
        timestamp: Date;
    }[] = [];

    static getInstance(): MockMailerService {
        if (!MockMailerService.instance) {
            MockMailerService.instance = new MockMailerService();
        }
        return MockMailerService.instance;
    }

    static bindToContainer(container: Container): void {
        const mockMailer = MockMailerService.getInstance();
        container.bind<IMailerService>("MailerService").toConstantValue(mockMailer);
    }

    static configureInstance(config: Partial<MockMailerConfig>): void {
        const instance = MockMailerService.getInstance();
        instance.config = { ...instance.config, ...config };
    }

    static resetInstance(): void {
        const instance = MockMailerService.getInstance();
        instance.config = {
            shouldSimulateError: false,
            errorMessage: "Mock mailer error",
            delay: 0,
        };
        instance.sentEmails = [];
    }

    async sendEmail(to: string, subject: string, body: string): Promise<void> {
        if (this.config.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.config.delay));
        }

        if (this.config.shouldSimulateError) {
            throw new Error(this.config.errorMessage);
        }

        this.sentEmails.push({
            to,
            subject,
            body,
            timestamp: new Date(),
        });
    }

    async sendWelcomeEmail(to: string, verificationLink: string): Promise<void> {
        return this.sendEmail(to, "Welcome!", `Welcome to our platform! Please verify your email: ${verificationLink}`);
    }

    async sendPasswordReset(to: string, resetLink: string): Promise<void> {
        return this.sendEmail(to, "Password Reset", `Reset your password using this link: ${resetLink}`);
    }

    // Test helper methods
    getSentEmails(): {
        to: string;
        subject: string;
        body: string;
        timestamp: Date;
    }[] {
        return [...this.sentEmails];
    }

    getEmailsSentTo(email: string): {
        to: string;
        subject: string;
        body: string;
        timestamp: Date;
    }[] {
        return this.sentEmails.filter((e) => e.to === email);
    }

    clearSentEmails(): void {
        this.sentEmails = [];
    }

    getConfig(): MockMailerConfig {
        return { ...this.config };
    }
}
