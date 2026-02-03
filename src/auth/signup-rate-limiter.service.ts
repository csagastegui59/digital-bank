import { Injectable } from '@nestjs/common';

@Injectable()
export class SignupRateLimiterService {
  private lastSignupTime: Date | null = null;
  private readonly COOLDOWN_MINUTES = 15;

  getLastSignupTime(): Date | null {
    return this.lastSignupTime;
  }

  recordSignup(): void {
    this.lastSignupTime = new Date();
  }

  canSignup(): boolean {
    if (!this.lastSignupTime) {
      return true;
    }

    const now = new Date();
    const diffMs = now.getTime() - this.lastSignupTime.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    return diffMinutes >= this.COOLDOWN_MINUTES;
  }

  getRemainingSeconds(): number {
    if (!this.lastSignupTime || this.canSignup()) {
      return 0;
    }

    const now = new Date();
    const diffMs = now.getTime() - this.lastSignupTime.getTime();
    const elapsedSeconds = Math.floor(diffMs / 1000);
    const totalCooldownSeconds = this.COOLDOWN_MINUTES * 60;
    
    return Math.max(0, totalCooldownSeconds - elapsedSeconds);
  }

  getStatus() {
    const canSignup = this.canSignup();
    const remainingSeconds = this.getRemainingSeconds();
    const serverTime = new Date();

    return {
      canSignup,
      remainingSeconds,
      serverTime: serverTime.toISOString(),
      lastSignupTime: this.lastSignupTime?.toISOString() || null,
      cooldownMinutes: this.COOLDOWN_MINUTES,
    };
  }
}
