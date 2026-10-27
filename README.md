# HNL Dev v0.3.3 — bảng quản lý phát triển (Web staging)

HNL Dev Center là một **Web/PWA quản lý quá trình phát triển** HNL QLTC, HCF và HCE. Đây là công cụ làm việc riêng biệt, **không thay đổi** ba ứng dụng hiện có. Bản v0.3.3 đang ở nhánh DEV của repo công khai; Web staging được triển khai độc lập. Không có backend, xác thực người quản trị hay đồng bộ dữ liệu nhiều thiết bị.

## Tính năng chạy được

- Tổng quan 3 ứng dụng / 2 repository; QLTC hiển thị ba môi trường PROD, DEV, DEV BACKUP riêng biệt (PROD chỉ đọc; DEV BACKUP là Hosting site không giả định cùng HEAD DEV); đọc **exact HEAD** từng nhánh qua GitHub REST `GET /git/ref/heads/...`, không cần GitHub token. Tránh lỗi bỏ sót nhánh khi repository có trên 100 nhánh.
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
3. Vào thư mục `hnl-dev-center-v0.3.3`, nhấp đúp `START-WINDOWS.bat`.
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

- Có thể dùng local tại `localhost` hoặc mở Web staging tại `https://hnldev.vercel.app` nếu bản đã được triển khai; giao diện là bản theo HEAD của HNL Dev được công bố.
- Đã có repository riêng `lengochieu1211-sudo/hnl-dev-center`. Web tĩnh Vercel phải được kiểm tra lại sau mỗi bản phát hành; chỉ nhánh HNL Dev `dev` được phép chỉnh trước, không tự triển khai PROD QLTC.
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


## Điểm mới v0.3.3 – chuẩn bị repository Public

- Khóa service worker (PWA) chỉ cache tài nguyên tĩnh đã liệt kê; không cache URL chứa query hoặc endpoint mới.
- Bổ sung `.gitignore` và `npm run audit:public` để rà file có dấu hiệu nhạy cảm trước khi phát hành.
- Bổ sung 2 bài kiểm thử, khóa GitHub Actions `checkout` / `setup-node` theo SHA bất biến.
- Bỏ URL PROD QLTC khỏi liên kết Preview mặc định: chỉ hiện nút mở trang khi đã nhập URL hợp lệ.
- Hướng dẫn tạo repository riêng ở `PUBLIC-REPOSITORY-HANDOFF.md`. Repository phải Public, không dùng repo QLTC/HCF/HCE.
- Đã kiểm tra build cục bộ; **chưa tạo GitHub repository, chưa chạy CI trên repo mới và chưa triển khai Vercel**.

## QLTC: xác minh tách môi trường (2026-10-27)
- PROD: nhánh `main`, Firebase project `com-example-qlct-61329`, Hosting site `hnlqltc`. Không nhúng PROD hoặc sửa dữ liệu.
- DEV: nhánh `dev`, Firebase project `hnl-qltc-dev`, Hosting site `hnl-qltc-dev`.
- DEV BACKUP: Hosting site `hnl-qltc-dev-backup`; không phải một nhánh Git riêng được xác minh. Exact HEAD bản triển khai và Firebase project của site backup cần đọc lại từ checkpoint hoặc Hosting.
- Kiểm tra HTTP từ trình duyệt ngoài ghi nhận PROD mở được, DEV bị lỗi 509 và DEV BACKUP 404 tại thời điểm kiểm tra. Không coi đây là chứng nhận runtime hoặc sự cố kết luận vĩnh viễn.
- Preview trên HNL Dev cho phép chọn đúng môi trường; PROD chỉ mở tab ngoài; DEV/DEV BACKUP có thể xem ở tab ngoài và thử nhúng giới hạn.
- Backup JSON công việc thêm trường tùy chọn `environment`, vẫn giữ schemaVersion=1 và tương thích các bản ghi cũ thiếu trường này.