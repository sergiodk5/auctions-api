import { SENDGRID_API_KEY } from "@/config/env";
import { IMailer } from "@/services/IMailer";
import { injectable } from "inversify";
import nodemailer from "nodemailer";
import nodemailerSendgrid from "nodemailer-sendgrid";

@injectable()
export class SendGridMailer implements IMailer {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport(
            nodemailerSendgrid({
                apiKey: SENDGRID_API_KEY,
            }),
        );
    }

    public async sendPasswordReset(to: string, resetLink: string): Promise<void> {
        await this.transporter.sendMail({
            from: `"MyApp Support" <support@myapp.com>`,
            to,
            subject: "Reset your password",
            text: `Reset link: ${resetLink}`,
            html: `<p>Reset link: <a href="${resetLink}">${resetLink}</a></p>`,
        });
    }
}
