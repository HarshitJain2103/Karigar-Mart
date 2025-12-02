# **KarigarMart – AI-Powered Artisan Marketplace**

*A full-stack MERN marketplace empowering artisans with AI-driven marketing, product videos, and seamless e-commerce.*

---

## 🚀 **Overview**

**KarigarMart** is a full-fledged MERN stack marketplace that connects **artisans** with customers. It blends traditional craftsmanship with **cutting-edge AI technologies**, enabling artisans to:

* Upload products
* Automatically generate **AI-driven marketing videos**
* Receive real-time video generation updates
* Sell products with Razorpay payments
* Manage store, profile, stories, orders, analytics
* And much more…

On the customer side, users can:

* Browse products
* Add to cart / wishlist
* Use Buy Now
* Auto-fill shipping address
* Checkout securely
* Manage orders, profile, and avatar
* Watch AI-generated product reels

---

# ⭐ **Key Features**

## 🎥 **1. AI Marketing Video Generation Pipeline (End-to-End)**

A unique highlight of KarigarMart is the **automated product marketing video creation pipeline** powered by:

* **Google Vertex AI (Gemini 2.5 Flash)**
* **Google Cloud Storage (GCS)**
* **Cloudinary transformations**
* **ElevenLabs TTS voice-over**
* **Real-time SSE updates**

### ⚙ How it works:

1. Artisan uploads product + images.
2. Backend creates **AI multimodal prompt** (image + metadata).
3. Gemini generates:

   * Cinematic script
   * Scene description
   * Base video
4. Temporary video is stored in **GCS**.
5. Video is uploaded to **Cloudinary** with:

   * Timestamp-based unique public IDs
   * Proper encoding
6. ElevenLabs generates **high-quality voice-over audio**.
7. Cloudinary merges video + audio.
8. Final video URL is stored in MongoDB.
9. User interface receives **real-time SSE status updates**:

   * `queued` → `processing` → `completed`

### 💡 Features inside this pipeline

* Multimodal prompting (images + metadata)
* InlineData format migration for Gemini
* Cloudinary audio/video merging
* URL encoding/decoding to avoid public_id errors
* Cleanup utilities for unused:

  * images
  * videos
  * audio
* Video regeneration support

---

## 📦 **2. Full E-Commerce System**

### 🛒 Cart / Wishlist

* Fully synced with backend
* Null/invalid product refs auto-cleaned
* Multi-cart support
* Clear cart functionality
* Real stockQuantity verification

### ⚡ Buy Now + Razorpay Integration

* Backend order creation
* Frontend order workflow
* Order confirmation updates user profile address

### 🛍 Product Features

* Product details
* Product card with:

  * real-time video status
  * marketing video display
  * wishlist/cart buttons
* Pagination
* Category filtering
* Linked shop page from Home

---

## 👤 **3. Complete Profile Management System**

Includes:

### ✏ Profile Overview & Editing

* Edit name, phone, address, email
* Avatar upload (Cloudinary)
* Secure password change

### 🔐 Account Security

* Change password with visibility toggle
* Delete account with confirmation dialog

### 📦 Orders Page

* Integrated with real backend orders
* Order details, shipping address, status

### 💖 Wishlist & Addresses

* Fully synced with backend

### 🔄 Auto-update

* After checkout
* After product purchase

---

## 🎨 **4. Artisan Dashboard**

Artisans get a complete dashboard to manage:

* Products
* Marketing videos
* Product stories / About Store
* Orders
* Avatar & profile
* Reels
* Real-time video generation

Includes:

* SSE integrated dashboard updates
* Story feature (renamed from “stories” → “About store”)
* Cloudinary cleanup integration for story images

---

## 🧩 **5. UI/UX Enhancements**

* WhatsApp-style zoomable avatar modal
* Accessible Radix Dialog setup
* Improved profile header interactions
* Mobile sidebar auto-close
* Toast notifications for login/logout
* Category UI fixes
* Product video rendering on product details page
* Autofill shipping address at checkout

---

## 🔐 **6. Authentication**

* **Google OAuth**
* Secure backend-to-Google token exchange
* No loopholes
* Stores avatar, email, profile details

---

## 📡 **7. Real-time Systems**

### ➤ Server-Sent Events (SSE)

Used for:

* Video generation updates
* Reflecting “Generating…” → “Completed” without refresh

---

## 🌩 **8. Cloudinary Cleanup System**

A major, production-grade cleanup pipeline:

### 🧹 Supports cleanup of:

* Images
* Videos
* Audio
* Story images
* Marketing assets
* URL-encoded public IDs
* Dry run utilities

