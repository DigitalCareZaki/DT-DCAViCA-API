import { readFileSync, writeFileSync } from 'fs';

import { HttpStatus, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { AppError } from 'src/errors';
import { PrismaService } from 'src/prisma/prisma.service';

import type { VLAllPatients, VLSinglePatientECGData } from './types';

@Injectable()
export class VivalinkService {
  constructor(private prisma: PrismaService) {}

  private vlCredentails = {
    baseUrl: process.env.VL_BASE_URL ?? 'https://vcloud2.vivalink.com',
    tenantId: process.env.VL_TENANT_ID,
    apiKey: process.env.VL_PROCESS_KEY,
    token: this.cronFetchToken(),
  };

  // private readToken(): string {
  //   const tokenData = JSON.parse(readFileSync('vlToken.json', 'utf-8'));

  //   return tokenData?.token ?? '';
  // }

  private updateToken(newToken: string): void {
    const tokenData = { token: newToken };

    writeFileSync('vlToken.json', JSON.stringify(tokenData, null, 2));
    this.vlCredentails.token = newToken;
  }

  // Cron to fetch token from the API
  // Runs every day at 00:00 UTC - Token expiry time is 72 hours
  @Cron('0 0 * * *', {
    name: 'fetchToken',
    timeZone: 'UTC',
  })
  handleCron() {
    (async () => {
      await this.cronFetchToken();
    })();
  }

  private async cronFetchToken() {
    try {
      const res = await fetch(this.vlCredentails.baseUrl + '/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: this.vlCredentails.tenantId,
          key: this.vlCredentails.apiKey,
        }),
      }); 

      const result = await res.json();
      console.log('result?.data?.token >>>>>>>> ', result?.data?.token);
      return result?.data?.token;

      // if (result.data.token) {
        console.log('result.data.token >>>>>>>> ', result.data.token);
        // this.updateToken(result.data.token);
      // } else {
      //   console.log('Error fetching token');
      // }
    } catch (err) {
      console.log('cronFetchToken -> Error fetching token', err);
    }
  }

  public async getPatients(): Promise<VLAllPatients> {
    const request = new Request(
      this.vlCredentails.baseUrl + `/tenants/${this.vlCredentails.tenantId}`,
      {
        headers: {
          Authorization: this.vlCredentails.token,
          Accept: '*/*',
          'Content-Type': 'application/json',
        },
      },
    );

    const res = await fetch(request);

    if (res.status !== 200) {
      throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const result = await res.json();

    console.log('getPatients from VL -> result >>>>>>>> ', result);

    // VL sends a response of 200 even on bad response
    // Need to check inside result for code
    if (result?.code !== 200) {
      throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
    }

    return result?.data?.mappings ?? {};
  }

  public async getPatientData(
    patchSn: string,
  ): Promise<VLSinglePatientECGData> {
    // const mainRes = await fetch(
    //   this.vlCredentails.baseUrl +
    //     `/tenants/${this.vlCredentails.tenantId}/data?patchSn=${patchSn}&topOne=true&order=descending`,
    //   {
    //     headers: {
    //       Authorization: this.vlCredentails.token,
    //       'Access-Control-Allow-Origin': '*',
    //     },
    //   },
    // );
    // if (mainRes.status !== 200) {
    //   throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
    // }
    // const mainResult = await mainRes.json();

    const startTime = 1738294516229 - 60000;
    const endTime = 1738294516229;

    const res = await fetch(
      this.vlCredentails.baseUrl +
        `/tenants/${this.vlCredentails.tenantId}/data?patchSn=${patchSn}&startTime=${startTime}&endTime=${endTime}&denoise=true`,
      {
        headers: {
          Authorization: this.vlCredentails.token,
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
    if (res.status !== 200) {
      throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const result = await res.json();

    console.log('result >>>>>>>> ', result);

    // const modifiedPatchSn = patchSn.replace(/\//g, '_');
    // const filePath = path.join(__dirname, `${modifiedPatchSn}.json`);
    // // Convert the result to JSON string
    // const jsonData = JSON.stringify(result, null, 2);

    // // Write the data to a file
    // fs.writeFile(filePath, jsonData, (err) => {
    //   if (err) {
    //     console.error('Error writing file:', err);
    //   } else {
    //     console.log('File saved successfully at', filePath);
    //   }
    // });

    // old code
    const ecgData = result?.data?.list.map((v) => v.vitals.ecg);

    

    const magnification = result?.data?.list[0]?.vitals?.magnification || 1000;
    const samplingFrequency = result?.data?.list[0]?.vitals?.sf || 128;
    const timePerPoint = 1000 / samplingFrequency; // 7.8125 ms
    // For a 1-second recording with 128 points, the time values would be:
    // Point 0: 0 * 7.8125 = 0 ms
    // Point 1: 1 * 7.8125 = 7.8125 ms
    // Point 2: 2 * 7.8125 = 15.625 ms
    // ...
    // Point 127: 127 * 7.8125 = 992.1875 ms
    const processedEcg = ecgData.map((value, index) => {
      return value.map((v2, i2) => ({
        time: (i2 * timePerPoint) / 1000 + index,
        mv: v2 / magnification,
      }));
    });

    return {
      ecg: processedEcg,
      samplingFrequency,
      timePerPoint,
    };
  }
}
