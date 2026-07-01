export interface SmsProvider {
  sendSms(phone: string, message: string): Promise<boolean>;
}

/**
 * AndroidGatewayProvider
 * 
 * Sends SMS via a local Android phone acting as an SMS Gateway.
 * The gateway exposes an HTTP API on the local network.
 */
class AndroidGatewayProvider implements SmsProvider {
  private url: string;
  private apiKey: string;

  constructor() {
    this.url = process.env.SMS_GATEWAY_URL || "";
    this.apiKey = process.env.SMS_GATEWAY_API_KEY || "";
  }

  public async sendSms(phone: string, message: string): Promise<boolean> {
    if (!this.url) {
      console.error("[SmsService] SMS_GATEWAY_URL is not configured.");
      return false;
    }

    return this.sendWithRetry(phone, message, 1);
  }

  private async sendWithRetry(phone: string, message: string, retries: number): Promise<boolean> {
    try {
      // AbortController for strict timeout handling (5 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to: phone,
          message: message,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gateway returned HTTP ${response.status}`);
      }

      return true;
    } catch (error: any) {
      console.error(`[SmsService] Failed to send SMS to ${phone}. Retries left: ${retries}. Reason: ${error.message}`);
      
      if (retries > 0) {
        return this.sendWithRetry(phone, message, retries - 1);
      }
      return false; // Graceful failure, no crash
    }
  }
}

/**
 * SmsService
 * 
 * Acts as the centralized entry point for sending SMS. 
 * Allows easy swapping of providers (Strategy pattern).
 */
class SmsService {
  private provider: SmsProvider;

  constructor(provider: SmsProvider) {
    this.provider = provider;
  }

  public async sendOtpSms(phone: string, otp: string): Promise<boolean> {
    const message = `Your IWIS verification code is: ${otp}. It expires in 5 minutes. Do not share this code.`;
    return this.provider.sendSms(phone, message);
  }
}

class DisabledSmsProvider implements SmsProvider {
  public async sendSms(phone: string, message: string): Promise<boolean> {
    console.log("[SmsService] SMS delivery disabled by environment config. Relying exclusively on Email.");
    return false;
  }
}

// ─── INSTANTIATION LOGIC ──────────────────────────────────────────────────
// Default behavior: 
// Development -> Android Gateway
// Production  -> Disabled (Email only)
let activeSmsProvider: SmsProvider;
const configProvider = process.env.SMS_PROVIDER;
const isProd = process.env.NODE_ENV === "production";

if (configProvider === "email" || (!configProvider && isProd)) {
  activeSmsProvider = new DisabledSmsProvider();
} else {
  activeSmsProvider = new AndroidGatewayProvider();
}

export const smsService = new SmsService(activeSmsProvider);
