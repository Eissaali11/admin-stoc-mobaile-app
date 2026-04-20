<div align="center">

# 📦 STOCKPRO — تطبيق المدير للجوال

<img src="assets/logo.png" width="120" />

**نظام إدارة المخزون المتكامل — تطبيق الإدارة**

[![Expo SDK](https://img.shields.io/badge/Expo-54-blue?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://typescriptlang.org)
[![EAS Build](https://img.shields.io/badge/EAS-Build_Ready-000020?logo=expo)](https://expo.dev/eas)

</div>

---

## نظرة عامة

تطبيق **STOCKPRO Admin** هو تطبيق جوال مخصص للمدراء والمشرفين لإدارة ومتابعة المخزون في الوقت الفعلي. مبني بتقنية **Expo + React Native** مع دعم كامل للغة العربية (RTL) وواجهة مظلمة أنيقة.

### الخلفية (Backend)
يتصل التطبيق بخادم **STOCKPRO** المنشور على:
- **الإنتاج**: `https://nuzum.fun`
- **التطوير**: `http://192.168.8.115:3001`

---

## ✨ المميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🔐 **المصادقة الآمنة** | تسجيل دخول بـ Bearer Token مخزن في SecureStore |
| 📊 **لوحة تحكم ذكية** | إحصائيات فورية للمخزون والعمليات |
| 📦 **إدارة المخزون** | عرض ومتابعة مخزون جميع الفنيين والمستودعات |
| 🏭 **إدارة المستودعات** | إضافة وتعديل المستودعات ومتابعة محتوياتها |
| 📋 **أنواع الأصناف** | إدارة أنواع المنتجات (أجهزة، شرائح، ورق، إكسسوارات) |
| 🔄 **العمليات** | إنشاء ومتابعة عمليات الإضافة والسحب |
| 📷 **ماسح الباركود** | مسح الأجهزة باستخدام الكاميرا |
| 🔔 **الإشعارات** | متابعة التنبيهات والطلبات المعلقة |
| 👤 **الملف الشخصي** | إدارة الحساب والإعدادات |
| 🌙 **وضع داكن** | واجهة مظلمة أنيقة مريحة للعين |

---

## 🏗️ هيكل المشروع

```
stockpro-mobile/
│
├── app/                          # 📱 الصفحات (Expo Router - File-based)
│   ├── _layout.tsx               #   ← التخطيط الجذري + مزود المصادقة
│   ├── index.tsx                  #   ← صفحة التوجيه الأولية
│   │
│   ├── (auth)/                   # 🔐 صفحات المصادقة
│   │   ├── _layout.tsx           #   ← تخطيط شاشات الدخول
│   │   └── login.tsx             #   ← شاشة تسجيل الدخول
│   │
│   ├── (tabs)/                   # 📑 التبويبات الرئيسية
│   │   ├── _layout.tsx           #   ← شريط التبويبات السفلي
│   │   ├── home.tsx              #   ← 🏠 الصفحة الرئيسية / لوحة التحكم
│   │   ├── inventory.tsx         #   ← 📦 عرض المخزون
│   │   ├── notifications.tsx     #   ← 🔔 الإشعارات
│   │   └── profile.tsx           #   ← 👤 الملف الشخصي
│   │
│   ├── admin/                    # ⚙️ لوحة الإدارة (مدير فقط)
│   │   ├── _layout.tsx           #   ← تخطيط صفحات الإدارة
│   │   ├── index.tsx             #   ← القائمة الرئيسية للإدارة
│   │   ├── warehouses.tsx        #   ← 🏭 إدارة المستودعات
│   │   ├── item-types.tsx        #   ← 📋 أنواع الأصناف
│   │   ├── inventory-overview.tsx#   ← 📊 نظرة عامة على المخزون
│   │   └── operations-management.tsx # ← 🔄 إدارة العمليات
│   │
│   ├── operations/               # 📝 العمليات
│   │   ├── _layout.tsx           #   ← تخطيط صفحات العمليات
│   │   ├── create.tsx            #   ← إنشاء عملية جديدة
│   │   └── history.tsx           #   ← سجل العمليات
│   │
│   └── scanner.tsx               # 📷 ماسح الباركود
│
├── components/                   # 🧩 المكونات المشتركة
│   ├── dashboard/
│   │   ├── StatCard.tsx          #   ← بطاقة الإحصائيات
│   │   └── RecentTransactions.tsx#   ← آخر العمليات
│   └── ui/
│       ├── Loading.tsx           #   ← مؤشر التحميل
│       ├── ErrorView.tsx         #   ← عرض الأخطاء
│       ├── EmptyState.tsx        #   ← حالة القائمة الفارغة
│       └── StyledText.tsx        #   ← نص بالخط العربي
│
├── lib/                          # 📚 المكتبات المساعدة
│   ├── api.ts                    #   ← عميل Axios + Bearer Token
│   ├── auth.tsx                  #   ← سياق المصادقة (Context)
│   ├── hooks.ts                  #   ← React Hooks مخصصة
│   ├── queryClient.ts            #   ← إعدادات React Query
│   ├── theme.ts                  #   ← الألوان والتنسيقات
│   └── types.ts                  #   ← أنواع TypeScript
│
├── assets/                       # 🎨 الأصول
│   ├── icon.png                  #   ← أيقونة التطبيق
│   ├── logo.png                  #   ← شعار التطبيق
│   ├── adaptive-icon.png         #   ← أيقونة أندرويد المتكيفة
│   ├── splash-icon.png           #   ← شاشة البداية
│   ├── favicon.png               #   ← أيقونة الويب
│   └── fonts/
│       └── BeinNormal.ttf        #   ← الخط العربي
│
├── app.json                      # ⚙️ إعدادات Expo
├── eas.json                      # 🏗️ إعدادات EAS Build
├── package.json                  # 📦 التبعيات
├── tsconfig.json                 # 🔧 إعدادات TypeScript
├── babel.config.js               # 🔧 إعدادات Babel
├── metro.config.js               # 🔧 إعدادات Metro bundler
└── global.css                    # 🎨 أنماط عامة
```

---

## 🗺️ خريطة التنقل

```
┌──────────────────────────────────────────────────────┐
│                     STOCKPRO App                      │
│                                                        │
│   ┌──────────────┐       ┌────────────────────────┐   │
│   │   تسجيل      │──────▶│  التبويبات الرئيسية    │   │
│   │   الدخول     │       │                        │   │
│   │  (auth/login)│       │  ┌────┬────┬────┬────┐ │   │
│   └──────────────┘       │  │ 🏠 │ 📦 │ 🔔 │ 👤 │ │   │
│                          │  │home│inv │noti│prof│ │   │
│                          │  └─┬──┴─┬──┴────┴──┬─┘ │   │
│                          └────┼────┼──────────┼───┘   │
│                               │    │          │        │
│              ┌────────────────┘    │          │        │
│              ▼                     ▼          ▼        │
│   ┌─────────────────┐   ┌──────────────┐ ┌────────┐  │
│   │  ⚙️ لوحة الإدارة │   │ 📝 العمليات  │ │الإعدادات│  │
│   │   (admin only)  │   │              │ │تسجيل   │  │
│   │                 │   │  ┌────────┐  │ │الخروج  │  │
│   │  ┌────────────┐ │   │  │ إنشاء  │  │ └────────┘  │
│   │  │ المستودعات │ │   │  │ عملية  │  │              │
│   │  ├────────────┤ │   │  ├────────┤  │              │
│   │  │  الأصناف   │ │   │  │  سجل   │  │              │
│   │  ├────────────┤ │   │  │العمليات│  │              │
│   │  │ نظرة عامة  │ │   │  └────────┘  │              │
│   │  ├────────────┤ │   └──────────────┘              │
│   │  │إدارة       │ │                                  │
│   │  │العمليات    │ │   ┌──────────────┐              │
│   │  └────────────┘ │   │ 📷 الماسح    │              │
│   └─────────────────┘   │  (الباركود)  │              │
│                          └──────────────┘              │
└──────────────────────────────────────────────────────┘
```

---

## 🔑 نظام الصلاحيات

| الميزة | المدير (admin) | المشرف (supervisor) | الفني (technician) |
|--------|:-:|:-:|:-:|
| لوحة التحكم | ✅ | ✅ | ✅ |
| المخزون | ✅ الكل | ✅ منطقته | ✅ مخزونه فقط |
| الإشعارات | ✅ | ✅ | ✅ |
| الملف الشخصي | ✅ | ✅ | ✅ |
| لوحة الإدارة | ✅ | ❌ | ❌ |
| المستودعات | ✅ | ❌ | ❌ |
| أنواع الأصناف | ✅ | ❌ | ❌ |
| إدارة العمليات | ✅ | ✅ | ❌ |
| الماسح | ✅ | ✅ | ✅ |

---

## 🛠️ التقنيات المستخدمة

| التقنية | الإصدار | الوصف |
|---------|---------|-------|
| **Expo** | SDK 54 | منصة تطوير React Native |
| **React Native** | 0.81.5 | إطار التطبيقات الأصلية |
| **React** | 19.1 | مكتبة واجهات المستخدم |
| **TypeScript** | 5.9 | لغة البرمجة |
| **Expo Router** | 6.0 | نظام التنقل (File-based Routing) |
| **React Query** | 5.99 | إدارة البيانات والتخزين المؤقت |
| **Axios** | 1.15 | عميل HTTP |
| **Expo SecureStore** | 15.0 | تخزين آمن للتوكنات |
| **Expo Camera** | 17.0 | الكاميرا وماسح الباركود |
| **React Native Reanimated** | 4.1 | الحركات والتأثيرات |
| **Expo Linear Gradient** | 15.0 | التدرجات اللونية |
| **React Native Screens** | 4.16 | تحسين أداء التنقل |

---

## 🚀 البدء السريع

### المتطلبات

- **Node.js** >= 18
- **npm** أو **yarn**
- **EAS CLI**: `npm install -g eas-cli` (للبناء السحابي)
- **Android Studio** أو جهاز أندرويد حقيقي (للاختبار)

### التثبيت

```bash
# 1. استنساخ المشروع
git clone https://github.com/Eissaali11/admin-stoc-mobaile-app.git
cd admin-stoc-mobaile-app

# 2. تثبيت التبعيات
npm install

# 3. تشغيل التطوير
npx expo start
```

### ⚙️ إعداد الاتصال بالخادم

عدّل ملف `lib/api.ts` لتغيير عنوان الخادم:

```typescript
const BASE_URL = __DEV__
  ? "http://YOUR_LOCAL_IP:3001"   // ← عنوان التطوير المحلي
  : "https://nuzum.fun";          // ← عنوان الإنتاج
```

---

## 📱 البناء والنشر

### بناء APK للاختبار
```bash
eas build --platform android --profile preview
```

### بناء للإنتاج (App Bundle)
```bash
eas build --platform android --profile production
```

### بناء Development Client
```bash
eas build --platform android --profile development
```

### ملفات البناء (EAS Profiles)

| Profile | النوع | الاستخدام |
|---------|-------|-----------|
| `development` | Development Client | اختبار محلي مع أدوات التطوير |
| `preview` | APK | توزيع داخلي للاختبار |
| `production` | App Bundle (AAB) | رفع على Google Play |

---

## 🎨 نظام التصميم

### لوحة الألوان

| اللون | الكود | الاستخدام |
|-------|-------|-----------|
| 🟢 Primary | `#18B2B0` | الأزرار والعناصر التفاعلية |
| ⬛ Background | `#0f172a` | خلفية التطبيق الرئيسية |
| ⬛ Card | `#1e293b` | خلفية البطاقات |
| 🟢 Success | `#22c55e` | النجاح والتأكيد |
| 🟡 Warning | `#f59e0b` | التحذيرات |
| 🔴 Error | `#ef4444` | الأخطاء |
| 🔵 Info | `#3b82f6` | المعلومات |

### الخط
- **BeinNormal** — خط عربي مخصص لجميع النصوص في التطبيق

### المقاسات
```
Spacing:  xs=4  sm=8  md=16  lg=24  xl=32  xxl=48
Font:     xs=12 sm=14 md=16  lg=18  xl=20  xxl=24 title=28 hero=36
Radius:   sm=6  md=12 lg=16  xl=24  full=9999
```

---

## 🔌 نقاط الاتصال (API Endpoints)

### المصادقة
| Method | Endpoint | الوصف |
|--------|----------|-------|
| `POST` | `/api/auth/login` | تسجيل الدخول |
| `GET` | `/api/auth/me` | بيانات المستخدم الحالي |
| `POST` | `/api/auth/logout` | تسجيل الخروج |

### المخزون والأصناف
| Method | Endpoint | الوصف |
|--------|----------|-------|
| `GET` | `/api/item-types/active` | أنواع الأصناف النشطة |
| `GET` | `/api/technicians/:id/fixed-inventory-entries` | المخزون الثابت |
| `GET` | `/api/technicians/:id/moving-inventory-entries` | المخزون المتحرك |
| `GET` | `/api/technicians-overview` | نظرة عامة على الفنيين |

### المستودعات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| `GET` | `/api/warehouses` | قائمة المستودعات |
| `POST` | `/api/warehouses` | إنشاء مستودع |
| `PUT` | `/api/warehouses/:id` | تحديث مستودع |

### العمليات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| `GET` | `/api/stock-movements` | حركات المخزون |
| `POST` | `/api/stock-movements` | إنشاء حركة |
| `GET` | `/api/received-devices` | الأجهزة المستلمة |

### الطلبات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| `GET` | `/api/inventory-requests` | طلبات المخزون |
| `PATCH` | `/api/inventory-requests/:id` | تحديث حالة الطلب |

---

## 📐 البنية التقنية

```
┌──────────────────────────────────────────────────┐
│                  Presentation Layer                │
│        app/ (Screens) + components/ (UI)           │
├──────────────────────────────────────────────────┤
│                State Management                    │
│      React Query (Server) + Context (Auth)         │
├──────────────────────────────────────────────────┤
│                   Data Layer                       │
│         lib/api.ts (Axios + Interceptors)           │
├──────────────────────────────────────────────────┤
│                    Security                        │
│      SecureStore (Token) + Bearer Auth              │
├──────────────────────────────────────────────────┤
│                  Backend API                       │
│           https://nuzum.fun (Express)               │
│        PostgreSQL + Drizzle ORM + Node.js           │
└──────────────────────────────────────────────────┘
```

---

## 🔒 الأمان

- **التوكنات** مخزنة في `expo-secure-store` (Keychain على iOS / Keystore على Android)
- **Bearer Token** يُحقن تلقائياً في كل طلب HTTP عبر Axios Interceptor
- **انتهاء الجلسة** — التوكن صالح لـ 24 ساعة، عند انتهائه يُعاد التوجيه لتسجيل الدخول
- **HTTPS** إلزامي في بيئة الإنتاج
- **لا يتم تخزين كلمات المرور** محلياً أبداً

---

## 📋 إعدادات التطبيق

| الإعداد | القيمة |
|---------|--------|
| Package Name | `com.stockpro.mobile` |
| Scheme | `stockpro` |
| Orientation | Portrait فقط |
| Min SDK | Android 5+ (API 21) |
| Architecture | New Architecture (Fabric) |
| Background Color | `#0f172a` |

---

## 📄 الترخيص

هذا المشروع خاص ومحمي. جميع الحقوق محفوظة © 2026 STOCKPRO.

---

<div align="center">

**صُنع بـ ❤️ لإدارة المخزون بكفاءة**

</div>
