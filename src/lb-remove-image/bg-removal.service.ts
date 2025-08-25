import { Injectable } from '@nestjs/common';
import { removeBackground } from '@imgly/background-removal-node';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class BgRemovalService {
  private readonly uploadPath = join(process.cwd(), 'uploads');
  private readonly outputPath = join(process.cwd(), 'uploads', 'bg-processed');

  constructor() {
    void this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories() {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
      await fs.mkdir(this.outputPath, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  async removeBackgroundFromImage(
    file: Express.Multer.File,
    options?: {
      outputFormat?: 'image/png' | 'image/jpeg' | 'image/webp';
      quality?: number | string;
      model?: 'medium' | 'small' | 'large';
    },
  ): Promise<string> {
    try {
      const filename = `bg-removed_${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, '')}.png`;
      const outputFilePath = join(this.outputPath, filename);

      // Configure background removal options
      const config = {
        output: {
          format: options?.outputFormat || 'image/png',
          quality:
            typeof options?.quality === 'string'
              ? parseFloat(options.quality)
              : options?.quality || 0.8,
        },
        model: options?.model || 'medium',
      };

      // Debug: Log file information
      console.log('File info:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        bufferLength: file.buffer.length
      });

      // Save the uploaded file temporarily and use URL approach
      const tempFilename = `temp_${Date.now()}_${file.originalname}`;
      const tempFilePath = join(this.uploadPath, tempFilename);
      
      try {
        // Save the original file
        await fs.writeFile(tempFilePath, file.buffer);
        console.log('Temporary file saved:', tempFilePath);
        
        // Use file URL approach
        const fileUrl = `file://${tempFilePath}`;
        console.log('Using file URL:', fileUrl);
        
        console.log('Starting background removal...');
        const result = await removeBackground(fileUrl, config);
        console.log('Background removal completed');
        
        // Clean up temporary file
        await fs.unlink(tempFilePath);
        console.log('Temporary file cleaned up');
        
        // Save the result - convert Blob to Buffer
        const arrayBuffer = await result.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(outputFilePath, buffer);
        
      } catch (error) {
        // Clean up temporary file on error
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.error('Error cleaning up temp file:', cleanupError);
        }
        throw error;
      }

      return filename;
    } catch (error) {
      console.error('Error removing background:', error);
      throw new Error(
        `Failed to remove background: ${(error as Error).message}`,
      );
    }
  }

  async removeBackgroundFromUrl(
    imageUrl: string,
    options?: {
      outputFormat?: 'image/png' | 'image/jpeg' | 'image/webp';
      quality?: number | string;
      model?: 'medium' | 'small' | 'large';
    },
  ): Promise<string> {
    try {
      const filename = `bg-removed_${Date.now()}_url.png`;
      const outputFilePath = join(this.outputPath, filename);

      // Configure background removal options
      const config = {
        output: {
          format: options?.outputFormat || 'image/png',
          quality:
            typeof options?.quality === 'string'
              ? parseFloat(options.quality)
              : options?.quality || 0.8,
        },
        model: options?.model || 'medium',
      };

      // Remove background from URL
      const result = await removeBackground(imageUrl, config);

      // Save the result - convert Blob to Buffer
      const arrayBuffer = await result.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(outputFilePath, buffer);

      return filename;
    } catch (error) {
      console.error('Error removing background from URL:', error);
      throw new Error(
        `Failed to remove background from URL: ${(error as Error).message}`,
      );
    }
  }

  getProcessedImagePath(filename: string): string {
    return join(this.outputPath, filename);
  }

  async listProcessedImages(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.outputPath);
      return files.filter((file) => file.startsWith('bg-removed_'));
    } catch (error) {
      console.error('Error listing processed images:', error);
      return [];
    }
  }

  async deleteProcessedImage(filename: string): Promise<boolean> {
    try {
      const filePath = join(this.outputPath, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting processed image:', error);
      return false;
    }
  }
}
