# HNL Dev Center v0.3.0 — Public Repository / DEV Readiness Report

**27/10/2026**. Source nền: HNL Dev Center v0.2.0 FULL SOURCE ZIP, không phải QLTC/HCF/HCE.

## Nguồn và trạng thái
- Dev Center: repository `hnl-dev-center` chưa tạo (GitHub connector không cung cấp create_repository); chưa có HEAD riêng.
- QLTC: `lengochieu1211-sudo/hnl-qltc` / `dev` / `d6effaf03a08a9879fa172a345992922916036d2`.
- HCF: `lengochieu1211-sudo/hnl-cad-ai` / `research/vxt-pro-v7-bootstrap` / `83582296127306d846571010a43eb8e94edbedd1`.
- HCE: `lengochieu1211-sudo/hnl-cad-ai` / `research/hce-pro-bootstrap` / `a45fe6dcf9fca2172fed3a93ac14e6cf4f4f8ae8`.
- Không thay đổi GitHub, Firebase, Cloudflare R2, domain hoặc môi trường PROD của ba ứng dụng.

## Root cause / sửa lỗi
1. Service worker cũ cache mọi URL GET cùng origin, tăng rủi ro giữ dữ liệu API nếu có endpoint mới. Giới hạn chỉ cache danh sách file tĩnh định nghĩa trước; URL có query và các endpoint khác không bị intercept.
2. Bản cũ chưa có quy tắc Public Repository / kiểm tra sơ bộ file nhạy cảm. Thêm `.gitignore`, `.gitattributes` và `scripts/public-safety.mjs` vào gate CI.
3. Preview mặc định có liên kết Web PROD QLTC, không phù hợp DEV-first. Bỏ URL mặc định; nút mở ngoài chỉ xuất hiện sau khi nhập URL hợp lệ.
4. GitHub Actions tham chiếu action bằng tag có thể dịch chuyển. Khóa commit SHA của checkout/setup-node.
5. Chuẩn bị tài liệu tạo repository **Public**, không tự tạo repo chứa mã của ứng dụng khác.

## File thay đổi
- `.gitattributes`
- `.github/workflows/ci.yml`
- `.gitignore`
- `PUBLIC-REPOSITORY-HANDOFF.md`
- `README.md`
- `package-lock.json`
- `package.json`
- `scripts/build.mjs`
- `scripts/public-safety.mjs`
- `src/app.ts`
- `src/index.html`
- `src/sw.js`
- `tests/public-repo.test.mjs`

## Gates đã chạy
- `npm ci --ignore-scripts --no-audit --no-fund`: PASS.
- `npm run audit:public`: PASS, 26 files checked (quét heuristic, không thay thế secret scanning chuyên sâu).
- `npm run typecheck`: PASS.
- `npm run lint`: PASS — lint tĩnh tự viết, không phải ESLint.
- `npm test`: **5/5 PASS**.
- `npm run build`: PASS.
- Chromium UI smoke: **7/7 PASS** — 1920×1080, 1440×900, 1366×768, 1180×820, 820×1180, 390×844, 360×800. Giả lập GitHub và DOM bằng Playwright set_content, chưa phải kiểm thử mạng/thiết bị thật.
- Kiểm tra ZIP: PASS; SHA256 cung cấp riêng.

## Giới hạn / việc cần hoàn thành
- Tạo GitHub `lengochieu1211-sudo/hnl-dev-center` **Public** cần thao tác trên GitHub do connector thiếu chức năng tạo repository. Chưa Push, chưa có GitHub Actions CI riêng.
- Chưa có Vercel Preview/DEV thực tế; không khai đã Deploy. Có `vercel.json` chuẩn bị sẵn.
- Chưa chạy iPhone/Android thiết bị thật, chưa kiểm tra Web HTTPS/PWA/đa thiết bị đầy đủ; KHÔNG CERTIFIED.
- Không có server auth hay đồng bộ hồ sơ giữa máy. Hồ sơ vẫn lưu localStorage từng trình duyệt, xuất JSON backup để bảo vệ.
- Không lưu source code ứng dụng QLTC/HCF/HCE trong gói này; chỉ có refs GitHub để theo dõi.
- Không sử dụng API AI trả phí hoặc thay đổi dự án Firebase/R2.

## Đề xuất tiếp theo
1. Tạo repository GitHub Public theo `PUBLIC-REPOSITORY-HANDOFF.md`; import source, chạy CI đúng HEAD.
2. Liên kết Vercel (Hobby) từ repository Dev Center, tạo Preview/DEV HTTPS, kiểm tra Web/PWA thật.
3. Nếu cần đồng bộ hồ sơ giữa điện thoại và PC, cần giai đoạn bảo mật riêng (đăng nhập, phân quyền, sao lưu, audit trail). Không đưa dữ liệu nhạy cảm vào localStorage trên site Public.
