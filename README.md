# 🎨 NestJS Sharp Image Processing

Một ứng dụng web mạnh mẽ để xử lý hình ảnh sử dụng NestJS và Sharp, với giao diện web thân thiện và nhiều tính năng composite nâng cao.

## ✨ Tính năng

### 🎯 Xử lý cơ bản
- **📏 Resize Image** - Thay đổi kích thước hình ảnh
- **🔄 Convert Format** - Chuyển đổi định dạng (JPEG, PNG, WebP)
- **✂️ Crop Image** - Cắt hình ảnh theo vùng chọn
- **ℹ️ Image Information** - Xem metadata chi tiết

### ✨ Bộ lọc và hiệu ứng
- **Greyscale** - Chuyển đổi sang ảnh đen trắng
- **Sharpen** - Làm sắc nét hình ảnh
- **Blur** - Làm mờ với mức độ điều chỉnh
- **Brightness** - Điều chỉnh độ sáng
- **Contrast** - Điều chỉnh độ tương phản

### 🔀 Tính năng Composite
- **🔀 Composite Images** - Ghép 2 hình ảnh với các blend mode khác nhau
- **🖼️ Create Collage** - Tạo collage từ nhiều hình ảnh
- **💧 Add Watermark** - Thêm watermark text với nhiều tùy chọn
- **🖼️ Add Border** - Thêm viền cho hình ảnh
- **🎭 Apply Mask** - Áp dụng mask hình dạng (Circle, Rounded, Star)

### 🔄 Tính năng Rotate (Mới!)
- **🔄 Rotate Image** - Xoay hình ảnh với góc tùy chỉnh
- **🔀 Flip Image** - Lật hình ảnh theo chiều ngang/dọc
- **🎛️ Advanced Transform** - Kết hợp xoay + lật với nhiều tùy chọn

## 🚀 Cách sử dụng

Ứng dụng chạy tại: **http://localhost:3001**

### 🔀 Hướng dẫn tính năng Composite

#### Composite Images
- Upload 2 hình ảnh (base và overlay)
- Chọn vị trí hoặc gravity
- Chọn blend mode (multiply, screen, overlay, etc.)

#### Create Collage  
- Upload nhiều hình ảnh (tối đa 20)
- Chọn số cột cho lưới
- Điều chỉnh khoảng cách và màu nền

#### Add Watermark
- Upload hình ảnh cần watermark
- Nhập text watermark
- Chọn font, size, màu sắc, opacity và vị trí

#### Add Border
- Upload hình ảnh
- Điều chỉnh độ rộng viền và màu viền

#### Apply Mask
- Upload hình ảnh
- Chọn loại mask (Circle, Rounded Rectangle, Star)
- Điều chỉnh radius và màu nền

### 🔄 Hướng dẫn tính năng Rotate

#### Rotate Image
- Upload hình ảnh
- Nhập góc xoay (degree) hoặc sử dụng quick buttons (90°, 180°, 270°, -90°)
- Chọn màu nền cho vùng trống sau khi xoay
- Hỗ trợ góc xoay tùy chỉnh (bất kỳ số thực nào)

#### Flip Image  
- Upload hình ảnh
- Chọn hướng lật: Horizontal (↔), Vertical (↕), hoặc Both (↗)
- Sử dụng quick buttons để lật nhanh

#### Advanced Transform
- Upload hình ảnh
- Kết hợp nhiều transformation: xoay + lật ngang + lật dọc
- Điều chỉnh góc xoay (có thể để trống)
- Chọn các checkbox để lật theo hướng mong muốn
- Chọn màu nền

## 📡 API Endpoints

### Basic Operations
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/images/upload` | Upload và lấy thông tin hình ảnh |
| POST | `/images/resize` | Resize hình ảnh |
| POST | `/images/convert` | Chuyển đổi format |
| POST | `/images/crop` | Crop hình ảnh |
| POST | `/images/filters` | Áp dụng bộ lọc |

### Composite Operations
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/images/composite` | Ghép 2 hình ảnh |
| POST | `/images/collage` | Tạo collage từ nhiều ảnh |
| POST | `/images/watermark` | Thêm watermark text |
| POST | `/images/border` | Thêm viền |
| POST | `/images/mask` | Áp dụng mask hình dạng |

### Rotate Operations (Mới!)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/images/rotate` | Xoay hình ảnh với góc tùy chỉnh |
| POST | `/images/rotate/flip` | Lật hình ảnh theo hướng |
| POST | `/images/rotate/transform` | Transform nâng cao (xoay + lật) |

### Utility
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/images/download/:filename` | Download hình ảnh đã xử lý |

#### Apply Mask
- Upload hình ảnh  
- Chọn loại mask (Circle, Rounded Rectangle, Star)
- Điều chỉnh radius và màu nền
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
