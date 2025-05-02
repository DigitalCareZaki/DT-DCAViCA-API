import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as Cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) { }

  public async uploadFile(file: Express.Multer.File) {
    const isPDF = file.mimetype === 'application/pdf' || file.mimetype === 'application/octet-stream';

    return new Promise((resolve, reject) => {
      const upload = this.cloudinary.uploader.upload_stream(
        {
          folder: 'avica',
          resource_type: isPDF ? 'raw' : 'auto', // ✅ Force raw for PDFs
        },
        (error, result) => {
          if (error) return reject(error);

          // Fix the returned URL manually if it's a non-image type
          const isPDF = file.mimetype === 'application/pdf';

          const url = isPDF
            ? result.secure_url.replace('/image/', '/raw/') // <- This is key
            : result.secure_url;

          // resolve({ ...result, secure_url: url }); // <- Replace returned URL

          resolve({
            url: result.url,
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          });
        },
      );

      const readableStream = Readable.from(file.buffer);
      readableStream.pipe(upload);
    });
  }
}
