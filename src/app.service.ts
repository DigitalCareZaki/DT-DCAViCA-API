import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RtcRole, RtcTokenBuilder } from "agora-token";
import { AppError } from 'src/errors';

@Injectable()
export class AppService {
    constructor(private readonly config: ConfigService) { }

    public async createAgoraToken(channelName: string, userId: string) {
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

        // Use buildTokenWithUserAccount for string user IDs
        const agoraToken = RtcTokenBuilder.buildTokenWithUserAccount(
            appId,
            appCertificate,
            channelName,
            userId,
            RtcRole.PUBLISHER,
            expirationTimeInSeconds,
            privilegeExpiredTs
        );

        console.log(" channelName>>>>>>>>>>>>>>>>>>>> ", channelName);
        console.log(" userId>>>>>>>>>>>>>>>>>>>> ", userId);
        console.log(" RtcRole.PUBLISHER>>>>>>>>>>>>>>>>>>>> ", RtcRole.PUBLISHER);
        console.log(" expirationTimeInSeconds>>>>>>>>>>>>>>>>>>>> ", expirationTimeInSeconds);
        console.log(" privilegeExpiredTs>>>>>>>>>>>>>>>>>>>> ", privilegeExpiredTs);

        if (!agoraToken) {
            throw new AppError('Failed to generate Agora token', 500);
        }

        return { agoraToken };
    }
}