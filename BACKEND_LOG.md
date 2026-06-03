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
   - Thay đổi trong [auth.service.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/modules/auth/auth.service.ts).
   - Sửa đổi phương thức `verifyAccount(token)`: Nếu phát hiện tài khoản đã kích hoạt (`user.isVerified === true`), trả về ngay thông tin người dùng được loại bỏ password (thay vì ném ra lỗi `400 Bad Request` với thông điệp "This account is already verified"). Điều này làm cho API xác thực trở nên idempotent (gọi nhiều lần với cùng 1 token đều trả về kết quả thành công).

---

### [2026-06-01] Multi-Tenant Experiences Endpoint & Enhanced Database Seeding

#### Tác vụ hoàn thành
- Xây dựng hoàn chỉnh API truy xuất danh sách Trải nghiệm (`GET /experiences`) theo từng phân hệ Làng nghề (tenant-scoped) phục vụ tích hợp đặt chỗ (booking) từ frontend.
- Cải tiến quy trình seeding dữ liệu mẫu: bổ sung đồng bộ cơ sở dữ liệu `Experience` song hành cùng bộ sưu tập `Workshop` để loại bỏ triệt để lỗi 404 khi thực hiện tạo giao dịch sandbox tại cổng PayOS.

#### Chi tiết kỹ thuật & File thay đổi
1. **Experience Retrieval Service & Controller**:
   - Thay đổi trong [payment.controller.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/modules/payment/payment.controller.ts).
   - Triển khai phương thức điều khiển `getExperiences`: Tự động trích xuất `Experience` model thuộc Connection Pool tương ứng của tenant (`req.tenantDb!`), truy vấn toàn bộ các trải nghiệm có cờ `isPublished: true` và sắp xếp giảm dần theo thời gian tạo.
2. **Tenant-Scoped Experience Routing**:
   - Thay đổi trong [payment.routes.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/modules/payment/payment.routes.ts).
   - Tích hợp thêm route `GET /experiences` áp dụng đồng bộ chốt chặn middleware `resolveTenant` và `requireTenantDb` để cô lập dữ liệu chuẩn xác cho từng làng nghề.
3. **Database Seeder Synchronization**:
   - Thay đổi trong [seed.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/seeds/seed.ts).
   - Cải tiến quy trình seed: Sau khi khởi tạo các `Workshop` mẫu cho Bát Tràng, Vạn Phúc và Non Nước, tự động ánh xạ (map) các thuộc tính tương thích sang schema `Experience` và ghi nhận đồng thời vào bộ sưu tập `Experience`. Điều này giúp đảm bảo API tạo booking (`POST /bookings` tìm kiếm qua `Experience` model) luôn phân giải thành công thực thể thật trong cơ sở dữ liệu.

---

### [2026-06-02] Global Villages API Endpoints

#### Tác vụ hoàn thành
- Phát triển API Lấy tất cả làng nghề (`GET /api/v1/villages`) và Lấy chi tiết một làng nghề (`GET /api/v1/villages/:slug`) hoạt động trực tiếp trên database hoalang_core.
- Hỗ trợ đầy đủ các tham số truy vấn tìm kiếm lọc thông minh bao gồm: từ khóa tìm kiếm (`search`), Lọc theo tỉnh thành (`province`), Lọc theo danh mục sản xuất (`category`), và lọc theo trạng thái kiểm duyệt (`isVerified`).
- Tích hợp tài liệu hướng dẫn Swagger OpenAPI cho phân hệ API Làng Nghề.

#### Chi tiết kỹ thuật & File thay đổi
1. **Controller**:
   - Thêm mới [village.controller.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/village/village.controller.ts): Xây dựng hàm `getVillages` xử lý Regex search trên name.vi, name.en, province và các bộ lọc tỉnh/ngành nghề. Thiết lập `getVillageBySlug` tìm kiếm một bản ghi duy nhất.
2. **Routes**:
   - Thêm mới [village.routes.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/village/village.routes.ts): Định nghĩa các endpoint và tài liệu Swagger OpenAPI tương ứng.
