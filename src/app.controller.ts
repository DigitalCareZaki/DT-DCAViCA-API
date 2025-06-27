import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AppService } from "./app.service";
import { JwtGuard } from "./auth/guards";
import { UserRes } from "@types";
import { GetUser } from "./auth/decorators";

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
    public async createAgoraToken(@Body() data: any, @GetUser() user: UserRes) {
        const { channelName } = data;
        return this.appService.createAgoraToken(channelName, user.id);
    }
}