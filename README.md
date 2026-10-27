# HNL Dev Center 0.3.0 — Bản DEV an toàn – chuẩn bị GitHub Public, không API AI

HNL Dev Center là một **Web/PWA quản lý quá trình phát triển** HNL QLTC, HCF và HCE. Đây là công cụ làm việc riêng biệt, **không thay đổi** ba ứng dụng hiện có. Bản 0.3.0 có chức năng thật nhưng chưa có backend/xác thực/đồng bộ đa thiết bị và **chưa được triển khai lên Web công khai**.

## Tính năng chạy được

- Tổng quan 3 ứng dụng / 2 repository; đọc **exact HEAD** từng nhánh qua GitHub REST `GET /git/ref/heads/...`, không cần GitHub token. Tránh lỗi bỏ sót nhánh khi repository có trên 100 nhánh.
- Trang GitHub Actions/CI: đọc workflow runs theo từng nhánh; chỉ hiển thị run trùng **exact HEAD mới đọc lại**; không coi CI PASS là Runtime Golden/CERTIFIED.
- Hồ sơ công việc: tạo, lưu trên trình duyệt (`localStorage`), lấy lại, lọc dự án, đổi trạng thái thủ công, xác nhận khi xóa. Các nhãn trạng thái **do người dùng tự ghi nhận**, không phải GitHub/CI tự xác minh.
- Handoff (bàn giao) sang ChatGPT/Claude/Gemini bằng nút sao chép + mở trang; Antigravity nhận nội dung dán trong ứng dụng PC. Không tích hợp API AI và không tự đồng bộ cuộc chat.
- Xuất backup JSON kèm SHA256 ngay trên giao diện, nhập/gộp bản ghi bằng ID và thời gian cập nhật; bảo vệ dữ liệu cục bộ nếu import lỗi hoặc bộ nhớ trình duyệt lỗi. JSON **không phải** FULL SOURCE/PATCH, không tự tải lên Google Drive.
- Preview Studio: mô phỏng PC/laptop/iPad/iPhone/Android; sandbox iframe đối với URL HTTPS trong các domain `*.web.app`, `*.firebaseapp.com`, `*.vercel.app`; ảnh trước/sau từ file PNG/JPG/WebP trên thiết bị. Iframe có thể bị chặn bởi web đích và không đại diện runtime EXE/APK/AutoCAD.
- PWA (cài shortcut/app shell) có manifest, icons PNG, service worker lưu cache **chỉ tài nguyên tĩnh** để có thể mở UI khi mất mạng sau lần tải thành công. Không cache API GitHub hoặc nội dung người dùng lên server.
- `.github/workflows/ci.yml` chỉ kiểm tra typecheck/lint/tests/build, không chứa Push, Deploy hoặc lệnh sử dụng secret.

## Cách chạy trên PC Windows

**Cách dễ nhất (không cần TypeScript):**

1. Tải FULL SOURCE ZIP 0.3.0, chọn **Extract All** để giải nén.
2. Cài **Node.js 22** nếu máy chưa cài.
3. Vào thư mục `hnl-dev-center-v0.3.0`, nhấp đúp `START-WINDOWS.bat`.
4. Mở `http://127.0.0.1:4173` nếu trình duyệt chưa mở.

**Kiểm tra và build lại từ source:**

