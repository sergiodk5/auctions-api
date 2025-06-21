import { injectable } from "inversify";
import nodemailer from "nodemailer";

/**
 * Test-specific mailer transporter that doesn't actually send emails
 */
@injectable()
export class TestMailerTransporter {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Create a test transporter that doesn't actually send emails
        this.transporter = nodemailer.createTransport({
            jsonTransport: true,
        });

        console.log("🔧 TestMailerTransporter: Initialized with test transporter");
    }

    /**
     * Get the underlying transporter (for compatibility with nodemailer.Transporter interface)
     */
    public getTransporter(): nodemailer.Transporter {
        return this.transporter;
    }

    // Implement the nodemailer.Transporter interface methods
    public sendMail(mailOptions: any): Promise<any> {
        console.log("🔧 TestMailerTransporter: Mock sending email:", mailOptions.to);
        return Promise.resolve({
            messageId: `test-${Date.now()}@test.email`,
            response: "250 Message queued as test",
            accepted: [mailOptions.to],
            rejected: [],
        });
    }

    public verify(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public close(): void {
        // Nothing to close for test transporter
    }
}

/**
 * Test helper for email functionality in tests
 * Tracks sent emails and provides testing utilities
 */

interface SentEmail {
    to: string;
    from?: string;
    subject?: string;
    text?: string;
    html?: string;
    sentAt: Date;
    [key: string]: any;
}

export class TestMailerHelper {
    private sentEmails: SentEmail[] = [];

    /**
     * Mock sendMail method that tracks sent emails
     */
    sendMail(mailOptions: any): Promise<any> {
        this.sentEmails.push({
            ...mailOptions,
            sentAt: new Date(),
        });

        return Promise.resolve({
            messageId: `test-${Date.now()}@test.email`,
            response: "250 Message queued as test",
            accepted: [mailOptions.to],
            rejected: [],
        });
    }

    /**
     * Get all sent emails
     */
    getSentEmails(): SentEmail[] {
        return JSON.parse(JSON.stringify(this.sentEmails)) as SentEmail[];
    }

    /**
     * Get emails sent to a specific recipient
     */
    getEmailsSentTo(email: string): SentEmail[] {
        return this.sentEmails.filter((mail) => mail.to === email);
    }

    /**
     * Clear all tracked emails
     */
    clearSentEmails(): void {
        this.sentEmails = [];
    }

    /**
     * Reset the helper
     */
    reset(): void {
        this.clearSentEmails();
    }

    /**
     * Verify functionality
     */
    verify(): Promise<boolean> {
        return Promise.resolve(true);
    }

    /**
     * Close functionality
     */
    close(): void {
        // Nothing to close for test helper
    }
}
