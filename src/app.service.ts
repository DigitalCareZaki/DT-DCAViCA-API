import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RtcRole, RtcTokenBuilder } from "agora-token";
import { AppError } from 'src/errors';

@Injectable()
export class AppService {
    constructor(private readonly config: ConfigService) {
        console.log('FIREBASE_SERVICE_ACCOUNT_JSON:', this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON'));

    }

    public async createAgoraToken(channelName: string, userId: string) {
        const appId = this.config.get<string>("b03a1cbf5d3e43ff973a26d84a726f85");
        const appCertificate = this.config.get<string>("3996161afc7c4d848285bde5143dd313");
        console.log("[AGORA][SERVICE][INPUT]", {
            channelName,
            userId,
            hasAppId: !!appId,
            hasAppCertificate: !!appCertificate,
        });
        if (!appId || !appCertificate) {
            console.error("[AGORA][SERVICE][CONFIG_MISSING]");
            throw new AppError(
                "AGORA_APP_ID and AGORA_APP_CERTIFICATE must be set in the environment variables.",
                500
            );
        }
        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        // Always numeric UID for cross-platform consistency
        const numericUid = this.generateNumericUid(userId);
        const agoraToken = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            numericUid,
            RtcRole.PUBLISHER,
            expirationTimeInSeconds,
            privilegeExpiredTs
        );
        console.log("[AGORA][SERVICE][TOKEN_BUILT]", {
            channelName,
            userId,
            numericUid,
            role: "PUBLISHER",
            expireAt: privilegeExpiredTs,
            tokenPrefix: agoraToken?.slice(0, 18),
            tokenLen: agoraToken?.length,
        });
        if (!agoraToken) {
            console.error("[AGORA][SERVICE][TOKEN_BUILD_FAILED]", {
                channelName,
                userId,
                numericUid,
            });
            throw new AppError("Failed to generate Agora token", 500);
        }
        return { agoraToken, numericUid };
    }
    private generateNumericUid(userId: string): number {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // 32-bit int
        }
        return Math.abs(hash) || 1; // avoid uid=0
    }
}