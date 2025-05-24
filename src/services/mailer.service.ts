import { MAILER_FROM_DOMAIN } from "@/config/env";
import { TYPES } from "@/di/types";
import { IMailerService } from "@/services/IMailerService";
import { inject, injectable } from "inversify";
import { type Transporter } from "nodemailer";

@injectable()
export class MailerService implements IMailerService {
    constructor(
        @inject(TYPES.MailerTransporter)
        private readonly transporter: Transporter,
    ) {}

    public async sendWelcomeEmail(to: string, verificationLink: string): Promise<void> {
        await this.transporter.sendMail({
            from: `"Welcome to Auctions Platform" <no-reply@${MAILER_FROM_DOMAIN}>`,
            to,
            subject: "Welcome! Please verify your email address",
            text: `Welcome to our auctions platform! Please verify your email address by visiting: ${verificationLink}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to Auctions Platform!</h2>
                    <p>Thank you for registering with us. To complete your registration, please verify your email address by clicking the link below:</p>
                    <p style="margin: 20px 0;">
                        <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </p>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666;">${verificationLink}</p>
                    <p>This verification link will remain valid until you verify your email or request a new one.</p>
                    <p>If you didn't create an account with us, please ignore this email.</p>
                </div>
            `,
        });
    }

    public async sendPasswordReset(to: string, resetLink: string): Promise<void> {
        // TODO: get the mailer domain from config instead.
        await this.transporter.sendMail({
            from: `"No Reply" <no-reply@${MAILER_FROM_DOMAIN}>`,
            to,
            subject: "Password Reset Request",
            text: `Reset your password by visiting: ${resetLink}`,
            html: `<p>Reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
        });
    }
}
