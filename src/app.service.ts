import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RtcRole, RtcTokenBuilder } from "agora-token";
import { AppError } from 'src/errors';

@Injectable()
export class AppService {
    constructor(private readonly config: ConfigService) {
        console.log('FIREBASE_SERVICE_ACCOUNT_JSON:', this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON'));

    }

    public async createAgoraToken(channelName: string, userId: string, platform: string) {
        const appId = this.config.get<string>('AGORA_APP_ID');
        const appCertificate = this.config.get<string>('AGORA_APP_CERTIFICATE');

        console.log('appId:', appId);
        console.log('appCertificate:', appCertificate);

        if (!appId || !appCertificate) {
            throw new AppError('AGORA_APP_ID and AGORA_APP_CERTIFICATE must be set in the environment variables.', 500);
        }

        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        let agoraToken, numericUid;

        if (platform != 'desktop') {
            // Use numeric UID for iOS
            numericUid = this.generateNumericUid(userId);
            agoraToken = RtcTokenBuilder.buildTokenWithUid(
                appId,
                appCertificate,
                channelName,
                numericUid,
                RtcRole.PUBLISHER,
                expirationTimeInSeconds,
                privilegeExpiredTs
            );
        } else {

            // Use buildTokenWithUserAccount for string user IDs
            agoraToken = RtcTokenBuilder.buildTokenWithUserAccount(
                appId,
                appCertificate,
                channelName,
                userId,
                RtcRole.PUBLISHER,
                expirationTimeInSeconds,
                privilegeExpiredTs
            );
        }

        console.log(" channelName>>>>>>>>>>>>>>>>>>>> ", channelName);
        console.log(" userId>>>>>>>>>>>>>>>>>>>> ", userId);
        console.log(" RtcRole.PUBLISHER>>>>>>>>>>>>>>>>>>>> ", RtcRole.PUBLISHER);
        console.log(" expirationTimeInSeconds>>>>>>>>>>>>>>>>>>>> ", expirationTimeInSeconds);
        console.log(" privilegeExpiredTs>>>>>>>>>>>>>>>>>>>> ", privilegeExpiredTs);

        if (!agoraToken) {
            throw new AppError('Failed to generate Agora token', 500);
        }

        return { agoraToken, numericUid };
    }

    private generateNumericUid(userId: string): number {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}