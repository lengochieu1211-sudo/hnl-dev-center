# HNL Dev Center — bàn giao repository Public

## Mục tiêu
Tên repository **hnl-dev-center** • **Public** • GitHub tài khoản `lengochieu1211-sudo` • mặc định `main`.
Không sử dụng repo HNL QLTC/HCF/HCE để lưu mã quản trị.

## Tạo GitHub Public (nếu công cụ không được cấp quyền tạo repo)
1. Đăng nhập GitHub, vào **https://github.com/new**.
2. Owner: **lengochieu1211-sudo**; Repository name: **hnl-dev-center**.
3. Visibility: **Public**.
4. Không tick *Add a README*, *.gitignore*, license (gói source đã có cấu hình).
5. Bấm **Create repository**.
6. Trong thư mục FULL SOURCE đã giải nén trên PC chạy:

```powershell
git init -b main
git add .
git commit -m "feat: initial HNL Dev Center v0.3.0 public"
git remote add origin https://github.com/lengochieu1211-sudo/hnl-dev-center.git
git push -u origin main
```

## Kiểm tra
- GitHub Actions → **HNL Dev Center - Read-only CI** → workflow của commit mới phải PASS.
- Settings → General: Repo visibility **Public**.
- `package.json`, `package-lock.json`, `.github/workflows`, `vercel.json` phải có đủ.
- Sau đó Vercel → Add New → Project → Import Git Repository `hnl-dev-center` → Deploy; không chọn các repository ứng dụng hiện có.
- Vercel target: Preview/DEV; chỉ xuất bản bản DEV của Dev Center, tuyệt đối không deploy các dự án QLTC/HCF/HCE.

## Bảo mật
Chỉ đăng source không có token, mật khẩu, backup JSON chứa hồ sơ cá nhân. CI kiểm tra tên file nhạy cảm và một số định dạng token; kiểm tra tự động không thể bảo đảm phát hiện mọi bí mật.
Web bản 0.3 dùng localStorage trên từng thiết bị và chưa có hệ thống đăng nhập/đồng bộ; không nhập dữ liệu nội bộ công trình khi site được công khai.
