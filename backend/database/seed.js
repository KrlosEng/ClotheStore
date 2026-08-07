const bcrypt = require('bcryptjs');
const { initSchema, queryGet, queryRun } = require('./db');

// Importar datos de productos simplificados
const productsData = [
  // Camisas (10)
  { name: "Camisa Oxford Blanca", category: "camisas", price: 49.99, desc: "Camisa de vestir Oxford confeccionada en 100% algodón.", tag: "Más Vendido", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" },
  { name: "Guayabera de Lino", category: "camisas", price: 59.90, desc: "Camisa tradicional de lino fresco.", tag: "Edición Verano", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80" },
  { name: "Camisa de Flanela", category: "camisas", price: 45.00, desc: "Camisa a cuadros de flanela suave.", tag: "Tendencia", image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80" },
  { name: "Camisa de Seda", category: "camisas", price: 79.99, desc: "Camisa elegante de satén de seda.", tag: "Lujo", image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80" },
  { name: "Camisa Estampada", category: "camisas", price: 34.95, desc: "Camisa ligera de manga corta tropical.", tag: "Nuevo", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80" },
  { name: "Camisa de Jeans", category: "camisas", price: 54.90, desc: "Camisa de mezclilla azul lavado.", tag: "Popular", image: "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?auto=format&fit=crop&w=800&q=80" },
  { name: "Camisa Cuello Mao", category: "camisas", price: 42.50, desc: "Camisa minimalista sin cuello tradicional.", tag: "Minimal", image: "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?auto=format&fit=crop&w=800&q=80" },
  { name: "Camisa de Rayas", category: "camisas", price: 52.00, desc: "Camisa de vestir formal con rayas.", tag: "Ejecutivo", image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=800&q=80" },
  { name: "Camisa Holgada", category: "camisas", price: 39.99, desc: "Camisa holgada en algodón orgánico.", tag: "Eco Friendly", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80" },
  { name: "Camisa de Pana", category: "camisas", price: 64.90, desc: "Camisa de pana suave para frío.", tag: "Otoño/Invierno", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80" },

  // Pantalones (10)
  { name: "Pantalón Chino Beige", category: "pantalones", price: 54.99, desc: "Pantalón chino cómodo en algodón elástico.", tag: "Esencial", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantalón de Vestir", category: "pantalones", price: 89.90, desc: "Pantalón formal con pinzas delanteras.", tag: "Lujo", image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantalón Cargo", category: "pantalones", price: 59.95, desc: "Pantalón urbano con bolsillos laterales.", tag: "Streetwear", image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantalón Jogger", category: "pantalones", price: 39.99, desc: "Jogger de algodón con resorte.", tag: "Comfort", image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantalón de Lino", category: "pantalones", price: 69.00, desc: "Pantalón de lino fresco.", tag: "Verano", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantalón de Pana", category: "pantalones", price: 64.50, desc: "Pantalón de pana grueso y abrigado.", tag: "Invierno", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80" },
  { name: "Bermuda Chino", category: "pantalones", price: 34.99, desc: "Bermuda casual arriba de la rodilla.", tag: "Casual", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantalón Plisado", category: "pantalones", price: 74.90, desc: "Pantalón con textura plisada moderna.", tag: "Vanguardia", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantalón Ajustado", category: "pantalones", price: 49.99, desc: "Corte entallado y tela flexible.", tag: "Skinny", image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=800&q=80" },
  { name: "Pantalón Elegante", category: "pantalones", price: 99.99, desc: "Pantalón formal para eventos especiales.", tag: "Alta Gala", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80" },

  // Jeans (10)
  { name: "Jeans Rectos Clásicos", category: "jeans", price: 79.95, desc: "Jeans vaqueros de corte recto tradicional.", tag: "Ícono", image: "https://images.unsplash.com/photo-1542272604-780c36856842?auto=format&fit=crop&w=800&q=80" },
  { name: "Jeans Azul Oscuro", category: "jeans", price: 64.99, desc: "Jeans azul oscuro liso.", tag: "Top Ventas", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80" },
  { name: "Jeans Con Roturas", category: "jeans", price: 59.90, desc: "Jeans de estilo urbano con roturas.", tag: "Urbano", image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80" },
  { name: "Jeans Negros", category: "jeans", price: 54.95, desc: "Jeans totalmente negros ajustados.", tag: "Básico", image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=800&q=80" },
  { name: "Jeans Anchos 90s", category: "jeans", price: 69.99, desc: "Corte suelto y holgado estilo noventero.", tag: "Retro 90s", image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80" },
  { name: "Jeans Blancos", category: "jeans", price: 68.00, desc: "Jeans en tono marfil crudo.", tag: "Edición Limitada", image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=800&q=80" },
  { name: "Jeans Oscuros", category: "jeans", price: 129.90, desc: "Jeans de tela gruesa y resistente.", tag: "Premium", image: "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=800&q=80" },
  { name: "Jeans Corte Bota", category: "jeans", price: 62.50, desc: "Corte que se ensancha al final.", tag: "Vintage", image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=800&q=80" },
  { name: "Jeans Elásticos", category: "jeans", price: 49.99, desc: "Comodidad de pants con apariencia de jeans.", tag: "Híbrido", image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80" },
  { name: "Jeans Gris Lavado", category: "jeans", price: 59.95, desc: "Jeans gris con efecto desgastado.", tag: "Tendencia", image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80" },

  // Zapatos (6)
  { name: "Zapatos de cuero color marrón", category: "zapatos", price: 89.99, desc: "Zapatos de cuero marrón de alta calidad y diseño atemporal.", tag: "Imprescindible", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80" },
  { name: "Zapatos Oxford Café", category: "zapatos", price: 119.90, desc: "Zapatos de vestir clásico café.", tag: "Elegancia", image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80" },
  { name: "Botines Chelsea", category: "zapatos", price: 109.95, desc: "Botines casuales de gamuza café.", tag: "Estilo Urbano", image: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=800&q=80" },
  { name: "Mocasines de Piel", category: "zapatos", price: 94.99, desc: "Mocasines de cuero suaves.", tag: "Smart Casual", image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80" },
  { name: "Sandalias de Cuero", category: "zapatos", price: 49.99, desc: "Sandalias cómodas para verano.", tag: "Verano", image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80" },
  { name: "Tenis de Plataforma", category: "zapatos", price: 84.90, desc: "Tenis modernos con suela alta.", tag: "High Street", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80" },

  // Camisetas Oversize (3)
  { name: "Camiseta Gris Retro", category: "camisetas", price: 44.90, desc: "Camiseta gris estilo desgastado de los 90.", tag: "Tendencia", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80" },
  { name: "Camiseta Con Estampado", category: "camisetas", price: 42.50, desc: "Camiseta con diseño gráfico urbano.", tag: "Exclusivo", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" },
  { name: "Camiseta Blanca Básica", category: "camisetas", price: 36.99, desc: "Camiseta básica en tono blanco marfil.", tag: "Más Vendido", image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80" }
];

async function seedDatabase() {
  await initSchema();

  console.log("Inicializando datos de prueba...");

  // 1. Usuarios de prueba
  const adminHash = await bcrypt.hash("admin123", 10);
  const clienteHash = await bcrypt.hash("cliente123", 10);

  const existingAdmin = await queryGet("SELECT * FROM users WHERE correo = ?", ["admin@tumoda.com"]);
  if (!existingAdmin) {
    const adminRes = await queryRun(
      "INSERT INTO users (nombre, correo, password_hash, telefono, rol) VALUES (?, ?, ?, ?, ?)",
      ["Admin TuModa", "admin@tumoda.com", adminHash, "+57 300 000 0000", "admin"]
    );
    console.log("Usuario Admin creado:", adminRes.lastID);
  }

  let clienteId;
  const existingCliente = await queryGet("SELECT * FROM users WHERE correo = ?", ["cliente@tumoda.com"]);
  if (!existingCliente) {
    const clienteRes = await queryRun(
      "INSERT INTO users (nombre, correo, password_hash, telefono, rol) VALUES (?, ?, ?, ?, ?)",
      ["Carlos Mendoza", "cliente@tumoda.com", clienteHash, "+57 311 222 3333", "cliente"]
    );
    clienteId = clienteRes.lastID;
    console.log("Usuario Cliente de prueba creado:", clienteId);

    await queryRun(
      "INSERT INTO addresses (usuario_id, calle, apartamento, ciudad, estado, codigo_postal, pais, es_direccion_principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [clienteId, "Avenida Principal #123", "Apto 402", "Bogotá", "Cundinamarca", "110111", "Colombia", 1]
    );
  }

  // 2. Categorías
  const categoriesMap = {};
  const catNames = ["camisetas", "camisas", "pantalones", "jeans", "zapatos"];
  for (const cName of catNames) {
    let cat = await queryGet("SELECT * FROM categories WHERE nombre = ?", [cName]);
    if (!cat) {
      const res = await queryRun("INSERT INTO categories (nombre) VALUES (?)", [cName]);
      categoriesMap[cName] = res.lastID;
    } else {
      categoriesMap[cName] = cat.id;
    }
  }

  // 3. Productos, Variantes e Imágenes
  // Primero actualizar o insertar con nombres sencillos
  for (let i = 0; i < productsData.length; i++) {
    const item = productsData[i];
    const catId = categoriesMap[item.category];

    let prod = await queryGet("SELECT * FROM products WHERE id = ?", [i + 1]);
    let prodId;
    if (!prod) {
      const res = await queryRun(
        "INSERT INTO products (nombre, descripcion, precio_base, categoria_id, estado) VALUES (?, ?, ?, ?, 'activo')",
        [item.name, item.desc, item.price, catId]
      );
      prodId = res.lastID;
    } else {
      prodId = prod.id;
      await queryRun("UPDATE products SET nombre = ?, descripcion = ?, precio_base = ?, categoria_id = ? WHERE id = ?", [item.name, item.desc, item.price, catId, prodId]);
    }

    const sizes = item.category === "zapatos" ? ["39", "40", "41", "42"] : ["S", "M", "L", "XL"];
    for (const size of sizes) {
      const sku = `TUMODA-${prodId}-${size}`;
      const existingVar = await queryGet("SELECT * FROM product_variants WHERE sku = ?", [sku]);
      if (!existingVar) {
        await queryRun(
          "INSERT INTO product_variants (producto_id, talla, color, sku, stock) VALUES (?, ?, ?, ?, ?)",
          [prodId, size, "Clásico", sku, 15]
        );
      }
    }

    const existingImg = await queryGet("SELECT * FROM product_images WHERE producto_id = ?", [prodId]);
    if (!existingImg) {
      await queryRun(
        "INSERT INTO product_images (producto_id, url_imagen, orden) VALUES (?, ?, 1)",
        [prodId, item.image]
      );
    } else {
      await queryRun("UPDATE product_images SET url_imagen = ? WHERE producto_id = ?", [item.image, prodId]);
    }
  }

  console.log("¡Base de datos SQLite actualizada con nombres sencillos!");
}

if (require.main === module) {
  seedDatabase().catch(err => console.error("Error al popular DB:", err));
}

module.exports = { seedDatabase };
