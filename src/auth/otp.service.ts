import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly algorithm = 'sha1';
  private readonly digits = 6;

  public generateEncryptedOtp(): {
    otp: string;
    encryptedOtp: string;
  } {
    const secret = process.env.OTP_SECRET;
    if (!secret) throw new Error('OTP_SECRET is not defined');
    const otp = this.generateHOTP(secret);
    const encryptedOtp = this.encryptOtp(otp);

    return { otp, encryptedOtp };
  }

  private generateHOTP(secretKey: string): string {
    let counter = new Date(Date.now()).getTime();

    const buffer = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
      buffer[7 - i] = counter & 0xff;
      counter = counter >> 8;
    }

    const hmac = crypto.createHmac(this.algorithm, secretKey);
    hmac.update(buffer);
    const hmacResult = hmac.digest();

    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const code =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff);

    const otp = code % Math.pow(10, this.digits);
    return otp.toString().padStart(this.digits, '0');
  }

  public encryptOtp(otp: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(otp);
    return hash.digest('hex');
  }
}
