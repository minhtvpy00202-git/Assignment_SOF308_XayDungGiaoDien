# 🌐 BlogApp – Social Blog Platform  
**Assignment SOF308 – Xây dựng giao diện tương tác Back-End**

BlogApp là một ứng dụng blog mạng xã hội được xây dựng bằng **VueJS**, cho phép người dùng đăng bài, kết bạn, nhắn tin và tương tác với nhau tương tự Facebook.  
Dự án được phát triển nhằm phục vụ bài **Assignment môn SOF308 – Xây dựng giao diện tương tác Back-End**, đồng thời tích hợp nhiều **API hiện đại và AI**.

---

## 🚀 Công nghệ sử dụng

### Front-end
- **VueJS 3**
- **Vite** (Build tool)
- **Bootstrap 5** (UI & Responsive)
- HTML5, CSS3, JavaScript (ES6+)

### Back-end / Data
- JSON (mô phỏng cơ sở dữ liệu)
- Fetch API / Axios

### API tích hợp
- **Google Cloud Translate API** – Tự động dịch ngôn ngữ
- **OpenAI API**
  - Chatbot AI
  - Phân tích cảm xúc nội dung bài viết

### Công cụ
- Visual Studio Code
- Git & GitHub

---

## 🔑 Các tính năng chính

### 👤 Tài khoản & Người dùng
- Đăng ký / Đăng nhập
- Cập nhật thông tin cá nhân
- Đổi mật khẩu

---

### 📝 Bài viết & Newsfeed
- Đăng bài viết văn bản
- Đăng **video**
- Lựa chọn **cảm xúc khi đăng bài**
- Like, bình luận, chia sẻ bài viết
- Trang Newsfeed hiển thị bài viết của tất cả người dùng

---

### 🤝 Kết bạn
- Gợi ý kết bạn
- Gửi / chấp nhận / từ chối lời mời kết bạn

---

### 💬 Chat & Tin nhắn
- Nhắn tin giữa các người dùng
- **Hiển thị trạng thái đăng nhập (online / offline) của người dùng khác**
- **Tìm kiếm tin nhắn (bộ lọc)**:
  - Theo nội dung hội thoại
  - Theo tên người dùng

---

### 🔔 Thông báo
Thông báo khi có người:
- Like bài viết
- Bình luận
- Chia sẻ
- Gửi tin nhắn
- Gửi lời mời kết bạn

---

## 🆕 Tính năng mới nổi bật

### 🎄 Giao diện hiệu ứng Giáng Sinh
- ❄️ Tuyết rơi
- 🎅 Ông già Noel chạy ngang màn hình
- ⛄ Người tuyết
- 🎄 Cây thông Noel
- 💡 Đèn dây lấp lánh nhiều màu  

👉 Tạo trải nghiệm sinh động, trực quan cho người dùng.

---

### 🌍 Tự động dịch ngôn ngữ
- Tích hợp **Google Cloud Translate API**
- Tự động dịch nội dung bài viết sang ngôn ngữ người dùng đang sử dụng
- Không phụ thuộc hoàn toàn vào i18n tĩnh

---

### 🤖 Chatbot AI
- Sử dụng **OpenAI API**
- Hỗ trợ trò chuyện và trả lời câu hỏi cơ bản
- Có thể dùng cho:
  - Guest
  - User
  - Admin

---

### 🧠 Phân tích cảm xúc bài viết (AI)
- Sử dụng **OpenAI API**
- Phân tích cảm xúc nội dung bài viết
- Hiển thị bằng **icon hoặc màu sắc**

Ví dụ:
- 😊 **Tích cực**
- 😐 **Trung lập**
- 😡 **Tiêu cực**

---

## 📂 Cấu trúc thư mục
blog_app/
│
├── node_modules/ # Thư viện cài đặt qua npm
│
├── public/ # Tài nguyên public
│ ├── apple-touch-icon.png
│ ├── favicon.svg
│ └── vite.svg
│
├── src/
│ ├── assets/ # Hình ảnh, icon, hiệu ứng giao diện
│ ├── components/ # Vue Components tái sử dụng
│ ├── composables/ # Vue Composables (logic dùng chung)
│ ├── locales/ # Đa ngôn ngữ (i18n)
│ ├── pages/ # Các trang chính của ứng dụng
│ ├── router/ # Vue Router
│ ├── services/ # Gọi API, Chatbot, Translate, Sentiment
│ ├── types/ # TypeScript types & interfaces
│ ├── utils/ # Các hàm tiện ích
│ │
│ ├── App.vue # Root component
│ ├── main.ts # Entry point
│ └── style.css # CSS toàn cục (Bootstrap custom)
│
├── .env # Biến môi trường (API Key)
├── .gitignore
├── db.json # JSON Database (mock dữ liệu)
├── example-sentiment-ui.vue # Demo giao diện phân tích cảm xúc
├── index.html
├── package.json
├── package-lock.json
├── README.md
│
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
│
├── update-users.js # Script xử lý dữ liệu người dùng
├── vite.config.ts # Cấu hình Vite
└── vitest.config.ts # Cấu hình test

## ▶️ Hướng dẫn chạy dự án

```bash
npm install
npm run dev
