# HoaLang Backend Development Log & Persistent Memory

> File này lưu trữ lịch sử phát triển, cấu trúc Database, Seeders, API Endpoints, và các cấu hình nghiệp vụ của Backend.

---

## 1. Bản đồ Cấu trúc Hiện tại (Current Backend Structure)

Hệ thống Backend của HoaLang được viết trên nền tảng **Express (TypeScript)**, hỗ trợ kiến trúc Multi-Tenant linh hoạt kết nối động với MongoDB Atlas:

* **`src/app.ts`**: Tệp khởi chạy chính của ứng dụng Express. Cấu hình bảo mật (Helmet, Cors), quản lý request, định tuyến tổng quát và tích hợp middleware tiêm kết nối database động cho từng tenant.
* **`src/config/`** (Quản lý cấu hình kết nối):
  - `coreDatabase.ts`: Thiết lập kết nối động tới Database lõi (Core DB) của hệ thống.
  - `tenantConnection.ts`: Chứa hàm giải quyết kết nối cơ sở dữ liệu động ở runtime cho từng tenant khi có request gửi đến.
* **`src/modules/`** (Các module nghiệp vụ chính):
  - `auth/`: Đăng nhập, đăng ký, cấp phát JWT, xác minh quyền hạn người dùng toàn cục và kiểm soát RBAC (Role-Based Access Control).
  - `tenantProvisioning/`: Quản lý quy trình tự động cấp phát tài nguyên, tạo database độc lập, thiết lập dữ liệu ban đầu cho các chi nhánh mới.
  - `tenantConfig/`: Quản lý giao diện, bố cục, banner và thông tin hiển thị riêng biệt của mỗi làng nghề.
  - `product/`: API thực hiện CRUD và tìm kiếm nâng cao đối với sản phẩm thủ công nghệ thuật.
* **`src/seeds/`**: Hệ thống các script CLI khởi tạo dữ liệu ban đầu cho hệ thống.

---

## 2. Nhật ký Thay đổi chi tiết (Changelog)

### [2026-06-01] Mongoose Seeder Double-Hashing and User Verification Resolution

#### Tác vụ hoàn thành
- Khắc phục lỗi nghiêm trọng khiến tất cả các tài khoản dữ liệu mẫu (Seeded accounts) không thể đăng nhập được sau khi chạy seed:
  1. Sửa lỗi mật khẩu bị băm (hash) 2 lần do seed băm thủ công kết hợp pre-save hook của Mongoose băm thêm lần nữa.
  2. Sửa lỗi tài khoản bị gắn cờ "chưa kích hoạt" do trường `isVerified` mặc định là `false`.
- Cấu hình lại seeder chạy mượt mà, xác thực tài khoản tức thì, và dọn dẹp các import không sử dụng.

#### Chi tiết kỹ thuật & File thay đổi
1. **Plain-text Password Transition**:
   - Thay đổi trong [seed.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/seeds/seed.ts).
   - Chuyển cấu hình mật khẩu từ băm thủ công qua `bcrypt.hash` thành dạng chuỗi gốc để Mongoose Pre-save Hook tự động băm 1 lần duy nhất trước khi lưu vào MongoDB.
2. **Explicit Account Verification Flag**:
   - Thay đổi trong [seed.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/seeds/seed.ts).
   - Bổ sung trường `isVerified: true` cho tất cả các tài khoản khởi tạo (Super Admin, các Owners, và Demo Traveler) để bỏ qua kiểm tra kích hoạt tài khoản trong passport local strategy.
3. **Unused Imports Clean Up**:
   - Loại bỏ import `bcrypt` dư thừa trong tệp `seed.ts` để vượt qua khâu kiểm duyệt ts-node nghiêm ngặt.

---

### [2026-06-01] Google OAuth Avatar Synchronization Enhancement

