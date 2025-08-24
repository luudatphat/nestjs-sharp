import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImageService } from './image.service';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const info = await this.imageService.getImageInfo(file);
    return {
      message: 'Image uploaded successfully',
      originalInfo: info,
    };
  }

  @Post('resize')
  @UseInterceptors(FileInterceptor('image'))
  async resizeImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { width: string; height: string },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const width = parseInt(body.width);
    const height = parseInt(body.height);

    if (isNaN(width) || isNaN(height)) {
      throw new Error('Invalid width or height');
    }

    const filename = await this.imageService.resizeImage(file, width, height);
    return {
      message: 'Image resized successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('convert')
  @UseInterceptors(FileInterceptor('image'))
  async convertImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { format: 'jpeg' | 'png' | 'webp' },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const filename = await this.imageService.convertFormat(file, body.format);
    return {
      message: 'Image converted successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('filters')
  @UseInterceptors(FileInterceptor('image'))
  async applyFilters(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      blur?: string;
      sharpen?: string;
      greyscale?: string;
      brightness?: string;
      contrast?: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const filters = {
      blur: body.blur ? parseFloat(body.blur) : undefined,
      sharpen: body.sharpen === 'true',
      greyscale: body.greyscale === 'true',
      brightness: body.brightness ? parseFloat(body.brightness) : undefined,
      contrast: body.contrast ? parseFloat(body.contrast) : undefined,
    };

    const filename = await this.imageService.applyFilters(file, filters);
    return {
      message: 'Filters applied successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('crop')
  @UseInterceptors(FileInterceptor('image'))
  async cropImage(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      left: string;
      top: string;
      width: string;
      height: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const left = parseInt(body.left);
    const top = parseInt(body.top);
    const width = parseInt(body.width);
    const height = parseInt(body.height);

    if (isNaN(left) || isNaN(top) || isNaN(width) || isNaN(height)) {
      throw new Error('Invalid crop parameters');
    }

    const filename = await this.imageService.cropImage(
      file,
      left,
      top,
      width,
      height,
    );
    return {
      message: 'Image cropped successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Get('download/:filename')
  downloadImage(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = this.imageService.getProcessedImagePath(filename);
      res.sendFile(filePath);
    } catch {
      res.status(404).json({ error: 'File not found' });
    }
  }

  @Get('info')
  @UseInterceptors(FileInterceptor('image'))
  async getImageInfo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const info = await this.imageService.getImageInfo(file);
    return info;
  }

  @Post('composite')
  @UseInterceptors(FilesInterceptor('images', 2))
  async compositeImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body()
    body: {
      left?: string;
      top?: string;
      blend?: string;
      gravity?: string;
      density?: string;
    },
  ) {
    if (!files || files.length !== 2) {
      throw new Error('Please upload exactly 2 images (base and overlay)');
    }

    const [baseFile, overlayFile] = files;
    const options = {
      left: body.left ? parseInt(body.left) : undefined,
      top: body.top ? parseInt(body.top) : undefined,
      blend: body.blend as any,
      gravity: body.gravity as any,
      density: body.density ? parseFloat(body.density) : undefined,
    };

    const filename = await this.imageService.compositeImages(
      baseFile,
      overlayFile,
      options,
    );
    return {
      message: 'Images composited successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('collage')
  @UseInterceptors(FilesInterceptor('images', 20))
  async createCollage(
    @UploadedFiles() files: Express.Multer.File[],
    @Body()
    body: {
      columns: string;
      spacing?: string;
      backgroundColor?: string;
    },
  ) {
    if (!files || files.length === 0) {
      throw new Error('Please upload at least one image');
    }

    const columns = parseInt(body.columns);
    if (isNaN(columns) || columns < 1) {
      throw new Error('Invalid columns value');
    }

    const options = {
      columns,
      spacing: body.spacing ? parseInt(body.spacing) : 10,
      backgroundColor: body.backgroundColor || '#ffffff',
    };

    const filename = await this.imageService.createCollage(files, options);
    return {
      message: 'Collage created successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('watermark')
  @UseInterceptors(FileInterceptor('image'))
  async addWatermark(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      text: string;
      fontSize?: string;
      fontFamily?: string;
      color?: string;
      opacity?: string;
      position?: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (!body.text) {
      throw new Error('Watermark text is required');
    }

    const options = {
      fontSize: body.fontSize ? parseInt(body.fontSize) : 48,
      fontFamily: body.fontFamily || 'Arial',
      color: body.color || '#ffffff',
      opacity: body.opacity ? parseFloat(body.opacity) : 0.7,
      position: body.position as any || 'southeast',
    };

    const filename = await this.imageService.addWatermark(
      file,
      body.text,
      options,
    );
    return {
      message: 'Watermark added successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('border')
  @UseInterceptors(FileInterceptor('image'))
  async addBorder(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      width: string;
      height?: string;
      color?: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const width = parseInt(body.width);
    if (isNaN(width) || width < 1) {
      throw new Error('Invalid border width');
    }

    const options = {
      width,
      height: body.height ? parseInt(body.height) : undefined,
      color: body.color || '#000000',
    };

    const filename = await this.imageService.createBorder(file, options);
    return {
      message: 'Border added successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('mask')
  @UseInterceptors(FileInterceptor('image'))
  async applyMask(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      type: 'circle' | 'rounded' | 'star';
      radius?: string;
      backgroundColor?: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const options = {
      radius: body.radius ? parseInt(body.radius) : undefined,
      backgroundColor: body.backgroundColor || '#ffffff',
    };

    const filename = await this.imageService.createMask(
      file,
      body.type,
      options,
    );
    return {
      message: 'Mask applied successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('rotate')
  @UseInterceptors(FileInterceptor('image'))
  async rotateImage(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      angle: string;
      backgroundColor?: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const angle = parseFloat(body.angle);
    if (isNaN(angle)) {
      throw new Error('Invalid rotation angle');
    }

    const options = {
      backgroundColor: body.backgroundColor || '#ffffff',
    };

    const filename = await this.imageService.rotateImage(file, angle, options);
    return {
      message: 'Image rotated successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('rotate/flip')
  @UseInterceptors(FileInterceptor('image'))
  async flipImage(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      direction: 'horizontal' | 'vertical' | 'both';
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (!body.direction) {
      throw new Error('Flip direction is required');
    }

    const filename = await this.imageService.flipImage(file, body.direction);
    return {
      message: 'Image flipped successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('rotate/transform')
  @UseInterceptors(FileInterceptor('image'))
  async transformImage(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      angle?: string;
      flip?: string;
      flop?: string;
      backgroundColor?: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const options = {
      angle: body.angle ? parseFloat(body.angle) : undefined,
      flip: body.flip === 'true',
      flop: body.flop === 'true',
      backgroundColor: body.backgroundColor || '#ffffff',
    };

    const filename = await this.imageService.rotateWithTransform(file, options);
    return {
      message: 'Image transformed successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  // Color operations
  @Post('color/adjust')
  @UseInterceptors(FileInterceptor('image'))
  async adjustColor(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      tint?: string;
      gamma?: string;
      negate?: string;
      normalize?: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const options = {
      tint: body.tint || undefined,
      gamma: body.gamma ? parseFloat(body.gamma) : undefined,
      negate: body.negate === 'true',
      normalize: body.normalize === 'true',
    };

    const filename = await this.imageService.adjustColor(file, options);
    return {
      message: 'Color adjusted successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('color/space')
  @UseInterceptors(FileInterceptor('image'))
  async convertColorspace(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      colorspace: 'srgb' | 'rgb16' | 'cmyk' | 'lab' | 'b-w';
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (!body.colorspace) {
      throw new Error('Colorspace is required');
    }

    const filename = await this.imageService.colorspace(file, body.colorspace);
    return {
      message: 'Colorspace converted successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  // Channel operations
  @Post('channel/operations')
  @UseInterceptors(FileInterceptor('image'))
  async channelOperations(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      removeAlpha?: string;
      ensureAlpha?: string;
      extractChannel?: 'red' | 'green' | 'blue' | 'alpha';
      bandBoolOperation?: 'and' | 'or' | 'eor';
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const options = {
      removeAlpha: body.removeAlpha === 'true',
      ensureAlpha: body.ensureAlpha === 'true',
      extractChannel: body.extractChannel,
      bandBoolOperation: body.bandBoolOperation,
    };

    const filename = await this.imageService.channelOperations(file, options);
    return {
      message: 'Channel operations applied successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('channel/join')
  @UseInterceptors(FilesInterceptor('channels', 4))
  async joinChannels(
    @UploadedFiles() files: Express.Multer.File[],
    @Body()
    body: {
      colorspace?: 'srgb' | 'rgb16' | 'cmyk' | 'lab';
    },
  ) {
    if (!files || files.length < 2) {
      throw new Error('At least 2 channel images are required');
    }

    const options = {
      colorspace: body.colorspace || 'srgb',
    };

    const filename = await this.imageService.joinChannels(files, options);
    return {
      message: 'Channels joined successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  // Utility operations
  @Post('utility/info')
  @UseInterceptors(FileInterceptor('image'))
  async getUtilityInfo(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      operation?: string;
      stats?: string;
      histogram?: string;
      dominant?: string;
      clone?: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const operation = body.operation || 'info';
    const options = {
      stats: body.stats === 'true',
      histogram: body.histogram === 'true',
      dominant: body.dominant === 'true',
      clone: body.clone === 'true',
    };

    const result = await this.imageService.utilityOperations(file, operation, options);
    return {
      message: 'Utility operations completed',
      data: result,
    };
  }

  @Post('utility/thumbnails')
  @UseInterceptors(FileInterceptor('image'))
  async createThumbnails(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      sizes: string; // JSON string of size array
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    let sizes;
    try {
      sizes = JSON.parse(body.sizes);
    } catch {
      // Default sizes if parsing fails
      sizes = [
        { width: 150, height: 150, suffix: 'thumb' },
        { width: 300, height: 300, suffix: 'medium' },
        { width: 600, height: 600, suffix: 'large' },
      ];
    }

    const filenames = await this.imageService.createThumbnails(file, sizes);
    return {
      message: 'Thumbnails created successfully',
      filenames,
      downloadUrls: filenames.map((name) => `/images/download/${name}`),
    };
  }

  @Post('utility/pipeline')
  @UseInterceptors(FileInterceptor('image'))
  async utilityPipeline(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      operations: string; // Comma-separated operations
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const operations = body.operations
      ? body.operations.split(',').map((op) => op.trim())
      : [];

    if (operations.length === 0) {
      throw new Error('At least one operation is required');
    }

    const filename = await this.imageService.utilityPipeline(file, operations);
    return {
      message: 'Pipeline operations applied successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  // Background removal operations
  @Post('background/remove')
  @UseInterceptors(FileInterceptor('image'))
  async removeBackground(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      method?: string;
      threshold?: string;
      color?: string;
      tolerance?: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const options = {
      method: body.method as 'threshold' | 'edge' | 'color',
      threshold: body.threshold ? parseInt(body.threshold) : undefined,
      color: body.color,
      tolerance: body.tolerance ? parseInt(body.tolerance) : undefined,
    };

    const filename = await this.imageService.removeBackground(file, options);
    return {
      message: 'Background removed successfully',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }

  @Post('background/smart-remove')
  @UseInterceptors(FileInterceptor('image'))
  async smartBackgroundRemoval(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      edgeDetection?: string;
      colorThreshold?: string;
      blur?: string;
      feather?: string;
    },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const options = {
      edgeDetection: body.edgeDetection !== 'false',
      colorThreshold: body.colorThreshold
        ? parseInt(body.colorThreshold)
        : undefined,
      blur: body.blur ? parseInt(body.blur) : undefined,
      feather: body.feather ? parseInt(body.feather) : undefined,
    };

    const filename = await this.imageService.smartBackgroundRemoval(
      file,
      options,
    );
    return {
      message: 'Smart background removal completed',
      filename,
      downloadUrl: `/images/download/${filename}`,
    };
  }
}
