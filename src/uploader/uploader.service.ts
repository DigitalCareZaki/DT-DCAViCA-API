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



  // public async handleFile(file: Express.Multer.File) {
  //   const isPDF = file.mimetype === 'application/pdf' || file.mimetype === 'application/octet-stream';
  //   console.log('file >>>>>>>>>>> ', file);

  //   return new Promise((resolve, reject) => {
  //     const upload = this.cloudinary.uploader.upload_stream(
  //       {
  //         folder: 'avica',
  //         resource_type: isPDF ? 'raw' : 'auto',
  //          // ✅ Force raw for PDFs
  //       },
  //       (error, result) => {
  //         if (error) return reject(error);

  //         // Fix the returned URL manually if it's a non-image type
  //         const isPDF = file.mimetype === 'application/pdf';

  //         const url = isPDF
  //           ? result.secure_url.replace('/image/', '/raw/') // <- This is key
  //           : result.secure_url;

  //         // resolve({ ...result, secure_url: url }); // <- Replace returned URL

  //         resolve({
  //           url: result.url,
  //           originalname: file.originalname,
  //           mimetype: file.mimetype,
  //           size: file.size,
  //         });
  //       },
  //     );

  //     const readableStream = Readable.from(file.buffer);
  //     readableStream.pipe(upload);
  //   });
  //}

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

  private bucketName = process.env.AWS_BUCKET_NAME;

  async uploadToS3(file: Express.Multer.File) {


    if (!file) {
      throw new Error('No file uploaded');
    }

    const fileName = this.generateFileName(file.originalname);
    console.log('Generated file name====>>>', fileName);
    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    try {
      const result = await this.s3.send(new PutObjectCommand(uploadParams));
      console.log(result, '========result');
      return {
        message: 'File uploaded successfully',
        url: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
      };
    }
    catch (err) {
      console.error('Error uploading file to S3:', err);
      throw new Error('Error uploading file to S3');
    }

  }

  public async getEcgFromS3(
    date: string,
    deviceId: string,
  ) {

    console.log('date in service ======>>>', date, deviceId)
    const params = {
      Bucket: this.ecgBucket,
      Prefix: date,
    };
    const bucketName = "vve-14-vitals-archive";
    const key = `${date}/${deviceId}_${date}_ECG_denoised_ANALYSIS.pdf`;

    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      console.log('command ======>>>', command)
      const response = await this.s1.send(command);

      if (!response.Body) {
        return 'no file is available'; // no file body returned
      }
      const bodyStream = response.Body as Readable;
      // const outputPath = "./downloaded.pdf";
      // // Pipe to local file
      // const writeStream = createWriteStream(outputPath);
      // bodyStream.pipe(writeStream);

      // writeStream.on("finish", () => {
      //   console.log(`✅ File downloaded to ${outputPath}`);
      // });

      return { pdfUrl: `https://vve-14-vitals-archive.s3.us-west-1.amazonaws.com/${date}/${deviceId}_${date}_ECG_denoised_ANALYSIS.pdf` };

    } catch (error) {
      if (error.name === "NoSuchKey") {
        console.log("File not found:", key);
        return { error: "File not found" };
      }
    }
  }

  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const uniqueName = crypto.randomBytes(16).toString('hex');
    return `${uniqueName}${ext}`;
  }
}
