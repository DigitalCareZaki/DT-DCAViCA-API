import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import { pipeline, Readable } from 'stream';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import * as path from 'path';
import fs, { createWriteStream } from "fs";
import { promisify } from 'util';


const pipe = promisify(pipeline);

@Injectable()
export class UploaderService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) { }

  private s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });


  private s1 = new S3Client({
    region: process.env.AWS_ECG_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ECG_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ECG_SECRET_ACCESS_KEY,
    },
  });

  private ecgBucket = process.env.AWS_ECG_BUCKET_NAME;

  private avicaBucket = process.env.AWS_BUCKET_NAME;

  async uploadToS3(file: Express.Multer.File) {


    if (!file) {
      throw new Error('No file uploaded');
    }

    const fileName = this.generateFileName(file.originalname);
    console.log('Generated file name====>>>', fileName);
    const uploadParams = {
      Bucket: this.avicaBucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    try {
      const result = await this.s3.send(new PutObjectCommand(uploadParams));
      console.log(result, '========result');
      return {
        message: 'File uploaded successfully',
        url: `https://${this.avicaBucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
      };
    }
    catch (err) {
      console.error('Error uploading file to S3:', err);
      throw new Error('Error uploading file to S3');
    }

  }
  public async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }

  public async getEcgFromS3(date: string, deviceId: string) {
    console.log("date in service ======>>>", date, deviceId);

    const sourceBucket = this.ecgBucket
    const sourceKey = `${date}/${deviceId}_${date}_ECG_denoised_ANALYSIS.pdf`;
    const destBucket = this.avicaBucket
    const destKey = `${date}/${deviceId}_${date}_ECG_denoised_ANALYSIS.pdf`;

    try {

      const command = new GetObjectCommand({
        Bucket: sourceBucket,
        Key: sourceKey,
      });
      const response = await this.s1.send(command);

      if (!response.Body) {
        return { error: "No file found in source bucket" };
      }


      const buffer = await this.streamToBuffer(response.Body as Readable);


      await this.s3.send(
        new PutObjectCommand({
          Bucket: destBucket,
          Key: destKey,
          Body: buffer,
          ContentType: "application/pdf",
          ContentLength: buffer.length,
        })
      );

      console.log(`✅ File copied to ${destBucket}/${destKey}`);

      return {
        pdfUrl: `https://${destBucket}.s3.ap-southeast-1.amazonaws.com/${destKey}`,
      };
    } catch (error) {
      console.error(" Transfer failed:", error);
      return { error: "No file found in source bucket" };
    }
  }

  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const uniqueName = crypto.randomBytes(16).toString('hex');
    return `${uniqueName}${ext}`;
  }
}
