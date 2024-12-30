import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import type { CitiesProps, CountriesProps } from './types';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  public async getCountries(): Promise<CountriesProps[]> {
    return this.prisma.country.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  public async getCountryById(countryId: string): Promise<CountriesProps> {
    return await this.prisma.country.findUnique({
      where: {
        id: countryId,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  public async getCities(): Promise<CitiesProps[]> {
    return this.prisma.city.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  public async getCityById(cityId: string): Promise<CitiesProps> {
    return await this.prisma.city.findUnique({
      where: {
        id: cityId,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  public async createLocation(
    address: string,
    cityId: string,
  ): Promise<string> {
    return (
      await this.prisma.location.create({
        data: {
          city_id: cityId,
          address: address,
        },
      })
    ).id;
  }
}