### ✨ Includes:

* Video resource scanning
* DB extraction utilities
* Public ID decoding
* Detailed logging

---

## 📩 **9. Contact Page**

* Backend powered by **Nodemailer**
* Fully functional contact form

---

# 🏗 **Tech Stack**

### **Frontend**

* React
* Zustand (state management)
* React Router
* Tailwind CSS
* Radix UI
* Toast notifications
* Axios

### **Backend**

* Node.js
* Express
* Mongoose (MongoDB)
* Multer (uploads)
* JWT
* Razorpay
* Nodemailer

### **AI & Cloud**

* Google Vertex AI (Gemini 2.5 Flash)
* Google Cloud Storage
* Cloudinary
* ElevenLabs Text-to-Speech

---

# 🗂 **Backend Structure**

```
KarigarMart/
│
├── backend/
│   ├── controllers/
│   │   ├── artisanController.js
│   │   ├── categoryController.js
│   │   ├── contactController.js
│   │   ├── orderController.js
│   │   ├── productController.js
│   │   ├── storyController.js
│   │   ├── uploadController.js
│   │   ├── userController.js
│   ├── models/
│   │   ├── artisanProfile.model.js
│   │   ├── User.js
│   │   ├── order.model.js
│   │   └── product.model.js
│   │   └── story.model.js
│   │   └── category.model.js
│   ├── routes/
│   │   └── artisanRoutes.js
│   │   └── authRoutes.js
│   │   └── categoryRoutes.js
│   │   └── contactRoutes.js
│   │   └── orderRoutes.js
│   │   └── productRoutes.js
│   │   └── storyRoutes.js
│   │   └── uploadRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── services/
│   │   ├── veoVideoService.js
│   └── utils/
│   │   ├── cleanupCloudinary.js
│   │   ├── migrateProducts.js
│   └── .env
│   └── server.js
│   └── seeder.js
│   └── service.account.json.enc
└── README.md
```

---

# ⚡ **Installation & Setup**

## 1. Clone the repo

```
git clone https://github.com/HarshitJain2103/KarigarMart
cd KarigarMart
```

## 2. Backend Setup

```
cd backend
npm install
```

### Create `.env` with:

```
MONGO_URI=
PORT=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_USER=
EMAIL_PASS=
EMAIL_RECIPIENT=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=
GOOGLE_GENAI_API_KEY=

GCS_BUCKET_NAME=
PROJECT_ID=
LOCATION_ID=
MODEL_ID=
API_ENDPOINT=
GOOGLE_APPLICATION_CREDENTIALS=
ENCRYPT_PASSWORD=
 
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

### Run backend:

```
node server.js
```

---

## 3. Frontend Setup

```
cd frontend
npm install
npm run dev
```

---

# 🔥 **AI Pipeline Architecture**

```
          +----------------------+
          |  Product Images      |
          +----------+-----------+
                     |
                     v
        +---------------------------+
        |  AI Prompt Generator      |
        |  (multimodal: img+meta)   |
        +--------------+------------+
                       |
                       v
          +------------------------------+
          |   Gemini 2.5 Flash Model     |
          |  • Script generation         |
          |  • Cinematic scenes          |
          |  • Base video output         |
          +--------------+---------------+
                         |
                         v
         +-------------------------------+
         |  Google Cloud Storage (temp)  |
         +---------------+---------------+
                         |
                         v
           +-----------------------------+
           |   Cloudinary (video merge)  |
           |   - video upload            |
           |   - encode public_ids       |
           |   - merge audio+video       |
           +---------------+-------------+
                           |
                           v
        +-----------------------------------+
        |   ElevenLabs Voice-over (TTS)     |
        +-------------+---------------------+
                      |
                      v
       +-------------------------------------+
       |   Final Marketing Video (Cloudinary)|
       +-------------------------------------+
```

---

# 📡 **Real-Time Video Status (SSE)**

Statuses:

```
queued → processing → audio_render → merging → completed
```

Frontend subscribed via:

```
useVideoSSE()
```

Used in:

* Dashboard
* Product page
* Shop

---

# 🧪 Cleaning Utilities

Cloudinary cleanup supports:

* Orphaned images
* Orphaned videos
* Audio
* Story images
* All via:

  * URL decoding
  * DB scan
  * Resource scan
  * dryRun mode

---

# 🤝 **Contribution Guide**

### Branching

```
main
dev
feature/*
fix/*
```

### Commit Format

```
feat: ...
fix: ...
refactor: ...
docs: ...
style: ...
```

---

# **Developed By - Harshit Jain**

---

# 📄 **License**

Currently **no license** added.