#### Tác vụ hoàn thành
- Khắc phục lỗ hổng không đồng bộ ảnh đại diện mới khi người dùng tiếp tục đăng nhập bằng Google trên tài khoản đã tồn tại.
- Nâng cấp hàm `upsertSocialMedia` kiểm tra và tự động cập nhật trường `avatar` và `fullName` mới nhất từ Google OAuth.

#### Chi tiết kỹ thuật & File thay đổi
1. **Google OAuth User Synchronization**:
   - Thay đổi trong [auth.service.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/modules/auth/auth.service.ts).
   - Bổ sung logic kiểm tra trong hàm `upsertSocialMedia`: khi người dùng đã tồn tại `googleId`, hệ thống sẽ so sánh thuộc tính `avatar` và `fullName` hiện tại trong DB với thông tin Google trả về. Nếu có sự thay đổi hoặc thiếu sót, hệ thống sẽ thực hiện cập nhật và tự động gọi `user.save()` để lưu trữ đồng bộ trạng thái mới nhất. Điều này sửa đổi triệt để trường hợp tài khoản đã tạo trước khi hệ thống lưu ảnh đại diện hoặc người dùng thay đổi ảnh đại diện trên tài khoản Google của họ.

---

### [2026-06-01] Backend Environment Variables Configuration & Dependency Installation

#### Tác vụ hoàn thành
- Đồng bộ cấu hình môi trường phát triển chính thức (.env) cho ứng dụng Backend.
- Thiết lập thông tin kết nối tới hệ thống MongoDB Atlas, SMTP Mailer gửi thư kích hoạt tài khoản song ngữ, cổng kết nối hình ảnh Cloudinary, Google OAuth 2.0 Single Sign-On (SSO) và các engine tìm kiếm Meilisearch.
- Cài đặt và tích hợp thư viện `nodemailer` cùng kiểu dữ liệu `@types/nodemailer` bị thiếu giúp quá trình biên dịch TypeScript (`tsc`) hoàn thành thành công 100% không có lỗi.

#### Chi tiết kỹ thuật & File thay đổi
1. **Environment Variables Configuration**:
   - Sửa đổi trong tệp [.env](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/.env).
   - Tích hợp thông tin xác thực SMTP passkey gửi thư song ngữ, thiết lập Cloudinary API Key/Secret, Google OAuth client credentials và cập nhật URI truy vấn kết nối cụm cluster MongoDB Atlas chính thức.
2. **Missing Dependency Installation**:
   - Khởi chạy lệnh cài đặt thư viện `pnpm add nodemailer` tự động tích hợp các gói xác thực gửi thư điện tử giúp giải quyết lỗi biên dịch thiếu module `nodemailer` tại `src/utils/mailer.ts`.

---

### [2026-05-31] Atlas Database Seeder and Connection Hoisting Fixes

#### Tác vụ hoàn thành
- Khắc phục lỗi ESM Import Hoisting khiến module database kết nối trước khi cấu hình môi trường `.env` được tải.
- Thực hiện re-seed toàn bộ cơ sở dữ liệu trên MongoDB Atlas với thông tin tài khoản và mật khẩu chuẩn xác theo yêu cầu mới nhất của hệ thống.
- Giải quyết triệt để các cảnh báo Mongoose trùng lặp Schema Index (`Duplicate schema index`) ở các Model `PageConfig` và `Tenant`.

#### Chi tiết kỹ thuật & File thay đổi
1. **Dynamic Database Connection**:
   - Chỉnh sửa trong `coreDatabase.ts` và `tenantConnection.ts`.
   - Chuyển cấu hình kết nối URI và tên database sang dạng lazy-resolved (chỉ đọc và thiết lập khi hàm kết nối thực sự được kích hoạt ở runtime thay vì đọc ngay lúc import module). Điều này giải quyết triệt để lỗi kết nối cơ sở dữ liệu thất bại khi chạy các scripts độc lập hoặc seeders.
