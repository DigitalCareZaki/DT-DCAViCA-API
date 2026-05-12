import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Site } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { VivalinkWebPortalTokenService } from 'src/vivalink/vivalink-webportal-token.service';

import { CreateSiteDto, UpdateSiteDto } from './dto';

export interface PaginationMeta {
    totalItems: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}


@Injectable()
export class SitesService {
    constructor(
        private prisma: PrismaService,
        private vlTokenService: VivalinkWebPortalTokenService,
    ) { }

    private get vlWebportalUrl(): string {
        return this.vlTokenService.getBaseUrl();
    }

    private get vlWebportalToken(): string {
        return this.vlTokenService.getToken();
    }

    async getAllSites(
        page: number = 1,
        limit: number = 10,
        branchId?: string,
    ): Promise<PaginatedResponse<Site>> {
        const skip = (page - 1) * limit;
        const where: Prisma.SiteWhereInput = branchId?.trim()
            ? { branchId: branchId.trim() }
            : {};

        const [data, totalItems] = await Promise.all([
            this.prisma.site.findMany({
                skip,
                take: limit,
                where,
                include: { branch: true },
            }),
            this.prisma.site.count({ where }),
        ]);
        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            data,
            pagination: {
                totalItems,
                perPage: limit,
                currentPage: page,
                totalPages,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null,
            },
        };
    }

    async getSiteById(id: string): Promise<Site> {
        const site = await this.prisma.site.findUnique({ where: { id } });
        if (!site) throw new NotFoundException('Site not found');
        return site;
    }

    async createSite(
        data: CreateSiteDto,
        userId: string,
        role: string,
    ): Promise<Site> {

        let branchId: string | null = null;

        // Super admin can pass any branchId
        if (role === 'SUPERADMIN' && data.branchId) {
            branchId = data.branchId;
        } else {
            // Other users will use their own branch
            const branch = await this.prisma.branch.findFirst({
                where: {
                    users: {
                        some: {
                            id: userId,
                        },
                    },
                },
                select: {
                    id: true,
                },
            });

            branchId = branch?.id ?? null;
        }

        const site = await this.prisma.site.create({
            data: {
                name: data.name,
                description: data.description,
                countryCode: data.countryCode,
                address: data.address,
                branchId,
            },
        });

        const siteVlRes = await this.createSiteVl(data);
        console.log('Response from sitevlcreate', siteVlRes);

        const vlSites = await this.getAllSitesVl();

        const vlSite = vlSites?.data?.find(
            (s: any) => s.name === data.name,
        );

        if (vlSite?._id) {
            return this.prisma.site.update({
                where: { id: site.id },
                data: { vivalinkSiteId: vlSite._id },
            });
        }

        return site;
    }

    async updateSiteById(id: string, data: UpdateSiteDto): Promise<Site> {
        const site = await this.prisma.site.findUnique({ where: { id } });
        if (!site) throw new NotFoundException('Site not found');

        if (site.vivalinkSiteId) {
            const res = await this.updateSiteVl(site.vivalinkSiteId, data);
            console.log("Update response from vl", res)
        }

        return this.prisma.site.update({ where: { id }, data });
    }

    async deleteSiteById(id: string): Promise<Site> {
        const site = await this.prisma.site.findUnique({ where: { id } });
        if (!site) throw new NotFoundException('Site not found');

        if (site.vivalinkSiteId) {
            await this.deleteSiteVl(site.vivalinkSiteId);
        }

        return this.prisma.site.delete({ where: { id } });
    }

    private async createSiteVl(data: CreateSiteDto) {
        const url = `${this.vlWebportalUrl}/sites`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.vlWebportalToken}`,
            },
            body: JSON.stringify(data),
        });
        return response.json();
    }

    private async getAllSitesVl() {
        const url = `${this.vlWebportalUrl}/sites`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${this.vlWebportalToken}` },
        });
        return response.json();
    }

    private async updateSiteVl(vlSiteId: string, data: UpdateSiteDto) {
        const url = `${this.vlWebportalUrl}/sites/${vlSiteId}`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.vlWebportalToken}`,
            },
            body: JSON.stringify(data),
        });
        return response.json();
    }

    private async deleteSiteVl(vlSiteId: string) {
        const url = `${this.vlWebportalUrl}/sites/${vlSiteId}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.vlWebportalToken}` },
        });
        return response.json();
    }
}
