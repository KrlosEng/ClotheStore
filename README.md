# 🛍️ TuModa Luxe - Aplicación de Tienda de Ropa

Aplicación web completa para **TuModa Luxe**, estructurada de manera limpia y modular separando el Frontend, Backend y la Base de Datos SQLite relacional con sistema de autenticación JWT.

---

## 📁 Estructura del Proyecto

```text
tienda-ropa/
├── 🎨 frontend/                  # Interfaz de usuario y cliente web
│   ├── index.html               # Estructura principal HTML5
│   ├── styles.css               # Sistema de diseño Vintage Editorial
│   ├── app.js                   # Lógica de cliente, filtro inteligente y API
│   └── products.js              # Catálogo de prendas locales
│
├── ⚙️ backend/                   # Servidor de API REST (Node.js & Express)
│   ├── server.js                # Punto de entrada del servidor y middleware JWT
│   └── 🗄️ database/              # Base de datos y esquemas relacionales
│       ├── db.js                # Conexión y wrapper de SQLite
│       ├── schema.sql           # Esquema SQL (11 tablas relacionales)
│       └── seed.js              # Datos iniciales y datos de prueba
│
├── 📦 package.json               # Dependencias del proyecto
├── 🚀 vercel.json                # Configuración de despliegue serverless en Vercel
└── 📄 README.md                  # Documentación del proyecto
```

---

## 🚀 Cómo ejecutar el proyecto en local

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/KrlosEng/ClotheStore.git
cd ClotheStore
npm install
```

### 2. Poblar la base de datos SQLite
```bash
npm run seed
```

### 3. Iniciar el servidor local
```bash
npm start
```
Abre tu navegador en: **`http://localhost:3000`**

---

## 🌟 Características Principales
- 🔍 **Buscador Inteligente**: Reconocimiento de sinónimos (`pantalon`, `jean`, `tenis`, `oversize`) y búsqueda por tokens.
- 🗄️ **Base de Datos Relacional SQLite**: 11 tablas divididas en 5 dominios (`users`, `addresses`, `categories`, `products`, `product_variants`, `product_images`, `cart_items`, `orders`, `order_items`, `payments`, `shipments`).
- 🔐 **Autenticación Segura**: Hash de contraseñas con `bcrypt` y tokens `JWT`.
- 🛍️ **Carrito & Checkout**: Registro de transacciones con número de guía y empresa de transporte.
- 🎨 **Estilo Vintage Editorial**: Paleta parchment clara sin colores oscuros, con tipografía refinada `Cormorant Garamond`.
