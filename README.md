# 🛒 Valren – Advanced Online Store

## 📌 Project Description

**Valren** is a full-stack **e-commerce web application** built with **Node.js, Express, MongoDB, and EJS**, featuring secure authentication, role-based access control, Stripe payment integration, and automated invoice generation.

The application supports **both user and admin roles**, focusing on **real-world backend concepts** such as CSRF protection, session management, server-side rendering, and payment workflows.

---

## 🧱 Tech Stack

### Frontend
- EJS (Server-Side Rendering)
- HTML5
- CSS3
- Vanilla JavaScript

### Backend
- Node.js
- Express.js
- MongoDB (Atlas)

### Payments & Invoices
- Stripe Checkout
- PDFKit (invoice generation)

---

## 🔐 Authentication & Authorization

- Session-based authentication
- Secure login & signup
- Password hashing with bcrypt
- Role-based access control:
  - User
  - Admin

---

## 👤 User Features

- User registration & login
- Browse products
- Add products to cart
- Checkout using Stripe (test mode)
- Automatic invoice generation (PDF)
- Secure order placement
- View order history
- CSRF-protected forms

---

## 🛠️ Admin Features

Admins have full control over the system:

- Admin-only protected routes
- Create / edit / delete products
- View all user orders
- Manage inventory
- Access admin dashboard
- Server-side admin authorization

> Admin access is enforced at the backend level.

---

## ⭐ Core Features

- Shopping cart system
- Stripe Checkout integration
- Automatic PDF invoice generation
- CSRF protection for sensitive routes
- Order persistence in MongoDB
- Product & order management
- Role-based access control (Admin / User)
- Server-side rendering with EJS
- Secure session handling
- Environment-based configuration
- Deployment-ready backend architecture

---

## 📦 Important Packages Used

### 🔐 Security
- `csurf` – CSRF protection
- `express-session` – session management
- `connect-mongodb-session` – MongoDB session store
- `bcryptjs` – password hashing
- `helmet` – security headers (configurable)

### 💳 Payments
- `stripe` – payment processing (test & live modes)

### 📄 Invoices & Files
- `pdfkit` – invoice PDF generation
- `fs` – local file handling (development)

### 🗄️ Database
- `mongoose` – MongoDB object modeling

### 🧩 Utilities
- `dotenv` – environment variables
- `multer` – file handling 
- `connect-flash` – flash messages



## 📁 Project Structure

