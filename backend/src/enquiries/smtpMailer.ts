import nodemailer, { type Transporter } from 'nodemailer';
import type { Mailer, MailMessage } from './mailer';

interface Options {
  host: string;
  port: number;
  user?: string;
  password?: string;
}

/** Sends email through any SMTP server: Mailpit locally, a real provider in production. */
export class SmtpMailer implements Mailer {
  private readonly transporter: Transporter;

  constructor(options: Options) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      auth:
        options.user && options.password
          ? { user: options.user, pass: options.password }
          : undefined,
      // Fail quickly if the mail server is unreachable, so the customer is not left waiting.
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail(message);
  }
}
