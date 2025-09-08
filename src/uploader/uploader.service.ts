import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class UploaderService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) { }

  public async handleFile(file: Express.Multer.File) {
    const isPDF =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/octet-stream';

    const originalName = file.originalname.replace(/\.[^/.]+$/, ''); // Remove extension
    const extension = file.originalname.split('.').pop(); // Get extension (e.g., pdf)

    return new Promise((resolve, reject) => {
      const upload = this.cloudinary.uploader.upload_stream(
        {
          folder: 'avica',
          resource_type: 'raw',
          type: 'upload', // ✅ public access for raw files
          public_id: `${originalName}.${extension}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url, // ✅ will now be accessible
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          });
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }

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

  private bucketName = process.env.AWS_BUCKET_NAME;

  async uploadToS3(file: Express.Multer.File) {

    try {
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

      await this.s3.send(new PutObjectCommand(uploadParams));

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

  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const uniqueName = crypto.randomBytes(16).toString('hex');
    return `${uniqueName}${ext}`;
  }
}
