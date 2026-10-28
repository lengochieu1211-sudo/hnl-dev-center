# HNL Dev v0.4.0 — Trung tâm GitHub thực tế (DEV Candidate)

Bản phát triển tiếp theo từ **HNL Dev v0.3.3**; không sửa source hay dữ liệu HNL QLTC/HCF/HCE. Ứng dụng Web/PWA tĩnh, repository Public `lengochieu1211-sudo/hnl-dev-center`, nhánh chuẩn đang chạy `dev` HEAD cơ sở `de529cf5ba0818b82ea3e6ae9c718fd38bacdffe` (xác minh ngày 27/10/2026). **v0.4.0 mới được build/test cục bộ; chưa Push/Deploy.** URL https://hnldev.vercel.app/ hiện không được coi là đã chạy v0.4.0.

## Có ích trực tiếp (v0.4.0)

- **Bộ cài / Artifacts:** chọn QLTC (PROD/DEV; DEV BACKUP bị khóa vì chưa xác minh HEAD), HCF hoặc HCE, bấm **Kiểm tra build theo HEAD**. Web đọc đúng GitHub branch SHA hiện tại và lọc workflow runs theo SHA, không dùng mã baseline để kết luận. Bấm **Xem bộ cài / artifact** cho từng workflow để xem tên, kích thước, thời hạn lưu, link tới đúng GitHub Actions run để đăng nhập tải ZIP. Nếu không có artifact hoặc API lỗi phải báo rõ; không tạo link tải giả. EXE/APK bên trong ZIP do workflow đóng gói, phải kiểm chứng và kiểm tra thiết bị thật riêng.
- **GitHub Issues:** đọc những vấn đề thực sự nằm trên repository QLTC/CAD, xem trạng thái/cập nhật, mở Issue trên GitHub. Loại trừ Pull Requests; HCF/HCE chia sẻ repository CAD nên không tự nhận phân loại issue.
- **CI hiện tại** vẫn giữ chức năng đọc workflow và đối chiếu HEAD, nhưng không coi thành công CI là Runtime Golden hay CERTIFIED.
- **QLTC 3 môi trường:** PROD (GitHub main; khóa thao tác sửa/nhúng), DEV (GitHub dev), DEV BACKUP (Hosting dự phòng không giả định chung HEAD); không thay Firebase/R2/Hosting nào.
- Giữ nguyên hồ sơ công việc cục bộ (`localStorage`), xuất/nhập JSON và Preview; không tự đồng bộ sang ChatGPT/Claude/Gemini, không dùng API AI; không kết nối nguồn dữ liệu công trình.

## Cách sử dụng trên PC

1. Giải nén FULL SOURCE ZIP v0.4.0, nhấp đúp `START-WINDOWS.bat` (cần Node.js 22; TypeScript 5.9.3 nếu muốn build lại).
2. Mở `http://127.0.0.1:4173` nếu trình duyệt chưa tự mở.
3. Chọn **Bộ cài / Artifacts**, hoặc **GitHub Issues**. Cần có mạng để lấy dữ liệu GitHub mới nhất; API công khai có hạn mức; tải artifact có thể yêu cầu đăng nhập GitHub.

Build và gate từ đúng source:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run audit:public
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Nếu `tsc` chưa được cài toàn cục: `npm install --global typescript@5.9.3 --ignore-scripts --no-audit --no-fund` (giai đoạn build; không có dependency runtime).

Kiểm thử UI Chromium cục bộ khi có Python Playwright + Chromium:

```bash
python tests/browser-smoke.py
python tests/qltc-environments-browser.py
python tests/github-live-browser.py
```

Các bài test browser trên **giả lập phản hồi GitHub** để xác minh UI, bảo mật link và rủi ro sai SHA. Chúng không xác nhận đăng nhập GitHub/khả năng tải trên điện thoại thật.

## Hạn chế và bảo vệ dữ liệu

- `github.com` có thể yêu cầu người dùng đăng nhập để tải artifact. HNL Dev không giữ hoặc yêu cầu token. Giấy phép/đăng nhập ChatGPT Plus không cấp quyền tải GitHub artifact.
- Không lấy bản build cũ làm bản mới, không lấy HEAD `dev` để khẳng định DEV BACKUP đang chạy, không so sánh CI với PROD runtime.
- HNL Dev Public chỉ đọc thông tin repository công khai; không tạo/sửa GitHub Issues tự động, không chạy agent OpenCode trên máy chủ, không lưu Drive tự động trong trình duyệt, không chạy AutoCAD/EXE/APK bên trong Web.
- Hồ sơ công việc cá nhân lưu từng trình duyệt, có thể mất nếu xóa dữ liệu trình duyệt: cần xuất JSON định kỳ.
- CI chỉ chạy typecheck, lint tĩnh (không phải ESLint toàn bộ), unit test và build; không tự động Push/Deploy. Không có secret, Firebase config, R2 token hay khóa truy cập trong source.
- Không được gọi `CERTIFIED` trước khi HEAD trên GitHub được kiểm tra CI, Runtime Golden thiết bị thật và Drive backup xác thực.

## Tham chiếu / triển khai

- Repository: https://github.com/lengochieu1211-sudo/hnl-dev-center — dùng nhánh DEV trước, nhánh main giữ nguyên.
- Web staging hiện tại: https://hnldev.vercel.app/ — **vẫn là bản v0.3.3** cho tới khi cập nhật có phê duyệt.
- Drive backup HNL Dev: https://drive.google.com/drive/folders/15Cn3ZyfbVuIk-Xav9sTKppsiclq_z6os
- Tài liệu GitHub API: https://docs.github.com/en/rest/actions/artifacts và https://docs.github.com/en/rest/issues/issues
