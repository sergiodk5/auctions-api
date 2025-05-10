import { SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_SECURE, SMTP_USER } from "@/config/env";
import { IMailer } from "@/services/IMailer";
import { injectable } from "inversify";
import nodemailer, { Transporter } from "nodemailer";

@injectable()
export class LocalMailer implements IMailer {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: SMTP_SECURE,
            auth: SMTP_USER
                ? {
                      user: SMTP_USER,
                      pass: SMTP_PASS,
                  }
                : undefined,
        });
    }

    public async sendPasswordReset(to: string, resetLink: string): Promise<void> {
        await this.transporter.sendMail({
            from: `"No Reply" <no-reply@localhost>`,
            to,
            subject: "Password Reset Request",
            text: `Click to reset: ${resetLink}`,
            html: `<p>Click to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
        });
    }
}
