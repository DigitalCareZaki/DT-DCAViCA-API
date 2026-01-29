import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class VivalinkWebPortalTokenService implements OnModuleInit, OnModuleDestroy {
    private vlWebportalUrl = process.env.VL_WEBPORTAL_URL!;
    private vlAdminEmail = process.env.VL_ADMIN_EMAIL!;
    private vlAdminPassword = process.env.VL_ADMIN_PASSWORD!;

    private accessToken = '';
    private tokenLifetimeMinutes = 25;
    private tokenRefreshInterval: NodeJS.Timeout | null = null;

    async onModuleInit() {
        await this.refreshToken();
        this.startTokenRefreshInterval();
    }

    onModuleDestroy() {
        this.stopTokenRefreshInterval();
    }

    getToken(): string {
        return this.accessToken;
    }

    getBaseUrl(): string {
        return this.vlWebportalUrl;
    }

    async refreshToken(): Promise<string | undefined> {
        try {
            const url = `${this.vlWebportalUrl}/authentication`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    strategy: 'local',
                    email: this.vlAdminEmail,
                    password: this.vlAdminPassword,
                }),
            });

            const result = await response.json();
            this.accessToken = result?.accessToken ?? '';
            console.log('Vivalink WebPortal token refreshed successfully');
            return this.accessToken;
        } catch (error) {
            console.error('Failed to fetch Vivalink WebPortal token:', error);
            return undefined;
        }
    }

    setTokenLifetime(minutes: number) {
        this.tokenLifetimeMinutes = minutes;
        this.startTokenRefreshInterval();
    }

    getTokenLifetime(): number {
        return this.tokenLifetimeMinutes;
    }

    private startTokenRefreshInterval() {
        this.stopTokenRefreshInterval();
        this.tokenRefreshInterval = setInterval(
            async () => {
                await this.refreshToken();
            },
            this.tokenLifetimeMinutes * 60 * 1000,
        );
    }

    private stopTokenRefreshInterval() {
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
        }
    }
}
