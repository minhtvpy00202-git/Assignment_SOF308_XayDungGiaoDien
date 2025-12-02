# Hướng dẫn sử dụng đa ngôn ngữ (i18n)

## Cấu trúc

```
src/locales/
  ├── index.ts      # Cấu hình Vue I18n
  ├── en.ts         # Bản dịch tiếng Anh
  ├── vi.ts         # Bản dịch tiếng Việt
  └── README.md     # File này
```

## Sử dụng trong component

### Composition API (script setup)

```vue
<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'

const { t, locale, setLocale } = useLocale()
</script>

<template>
  <div>
    <h1>{{ t('navbar.home') }}</h1>
    <p>{{ t('common.loading') }}</p>
    
    <!-- Đổi ngôn ngữ -->
    <button @click="setLocale('en')">English</button>
    <button @click="setLocale('vi')">Tiếng Việt</button>
  </div>
</template>
```

### Template (Options API)

```vue
<template>
  <div>
    <h1>{{ $t('navbar.home') }}</h1>
  </div>
</template>
```

## Thêm bản dịch mới

### 1. Thêm key vào file ngôn ngữ

**vi.ts:**
```typescript
export default {
  myFeature: {
    title: 'Tiêu đề tính năng',
    description: 'Mô tả tính năng'
  }
}
```

**en.ts:**
```typescript
export default {
  myFeature: {
    title: 'Feature Title',
    description: 'Feature Description'
  }
}
```

### 2. Sử dụng trong component

```vue
<template>
  <h1>{{ t('myFeature.title') }}</h1>
  <p>{{ t('myFeature.description') }}</p>
</template>
```

## Ngôn ngữ mặc định

- Ngôn ngữ mặc định: **Tiếng Việt (vi)**
- Ngôn ngữ dự phòng: **Tiếng Anh (en)**
- Ngôn ngữ được lưu trong `localStorage` với key `locale`

## API

### useLocale()

```typescript
const {
  locale,           // Ref<string> - Ngôn ngữ hiện tại
  availableLocales, // Array - Danh sách ngôn ngữ có sẵn
  setLocale,        // (locale: string) => void - Đổi ngôn ngữ
  toggleLocale,     // () => void - Chuyển đổi giữa en/vi
  t                 // (key: string) => string - Hàm dịch
} = useLocale()
```

## Các nhóm bản dịch

- `navbar` - Thanh điều hướng
- `auth` - Đăng nhập/Đăng ký
- `post` - Bài viết
- `profile` - Hồ sơ người dùng
- `messages` - Tin nhắn
- `suggestions` - Gợi ý kết bạn
- `common` - Chung
- `validation` - Thông báo lỗi
- `language` - Ngôn ngữ
