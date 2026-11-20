export interface MailMessage {
  to: string;
  from: string;
  /** Where a reply to this email should go. */
  replyTo?: string;
  subject: string;
  /** Plain text body. */
  text: string;
}

/**
 * How email is sent. To change the email provider, write a new implementation of this
 * interface and wire it in `server.ts`. Nothing else needs to change.
 */
export interface Mailer {
  /** Resolves when the provider has accepted the message. Rejects if it could not be sent. */
  send(message: MailMessage): Promise<void>;
}
