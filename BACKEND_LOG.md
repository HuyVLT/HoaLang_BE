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

