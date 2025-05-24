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

    public async sendPasswordReset(to: string, resetLink: string): Promise<void> {
        // TODO: get the mailer domain from config instead.
        await this.transporter.sendMail({
            from: `"No Reply" <no-reply@${process.env.MAILER_FROM_DOMAIN}>`,
            to,
            subject: "Password Reset Request",
            text: `Reset your password by visiting: ${resetLink}`,
            html: `<p>Reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
        });
    }
}
