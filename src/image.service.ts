import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { join } from 'path';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class ImageService {
  private readonly uploadPath = join(process.cwd(), 'uploads');
  private readonly outputPath = join(process.cwd(), 'uploads', 'processed');

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

  async resizeImage(
    file: Express.Multer.File,
    width: number,
    height: number,
  ): Promise<string> {
    const filename = `resized_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    await sharp(file.buffer)
      .resize(width, height)
      .jpeg({ quality: 90 })
      .toFile(outputFilePath);

    return filename;
  }

  async convertFormat(
    file: Express.Multer.File,
    format: 'jpeg' | 'png' | 'webp',
  ): Promise<string> {
    const extension = format === 'jpeg' ? 'jpg' : format;
    const filename = `converted_${Date.now()}.${extension}`;
    const outputFilePath = join(this.outputPath, filename);

    let sharpInstance = sharp(file.buffer);

    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: 90 });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality: 90 });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: 90 });
        break;
    }

    await sharpInstance.toFile(outputFilePath);
    return filename;
  }

  async applyFilters(
    file: Express.Multer.File,
    filters: {
      blur?: number;
      sharpen?: boolean;
      greyscale?: boolean;
      brightness?: number;
      contrast?: number;
    },
  ): Promise<string> {
    const filename = `filtered_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    let sharpInstance = sharp(file.buffer);

    if (filters.blur) {
      sharpInstance = sharpInstance.blur(filters.blur);
    }

    if (filters.sharpen) {
      sharpInstance = sharpInstance.sharpen();
    }

    if (filters.greyscale) {
      sharpInstance = sharpInstance.greyscale();
    }

    if (filters.brightness !== undefined) {
      sharpInstance = sharpInstance.modulate({
        brightness: filters.brightness,
      });
    }

    if (filters.contrast !== undefined) {
      // Sharp doesn't have direct contrast modulation, using linear adjustment
      sharpInstance = sharpInstance.linear(filters.contrast, 0);
    }

    await sharpInstance.jpeg({ quality: 90 }).toFile(outputFilePath);
    return filename;
  }

  async cropImage(
    file: Express.Multer.File,
    left: number,
    top: number,
    width: number,
    height: number,
  ): Promise<string> {
    const filename = `cropped_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    await sharp(file.buffer)
      .extract({ left, top, width, height })
      .jpeg({ quality: 90 })
      .toFile(outputFilePath);

    return filename;
  }

  async getImageInfo(file: Express.Multer.File): Promise<any> {
    const metadata = await sharp(file.buffer).metadata();
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      size: file.size,
    };
  }

  async compositeImages(
    baseFile: Express.Multer.File,
    overlayFile: Express.Multer.File,
    options: {
      left?: number;
      top?: number;
      blend?:
        | 'clear'
        | 'source'
        | 'over'
        | 'in'
        | 'out'
        | 'atop'
        | 'dest'
        | 'dest-over'
        | 'dest-in'
        | 'dest-out'
        | 'dest-atop'
        | 'xor'
        | 'add'
        | 'saturate'
        | 'multiply'
        | 'screen'
        | 'overlay'
        | 'darken'
        | 'lighten'
        | 'colour-dodge'
        | 'color-dodge'
        | 'colour-burn'
        | 'color-burn'
        | 'hard-light'
        | 'soft-light'
        | 'difference'
        | 'exclusion';
      gravity?:
        | 'north'
        | 'northeast'
        | 'east'
        | 'southeast'
        | 'south'
        | 'southwest'
        | 'west'
        | 'northwest'
        | 'center'
        | 'centre';
      density?: number;
    },
  ): Promise<string> {
    const filename = `composite_${Date.now()}_${baseFile.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    const compositeOptions: any = {
      input: overlayFile.buffer,
    };

    if (options.left !== undefined) compositeOptions.left = options.left;
    if (options.top !== undefined) compositeOptions.top = options.top;
    if (options.blend) compositeOptions.blend = options.blend;
    if (options.gravity) compositeOptions.gravity = options.gravity;
    if (options.density) compositeOptions.density = options.density;

    await sharp(baseFile.buffer)
      .composite([compositeOptions])
      .jpeg({ quality: 90 })
      .toFile(outputFilePath);

    return filename;
  }

  async createCollage(
    files: Express.Multer.File[],
    options: {
      columns: number;
      spacing?: number;
      backgroundColor?: string;
    },
  ): Promise<string> {
    if (files.length === 0) {
      throw new Error('No files provided for collage');
    }

    const filename = `collage_${Date.now()}.jpg`;
    const outputFilePath = join(this.outputPath, filename);
    const spacing = options.spacing || 10;
    const backgroundColor = options.backgroundColor || '#ffffff';

    // Get metadata for all images to calculate dimensions
    const imageInfos = await Promise.all(
      files.map(async (file) => {
        const metadata = await sharp(file.buffer).metadata();
        return {
          buffer: file.buffer,
          width: metadata.width || 0,
          height: metadata.height || 0,
        };
      }),
    );

    // Calculate grid dimensions
    const rows = Math.ceil(files.length / options.columns);
    const maxWidth = Math.max(...imageInfos.map((info) => info.width));
    const maxHeight = Math.max(...imageInfos.map((info) => info.height));

    const canvasWidth =
      maxWidth * options.columns + spacing * (options.columns + 1);
    const canvasHeight = maxHeight * rows + spacing * (rows + 1);

    // Create composite operations for each image
    const compositeOperations = imageInfos.map((imageInfo, index) => {
      const row = Math.floor(index / options.columns);
      const col = index % options.columns;

      const left = spacing + col * (maxWidth + spacing);
      const top = spacing + row * (maxHeight + spacing);

      return {
        input: imageInfo.buffer,
        left,
        top,
      };
    });

    // Create canvas and composite all images
    await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 3,
        background: backgroundColor,
      },
    })
      .composite(compositeOperations)
      .jpeg({ quality: 90 })
      .toFile(outputFilePath);

    return filename;
  }

  async addWatermark(
    file: Express.Multer.File,
    watermarkText: string,
    options: {
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      opacity?: number;
      position?:
        | 'northwest'
        | 'north'
        | 'northeast'
        | 'west'
        | 'center'
        | 'east'
        | 'southwest'
        | 'south'
        | 'southeast';
    },
  ): Promise<string> {
    const filename = `watermark_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    const fontSize = options.fontSize || 48;
    const fontFamily = options.fontFamily || 'Arial';
    const color = options.color || '#ffffff';
    const opacity = options.opacity || 0.7;
    const position = options.position || 'southeast';

    // Create SVG watermark
    const svgWatermark = `
      <svg width="400" height="100">
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
              font-family="${fontFamily}" font-size="${fontSize}" 
              fill="${color}" opacity="${opacity}">
          ${watermarkText}
        </text>
      </svg>
    `;

    const watermarkBuffer = Buffer.from(svgWatermark);

    await sharp(file.buffer)
      .composite([
        {
          input: watermarkBuffer,
          gravity: position,
        },
      ])
      .jpeg({ quality: 90 })
      .toFile(outputFilePath);

    return filename;
  }

  async createBorder(
    file: Express.Multer.File,
    options: {
      width: number;
      height?: number;
      color?: string;
    },
  ): Promise<string> {
    const filename = `border_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    const borderColor = options.color || '#000000';
    const borderHeight = options.height || options.width;

    await sharp(file.buffer)
      .extend({
        top: borderHeight,
        bottom: borderHeight,
        left: options.width,
        right: options.width,
        background: borderColor,
      })
      .jpeg({ quality: 90 })
      .toFile(outputFilePath);

    return filename;
  }

  async createMask(
    file: Express.Multer.File,
    maskType: 'circle' | 'rounded' | 'star',
    options?: {
      radius?: number;
      backgroundColor?: string;
    },
  ): Promise<string> {
    const filename = `mask_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    const metadata = await sharp(file.buffer).metadata();
    const width = metadata.width || 400;
    const height = metadata.height || 400;
    const size = Math.min(width, height);
    const radius = options?.radius || size / 2;
    const backgroundColor = options?.backgroundColor || '#ffffff';

    let maskSvg = '';

    switch (maskType) {
      case 'circle':
        maskSvg = `
          <svg width="${width}" height="${height}">
            <defs>
              <mask id="mask">
                <rect width="100%" height="100%" fill="black"/>
                <circle cx="${width / 2}" cy="${height / 2}" r="${radius}" fill="white"/>
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="${backgroundColor}" mask="url(#mask)"/>
          </svg>
        `;
        break;
      case 'rounded':
        maskSvg = `
          <svg width="${width}" height="${height}">
            <defs>
              <mask id="mask">
                <rect width="100%" height="100%" fill="black"/>
                <rect x="${radius}" y="${radius}" width="${width - 2 * radius}" height="${height - 2 * radius}" 
                      rx="${radius}" ry="${radius}" fill="white"/>
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="${backgroundColor}" mask="url(#mask)"/>
          </svg>
        `;
        break;
      case 'star': {
        const points: string[] = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5;
          const r = i % 2 === 0 ? radius : radius * 0.5;
          const x = width / 2 + r * Math.cos(angle - Math.PI / 2);
          const y = height / 2 + r * Math.sin(angle - Math.PI / 2);
          points.push(`${x},${y}`);
        }
        maskSvg = `
          <svg width="${width}" height="${height}">
            <defs>
              <mask id="mask">
                <rect width="100%" height="100%" fill="black"/>
                <polygon points="${points.join(' ')}" fill="white"/>
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="${backgroundColor}" mask="url(#mask)"/>
          </svg>
        `;
        break;
      }
    }

    const maskBuffer = Buffer.from(maskSvg);

    await sharp(file.buffer)
      .composite([
        {
          input: maskBuffer,
          blend: 'dest-in',
        },
      ])
      .png()
      .toFile(outputFilePath);

    return filename;
  }

  async rotateImage(
    file: Express.Multer.File,
    angle: number,
    options?: {
      backgroundColor?: string;
    },
  ): Promise<string> {
    const filename = `rotate_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    const backgroundColor = options?.backgroundColor || '#ffffff';

    await sharp(file.buffer)
      .rotate(angle, { background: backgroundColor })
      .jpeg({ quality: 90 })
      .toFile(outputFilePath);

    return filename;
  }

  async flipImage(
    file: Express.Multer.File,
    direction: 'horizontal' | 'vertical' | 'both',
  ): Promise<string> {
    const filename = `rotate_flip_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    let sharpInstance = sharp(file.buffer);

    switch (direction) {
      case 'horizontal':
        sharpInstance = sharpInstance.flop();
        break;
      case 'vertical':
        sharpInstance = sharpInstance.flip();
        break;
      case 'both':
        sharpInstance = sharpInstance.flip().flop();
        break;
    }

    await sharpInstance.jpeg({ quality: 90 }).toFile(outputFilePath);

    return filename;
  }

  async rotateWithTransform(
    file: Express.Multer.File,
    options: {
      angle?: number;
      flip?: boolean;
      flop?: boolean;
      backgroundColor?: string;
    },
  ): Promise<string> {
    const filename = `rotate_transform_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    let sharpInstance = sharp(file.buffer);

    if (options.angle !== undefined && options.angle !== 0) {
      sharpInstance = sharpInstance.rotate(options.angle, {
        background: options.backgroundColor || '#ffffff',
      });
    }

    if (options.flip) {
      sharpInstance = sharpInstance.flip();
    }

    if (options.flop) {
      sharpInstance = sharpInstance.flop();
    }

    await sharpInstance.jpeg({ quality: 90 }).toFile(outputFilePath);

    return filename;
  }

  // Color operations (https://sharp.pixelplumbing.com/api-colour/)
  async adjustColor(
    file: Express.Multer.File,
    options: {
      tint?: string;
      gamma?: number;
      negate?: boolean;
      normalize?: boolean;
    },
  ): Promise<string> {
    const filename = `color_adjust_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    let sharpInstance = sharp(file.buffer);

    if (options.tint) {
      sharpInstance = sharpInstance.tint(options.tint);
    }

    if (options.gamma !== undefined) {
      sharpInstance = sharpInstance.gamma(options.gamma);
    }

    if (options.negate) {
      sharpInstance = sharpInstance.negate();
    }

    if (options.normalize) {
      sharpInstance = sharpInstance.normalize();
    }

    await sharpInstance.jpeg({ quality: 90 }).toFile(outputFilePath);
    return filename;
  }

  async colorspace(
    file: Express.Multer.File,
    colorspace: 'srgb' | 'rgb16' | 'cmyk' | 'lab' | 'b-w',
  ): Promise<string> {
    const filename = `color_space_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    await sharp(file.buffer)
      .toColorspace(colorspace)
      .jpeg({ quality: 90 })
      .toFile(outputFilePath);

    return filename;
  }

  // Channel operations (https://sharp.pixelplumbing.com/api-channel/)
  async channelOperations(
    file: Express.Multer.File,
    options: {
      removeAlpha?: boolean;
      ensureAlpha?: boolean;
      extractChannel?: 'red' | 'green' | 'blue' | 'alpha';
      bandBoolOperation?: 'and' | 'or' | 'eor';
    },
  ): Promise<string> {
    const filename = `channel_ops_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    let sharpInstance = sharp(file.buffer);

    if (options.removeAlpha) {
      sharpInstance = sharpInstance.removeAlpha();
    }

    if (options.ensureAlpha) {
      sharpInstance = sharpInstance.ensureAlpha();
    }

    if (options.extractChannel) {
      sharpInstance = sharpInstance.extractChannel(options.extractChannel);
    }

    if (options.bandBoolOperation) {
      sharpInstance = sharpInstance.bandbool(options.bandBoolOperation);
    }

    const outputFormat =
      options.extractChannel || options.removeAlpha ? 'png' : 'jpeg';

    if (outputFormat === 'png') {
      await sharpInstance.png({ quality: 90 }).toFile(outputFilePath);
    } else {
      await sharpInstance.jpeg({ quality: 90 }).toFile(outputFilePath);
    }

    return filename;
  }

  async joinChannels(
    files: Express.Multer.File[],
    options: {
      colorspace?: 'srgb' | 'rgb16' | 'cmyk' | 'lab';
    },
  ): Promise<string> {
    if (files.length < 2) {
      throw new Error('At least 2 channel images are required');
    }

    const filename = `channel_join_${Date.now()}.png`;
    const outputFilePath = join(this.outputPath, filename);

    // Convert files to channel buffers
    const channels = await Promise.all(
      files.map(async (file) => {
        return await sharp(file.buffer).raw().toBuffer();
      }),
    );

    // Get metadata from first image
    const metadata = await sharp(files[0].buffer).metadata();
    const width = metadata.width || 400;
    const height = metadata.height || 400;

    // Create a simple channel join by overlaying images
    let sharpInstance = sharp(files[0].buffer);

    for (let i = 1; i < channels.length && i < 3; i++) {
      const overlayBuffer = await sharp(files[i].buffer)
        .resize(width, height)
        .toBuffer();

      sharpInstance = sharpInstance.composite([
        {
          input: overlayBuffer,
          blend: 'multiply',
        },
      ]);
    }

    await sharpInstance.png().toFile(outputFilePath);

    return filename;
  }

  // Utility operations (https://sharp.pixelplumbing.com/api-utility/)
  async utilityOperations(
    file: Express.Multer.File,
    operation: string,
    options: any = {},
  ): Promise<any> {
    const result: any = {};

    try {
      if (operation === 'clone') {
        // Create a copy of the image
        const filename = `utility_clone_${Date.now()}_${file.originalname}`;
        const outputPath = path.join(
          process.cwd(),
          'public',
          'processed',
          filename,
        );

        await sharp(file.buffer).toFile(outputPath);

        result.clonedFilename = filename;
        result.downloadUrl = `/images/download/${filename}`;
        result.message = 'Image cloned successfully';
      } else if (operation === 'cache') {
        // Clear cache (Sharp handles this internally)
        sharp.cache(false);
        result.message = 'Cache cleared';
      } else if (operation === 'concurrency') {
        // Set concurrency
        const threads = options.threads || 0;
        sharp.concurrency(threads);
        result.message = `Concurrency set to ${threads}`;
      } else if (operation === 'simd') {
        // Set SIMD
        const enable = options.enable !== false;
        sharp.simd(enable);
        result.message = `SIMD ${enable ? 'enabled' : 'disabled'}`;
      } else {
        throw new Error(`Unknown utility operation: ${operation}`);
      }

      // Create a test pipeline to demonstrate utility operations
      const filename = `utility_pipeline_${Date.now()}_${file.originalname}`;
      const outputPath = path.join(
        process.cwd(),
        'public',
        'processed',
        filename,
      );

      let sharpInstance = sharp(file.buffer);

      // Simple processing pipeline
      await sharpInstance
        .resize(800, 600, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      result.filename = filename;
      result.downloadUrl = `/images/download/${filename}`;

      return result;
    } catch (error) {
      throw new Error(`Utility operations failed: ${error.message}`);
    }
  }

  async createThumbnails(
    file: Express.Multer.File,
    sizes: { width: number; height: number; suffix: string }[],
  ): Promise<string[]> {
    const baseFilename = `utility_thumb_${Date.now()}`;
    const filenames: string[] = [];

    for (const size of sizes) {
      const filename = `${baseFilename}_${size.suffix}.jpg`;
      const outputFilePath = path.join(
        process.cwd(),
        'public',
        'processed',
        filename,
      );

      await sharp(file.buffer)
        .resize(size.width, size.height, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toFile(outputFilePath);

      filenames.push(filename);
    }

    return filenames;
  }

  async removeBackground(
    file: Express.Multer.File,
    options: {
      method?: 'threshold' | 'edge' | 'color';
      threshold?: number;
      color?: string;
      tolerance?: number;
    } = {},
  ): Promise<string> {
    const filename = `bg_removed_${Date.now()}_${file.originalname.split('.')[0]}.png`;
    const outputPath = join(this.outputPath, filename);

    try {
      let sharpInstance = sharp(file.buffer);

      // Get image metadata to work with
      const metadata = await sharpInstance.metadata();
      const { width, height } = metadata;

      if (options.method === 'threshold') {
        // Remove background using threshold (works best with high contrast images)
        const threshold = options.threshold || 128;

        await sharpInstance
          .greyscale()
          .threshold(threshold)
          .negate()
          .toFormat('png')
          .toFile(outputPath);
      } else if (options.method === 'edge') {
        // Edge detection method
        await sharpInstance
          .greyscale()
          .convolve({
            width: 3,
            height: 3,
            kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
          })
          .threshold(50)
          .negate()
          .toFormat('png')
          .toFile(outputPath);
      } else if (options.method === 'color') {
        // Remove specific color background
        const color = options.color || '#ffffff';
        const tolerance = options.tolerance || 10;

        // This is a simplified approach - for better results, you'd need a more sophisticated algorithm
        await sharpInstance
          .flatten({ background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .toFormat('png')
          .toFile(outputPath);
      } else {
        // Default method: Create a mask based on edge detection and apply transparency
        const mask = await sharp(file.buffer)
          .greyscale()
          .blur(1)
          .convolve({
            width: 3,
            height: 3,
            kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
          })
          .threshold(30)
          .negate()
          .toBuffer();

        // Apply the mask to create transparency
        await sharpInstance
          .composite([
            {
              input: mask,
              blend: 'dest-in',
            },
          ])
          .png({ compressionLevel: 9 })
          .toFile(outputPath);
      }

      return filename;
    } catch (error) {
      throw new Error(`Background removal failed: ${error.message}`);
    }
  }

  async smartBackgroundRemoval(
    file: Express.Multer.File,
    options: {
      edgeDetection?: boolean;
      colorThreshold?: number;
      blur?: number;
      feather?: number;
    } = {},
  ): Promise<string> {
    const filename = `smart_bg_removed_${Date.now()}_${file.originalname.split('.')[0]}.png`;
    const outputPath = path.join(
      process.cwd(),
      'public',
      'processed',
      filename,
    );

    try {
      const {
        edgeDetection = true,
        colorThreshold = 50,
        blur = 1,
        feather = 2,
      } = options;

      // Step 1: Get the original image
      let originalImage = sharp(file.buffer);
      const metadata = await originalImage.metadata();

      // Step 2: Create edge detection mask
      let mask;
      if (edgeDetection) {
        mask = await sharp(file.buffer)
          .greyscale()
          .blur(blur)
          .convolve({
            width: 3,
            height: 3,
            kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
          })
          .threshold(colorThreshold)
          .blur(feather) // Feather the edges
          .toBuffer();
      } else {
        // Simple threshold mask
        mask = await sharp(file.buffer)
          .greyscale()
          .threshold(colorThreshold)
          .blur(feather)
          .toBuffer();
      }

      // Step 3: Apply the mask to remove background
      await originalImage
        .composite([
          {
            input: mask,
            blend: 'dest-in',
          },
        ])
        .png({
          compressionLevel: 9,
          palette: false,
        })
        .toFile(outputPath);

      return filename;
    } catch (error) {
      throw new Error(`Smart background removal failed: ${error.message}`);
    }
  }

  async utilityPipeline(
    file: Express.Multer.File,
    operations: string[],
  ): Promise<string> {
    const filename = `utility_pipeline_${Date.now()}_${file.originalname}`;
    const outputFilePath = join(this.outputPath, filename);

    let sharpInstance = sharp(file.buffer);

    // Apply operations based on string array
    for (const operation of operations) {
      switch (operation) {
        case 'greyscale':
          sharpInstance = sharpInstance.greyscale();
          break;
        case 'negate':
          sharpInstance = sharpInstance.negate();
          break;
        case 'normalize':
          sharpInstance = sharpInstance.normalize();
          break;
        case 'sharpen':
          sharpInstance = sharpInstance.sharpen();
          break;
        case 'blur':
          sharpInstance = sharpInstance.blur(2);
          break;
        case 'flip':
          sharpInstance = sharpInstance.flip();
          break;
        case 'flop':
          sharpInstance = sharpInstance.flop();
          break;
      }
    }

    await sharpInstance.jpeg({ quality: 90 }).toFile(outputFilePath);
    return filename;
  }

  getProcessedImagePath(filename: string): string {
    return join(this.outputPath, filename);
  }
}
