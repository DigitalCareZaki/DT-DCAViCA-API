import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AppService } from "./app.service";
import { JwtGuard } from "./auth/guards";
import { UserRes } from "@types";
import { GetUser } from "./auth/decorators";
import { Request } from "express";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get('/')
    public health() {
        return {
            status: 'running',
            availableRoutes: [],
        };
    }

    @UseGuards(JwtGuard)
    @Post('/agora/token')
    public async createAgoraToken(
        @Body() data: any,
        @GetUser() user: UserRes,
        @Req() req: Request
    ) {
        const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const channelName = String(data?.channelName || "").trim();
        const userAgent = String(req.headers["user-agent"] || "");
        const isMobileHeader = String(req.headers["ismobile"] || "");
        const platformByUA = /Android|webOS|iPhone|iOS|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
            ? "mobile"
            : "desktop";
        console.log("[AGORA][TOKEN][REQ]", {
            requestId,
            userId: user?.id,
            channelName,
            userAgent,
            isMobileHeader,
            platformByUA,
            body: data,
        });
        if (!channelName) {
            console.error("[AGORA][TOKEN][BAD_REQUEST]", { requestId, userId: user?.id, channelName });
            throw new Error("channelName is required");
        }
        const result = await this.appService.createAgoraToken(channelName, user.id);
        console.log("[AGORA][TOKEN][RES]", {
            requestId,
            userId: user?.id,
            channelName,
            numericUid: result?.numericUid,
            tokenPrefix: result?.agoraToken?.slice(0, 18), // never log full token
            tokenLen: result?.agoraToken?.length,
        });
        return result;
    }
}