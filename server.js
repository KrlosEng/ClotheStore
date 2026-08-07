const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { initSchema, queryAll, queryGet, queryRun } = require('./database/db');
const { seedDatabase } = require('./database/seed');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'tumoda_luxe_secret_key_2026';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Middleware de Autenticación JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
}

// ==========================================================================
// 1. RUTAS DE AUTENTICACIÓN (LOGIN Y REGISTRO)
// ==========================================================================

// Registro de usuarios
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, correo, password, telefono } = req.body;
    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
    }

    const existing = await queryGet('SELECT * FROM users WHERE correo = ?', [correo.toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await queryRun(
      'INSERT INTO users (nombre, correo, password_hash, telefono, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, correo.toLowerCase(), password_hash, telefono || '', 'cliente']
    );

    const userId = result.lastID;
    const token = jwt.sign({ id: userId, correo: correo.toLowerCase(), rol: 'cliente' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Usuario registrado con éxito',
      user: { id: userId, nombre, correo: correo.toLowerCase(), rol: 'cliente' },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor: ' + err.message });
  }
});

// Inicio de sesión
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: 'Ingresa correo y contraseña' });
    }

    const user = await queryGet('SELECT * FROM users WHERE correo = ?', [correo.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, correo: user.correo, rol: user.rol }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Inicio de sesión exitoso',
      user: { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol, telefono: user.telefono },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor: ' + err.message });
  }
});

// Perfil de usuario actual
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryGet('SELECT id, nombre, correo, telefono, rol, fecha_registro FROM users WHERE id = ?', [req.user.id]);
    const addresses = await queryAll('SELECT * FROM addresses WHERE usuario_id = ?', [req.user.id]);
    res.json({ user, addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 2. RUTAS DEL CATÁLOGO E INVENTARIO
// ==========================================================================

// Obtener todos los productos con imágenes y variantes
app.get('/api/products', async (req, res) => {
  try {
    const products = await queryAll(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM products p 
      JOIN categories c ON p.categoria_id = c.id
      WHERE p.estado = 'activo'
    `);

    const fullProducts = await Promise.all(products.map(async (prod) => {
      const images = await queryAll('SELECT * FROM product_images WHERE producto_id = ? ORDER BY orden ASC', [prod.id]);
      const variants = await queryAll('SELECT * FROM product_variants WHERE producto_id = ?', [prod.id]);

      return {
        id: prod.id,
        name: prod.nombre,
        description: prod.descripcion,
        brand: prod.marca,
        price: prod.precio_base,
        category: prod.categoria_nombre,
        rating: 4.8,
        reviews: Math.floor(Math.random() * 150) + 50,
        image: images.length > 0 ? images[0].url_imagen : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
        images: images.map(img => img.url_imagen),
        sizes: [...new Set(variants.map(v => v.talla))],
        colors: ['#000000', '#ffffff', '#708090'],
        variants,
        tag: 'Exclusivo'
      };
    }));

    res.json(fullProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 3. RUTAS DEL CARRITO DE COMPRAS
// ==========================================================================

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const items = await queryAll(`
      SELECT ci.id, ci.cantidad, pv.talla, pv.color, p.nombre, p.precio_base, pi.url_imagen
      FROM cart_items ci
      JOIN product_variants pv ON ci.variante_id = pv.id
      JOIN products p ON pv.producto_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.producto_id
      WHERE ci.usuario_id = ?
      GROUP BY ci.id
    `, [req.user.id]);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 4 Y 5. PEDIDOS, VENTAS, PAGOS Y ENVÍOS
// ==========================================================================

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, total, proveedor_pago, direccion } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No hay productos en la orden' });
    }

    // 1. Crear o guardar dirección si no existe
    let direccionId = null;
    if (direccion) {
      const dirRes = await queryRun(
        'INSERT INTO addresses (usuario_id, calle, apartamento, ciudad, estado, codigo_postal, pais) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, direccion.calle || 'Calle Principal', direccion.apartamento || '', direccion.ciudad || 'Bogotá', direccion.estado || 'Cundinamarca', '110111', 'Colombia']
      );
      direccionId = dirRes.lastID;
    }

    // 2. Crear Pedido en DB
    const orderRes = await queryRun(
      'INSERT INTO orders (usuario_id, estado_pedido, total, direccion_envio_id) VALUES (?, ?, ?, ?)',
      [req.user.id, 'pagado', total, direccionId]
    );
    const orderId = orderRes.lastID;

    // 3. Crear Detalle de Pedido (order_items)
    for (const item of items) {
      // Buscar o crear variante si no existe
      let variant = await queryGet('SELECT * FROM product_variants WHERE producto_id = ? LIMIT 1', [item.id]);
      let variantId = variant ? variant.id : 1;

      await queryRun(
        'INSERT INTO order_items (pedido_id, variante_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [orderId, variantId, item.quantity || 1, item.price]
      );
    }

    // 4. Registro de Pago (payments)
    const txId = 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    await queryRun(
      'INSERT INTO payments (pedido_id, proveedor, transaccion_externa_id, estado_pago, monto) VALUES (?, ?, ?, ?, ?)',
      [orderId, proveedor_pago || 'Tarjeta de Crédito', txId, 'aprobado', total]
    );

    // 5. Registro de Envío (shipments)
    const guiaId = 'GUIA-' + Math.floor(10000000 + Math.random() * 90000000);
    await queryRun(
      'INSERT INTO shipments (pedido_id, empresa_transporte, numero_guia, estado_envio, fecha_estimada) VALUES (?, ?, ?, ?, date("now", "+3 days"))',
      [orderId, 'DHL Express', guiaId, 'en_transito']
    );

    // Vaciar carrito del usuario
    await queryRun('DELETE FROM cart_items WHERE usuario_id = ?', [req.user.id]);

    res.status(201).json({
      message: '¡Pedido procesado con éxito!',
      orderId,
      transaccionId: txId,
      numeroGuia: guiaId,
      total
    });
  } catch (err) {
    res.status(500).json({ error: 'Error procesando pedido: ' + err.message });
  }
});

// Inicializar DB y Servidor
async function startServer() {
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Servidor TuModa Luxe en vivo en: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer();