```powershell
npm install --global typescript@5.9.3
npm ci --ignore-scripts
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

`npm ci` không tải thư viện runtime: bản này không có dependency npm. TypeScript 5.9.3 được cài riêng ở thời điểm build và workflow CI sử dụng phiên bản đã khóa.

## Sử dụng trên điện thoại, tablet và iPhone

- Bản hiện tại chạy `localhost` và chỉ truy cập trên chính PC đang chạy, **không** phải URL sử dụng chung qua các thiết bị.
- File `vercel.json` có sẵn cấu hình cho Web DEV tĩnh, nhưng **chưa Deploy**; cần cấp phép, tạo repository/cấu hình Vercel và kiểm tra HTTPS thực tế trước khi mở trên iPhone/Android.
- Sau khi có HTTPS, có thể mở trên Safari/Chrome rồi thêm ra màn hình chính; lưu ý dữ liệu hồ sơ **vẫn độc lập theo trình duyệt/thiết bị** cho đến khi xây xác thực và backend đồng bộ an toàn.
- Khi đổi máy hoặc muốn sao lưu: vào **Sao lưu hồ sơ → Tải backup JSON**, lưu Google Drive thủ công; trên thiết bị mới chọn **Nhập JSON**.

## Nguồn GitHub tham chiếu ngày 27/10/2026

| Ứng dụng | Repo | Branch | HEAD đã kiểm tra |
|---|---|---|---|
| QLTC | `lengochieu1211-sudo/hnl-qltc` | `dev` | `d6effaf03a08a9879fa172a345992922916036d2` |
| HCF | `lengochieu1211-sudo/hnl-cad-ai` | `research/vxt-pro-v7-bootstrap` | `83582296127306d846571010a43eb8e94edbedd1` |
| HCE | `lengochieu1211-sudo/hnl-cad-ai` | `research/hce-pro-bootstrap` | `a45fe6dcf9fca2172fed3a93ac14e6cf4f4f8ae8` |

Đây chỉ là mốc tại thời điểm kiểm tra. Phải **Cập nhật GitHub** lại để xác minh HEAD mới trước khi sửa thật.

## Kiểm thử và giới hạn

- `npm run typecheck` dùng `tsc --noEmit`.
- `npm run lint` là lint bảo mật/tập tin **tự viết**, không phải ESLint đầy đủ.
- `npm test` kiểm tra 3 ràng buộc tĩnh về API/secret, nhánh và an toàn.
- `python tests/browser-smoke.py` cần Python Playwright và Chromium; trong môi trường tạo bản, trình duyệt chặn tất cả navigation. Kiểm thử đã dùng `set_content`, giả lập phản hồi GitHub và kiểm tra thao tác ở 1440x900, 820x1180, 390x844. Đây là **UI component smoke** (kiểm tra tương tác giao diện), **không phải kiểm thử kết nối mạng/Runtime Golden thực tế**.
- Chưa có đăng nhập quản trị, phân quyền, bảo vệ công việc khi nhiều người dùng cùng chỉnh, backend, đồng bộ đa thiết bị, API AI, GitHub write, Google Drive tự lưu, kiểm thử thiết bị thật hoặc EXE/APK/AutoCAD.
- Giữ trạng thái **DEV CANDIDATE / CHƯA CERTIFIED**.

## Bảo vệ dữ liệu / điều hành

- Không lưu API keys, không yêu cầu GitHub secrets, không có endpoint hoặc quyền ghi Firebase/Cloudflare R2.
- Không Push GitHub, không Merge, không Deploy Vercel/Firebase. Không can thiệp QLTC, HCF, HCE.
- Không nhập password, token, thông tin cá nhân/công trình nhạy cảm vào hồ sơ cục bộ. `localStorage` có thể bị xóa khi dọn dữ liệu trình duyệt; xuất backup JSON định kỳ.
- Khi có lỗi localStorage, hệ thống khóa ghi để không vô tình ghi đè dữ liệu cũ.

## Hướng hoàn thiện tiếp theo

1. Tạo **repository HNL Dev Center riêng** (chỉ khi người dùng cho phép), dùng `main` cho mã Dev Center và nhánh `dev` cho cập nhật tiếp theo. Không đụng hai repository ứng dụng.
2. Chạy GitHub Actions trên repo mới, xác minh all PASS đúng HEAD.
3. Triển khai **Vercel Preview/DEV** trước, không nhầm với PROD QLTC. Test Safari iOS, Chrome Android, màn hình tablet và PWA/offline thực tế.
4. Nếu cần hồ sơ đồng bộ đa thiết bị/thành viên: thiết kế tài khoản + backend, ACL (phân quyền), sao lưu có xác nhận, Audit log, encryption và regression riêng trước khi bật.
5. Thiết kế connector theo quyền tối thiểu để lấy artifacts/Drive backup, nhưng **không tự động Push/Deploy**.


## Điểm mới v0.3.0 – chuẩn bị repository Public

- Khóa service worker (PWA) chỉ cache tài nguyên tĩnh đã liệt kê; không cache URL chứa query hoặc endpoint mới.
- Bổ sung `.gitignore` và `npm run audit:public` để rà file có dấu hiệu nhạy cảm trước khi phát hành.
- Bổ sung 2 bài kiểm thử, khóa GitHub Actions `checkout` / `setup-node` theo SHA bất biến.
- Bỏ URL PROD QLTC khỏi liên kết Preview mặc định: chỉ hiện nút mở trang khi đã nhập URL hợp lệ.
- Hướng dẫn tạo repository riêng ở `PUBLIC-REPOSITORY-HANDOFF.md`. Repository phải Public, không dùng repo QLTC/HCF/HCE.
- Đã kiểm tra build cục bộ; **chưa tạo GitHub repository, chưa chạy CI trên repo mới và chưa triển khai Vercel**.