2. **Re-seeded MongoDB Atlas Accounts**:
   - Seed thành công tài khoản Super Admin với mật khẩu cập nhật thành `Admin@123`.
   - Seed thành công các tài khoản Tenant Owners và Traveler Demo với mật khẩu thống nhất thành `TruongHuy888!`:
     - Bát Tràng Owner: `owner@battrang.vn` (Role: `VILLAGE_OWNER`, linked to Tenant Bat Trang).
     - Vạn Phúc Owner: `owner@vanphuc.vn` (Role: `VILLAGE_OWNER`, linked to Tenant Van Phuc).
     - Non Nước Owner: `owner@nonuoc.vn` (Role: `VILLAGE_OWNER`, linked to Tenant Non Nuoc).
     - Traveler Demo: `traveler@gmail.com` (Role: `USER`).
3. **Mongoose Duplicate Index Fixes**:
   - Chỉnh sửa trong [PageConfig.model.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/models/core/PageConfig.model.ts) và [Tenant.model.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/models/core/Tenant.model.ts).
   - Loại bỏ các khai báo index thủ công dư thừa ở cấp độ schema (`Schema.index(...)`) cho các trường đã có thuộc tính `unique: true` trực tiếp ở cấp độ trường (như `tenantId`, `slug`, `domain`, và `dbName`). Điều này giúp cải thiện hiệu năng cơ sở dữ liệu, tiết kiệm tài nguyên bộ nhớ đệm index và tắt hoàn toàn các cảnh báo của Mongoose lúc khởi động ứng dụng.

#### Lưu ý cho lần phát triển tiếp theo
- Tránh import các module kết nối cơ sở dữ liệu ở phạm vi global trong các script chạy bằng CLI nếu script đó chưa thực thi `dotenv.config()`. Bọc kết nối database hoặc gọi dynamic helper để đảm bảo an toàn.
- Khi thiết lập index trong Mongoose Schemas, nếu trường đã có thuộc tính `unique: true` hoặc `index: true`, không khai báo thêm `schema.index({ field: 1 })` để tránh cảnh báo trùng lặp index.
- Khi tạo thêm Tenant mới, hãy đảm bảo cập nhật danh sách tenant được phép truy cập trong file cấu hình và cơ sở dữ liệu tương ứng.

### [2026-05-31] Complete Authentication Flow & Email Verification Integration

#### Tác vụ hoàn thành
- Triển khai toàn diện hệ thống Authentication Flow bảo mật (BE & FE) đáp ứng đầy đủ yêu cầu nghiệp vụ.
- Thiết lập User Schema cải tiến: bổ sung `fullName`, `phone`, `avatar`, `type`, `socialLogin`, `googleId`, `isVerified`, `status`, `walletBalance`.
- Cài đặt pre-save hook tự động băm mật khẩu bằng `bcrypt` trên model.
- Thiết kế cơ chế tự động xóa tài khoản chưa kích hoạt sau 15 phút bằng MongoDB TTL index trên trường `verificationExpiresAt`.
- Tích hợp email xác thực qua Nodemailer với giao diện HTML song ngữ sang trọng, tuân thủ bảng màu và phong cách nghệ thuật HoaLang (parchment, cream, lacquer, gold).
- Triển khai middleware `checkAccessToken` chặn lập tức tài khoản `BLOCKED`.
- Xây dựng tích hợp Google OAuth qua Passport.js hỗ trợ phát hiện thiết bị di động (mobile) qua query parameter và state, điều hướng deep-link tương ứng (`hoalang://auth/callback`) hoặc web client.

