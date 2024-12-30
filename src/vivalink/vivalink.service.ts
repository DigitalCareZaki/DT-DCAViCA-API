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
    token: this.readToken(),
  };

  private readToken(): string {
    const tokenData = JSON.parse(readFileSync('vlToken.json', 'utf-8'));

    return tokenData?.token ?? '';
  }

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

        if (res.status === 200 && result?.code === 200) {
          this.updateToken(result.data.token);
        }
      } catch (err) {}
    })();
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
    const res = await fetch(
      this.vlCredentails.baseUrl +
        `/tenants/${this.vlCredentails.tenantId}/data?patchSn=${patchSn}&topOne=true&order=descending`,
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

    // const result = {
    //   code: 200,
    //   message: 'OK',
    //   data: {
    //     list: [
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090800860,
    //         collectTime: 1729090824510,
    //         receiveTime: 1729090845927,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 10.0,
    //           avRR: -10001.0,
    //           hr: 77,
    //           rwl: [70, -1, -1, -1, -1],
    //           rri: [781, 0, 0, 0, 0],
    //           acc: [
    //             { x: -805, y: 1614, z: 905 },
    //             { x: -727, y: 1683, z: 903 },
    //             { x: -686, y: 1686, z: 986 },
    //             { x: -638, y: 1655, z: 972 },
    //             { x: -667, y: 1659, z: 935 },
    //           ],
    //           ecg: [
    //             16, 20, 24, 27, 29, 16, 0, -14, -34, -52, -55, -65, -68, -68,
    //             -69, -62, -55, -59, -48, -44, -41, -35, -36, -29, -24, -23, -25,
    //             -20, -28, -25, -19, -15, -18, -18, -18, -16, -17, -18, -17, -15,
    //             -21, -19, -20, -17, -21, -10, -13, -12, 7, 18, 20, 20, 31, 27,
    //             37, 21, 7, -7, -15, -27, -40, -44, -47, -44, -41, -44, -50, -15,
    //             127, 484, 522, 158, -248, -440, -338, -135, -44, -43, -44, -39,
    //             -35, -37, -35, -29, -27, -25, -21, -21, -21, -14, -3, -3, 11,
    //             24, 35, 41, 50, 64, 79, 98, 111, 115, 129, 137, 139, 142, 135,
    //             126, 117, 85, 61, 42, 13, 4, -6, -16, -27, -28, -27, -29, -33,
    //             -29, -28, -28, -22, -26, -26, -24,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090801860,
    //         collectTime: 1729090824510,
    //         receiveTime: 1729090845927,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 10.0,
    //           avRR: -10001.0,
    //           hr: 78,
    //           rwl: [48, -1, -1, -1, -1],
    //           rri: [804, 0, 0, 0, 0],
    //           acc: [
    //             { x: -667, y: 1693, z: 939 },
    //             { x: -717, y: 1691, z: 911 },
    //             { x: -738, y: 1654, z: 962 },
    //             { x: -694, y: 1685, z: 889 },
    //             { x: -705, y: 1702, z: 941 },
    //           ],
    //           ecg: [
    //             -28, -27, -37, -34, -35, -38, -38, -39, -32, -33, -32, -29, -33,
    //             -31, -31, -27, -28, -24, -21, -24, -27, -24, -24, -22, -28, -23,
    //             -6, 11, 15, 11, 30, 24, 30, 23, 6, -8, -7, -24, -41, -43, -45,
    //             -49, -43, -45, -56, -42, 70, 386, 577, 273, -163, -450, -378,
    //             -186, -61, -48, -47, -44, -36, -39, -34, -36, -31, -40, -30,
    //             -26, -27, -17, -9, -7, 6, 10, 25, 33, 40, 62, 77, 96, 111, 124,
    //             136, 147, 148, 149, 145, 141, 126, 103, 77, 52, 33, 17, 0, -10,
    //             -23, -30, -31, -35, -32, -36, -34, -37, -30, -32, -27, -30, -31,
    //             -32, -34, -34, -38, -36, -34, -35, -32, -33, -30, -28, -32, -26,
    //             -31, -25, -25, -21, -26, -18, -24, -27,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090802860,
    //         collectTime: 1729090824511,
    //         receiveTime: 1729090845928,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 10.0,
    //           avRR: -10001.0,
    //           hr: 79,
    //           rwl: [26, -1, -1, -1, -1],
    //           rri: [828, 0, 0, 0, 0],
    //           acc: [
    //             { x: -676, y: 1684, z: 926 },
    //             { x: -693, y: 1678, z: 953 },
    //             { x: -675, y: 1713, z: 912 },
    //             { x: -679, y: 1655, z: 950 },
    //             { x: -657, y: 1664, z: 965 },
    //           ],
    //           ecg: [
    //             -33, -32, -29, -17, -8, -1, 5, 19, 32, 25, 33, 11, -4, -15, -25,
    //             -38, -49, -45, -49, -40, -49, -51, -51, -15, 136, 525, 549, 151,
    //             -274, -467, -374, -179, -47, -33, -31, -33, -25, -24, -24, -22,
    //             -22, -21, -20, -16, -11, -6, 6, 6, 20, 24, 33, 42, 52, 70, 78,
    //             96, 107, 115, 127, 127, 128, 121, 118, 113, 95, 79, 55, 34, 15,
    //             -2, -10, -16, -30, -31, -32, -31, -37, -34, -29, -20, -28, -26,
    //             -25, -27, -27, -29, -30, -34, -34, -35, -35, -27, -27, -26, -25,
    //             -29, -27, -29, -25, -27, -29, -24, -29, -27, -25, -20, -6, 7, 3,
    //             9, 19, 13, 22, 10, -7, -18, -20, -42, -49, -52, -50, -51, -49,
    //             -51, -69, -36, 133, 517,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090803860,
    //         collectTime: 1729090824511,
    //         receiveTime: 1729090845928,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 10.0,
    //           avRR: -10001.0,
    //           hr: 79,
    //           rwl: [0, 98, -1, -1, -1],
    //           rri: [828, 0, 0, 0, 0],
    //           acc: [
    //             { x: -638, y: 1660, z: 922 },
    //             { x: -697, y: 1689, z: 927 },
    //             { x: -731, y: 1644, z: 903 },
    //             { x: -715, y: 1692, z: 921 },
    //             { x: -707, y: 1677, z: 957 },
    //           ],
    //           ecg: [
    //             500, 122, -283, -442, -330, -111, -49, -41, -36, -32, -35, -32,
    //             -28, -28, -35, -27, -25, -16, -16, -13, -8, 1, 13, 23, 35, 50,
    //             60, 77, 95, 109, 121, 141, 142, 152, 158, 152, 150, 142, 115,
    //             82, 61, 25, 2, -8, -23, -31, -37, -45, -44, -44, -39, -40, -36,
    //             -35, -34, -34, -32, -32, -31, -31, -34, -31, -31, -34, -34, -39,
    //             -37, -38, -38, -35, -34, -31, -32, -32, -35, -35, -19, -4, 1, 2,
    //             10, 17, 9, 17, 2, -12, -21, -30, -48, -58, -60, -51, -52, -55,
    //             -50, -63, -32, 146, 554, 515, 124, -294, -447, -333, -110, -52,
    //             -44, -43, -38, -42, -35, -35, -38, -30, -26, -29, -22, -21, -10,
    //             -4, 4, 20, 27, 34, 54, 67, 88, 102,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090804860,
    //         collectTime: 1729090824511,
    //         receiveTime: 1729090845928,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 10.0,
    //           avRR: -10001.0,
    //           hr: 78,
    //           rwl: [64, -1, -1, -1, -1],
    //           rri: [796, 765, 0, 0, 0],
    //           acc: [
    //             { x: -746, y: 1675, z: 890 },
    //             { x: -720, y: 1661, z: 941 },
    //             { x: -693, y: 1649, z: 920 },
    //             { x: -708, y: 1653, z: 938 },
    //             { x: -727, y: 1682, z: 930 },
    //           ],
    //           ecg: [
    //             114, 131, 144, 156, 158, 164, 163, 155, 137, 112, 86, 55, 26, 7,
    //             -9, -23, -38, -37, -45, -38, -51, -52, -40, -42, -35, -38, -39,
    //             -41, -37, -38, -33, -37, -36, -44, -41, -44, -36, -44, -42, -40,
    //             -41, -37, -24, -8, -5, -6, 6, 10, 6, 17, -1, -20, -25, -27, -53,
    //             -57, -56, -52, -58, -52, -59, -70, -22, 164, 576, 507, 83, -330,
    //             -463, -345, -108, -56, -49, -45, -35, -38, -40, -35, -32, -30,
    //             -26, -26, -18, -12, -13, -1, 3, 17, 24, 44, 53, 63, 87, 106,
    //             124, 138, 152, 156, 167, 166, 164, 156, 138, 106, 75, 44, 16, 1,
    //             -18, -29, -34, -37, -43, -42, -43, -43, -43, -36, -34, -38, -39,
    //             -40, -43, -38, -38, -41, -45, -41,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090805860,
    //         collectTime: 1729090824511,
    //         receiveTime: 1729090845928,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 10.0,
    //           avRR: -10001.0,
    //           hr: 78,
    //           rwl: [28, 119, -1, -1, -1],
    //           rri: [734, 0, 0, 0, 0],
    //           acc: [
    //             { x: -760, y: 1681, z: 892 },
    //             { x: -695, y: 1633, z: 963 },
    //             { x: -769, y: 1704, z: 880 },
    //             { x: -749, y: 1694, z: 870 },
    //             { x: -772, y: 1650, z: 863 },
    //           ],
    //           ecg: [
    //             -37, -42, -47, -41, -47, -43, -27, -12, -8, -7, 8, 3, 16, 4,
    //             -10, -18, -32, -44, -54, -60, -57, -55, -57, -60, -68, -69, 39,
    //             341, 633, 352, -134, -467, -424, -251, -64, -44, -42, -44, -39,
    //             -37, -39, -39, -42, -30, -24, -18, -20, -6, -3, 4, 17, 28, 37,
    //             50, 64, 80, 96, 113, 131, 146, 156, 162, 166, 166, 159, 143,
    //             116, 95, 67, 36, 12, -7, -17, -24, -37, -42, -39, -47, -45, -40,
    //             -39, -35, -38, -38, -39, -38, -42, -41, -41, -40, -44, -40, -48,
    //             -42, -48, -47, -34, -14, -6, -11, -6, 7, 4, 12, -6, -23, -27,
    //             -34, -47, -63, -62, -64, -61, -61, -58, -77, -54, 99, 512, 595,
    //             201, -273, -490, -373, -132, -53, -61, -83,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090806860,
    //         collectTime: 1729090824512,
    //         receiveTime: 1729090845929,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 10.0,
    //           avRR: -10001.0,
    //           hr: 78,
    //           rwl: [82, -1, -1, -1, -1],
    //           rri: [718, 710, 0, 0, 0],
    //           acc: [
    //             { x: -772, y: 1597, z: 937 },
    //             { x: -792, y: 1616, z: 916 },
    //             { x: -769, y: 1658, z: 917 },
    //             { x: -716, y: 1648, z: 897 },
    //             { x: -758, y: 1672, z: 909 },
    //           ],
    //           ecg: [
    //             -28, -39, -36, -38, -42, -33, -27, -26, -37, -27, 0, -4, 1, 11,
    //             29, 39, 50, 64, 80, 107, 118, 137, 155, 162, 170, 173, 175, 167,
    //             145, 118, 84, 51, 27, 0, -14, -25, -31, -36, -44, -41, -40, -43,
    //             -38, -41, -34, -34, -37, -41, -42, -41, -37, -40, -41, -44, -52,
    //             -43, -40, -40, -41, -32, -14, -10, -4, 1, 14, 4, 5, 0, -5, -24,
    //             -29, -49, -61, -70, -80, -59, -50, -60, -76, -74, 31, 352, 685,
    //             392, -123, -504, -462, -293, -77, -56, -49, -45, -41, -43, -32,
    //             -34, -33, -29, -32, -28, -20, -7, -6, 0, 10, 25, 43, 54, 72, 84,
    //             100, 113, 150, 154, 166, 171, 172, 172, 170, 151, 127, 94, 64,
    //             35, 5, -6, -19, -24,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090807860,
    //         collectTime: 1729090824512,
    //         receiveTime: 1729090845929,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 9.0,
    //           avRR: -10001.0,
    //           hr: 77,
    //           rwl: [47, -1, -1, -1, -1],
    //           rri: [710, 0, 0, 0, 0],
    //           acc: [
    //             { x: -757, y: 1691, z: 859 },
    //             { x: -826, y: 1667, z: 863 },
    //             { x: -935, y: 1585, z: 748 },
    //             { x: -1008, y: 1641, z: 789 },
    //             { x: -1030, y: 1596, z: 923 },
    //           ],
    //           ecg: [
    //             -31, -42, -35, -40, -42, -42, -41, -36, -32, -34, -39, -45, -44,
    //             -44, -46, -46, -50, -47, -46, -46, -47, -50, -44, -45, -45, -25,
    //             -3, -5, -2, 12, 12, 19, 13, -11, -30, -25, -46, -71, -73, -60,
    //             -58, -65, -58, -73, -91, -1, 331, 691, 438, -89, -480, -445,
    //             -247, -68, -58, -55, -52, -43, -35, -36, -37, -34, -36, -26,
    //             -22, -16, -15, -5, 5, 20, 17, 39, 51, 58, 88, 111, 121, 146,
    //             147, 178, 180, 178, 180, 175, 159, 126, 99, 68, 35, 8, -10, -24,
    //             -34, -38, -47, -55, -69, -44, -45, -51, -85, -130, -32, -6, -19,
    //             -38, -40, -51, -39, -32, -37, -50, -44, -53, -41, -48, -44, -51,
    //             -32, -16, -9, -3, 16, 20, 24, 16, 0, -12,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090808860,
    //         collectTime: 1729090824512,
    //         receiveTime: 1729090845929,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 9.0,
    //           avRR: -10001.0,
    //           hr: 78,
    //           rwl: [13, 108, -1, -1, -1],
    //           rri: [726, 0, 0, 0, 0],
    //           acc: [
    //             { x: -943, y: 1635, z: 952 },
    //             { x: -824, y: 1482, z: 785 },
    //             { x: -973, y: 1544, z: 911 },
    //             { x: -1013, y: 1601, z: 893 },
    //             { x: -922, y: 1556, z: 825 },
    //           ],
    //           ecg: [
    //             -20, -30, -49, -54, -57, -59, -54, -56, -62, -92, -66, 144, 622,
    //             646, 174, -323, -525, -405, -160, -54, -47, -48, -37, -34, -26,
    //             -24, -29, -32, -28, -26, -19, -10, -5, -4, 1, 15, 21, 33, 55,
    //             79, 102, 121, 146, 161, 175, 178, 187, 187, 175, 162, 136, 103,
    //             73, 36, 0, -39, -38, -20, -24, -44, -46, -44, -55, -55, -50,
    //             -46, -42, -45, -49, -48, -51, -51, -52, -50, -52, -50, -46, -44,
    //             -43, -49, -44, -41, -43, -37, -34, -33, -8, 4, 7, 12, 22, 12,
    //             27, 14, 0, -19, -25, -48, -59, -64, -60, -64, -61, -61, -74,
    //             -94, 13, 394, 742, 453, -102, -514, -468, -269, -90, -56, -52,
    //             -47, -48, -44, -44, -46, -46, -35, -39, -32, -25, -20,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090809860,
    //         collectTime: 1729090824513,
    //         receiveTime: 1729090845929,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 9.0,
    //           avRR: -10001.0,
    //           hr: 78,
    //           rwl: [74, -1, -1, -1, -1],
    //           rri: [734, 742, 0, 0, 0],
    //           acc: [
    //             { x: -903, y: 1657, z: 986 },
    //             { x: -840, y: 1670, z: 829 },
    //             { x: -870, y: 1696, z: 835 },
    //             { x: -871, y: 1653, z: 847 },
    //             { x: -872, y: 1647, z: 842 },
    //           ],
    //           ecg: [
    //             -10, -3, 14, 22, 36, 51, 74, 92, 114, 133, 150, 162, 183, 194,
    //             200, 197, 190, 179, 144, 108, 73, 35, 9, -14, -30, -46, -48,
    //             -52, -53, -53, -53, -51, -51, -42, -47, -47, -48, -46, -48, -41,
    //             -41, -48, -48, -44, -42, -45, -46, -42, -54, -45, -44, -36, -14,
    //             -5, -13, 9, 16, 10, 25, -3, -17, -23, -30, -51, -59, -60, -64,
    //             -67, -65, -71, -97, -93, 93, 574, 692, 257, -298, -562, -440,
    //             -158, -61, -60, -54, -47, -43, -41, -46, -41, -36, -32, -28,
    //             -27, -17, -12, 0, 7, 21, 30, 46, 62, 87, 94, 124, 142, 169, 181,
    //             205, 216, 213, 208, 203, 172, 127, 90, 48, 25, -8, -28, -37,
    //             -51, -58, -60, -69, -71, -75, -69, -64, -60,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090810860,
    //         collectTime: 1729090824513,
    //         receiveTime: 1729090845929,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 9.0,
    //           avRR: -10001.0,
    //           hr: 79,
    //           rwl: [38, -1, -1, -1, -1],
    //           rri: [734, 0, 0, 0, 0],
    //           acc: [
    //             { x: -982, y: 1671, z: 717 },
    //             { x: -975, y: 1627, z: 598 },
    //             { x: -1045, y: 1625, z: 690 },
    //             { x: -995, y: 1636, z: 735 },
    //             { x: -1101, y: 1596, z: 766 },
    //           ],
    //           ecg: [
    //             -58, -52, -52, -47, -47, -53, -48, -52, -46, -51, -53, -47, -46,
    //             -46, -47, -34, -10, -7, -10, -1, 9, 13, 18, -3, -21, -23, -31,
    //             -57, -46, -54, -50, -56, -45, -55, -63, -27, 107, 455, 627, 257,
    //             -212, -475, -417, -250, -64, -46, -40, -31, -33, -19, -20, -26,
    //             -17, -16, -15, -13, 0, 4, 7, 8, 19, 28, 46, 50, 64, 82, 96, 114,
    //             125, 135, 142, 152, 149, 136, 129, 104, 81, 56, 25, 11, -9, -26,
    //             -40, -41, -42, -38, -41, -34, -36, -35, -25, -26, -23, -26, -22,
    //             -23, -22, -18, -24, -27, -31, -28, -27, -28, -31, -36, -41, -41,
    //             -28, -3, 0, 6, 14, 20, 10, 9, -1, -12, -27, -37, -53, -66, -71,
    //             -73, -68, -67, -57, -82,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090811860,
    //         collectTime: 1729090824513,
    //         receiveTime: 1729090845930,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 9.0,
    //           avRR: -10001.0,
    //           hr: 80,
    //           rwl: [3, 96, -1, -1, -1],
    //           rri: [718, 0, 0, 0, 0],
    //           acc: [
    //             { x: -1058, y: 1646, z: 637 },
    //             { x: -1089, y: 1674, z: 641 },
    //             { x: -1103, y: 1652, z: 759 },
    //             { x: -1047, y: 1561, z: 719 },
    //             { x: -1096, y: 1566, z: 711 },
    //           ],
    //           ecg: [
    //             -67, 111, 512, 570, 175, -279, -482, -378, -151, -60, -56, -54,
    //             -47, -37, -40, -38, -39, -31, -30, -22, -19, -9, -10, 8, 0, 16,
    //             24, 33, 53, 69, 93, 113, 129, 148, 164, 166, 169, 173, 171, 164,
    //             139, 105, 78, 46, 22, 0, -12, -26, -39, -42, -44, -60, -37, -37,
    //             -39, -41, -37, -36, -26, -37, -30, -27, -27, -40, -43, -36, -38,
    //             -44, -42, -42, -45, -45, -43, -39, -22, 8, 4, 5, 16, 13, 18, 4,
    //             1, -19, -23, -45, -56, -59, -64, -64, -61, -61, -73, -63, 60,
    //             380, 610, 276, -208, -484, -383, -150, -64, -67, -56, -52, -51,
    //             -50, -46, -51, -51, -47, -35, -36, -21, -43, -13, -51, 31, 15,
    //             27, 45, 70, 77, 72, 104, 155, 150,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090812860,
    //         collectTime: 1729090824513,
    //         receiveTime: 1729090845964,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090813,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 9.0,
    //           avRR: -10001.0,
    //           hr: 81,
    //           rwl: [63, -1, -1, -1, -1],
    //           rri: [726, 726, 0, 0, 0],
    //           acc: [
    //             { x: -1191, y: 1557, z: 747 },
    //             { x: -1121, y: 1543, z: 917 },
    //             { x: -1061, y: 1456, z: 987 },
    //             { x: -875, y: 1453, z: 831 },
    //             { x: -625, y: 1582, z: 1154 },
    //           ],
    //           ecg: [
    //             169, 174, 175, 169, 161, 138, 110, 79, 34, -2, -14, -43, -51,
    //             -63, -41, -51, -48, -52, -46, -42, -72, -27, -38, -18, -36, -34,
    //             -16, -38, -49, -50, -4, -26, -27, -67, -43, -5, 0, -21, -11,
    //             -20, -17, 5, 21, 17, -2, 42, 48, 26, 47, 24, 1, -4, -10, 6, -29,
    //             -68, 37, -31, -78, -83, 41, 56, 285, 668, 394, -56, -432, -396,
    //             -337, 65, -23, -7, 16, 5, -40, 22, -4, -6, -4, -38, 19, 12, -10,
    //             -14, 47, 13, 10, -98, -99, -263, 23, 51, 226, 97, 183, 164, 262,
    //             95, 54, 78, 394, 138, -22, -29, -205, 144, 131, -21, -46, -167,
    //             15, -41, -71, 31, 65, -15, -6, -28, 2, -37, -25, -5, -37, -38,
    //             -31, -61, -34, -37,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090813860,
    //         collectTime: 1729090844519,
    //         receiveTime: 1729090845964,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090833,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 9.0,
    //           avRR: -10001.0,
    //           hr: 82,
    //           rwl: [32, 125, -1, -1, -1],
    //           rri: [742, 0, 0, 0, 0],
    //           acc: [
    //             { x: -656, y: 1583, z: 961 },
    //             { x: -1005, y: 1661, z: 937 },
    //             { x: -877, y: 1556, z: 911 },
    //             { x: -960, y: 1544, z: 933 },
    //             { x: -912, y: 1502, z: 1031 },
    //           ],
    //           ecg: [
    //             -13, -42, -34, -46, -46, -48, -48, -55, -57, -59, -45, -39, -39,
    //             -36, -13, -14, -17, -13, -36, -43, -45, -59, -74, -79, -79, -72,
    //             -75, -73, -73, -51, 29, 240, 611, 360, -70, -433, -514, -361,
    //             -125, -54, -47, -41, -37, -30, -27, -22, -23, -23, -21, -19,
    //             -12, -6, -1, 12, 26, 34, 47, 55, 73, 85, 93, 111, 125, 138, 145,
    //             143, 136, 143, 127, 117, 95, 78, 55, 31, 18, 0, -9, -17, -21,
    //             -23, -19, -12, -17, -13, -12, -7, -6, -13, -11, -13, -21, -20,
    //             -24, -28, -27, -28, -22, -24, -29, -25, -28, -29, -25, -6, 8, 3,
    //             12, 18, 10, 16, 10, -5, -22, -21, -37, -50, -52, -53, -56, -55,
    //             -54, -59, -43, 46, 313, 600, 296, -136,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090814860,
    //         collectTime: 1729090844520,
    //         receiveTime: 1729090845964,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090833,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 9.0,
    //           avRR: -10001.0,
    //           hr: 82,
    //           rwl: [92, -1, -1, -1, -1],
    //           rri: [757, 726, 0, 0, 0],
    //           acc: [
    //             { x: -947, y: 1495, z: 1068 },
    //             { x: -916, y: 1443, z: 1070 },
    //             { x: -863, y: 1495, z: 1114 },
    //             { x: -875, y: 1478, z: 1089 },
    //             { x: -873, y: 1481, z: 1095 },
    //           ],
    //           ecg: [
    //             -460, -432, -263, -67, -42, -45, -36, -31, -31, -33, -32, -32,
    //             -25, -25, -16, -15, -5, 0, 10, 18, 28, 41, 51, 68, 90, 107, 125,
    //             139, 152, 155, 160, 164, 159, 141, 120, 93, 67, 42, 13, -6, -20,
    //             -31, -38, -40, -38, -40, -33, -36, -39, -36, -35, -27, -37, -33,
    //             -27, -34, -31, -32, -34, -32, -35, -37, -33, -36, -41, -34, -35,
    //             -37, -36, -29, -25, -8, -1, 0, 11, 11, 7, 17, -4, -9, -18, -29,
    //             -47, -60, -48, -51, -53, -53, -56, -59, 10, 187, 577, 432, 27,
    //             -359, -483, -341, -117, -44, -42, -37, -34, -33, -36, -31, -27,
    //             -21, -20, -22, -15, -8, -1, 7, 12, 26, 30, 47, 62, 83, 102, 121,
    //             127, 149, 154, 162, 160, 162,
    //           ],
    //         },
    //       },
    //       {
    //         appId: 'com.vivalnk.vitalsmonitor',
    //         patchSn: 'ECGRec_202430/E115537',
    //         patchMac: 'CE:D7:29:2A:55:88',
    //         recordTime: 1729090815860,
    //         collectTime: 1729090844520,
    //         receiveTime: 1729090845965,
    //         timezone: '-25200',
    //         patchBattery: 22,
    //         patchInfo:
    //           '{"accSamplingEnable":1,"samplingMultiple":1,"magnification":1000,"hasHR":0,"channelNumber":"","accChipTempCalibration":0,"manufacturer":"VIVALNK","hwVersion":"01","leadOffAccEnable":0,"accSamplingFrequency":5,"encryption":1,"batteryStatus":"NOT_INCHARGING","patchLeadStatus":1,"patchSamplingStatus":1,"model":"VV330_1","ecgSamplingFrequency":128,"accSamplingAccuracy":2048,"fwVersion":"3.0.0.0028","sn":"202430/E115537","productType":1,"batteryLevel":2,"cpuStatus":2,"timeStamp":1729090833,"flashNum":0,"ackStatus":1,"options":{"autoConnect":1,"connectRetry":3,"connectTimeout":10000,"extras":{"dataMode":"FullDualMode"},"rssiThreshold":-95,"serviceDiscoverRetry":3,"serviceDiscoverTimeout":30000}}',
    //         sdkVersion: '3.3.0',
    //         vitals: {
    //           flash: true,
    //           leadOn: true,
    //           activity: false,
    //           magnification: 1000,
    //           accAccuracy: 2048,
    //           sf: 128,
    //           rr: 9.0,
    //           avRR: -10001.0,
    //           hr: 82,
    //           rwl: [60, -1, -1, -1, -1],
    //           rri: [742, 0, 0, 0, 0],
    //           acc: [
    //             { x: -892, y: 1481, z: 1115 },
    //             { x: -850, y: 1450, z: 1157 },
    //             { x: -866, y: 1444, z: 1110 },
    //             { x: -888, y: 1439, z: 1107 },
    //             { x: -856, y: 1455, z: 1156 },
    //           ],
    //           ecg: [
    //             155, 136, 110, 83, 51, 19, 1, -18, -25, -35, -42, -48, -45, -42,
    //             -36, -33, -40, -34, -35, -30, -27, -28, -26, -29, -25, -29, -32,
    //             -35, -37, -36, -33, -37, -37, -35, -35, -34, -37, -28, -19, -2,
    //             3, 2, 16, 17, 7, 12, -6, -18, -29, -37, -51, -58, -57, -54, -57,
    //             -53, -51, -59, -21, 134, 523, 512, 138, -288, -503, -375, -154,
    //             -51, -45, -43, -34, -33, -31, -30, -29, -26, -15, -18, -14, -9,
    //             -4, 2, 16, 24, 31, 50, 64, 80, 91, 119, 134, 150, 160, 166, 168,
    //             165, 158, 146, 120, 86, 53, 33, 0, -17, -31, -39, -44, -49, -49,
    //             -44, -41, -33, -36, -37, -35, -32, -30, -30, -32, -32, -28, -30,
    //             -32, -34, -34, -38, -33, -29,
    //           ],
    //         },
    //       },
    //     ],
    //     start: 1729090800860,
    //     end: 1729091899860,
    //   },
    // };
    // VL sends a response of 200 even on bad response
    // Need to check inside result for code
    // if (result?.code !== 200) {
    //   throw new AppError('API Error', HttpStatus.SERVICE_UNAVAILABLE);
    // }
    // const totalData = result?.data?.list;
    // // const timePerPoint = (totalData.length / 60) * 1000;
    // // maybe - time per is seconds
    // // const timePerPoint = (totalData.length / 60) * 1000;
    // // const timePerPoint = 1000 / 128; // second
    // const timePerPoint = 0.04; // second
    // let processedEcg = [];
    // totalData.map((item, mainIdx) => {
    //   const ecgData = item?.vitals?.ecg; // this is in volts
    //   const magnification = item?.vitals?.magnification || 1000;
    //   // const sf = item?.vitals?.sf || 128;
    //   const innerProcessedEcg = ecgData.map((value, index) => ({
    //     time: ((mainIdx * ecgData.length + index) * timePerPoint) / 1000,
    //     mv: value / magnification, // to convert to millivolts
    //   }));
    //   processedEcg = [...processedEcg, ...innerProcessedEcg];
    // });
    // return {
    //   ecg: processedEcg,
    //   samplingFrequency: totalData.length * 128,
    //   timePerPoint: totalData.length / 128,
    // };

    // old code
    const ecgData = result?.data?.list[0]?.vitals?.ecg;
    const magnification = result?.data?.list[0]?.vitals?.magnification || 1000;
    const samplingFrequency = result?.data?.list[0]?.vitals?.sf || 128;
    const timePerPoint = 1000 / samplingFrequency; // 7.8125 ms
    // For a 1-second recording with 128 points, the time values would be:
    // Point 0: 0 * 7.8125 = 0 ms
    // Point 1: 1 * 7.8125 = 7.8125 ms
    // Point 2: 2 * 7.8125 = 15.625 ms
    // ...
    // Point 127: 127 * 7.8125 = 992.1875 ms
    const processedEcg = ecgData.map((value, index) => ({
      time: (index * timePerPoint) / 1000,
      mv: value / magnification,
    }));
    return {
      ecg: processedEcg,
      samplingFrequency,
      timePerPoint,
    };
  }
}
