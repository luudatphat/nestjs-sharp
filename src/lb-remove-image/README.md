# Background Removal Module

This module provides background removal functionality for images using the `@imgly/background-removal-node` package.

## Features

- Remove background from uploaded images
- Remove background from image URLs
- Multiple output formats (PNG, JPEG, WebP)
- Configurable quality settings
- Multiple model options (small, medium, large)
- List and manage processed images
- Simple HTML interface for testing

## API Endpoints

### 1. Remove Background from Uploaded Image
```
POST /bg-removal/upload
Content-Type: multipart/form-data

Parameters:
- image: File (required)
- outputFormat: string (optional) - 'image/png', 'image/jpeg', 'image/webp'
- quality: number (optional) - 0.1 to 1.0
- model: string (optional) - 'small', 'medium', 'large'
```

### 2. Remove Background from URL
```
POST /bg-removal/url
Content-Type: application/json

Body:
{
  "imageUrl": "https://example.com/image.jpg",
  "outputFormat": "image/png",
  "quality": 0.8,
  "model": "medium"
}
```

### 3. List Processed Images
```
GET /bg-removal/images
```

### 4. Get Processed Image
```
GET /bg-removal/images/:filename
```

### 5. Delete Processed Image
```
DELETE /bg-removal/images/:filename
```

## Usage Examples

### Using cURL

1. **Upload and remove background:**
```bash
curl -X POST http://localhost:3000/bg-removal/upload \
  -F "image=@/path/to/image.jpg" \
  -F "outputFormat=image/png" \
  -F "quality=0.8" \
  -F "model=medium"
```

2. **Remove background from URL:**
```bash
curl -X POST http://localhost:3000/bg-removal/url \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "outputFormat": "image/png",
    "quality": 0.8,
    "model": "medium"
  }'
```

3. **List processed images:**
```bash
curl http://localhost:3000/bg-removal/images
```

### Using JavaScript/Fetch

```javascript
// Upload image
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('outputFormat', 'image/png');
formData.append('quality', '0.8');
formData.append('model', 'medium');

const response = await fetch('/bg-removal/upload', {
  method: 'POST',
  body: formData
});

// Remove background from URL
const response = await fetch('/bg-removal/url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageUrl: 'https://example.com/image.jpg',
    outputFormat: 'image/png',
    quality: 0.8,
    model: 'medium'
  })
});
```

## Configuration Options

### Output Formats
- `image/png`: PNG format with transparency support
- `image/jpeg`: JPEG format (no transparency)
- `image/webp`: WebP format with transparency support

### Quality Settings
- Range: 0.1 to 1.0
- Higher values = better quality but larger file size
- Recommended: 0.8 for good balance

### Model Options
- `small`: Fastest processing, lower quality
- `medium`: Balanced speed and quality (default)
- `large`: Highest quality, slower processing

## File Storage

Processed images are stored in the `uploads/bg-processed/` directory with the following naming convention:
- `bg-removed_{timestamp}_{originalname}.png`

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (missing parameters)
- `404`: Image not found
- `500`: Internal server error

## Testing Interface

Access the HTML testing interface at:
```
http://localhost:3000/bg-removal.html
```

This interface provides a user-friendly way to test all background removal features.

## Dependencies

- `@imgly/background-removal-node`: Core background removal functionality
- `@nestjs/common`: NestJS framework
- `@nestjs/platform-express`: Express integration

## Notes

- The background removal process may take several seconds depending on image size and model selection
- Large images will be processed faster with the 'small' model
- PNG format is recommended for best results as it supports transparency
- The service automatically creates necessary directories on startup
