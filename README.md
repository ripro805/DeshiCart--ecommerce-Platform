# 🛒 DeshiCart — Full-Stack E-commerce Platform

A full-stack e-commerce platform for the deshi (local) market, built with **Django REST Framework** on the backend and **Next.js 14** on the frontend.

## ✨ Features

- 📦 **Product Catalog** — 20K+ products across 45 categories, paginated REST API, search & filters
- 🖼️ **Image-driven listings** — Wikimedia Commons-backed product imagery, per-product image URLs exposed via DRF serializer
- 👤 **Customer accounts** — Custom `User` model, email-based registration, JWT auth (Djoser)
- 🛒 **Cart → Checkout → Order** lifecycle with payment + status tracking
- ⭐ **Reviews & Ratings** per product
- ⚡ **Modern storefront** — Next.js 14 App Router, Tailwind, Radix UI, React Query, Zustand, Framer Motion
- 🧰 **Admin** — Django admin for catalog, orders, payments, users

## 🧱 Tech Stack

| Layer    | Tech                                                       |
| -------- | ---------------------------------------------------------- |
| Backend  | Django 5/6, Django REST Framework, Djoser, django-filter   |
| Database | SQLite (dev) — easily swappable for PostgreSQL             |
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind    |
| UI       | Radix UI primitives, Framer Motion, Lucide icons           |
| State    | Zustand (client), React Query (server data)                |
| Auth     | JWT (Djoser) + email activation                            |

## 📁 Project Structure

```
DeshiCart/
├── manage.py
├── requirements.txt
├── .gitignore
├── README.md
│
├── deshicart/              # Django project (settings, urls, asgi/wsgi)
├── api/                    # Aggregated API routes
├── product/                # Products, categories, reviews, filters
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── product_urls.py
│   ├── categories_urls.py
│   ├── filters.py
│   └── migrations/
├── order/                  # Cart, order, payment
│   ├── models.py
│   ├── serializers.py
│   ├── services.py
│   └── views.py
├── users/                  # Custom user model + auth
│   ├── models.py
│   ├── managers.py
│   └── serializers.py
├── fixtures/               # Demo data JSON
└── frontend/               # Next.js 14 storefront
    ├── package.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    └── src/
        ├── app/            # App Router pages
        │   ├── (auth)/     # login, register, activate, reset
        │   ├── account/
        │   ├── cart/
        │   ├── categories/
        │   ├── checkout/
        │   ├── order/
        │   └── products/
        ├── components/
        ├── hooks/
        ├── lib/
        ├── store/          # Zustand stores
        └── types/
```

## 🚀 Getting Started

### 1) Backend (Django)

```bash
# Create venv & install
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# Migrate + seed demo data (optional)
python manage.py migrate
python manage.py loaddata fixtures/product_data.json

# Run dev server
python manage.py runserver 127.0.0.1:8000
```

The Django REST API will be available at `http://127.0.0.1:8000/api/`.

### 2) Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

The storefront will be available at `http://127.0.0.1:3000/`.  
The Next.js dev server proxies `/api/*` → `http://127.0.0.1:8000/` automatically (see `next.config.mjs`).

## 🔌 Key API Endpoints

| Method | Endpoint                              | Purpose                       |
| ------ | ------------------------------------- | ----------------------------- |
| GET    | `/api/products/`                      | List products (paginated)     |
| GET    | `/api/products/{id}/`                 | Product detail                |
| GET    | `/api/categories/`                    | List categories               |
| POST   | `/api/auth/users/`                    | Register new user             |
| POST   | `/api/auth/jwt/create/`               | JWT login                     |
| POST   | `/api/auth/users/activation/`         | Email activation              |
| GET    | `/api/cart/`                          | Current cart (auth required)  |
| POST   | `/api/orders/`                        | Place order                   |
| GET    | `/api/orders/{id}/`                   | Order detail                  |
| POST   | `/api/reviews/`                       | Submit review                 |

## 🧪 Verification Snapshot

- ✅ **20,081 / 20,092** products have `image_external_url` populated
- ✅ **5,924** unique Wikimedia URLs across 45 categories
- ✅ **0** broken image URLs in production (HEAD-checked 250-URL weighted sample)
- ✅ **25 / 25** random products return valid images via the Next.js → Django proxy chain

## 📝 Notes

- This repo intentionally excludes `db.sqlite3`, `.venv/`, `node_modules/`, `.next/`, build artifacts, and scratch helper scripts (prefixed with `_`).
- See `TODO.md` for the operational log of the image-pool build pipeline.

## 📄 License

MIT — feel free to fork, learn, and adapt.