#### Chi tiết kỹ thuật & File thay đổi
1. **Models**:
   - Sửa đổi [User.model.ts](file:///d:/HoaLang/HoaLang_BE/src/models/core/User.model.ts): bổ sung các thuộc tính và Mongoose hooks.
2. **Utilities & Mailer**:
   - Thêm mới [mailer.ts](file:///d:/HoaLang/HoaLang_BE/src/utils/mailer.ts): hàm `sendVerificationEmail` dùng `nodemailer`.
   - Thêm mới [cloudinary.ts](file:///d:/HoaLang/HoaLang_BE/src/utils/cloudinary.ts): hàm stream buffer upload `uploadToCloudinary`.
3. **Middleware**:
   - Thêm mới [upload.middleware.ts](file:///d:/HoaLang/HoaLang_BE/src/middleware/upload.middleware.ts): multer memory storage.
   - Sửa đổi [auth.middleware.ts](file:///d:/HoaLang/HoaLang_BE/src/middleware/auth.middleware.ts): bảo vệ API private và chặn tài khoản `BLOCKED`.
4. **Auth Module**:
   - Sửa đổi [auth.dto.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/auth/auth.dto.ts): kiểm tra định dạng phone (10 số) và mật khẩu mạnh.
   - Sửa đổi [auth.service.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/auth/auth.service.ts): triển khai `register` (isVerified = false), `verifyAccount` (kích hoạt), và `upsertSocialMedia` (đồng bộ Google).
   - Sửa đổi [passport.ts](file:///d:/HoaLang/HoaLang_BE/src/config/passport.ts): tinh chỉnh Local Strategy (kiểm tra status, isVerified) và Google Strategy.
   - Sửa đổi [auth.routes.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/auth/auth.routes.ts) & [auth.controller.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/auth/auth.controller.ts): tích hợp upload avatar khi register, định tuyến Google OAuth theo thiết bị, và GET `/verify-account`.
5. **Database Seeder**:
   - Sửa đổi [seed.ts](file:///d:/HoaLang/HoaLang_BE/src/seeds/seed.ts): chuyển đổi trường `name` sang `fullName` và fix type casting cho Mongoose document.

### [2026-06-01] Request Query Object Mutation Bug Fix

#### Tác vụ hoàn thành
- Khắc phục triệt để lỗi runtime crash `Cannot set property query of #<IncomingMessage> which has only a getter` khi thực hiện đăng ký tài khoản trên môi trường Next.js/Express.
- Đảm bảo tính nhất quán của kiểu dữ liệu đầu vào sau khi được Zod ép kiểu và kiểm tra trong middleware validation.

#### Chi tiết kỹ thuật & File thay đổi
1. **Zod Validation Middleware Safe Re-assignment**:
   - Thay đổi trong [validate.middleware.ts](file:///d:/HoaLang/HoaLang_BE/src/middleware/validate.middleware.ts).
   - Thay thế việc ghi đè trực tiếp tham chiếu của đối tượng `req.query` và `req.params` (gây ra lỗi crash do Express thiết lập `req.query` làm getter chỉ đọc).
   - Cải tiến bằng cách xóa toàn bộ các khóa cũ và sử dụng `Object.assign(req.query, validated.query)` (hoặc `req.params`) để cập nhật trực tiếp nội dung các thuộc tính bên trong mà không làm thay đổi con trỏ tham chiếu đối tượng cha, loại bỏ lỗi getter-only an toàn 100%.

### [2026-06-01] Idempotent Account Verification Fix

#### Tác vụ hoàn thành
- Khắc phục lỗi hiển thị "Kích hoạt thất bại / Verification Failed" khi người dùng truy cập trang kích hoạt tài khoản dù tài khoản thực tế đã được xác thực (`isVerified = true`) và đăng nhập bình thường.
- Cải thiện trải nghiệm xác thực song ngữ và khả năng chịu tải tốt hơn đối với các công cụ quét link tự động (email link scanners) của Gmail/Outlook.

#### Chi tiết kỹ thuật & File thay đổi
1. **Idempotency in Auth Service**:
   - Thay đổi trong [auth.service.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/auth/auth.service.ts).
   - Sửa đổi phương thức `verifyAccount(token)`: Nếu phát hiện tài khoản đã kích hoạt (`user.isVerified === true`), trả về ngay thông tin người dùng được loại bỏ password (thay vì ném ra lỗi `400 Bad Request` với thông điệp "This account is already verified"). Điều này làm cho API xác thực trở nên idempotent (gọi nhiều lần với cùng 1 token đều trả về kết quả thành công).
