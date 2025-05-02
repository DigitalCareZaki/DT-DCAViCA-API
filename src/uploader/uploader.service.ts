import { Injectable } from '@nestjs/common';

@Injectable()
export class UploaderService {
  public async handleFile(file: Express.Multer.File) {

    console.log('file >>>>>>>>>>> ', file);
    // const fileUrl = `https://mobility-health-backend-production.up.railway.app/uploads/${file.filename}`;

    // Softsols railway
    const fileUrl = `https://avica.up.railway.app/uploads/${file.filename}`;

    return {
      url: fileUrl,
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
