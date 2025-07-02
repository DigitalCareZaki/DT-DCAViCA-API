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
    public async createAgoraToken(@Body() data: any, @GetUser() user: UserRes, @Req() req: Request) {

        const { channelName } = data;

        console.log('req.agent >>>>>>>>>>>> ', req.headers['user-agent']);

        // Extract platform info from user agent
        const userAgent = req.headers['user-agent'];
        const platform = userAgent
            ? /Android|webOS|iPhone|iOS|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
                ? 'mobile'
                : 'desktop'
            : 'unknown';

        console.log('Requested platform:', platform);

        return this.appService.createAgoraToken(channelName, user.id, platform);
    }
}