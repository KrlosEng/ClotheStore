-- ==========================================================================
-- SCHEMA SQL: BASE DE DATOS PARA TUMODA LUXE
-- ==========================================================================

-- 1. GESTIÓN DE USUARIOS Y CLIENTES
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    telefono TEXT,
    rol TEXT NOT NULL DEFAULT 'cliente', -- 'cliente' o 'admin'
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    calle TEXT NOT NULL,
    apartamento TEXT,
    ciudad TEXT NOT NULL,
    estado TEXT NOT NULL,
    codigo_postal TEXT NOT NULL,
    pais TEXT NOT NULL DEFAULT 'Colombia',
    es_direccion_principal INTEGER DEFAULT 0, -- 1 o 0 (booleano en SQLite)
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. CATÁLOGO E INVENTARIO DE ROPA
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    categoria_padre_id INTEGER,
    FOREIGN KEY (categoria_padre_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    marca TEXT DEFAULT 'TuModa Luxe',
    precio_base REAL NOT NULL,
    categoria_id INTEGER NOT NULL,
    estado TEXT DEFAULT 'activo', -- 'activo' o 'borrador'
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    talla TEXT NOT NULL, -- 'S', 'M', 'L', 'XL', '39', '40', etc.
    color TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    stock INTEGER NOT NULL DEFAULT 10,
    precio_ajustado REAL, -- Nulo o precio específico si varía por talla/color
    FOREIGN KEY (producto_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    variante_id INTEGER,
    url_imagen TEXT NOT NULL,
    orden INTEGER DEFAULT 1,
    FOREIGN KEY (producto_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variante_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- 3. CARRITO DE COMPRAS
CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    variante_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (variante_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- 4. PEDIDOS Y VENTAS
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_pedido TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'enviado', 'completado', 'cancelado'
    total REAL NOT NULL,
    direccion_envio_id INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (direccion_envio_id) REFERENCES addresses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    variante_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (variante_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- 5. PAGOS Y ENVÍOS
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    proveedor TEXT NOT NULL, -- 'Stripe', 'PayPal', 'Tarjeta', 'PSE'
    transaccion_externa_id TEXT NOT NULL,
    estado_pago TEXT NOT NULL DEFAULT 'aprobado',
    monto REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    empresa_transporte TEXT NOT NULL DEFAULT 'Servientrega / DHL',
    numero_guia TEXT NOT NULL UNIQUE,
    estado_envio TEXT NOT NULL DEFAULT 'preparando', -- 'preparando', 'en_transito', 'entregado'
    fecha_estimada DATE,
    FOREIGN KEY (pedido_id) REFERENCES orders(id) ON DELETE CASCADE
);
