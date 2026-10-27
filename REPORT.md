# HNL Dev v0.3.3 – Báo cáo môi trường QLTC và Preview Studio
Ngày: 27/10/2026. Chỉ sửa HNL Dev Center, không sửa HNL QLTC/HCF/HCE.

## Nguồn chuẩn
HNL Dev GitHub `lengochieu1211-sudo/hnl-dev-center`, branch `dev`, HEAD cơ sở `ca169a4e269f6ec5c029e687d94c851e9cbdb84c` (v0.3.1). Mã nguồn 0.3.2 xem trước phát triển từ đúng source đó, chưa push. Tích hợp các thay đổi thành v0.3.3 trên DEV trước.

## Hiện trạng / Root cause
- HNL Dev chỉ có 1 thẻ QLTC mặc định `dev`, che mất hệ thống PROD và DEV BACKUP.
- Preview v0.3.1 nhúng web, ô URL ở dưới khung mô phỏng và thiếu lựa chọn môi trường, gây khó sử dụng điện thoại.
- Vercel SSO trước đây chặn khách chưa đăng nhập; đã tắt bảo vệ cho trang HNL Dev công khai. Không liên quan Firebase QLTC.

## Thực hiện
- Thêm ba thẻ QLTC PROD / DEV / DEV BACKUP, hiển thị mục đích, Firebase (nếu đã xác minh), Hosting site, HEAD GitHub cho PROD và DEV; DEV BACKUP không gán bừa HEAD.
- Preview chọn môi trường QLTC, tự điền URL; PROD chặn nhúng, chỉ mở tab ngoài; DEV và DEV BACKUP có thể mở ngoài, nhúng thử giới hạn.
- Giữ Preview hỗ trợ PC/laptop/tablet/iPhone/Android, iframe kích thước logic đúng và nút mở Web thật ở phía trên.
- Thêm lựa chọn môi trường khi tạo hồ sơ QLTC; lưu trường `environment` tùy chọn, tương thích bản ghi cũ/JSON schemaVersion=1.
- Không yêu cầu API AI, không lưu secrets, không sửa Firebase/R2/Hosting/GitHub của QLTC.

## Môi trường kiểm chứng
- PROD: `main`, Firebase `com-example-qlct-61329`, Hosting `hnlqltc.web.app` theo source; URL đọc được từ bên ngoài.
- DEV: `dev`, Firebase `hnl-qltc-dev`, Hosting `hnl-qltc-dev.web.app`; truy vấn từ ngoài báo 509 (chưa xác định được nguyên nhân).
- DEV BACKUP: Hosting site `hnl-qltc-dev-backup`, truy cập gốc `hnl-qltc-dev-backup.web.app` báo 404; preview channel trước đó có URL tạm, không coi là bản live.
- Tính khả dụng trực tuyến và HEAD triển khai DEV BACKUP **chưa được xác nhận**.

## Gate đã chạy (cục bộ)
- TypeScript: PASS; lint an toàn tĩnh: PASS (không phải ESLint); npm test: 10/10 PASS; audit:public: PASS; Build: PASS.
- Chromium iframe preview 5 kích thước: PASS; Chromium QLTC env 4 kích thước: PASS.
- Package lock đồng bộ; file config Firebase không tồn tại trong HNL Dev; workflow CI không có lệnh deploy.
- Runtime Golden thiết bị thật/Firebase/Auth multi-user: CHƯA KIỂM THỬ, KHÔNG CERTIFIED.

## Rủi ro và hạn chế
- URL DEV / DEV BACKUP có thể không phục vụ live; không che giấu kết quả thất bại.
- Dữ liệu hồ sơ lưu localStorage theo domain, không tự đồng bộ các thiết bị.
- Không thực hiện thao tác dữ liệu PROD từ ứng dụng quản trị.
- Cần đo build/CI từ HEAD đẩy lên GitHub và xác nhận Vercel READY trước khi giao Web v0.3.3.

## Đóng gói
FULL SOURCE có 32 file. PATCH từ DEV v0.3.1 có 14 file. ZIP CRC PASS.