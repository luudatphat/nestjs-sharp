import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { BgRemovalService } from './bg-removal.service';

@Controller('bg-removal')
export class BgRemovalController {
  constructor(private readonly bgRemovalService: BgRemovalService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async removeBackgroundFromUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: {
      outputFormat?: 'image/png' | 'image/jpeg' | 'image/webp';
      quality?: number | string;
      model?: 'medium' | 'small' | 'large';
    },
  ) {
    if (!file) {
      throw new HttpException(
        'No image file provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new HttpException(
        'File size too large. Maximum size is 10MB',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const filename = await this.bgRemovalService.removeBackgroundFromImage(
        file,
        options,
      );

      return {
        success: true,
        filename,
        message: 'Background removed successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to remove background: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('url')
  async removeBackgroundFromUrl(
    @Body() body: {
      imageUrl: string;
      outputFormat?: 'image/png' | 'image/jpeg' | 'image/webp';
      quality?: number | string;
      model?: 'medium' | 'small' | 'large';
    },
  ) {
    if (!body.imageUrl) {
      throw new HttpException(
        'No image URL provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const filename = await this.bgRemovalService.removeBackgroundFromUrl(
        body.imageUrl,
        {
          outputFormat: body.outputFormat,
          quality: body.quality,
          model: body.model,
        },
      );

      return {
        success: true,
        filename,
        message: 'Background removed successfully from URL',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to remove background from URL: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('images')
  async listProcessedImages() {
    try {
      const images = await this.bgRemovalService.listProcessedImages();
      return {
        success: true,
        images,
        count: images.length,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to list processed images: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('images/:filename')
  async getProcessedImage(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = this.bgRemovalService.getProcessedImagePath(filename);
      
      // Check if file exists
      const fs = require('fs').promises;
      await fs.access(filePath);
      
      return res.sendFile(filePath);
    } catch (error) {
      throw new HttpException(
        'Image not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Delete('images/:filename')
  async deleteProcessedImage(@Param('filename') filename: string) {
    try {
      const success = await this.bgRemovalService.deleteProcessedImage(filename);
      
      if (!success) {
        throw new HttpException(
          'Failed to delete image',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        success: true,
        message: 'Image deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete image: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
