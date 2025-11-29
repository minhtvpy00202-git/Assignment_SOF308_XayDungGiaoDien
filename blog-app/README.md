# 📝 Blog App - Ứng dụng quản lý Blog với Vue.js

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat&logo=vue.js&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

Ứng dụng web quản lý trang blog được xây dựng bằng **Vue.js 3** và **Bootstrap 5**. Cho phép người dùng đăng ký, đăng nhập, đăng bài viết, bình luận và quản lý thông tin cá nhân.

## ✨ Tính năng chính

- 🔐 **Đăng ký & Đăng nhập** - Hệ thống authentication cơ bản
- ✍️ **Quản lý bài viết** - Tạo, sửa, xóa bài viết (có ảnh minh họa)
- 💬 **Bình luận** - Tương tác với bài viết qua comments
- 👤 **Trang cá nhân** - Quản lý thông tin user
- 📄 **Phân trang** - Hiển thị 5 bài viết/trang
- 🎨 **Giao diện đẹp** - Gradient hiện đại, animations mượt mà
- 📱 **Responsive** - Hoạt động tốt trên mọi thiết bị

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 20.19.0 hoặc >= 22.12.0
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd blog-app
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Chạy JSON Server (Backend)
Mở terminal thứ nhất:
```bash
npm run server
```
Server sẽ chạy tại: `http://localhost:3000`

### Bước 4: Chạy Vue App (Frontend)
Mở terminal thứ hai:
```bash
npm run dev
```
App sẽ chạy tại: `http://localhost:5173`

## 👤 Tài khoản demo

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| admin@example.com | 123456 | Admin |
| hungnv@gmail.com | 123456 | User |
| minhtvpy00202@gmail.com | 123456 | User |

## 📁 Cấu trúc dự án

```
blog-app/
├── public/              # Static assets
├── server/
│   └── db.json         # JSON Server database
├── src/
│   ├── components/     # Vue components
│   │   ├── NavBar.vue
│   │   ├── PostList.vue
│   │   └── UserSidebar.vue
│   ├── router/         # Vue Router
│   │   └── index.js
│   ├── stores/         # State management
│   │   └── auth.js
│   ├── views/          # Page components
│   │   ├── Home.vue
│   │   ├── Login.vue
│   │   ├── Register.vue
│   │   ├── PostDetail.vue
│   │   ├── PostForm.vue
│   │   └── Profile.vue
│   ├── api.js          # API calls
│   ├── App.vue         # Root component
│   └── main.js         # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## 🛠️ Công nghệ sử dụng

- **Frontend Framework**: Vue.js 3 (Composition API)
- **Routing**: Vue Router 4
- **UI Framework**: Bootstrap 5.3.3
- **HTTP Client**: Axios
- **Backend Mock**: JSON Server
- **Build Tool**: Vite
- **Fonts**: Google Fonts (Inter)

## 📚 Tài liệu

- [HUONG_DAN_SU_DUNG.md](./HUONG_DAN_SU_DUNG.md) - Hướng dẫn chi tiết
- [KIEM_TRA_YEU_CAU.md](./KIEM_TRA_YEU_CAU.md) - Checklist yêu cầu
- [TEST_CHUC_NANG.md](./TEST_CHUC_NANG.md) - Test cases

## 🎯 Yêu cầu đã hoàn thành

### Chức năng (4/4) ✅
- ✅ Đăng ký và đăng nhập
- ✅ Đăng bài viết (tạo/sửa/xóa)
- ✅ Bình luận vào bài viết
- ✅ Trang thông tin cá nhân

### Kỹ thuật (10/10) ✅
- ✅ Vue.js + Bootstrap
- ✅ Template Syntax
- ✅ Data Binding & Reactivity
- ✅ Conditional Rendering
- ✅ List Rendering
- ✅ Class & Style Binding
- ✅ Event Handling
- ✅ Form Binding
- ✅ Vue Router với route protection
- ✅ Authentication system

## 🎨 Screenshots

### Trang chủ
![Home](https://via.placeholder.com/800x400?text=Home+Page)

### Đăng nhập
![Login](https://via.placeholder.com/800x400?text=Login+Page)

### Chi tiết bài viết
![Post Detail](https://via.placeholder.com/800x400?text=Post+Detail)

## 🐛 Troubleshooting

**Lỗi: Cannot connect to server**
```bash
# Kiểm tra JSON Server đã chạy chưa
npm run server
```

**Lỗi: Port already in use**
```bash
# Kill process đang dùng port
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

**Reset dữ liệu**
```bash
# Restart JSON Server để reset về dữ liệu ban đầu
```

## 📝 Scripts

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run preview  # Preview production build
npm run server   # Chạy JSON Server
```

## 🤝 Contributing

Contributions, issues và feature requests đều được chào đón!

## 📄 License

[MIT](LICENSE)

## 👨‍💻 Tác giả

Dự án được xây dựng theo yêu cầu bài tập môn học Vue.js

---

⭐ Nếu bạn thấy project hữu ích, hãy cho một star nhé!