3. **App Bootstrap**:
   - Sửa đổi [app.ts](file:///d:/HoaLang/HoaLang_BE/src/app.ts): Nhập `villageRoutes` và đăng ký định tuyến dưới tiền tố `/api/v1/villages` tại tầng định tuyến lõi (không scoped tenant).

---

### [2026-06-02] Update User Profile Endpoint & Cloudinary Integration

#### Tác vụ hoàn thành
- Phát triển API cập nhật thông tin cá nhân (`PUT /api/v1/auth/profile`) cho phép người dùng đang đăng nhập chỉnh sửa các trường họ tên, số điện thoại, và tải lên ảnh đại diện mới.
- Tích hợp công cụ upload hình ảnh Multer cùng cổng lưu trữ Cloudinary để xử lý và lưu trữ trực tiếp ảnh đại diện của người dùng lên Cloudinary.
- Tích hợp kiểm tra dữ liệu đầu vào sử dụng Zod schema.

#### Chi tiết kỹ thuật & File thay đổi
1. **Auth DTO Schema**:
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

### [2026-06-03] Configure PayOS Redirect URLs for Local Development Environment

#### Tác vụ hoàn thành
- Khắc phục lỗi thanh toán thành công trên cổng PayOS nhưng đơn hàng local bị kẹt ở trạng thái `PENDING` và hiển thị trang trắng.
- Cấu hình các biến môi trường redirection cụ thể cho PayOS để định hướng người dùng quay lại client local thay vì mặc định về production.

#### Chi tiết kỹ thuật & File thay đổi
1. **PayOS Environment Variables Configuration**:
   - Thay đổi trong tệp [.env](file:///d:/HoaLang/HoaLang_BE/.env).
   - Thêm hai cấu hình môi trường mới: `PAYOS_RETURN_URL=http://localhost:3000/payment/success` và `PAYOS_CANCEL_URL=http://localhost:3000/payment/cancel`.
   - Điều này đảm bảo rằng các đường link thanh toán được sinh ra ở máy local sẽ hướng khách hàng quay trở lại cổng Next.js local (đã tích hợp logic đồng bộ trạng thái đơn hàng) sau khi thanh toán hoặc hủy thanh toán, thay vì hướng về trang web production trực tuyến `https://hoalang.site`.

---

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
- Cải thiện trải nghiệm xác thực song ngữ và khả năng chịu tải tốt hơn đối các công cụ quét link tự động (email link scanners) của Gmail/Outlook.

#### Chi tiết kỹ thuật & File thay đổi
1. **Idempotency in Auth Service**:
   - Thay đổi trong [auth.service.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/modules/auth/auth.service.ts).
   - Sửa đổi phương thức `verifyAccount(token)`: Nếu phát hiện tài khoản đã kích hoạt (`user.isVerified === true`), trả về ngay thông tin người dùng được loại bỏ password (thay vì ném ra lỗi `400 Bad Request` với thông điệp "This account is already verified"). Điều này làm cho API xác thực trở nên idempotent (gọi nhiều lần với cùng 1 token đều trả về kết quả thành công).

---

### [2026-06-01] Multi-Tenant Experiences Endpoint & Enhanced Database Seeding

#### Tác vụ hoàn thành
- Xây dựng hoàn chỉnh API truy xuất danh sách Trải nghiệm (`GET /experiences`) theo từng phân hệ Làng nghề (tenant-scoped) phục vụ tích hợp đặt chỗ (booking) từ frontend.
- Cải tiến quy trình seeding dữ liệu mẫu: bổ sung đồng bộ cơ sở dữ liệu `Experience` song hành cùng bộ sưu tập `Workshop` để loại bỏ triệt để lỗi 404 khi thực hiện tạo giao dịch sandbox tại cổng PayOS.

#### Chi tiết kỹ thuật & File thay đổi
1. **Experience Retrieval Service & Controller**:
   - Thay đổi trong [payment.controller.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/modules/payment/payment.controller.ts).
   - Triển khai phương thức điều khiển `getExperiences`: Tự động trích xuất `Experience` model thuộc Connection Pool tương ứng của tenant (`req.tenantDb!`), truy vấn toàn bộ các trải nghiệm có cờ `isPublished: true` và sắp xếp giảm dần theo thời gian tạo.
2. **Tenant-Scoped Experience Routing**:
   - Thay đổi trong [payment.routes.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/modules/payment/payment.routes.ts).
   - Tích hợp thêm route `GET /experiences` áp dụng đồng bộ chốt chặn middleware `resolveTenant` và `requireTenantDb` để cô lập dữ liệu chuẩn xác cho từng làng nghề.
3. **Database Seeder Synchronization**:
   - Thay đổi trong [seed.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/seeds/seed.ts).
   - Cải tiến quy trình seed: Sau khi khởi tạo các `Workshop` mẫu cho Bát Tràng, Vạn Phúc và Non Nước, tự động ánh xạ (map) các thuộc tính tương thích sang schema `Experience` và ghi nhận đồng thời vào bộ sưu tập `Experience`. Điều này giúp đảm bảo API tạo booking (`POST /bookings` tìm kiếm qua `Experience` model) luôn phân giải thành công thực thể thật trong cơ sở dữ liệu.

---

### [2026-06-02] Global Villages API Endpoints

#### Tác vụ hoàn thành
- Phát triển API Lấy tất cả làng nghề (`GET /api/v1/villages`) và Lấy chi tiết một làng nghề (`GET /api/v1/villages/:slug`) hoạt động trực tiếp trên database hoalang_core.
- Hỗ trợ đầy đủ các tham số truy vấn tìm kiếm lọc thông minh bao gồm: từ khóa tìm kiếm (`search`), Lọc theo tỉnh thành (`province`), Lọc theo danh mục sản xuất (`category`), và lọc theo trạng thái kiểm duyệt (`isVerified`).
- Tích hợp tài liệu hướng dẫn Swagger OpenAPI cho phân hệ API Làng Nghề.

#### Chi tiết kỹ thuật & File thay đổi
1. **Controller**:
   - Thêm mới [village.controller.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/village/village.controller.ts): Xây dựng hàm `getVillages` xử lý Regex search trên name.vi, name.en, province và các bộ lọc tỉnh/ngành nghề. Thiết lập `getVillageBySlug` tìm kiếm một bản ghi duy nhất.
2. **Routes**:
   - Thêm mới [village.routes.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/village/village.routes.ts): Định nghĩa các endpoint và tài liệu Swagger OpenAPI tương ứng.
3. **App Bootstrap**:
   - Sửa đổi [app.ts](file:///d:/HoaLang/HoaLang_BE/src/app.ts): Nhập `villageRoutes` và đăng ký định tuyến dưới tiền tố `/api/v1/villages` tại tầng định tuyến lõi (không scoped tenant).

---

### [2026-06-02] Update User Profile Endpoint & Cloudinary Integration

#### Tác vụ hoàn thành
- Phát triển API cập nhật thông tin cá nhân (`PUT /api/v1/auth/profile`) cho phép người dùng đang đăng nhập chỉnh sửa các trường họ tên, số điện thoại, và tải lên ảnh đại diện mới.
- Tích hợp công cụ upload hình ảnh Multer cùng cổng lưu trữ Cloudinary để xử lý và lưu trữ trực tiếp ảnh đại diện của người dùng lên Cloudinary.
- Tích hợp kiểm tra dữ liệu đầu vào sử dụng Zod schema.

#### Chi tiết kỹ thuật & File thay đổi
1. **Auth DTO Schema**:
   - Sửa đổi [auth.dto.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/auth/auth.dto.ts): Bổ sung `updateProfileSchema` để kiểm tra độ dài họ tên tối thiểu 2 chữ và phone tối thiểu 10 chữ số hoặc rỗng.
2. **Auth Service**:
   - Sửa đổi [auth.service.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/auth/auth.service.ts): Thêm phương thức `updateProfile` để tìm bản ghi người dùng, cập nhật và lưu trữ các giá trị mới.
3. **Auth Controller**:
   - Sửa đổi [auth.controller.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/auth/auth.controller.ts): Thêm phương thức `updateProfile`, gọi tiện ích `uploadToCloudinary` để chuyển file buffer thành URL ảnh đại diện chính thức.
4. **Auth Routes**:
   - Sửa đổi [auth.routes.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/auth/auth.routes.ts): Định nghĩa đường dẫn `PUT /profile` với các middlewares `protect`, `upload.single('avatar')`, `validateRequest(updateProfileSchema)`.

---

### [2026-06-02] Voucher & Discount Codes Core Module & Seeding

#### Tác vụ hoàn thành
- Thiết lập cơ sở dữ liệu `Voucher` lõi mới trong hoalang_core.
- Triển khai API lấy mã giảm giá đang hoạt động (`GET /api/v1/vouchers`) có bảo mật bằng middleware `protect`.
- Cấu hình seeding dữ liệu mã giảm giá mẫu trong `seed.ts` và tích hợp dọn dẹp (drop) tự động bộ sưu tập trước khi seed để tránh trùng khóa.

#### Chi tiết kỹ thuật & File thay đổi
1. **Voucher Model**:
   - Thêm mới [Voucher.model.ts](file:///d:/HoaLang/HoaLang_BE/src/models/core/Voucher.model.ts): Định nghĩa schema Mongoose, các thuộc tính `code` (uppercase, unique, index), `description` (đa ngôn ngữ), `discountType` (`PERCENTAGE`/`FIXED`), `minOrderValue`, `startDate`, `endDate`, `isActive`.
2. **Voucher Service, Controller, Routes**:
   - Thêm mới [voucher.service.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/voucher/voucher.service.ts): Truy vấn tất cả voucher active và còn thời hạn hiệu lực.
   - Thêm mới [voucher.controller.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/voucher/voucher.controller.ts): Phản hồi dữ liệu chuẩn hóa dạng JSON qua tiện ích `sendResponse`.
   - Thêm mới [voucher.routes.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/voucher/voucher.routes.ts): Thiết lập endpoint `GET /` được bọc bởi middleware `protect`.
3. **App Bootstrap Integration**:
   - Sửa đổi [app.ts](file:///d:/HoaLang/HoaLang_BE/src/app.ts): Mount định tuyến mới dưới đường dẫn `/api/v1/vouchers`.
4. **Core Database Seeder**:
   - Sửa đổi [seed.ts](file:///d:/HoaLang/HoaLang_BE/src/seeds/seed.ts): Thêm dọn dẹp `Voucher.deleteMany({})` và seeding danh sách 3 voucher lớn: `HOALANG10`, `BATTRANG20`, `VANPHUC50K` có đầy đủ dịch thuật 5 ngôn ngữ.

---

### [2026-06-03] User Tenants Mapping & Secured Dashboard Routes

#### Tác vụ hoàn thành
- Tích hợp thêm trường `tenants` liên kết của người dùng trong kết quả trả về của các API Đăng nhập (`/auth/login`) và API Lấy thông tin cá nhân (`/auth/me`).
- Nâng cao tính bảo mật và cô lập dữ liệu cho Bảng quản trị của từng Tenant (multi-tenant isolation) bằng cách bắt buộc kiểm tra xem Owner có quyền sở hữu của Tenant tương ứng thông qua middleware `requireTenantRole`.

#### Chi tiết kỹ thuật & File thay đổi
1. **Auth Controller**:
   - Sửa đổi [auth.controller.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/auth/auth.controller.ts): Nhập `UserTenantRole` model. Trong phương thức `login` và `getMe`, tự động truy vấn danh sách `UserTenantRole` thuộc về người dùng hiện tại, populate thông tin chi tiết của `Tenant` và trả về mảng `tenants` chứa thông tin `slug`, `name`, và vai trò `role` cục bộ.
2. **Merchant Dashboard Routes Security**:
   - Sửa đổi [dashboard.routes.ts](file:///d:/HoaLang/HoaLang_BE/src/modules/tenantConfig/dashboard.routes.ts): Bổ sung thêm middleware `requireTenantRole('OWNER')` vào đường dẫn định tuyến cấu hình. Thiết lập này ngăn chặn triệt để lỗ hổng bảo mật nơi một VILLAGE_OWNER của làng nghề này có thể xem/chỉnh sửa hoặc ngắt kết nối cấu hình cổng PayOS của một làng nghề khác bằng cách thay đổi header `x-tenant-slug` thủ công.

---

### [2026-06-03] SendGrid Web API Integration

#### Tác vụ hoàn thành
- Chuyển đổi cơ chế gửi mail từ SMTP Nodemailer sang SendGrid Web API (Cổng HTTPS - Port 443) để khắc phục tình trạng bị chặn cổng SMTP trên các dịch vụ Hosting/PaaS giới hạn cổng như Render hoặc Vercel.
- Cập nhật các biến cấu hình môi trường tương ứng trong file `.env`.

#### Chi tiết kỹ thuật & File thay đổi
1. **Mailer Utility**:
   - Thay đổi trong [mailer.ts](file:///d:/HoaLang/HoaLang_BE/src/utils/mailer.ts).
   - Loại bỏ `nodemailer` và tích hợp SDK chính thức `@sendgrid/mail`.
   - Viết hàm `getSenderInfo()` hỗ trợ phân tách tên hiển thị và email từ biến môi trường `SENDGRID_FROM` hoặc `SMTP_FROM`.
   - Cập nhật hàm `sendVerificationEmail` và `sendResetPasswordEmail` sử dụng `sgMail.send()` thay thế cho `transporter.sendMail()`.
2. **Environment Configuration**:
   - Thay đổi trong [.env](file:///d:/HoaLang/HoaLang_BE/.env).
   - Loại bỏ các biến cấu hình SMTP và thay bằng `SENDGRID_API_KEY` và `SENDGRID_FROM`.
### [2026-06-03] TypeScript Build Resolution for PaaS/Render Deployments & Environment Separation

#### Tác vụ hoàn thành
- Khắc phục triệt để lỗi biên dịch TypeScript (`tsc`) khi triển khai ứng dụng Backend lên các môi trường cloud (Render, Heroku, v.v.).
- Giải quyết lỗi không thể nhận diện các đối tượng toàn cục của Node (`process`, `console`, `Buffer`, `crypto`) và các module nghiệp vụ như `express`, `@payos/node` do cơ chế bỏ qua cài đặt `devDependencies` trong môi trường sản xuất (`NODE_ENV=production`) của npm/pnpm.
- Loại bỏ thuộc tính `"types": ["node"]` trong `tsconfig.json` vốn gây cản trở TypeScript tự động nạp các tệp định nghĩa kiểu `@types/*` khác khi import module.
- Di chuyển `typescript`, `ts-node`, và `tsconfig-paths` từ `devDependencies` sang `dependencies` trong `package.json` để đảm bảo chúng luôn được cài đặt đầy đủ trong quá trình build production.
- Định nghĩa kiểu dữ liệu tường minh (`UploadApiErrorResponse | undefined`, `UploadApiResponse | undefined`) cho tham số callback trong [cloudinary.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/utils/cloudinary.ts) để giải quyết lỗi `noImplicitAny` khi biên dịch ở chế độ strict.
- Phân chia gọn gàng cấu hình môi trường giữa môi trường cục bộ (Local Development) và triển khai thực tế (Production Deployment) trong tệp `.env` sử dụng chú thích.

#### Chi tiết kỹ thuật & File thay đổi
1. **Typings & Compiler Relocation**:
   - Sửa đổi [package.json](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/package.json): Di chuyển toàn bộ các gói định nghĩa kiểu dữ liệu `@types/*` (gồm `@types/node`, `@types/express`, `@types/jsonwebtoken`, `@types/cors`, `@types/bcrypt`, v.v.) và các công cụ dịch (`typescript`, `ts-node`, `tsconfig-paths`) từ `devDependencies` sang `dependencies`. Điều này đảm bảo khi cài đặt dependencies trong môi trường Production, các kiểu dữ liệu và lệnh biên dịch luôn sẵn sàng.
2. **TSConfig Types Enforcement**:
   - Sửa đổi [tsconfig.json](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/tsconfig.json): Loại bỏ `"types": ["node"]` ở `compilerOptions` để TypeScript tự động nạp toàn bộ các `@types` đã cài đặt từ thư mục `node_modules/@types` nhằm phân giải tất cả module import và Node globals.
3. **Cloudinary Strict Typing**:
   - Sửa đổi [cloudinary.ts](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/src/utils/cloudinary.ts): Import `UploadApiErrorResponse` và `UploadApiResponse` từ gói `cloudinary` để chỉ định kiểu rõ ràng cho callback của `upload_stream`.
4. **Environment Variables Separation**:
   - Sửa đổi [.env](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/.env): Tạo các khối chú thích rõ ràng phân vùng cho Local Development và Production Deployment đối với các biến `CLIENT_URL`, `BACKEND_URL`, và các đường dẫn hoàn tất giao dịch PayOS (`PAYOS_RETURN_URL`, `PAYOS_CANCEL_URL`).


---

### [2026-06-03] Express Trust Proxy Configuration for HTTPS OAuth Callback Resolution

#### Tác vụ hoàn thành
- Cấu hình `app.set('trust proxy', 1)` trong Express để nhận diện chính xác các header của reverse proxy (như `x-forwarded-proto`).
- Khắc phục lỗi Passport.js tự động sinh callback URL dạng `http://` thay vì `https://` khi chạy sau mạng lưới phân phối (proxy) của Render, giúp loại bỏ hoàn toàn lỗi `redirect_uri_mismatch` từ Google OAuth.

#### Chi tiết kỹ thuật & File thay đổi
1. **Express App Bootstrap**:
   - Sửa đổi [app.ts](file:///d:/HoaLang/HoaLang_BE/src/app.ts): Thêm dòng `app.set('trust proxy', 1)` ngay sau khi khởi tạo Express app instance.
---

### [2026-06-03] Remove Nodemailer Dependency & Sync SendGrid Environment Variables

#### Tác vụ hoàn thành
- Cập nhật chính thức tệp `.env` đồng bộ cấu hình SendGrid Web API, loại bỏ hoàn toàn các cấu hình SMTP/Nodemailer cũ để tương thích 100% với môi trường cloud/PaaS của Render vốn chặn cổng SMTP (ports 587/465/25).
- Dọn dẹp mã nguồn sạch sẽ bằng cách gỡ bỏ thư viện `nodemailer` và gói định nghĩa kiểu `@types/nodemailer` ra khỏi dự án do không còn sử dụng (hệ thống đã được chuyển hoàn toàn qua SendGrid Web API ở cổng HTTPS - Port 443).
- Chạy cập nhật lockfile `pnpm-lock.yaml` và kiểm tra biên dịch (`tsc`) thành công 100% không có lỗi.

#### Chi tiết kỹ thuật & File thay đổi
1. **Environment Configuration**:
   - Sửa đổi [.env](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/.env): Thay thế toàn bộ khối cấu hình SMTP/Nodemailer cũ bằng cấu hình `SENDGRID_API_KEY` và `SENDGRID_FROM` chính thức trong cả hai phân vùng Local (Khối A) và Production (Khối B).
2. **Package Clean Up**:
   - Sửa đổi [package.json](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/package.json): Xóa bỏ `"nodemailer"` và `"@types/nodemailer"` khỏi phần `dependencies`.
   - Khởi chạy lệnh `pnpm install` cập nhật dependencies trong `node_modules` và đồng bộ `pnpm-lock.yaml`.

---

### [2026-06-03] Switch Package Manager from pnpm to npm

#### Tác vụ hoàn thành
- Chuyển đổi toàn diện trình quản lý gói của Backend từ `pnpm` sang `npm` để đồng bộ hóa quy trình phát triển cục bộ và phân phối sản phẩm.
- Khởi tạo tệp khóa `package-lock.json` thông qua lệnh cài đặt an toàn `npm install --legacy-peer-deps`.
- Cấu hình lại tệp tin bỏ qua của git `.gitignore` và Dockerfile tương thích hoàn toàn với cơ chế cài đặt của `npm`.
- Xác nhận biên dịch TypeScript dự án (`npm run build`) thành công 100% không có lỗi.

#### Chi tiết kỹ thuật & File thay đổi
1. **Dependency Configuration**:
   - Sửa đổi [package.json](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/package.json): Loại bỏ trường chỉ định `"packageManager": "pnpm@10.16.1"`.
   - Sửa đổi [.gitignore](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/.gitignore): Loại bỏ `package-lock.json` khỏi danh sách bỏ qua và thêm `pnpm-lock.yaml` để Git theo dõi tệp khóa của npm và bỏ qua tệp của pnpm.
2. **Dockerfile Refactoring**:
   - Sửa đổi [Dockerfile](file:///c:/Project%20Web/Multi-Tenant/HoaLang/hoalang-be/Dockerfile): Thay thế toàn bộ các tiến trình cài đặt của `pnpm` bằng `npm` tương ứng với cờ `--legacy-peer-deps` để giải quyết xung đột peer dependency và build mã nguồn bằng `npm run build`.
3. **Lockfile Switch**:
   - Xóa bỏ `pnpm-lock.yaml` và sinh mới thành công `package-lock.json`.
