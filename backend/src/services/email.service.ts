import nodemailer from "nodemailer";

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }

  public async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    return this.sendWithRetry(to, otp, 1);
  }

  private async sendWithRetry(to: string, otp: string, retries: number): Promise<boolean> {
    if (!this.transporter) {
      throw new Error("Transporter not initialized. Missing SMTP credentials.");
    }

    try {
      await this.transporter.sendMail({
        from: `"IWIS Green" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Your IWIS Verification Code",
        text: `Your IWIS verification code is: ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
        html: this.getOtpEmailTemplate(otp)
      });
      return true;
    } catch (error: any) {
      if (retries > 0) {
        return this.sendWithRetry(to, otp, retries - 1);
      }
      // Return the real SMTP error
      throw new Error(error.message || "Failed to send email");
    }
  }

  /**
   * Generates a professional HTML template for the OTP email.
   */
  private getOtpEmailTemplate(otp: string): string {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background-color: #0f0f0f; color: #ffffff; border-radius: 12px; border: 1px solid #262626;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #4ade80; margin: 0; font-size: 24px; font-weight: 700;">🌿 IWIS</h2>
          <p style="color: #a1a1aa; font-size: 14px; margin-top: 4px;">India Waste Intelligence System</p>
        </div>
        
        <div style="background-color: #18181b; padding: 24px; border-radius: 8px; text-align: center; border: 1px solid #27272a;">
          <h3 style="margin-top: 0; color: #e4e4e7; font-size: 18px; font-weight: 500;">Verification Code</h3>
          <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px;">Please use the following 6-digit code to complete your authentication. This code expires in <strong>5 minutes</strong>.</p>
          
          <div style="background-color: #27272a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4ade80; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="color: #ef4444; font-size: 12px; margin: 0; font-weight: 600;">⚠️ Do not share this code with anyone.</p>
        </div>
        
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #262626;">
          <p style="color: #71717a; font-size: 11px; margin: 0;">If you did not request this code, please ignore this email.</p>
          <p style="color: #52525b; font-size: 11px; margin-top: 8px;">&copy; ${new Date().getFullYear()} IWIS Green. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  public async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
    if (!this.transporter) {
      console.error("[EmailService] Transporter not initialized. Cannot send reset email.");
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"IWIS Green" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Reset your IWIS password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f0f0f;color:#fff;border-radius:16px;">
            <h2 style="color:#4ade80;margin-bottom:8px;">🌿 IWIS Green</h2>
            <h3 style="margin-top:0;">Password Reset Request</h3>
            <p style="color:#a3a3a3;">We received a request to reset your password. Click the button below to create a new one. This link expires in <strong style="color:#fff;">1 hour</strong>.</p>
            <a href="${resetLink}"
               style="display:inline-block;margin:24px 0;padding:14px 32px;background:linear-gradient(135deg,#4ade80,#06b6d4);color:#000;font-weight:700;border-radius:12px;text-decoration:none;font-size:16px;">
              Reset Password →
            </a>
            <p style="color:#737373;font-size:12px;">If you didn't request this, ignore this email — your password won't change.</p>
            <hr style="border-color:#262626;margin:24px 0;" />
            <p style="color:#525252;font-size:11px;">IWIS Green · Towards a greener planet</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error("[EmailService] Failed to send reset email", error);
      return false;
    }
  }
}

// Export as Singleton
export const emailService = new EmailService();
