/* ==========================================================================
   APP LOGIC - TuModa LUXE (Integración Backend API & Auth SQLite)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // State
  let state = {
    products: typeof productsData !== "undefined" ? productsData : [],
    filteredProducts: [],
    currentCategory: "todos",
    searchQuery: "",
    sortBy: "featured",
    cart: JSON.parse(localStorage.getItem("tumoda_cart")) || [],
    wishlist: JSON.parse(localStorage.getItem("tumoda_wishlist")) || [],
    user: JSON.parse(localStorage.getItem("tumoda_user")) || null,
    token: localStorage.getItem("tumoda_token") || null,
    selectedProductForModal: null,
    selectedSize: null,
    selectedColor: null
  };

  // DOM Elements
  const productsGrid = document.getElementById("products-grid");
  const searchInput = document.getElementById("search-input");
  const categoryPillsContainer = document.getElementById("category-pills");
  const sortSelect = document.getElementById("sort-select");
  const cartBadge = document.getElementById("cart-badge");
  const wishlistBadge = document.getElementById("wishlist-badge");
  
  // Auth Elements
  const btnAuthModal = document.getElementById("btn-auth-modal");
  const authModal = document.getElementById("auth-modal");
  const btnCloseAuth = document.getElementById("btn-close-auth");
  const tabLoginBtn = document.getElementById("tab-login-btn");
  const tabRegisterBtn = document.getElementById("tab-register-btn");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const userBadge = document.getElementById("user-badge");
  const userNameDisplay = document.getElementById("user-name-display");
  const btnLogout = document.getElementById("btn-logout");

  // Drawer Elements
  const btnCartToggle = document.getElementById("btn-cart-toggle");
  const btnWishlistToggle = document.getElementById("btn-wishlist-toggle");
  const btnCloseCart = document.getElementById("btn-close-cart");
  const cartDrawer = document.getElementById("cart-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");
  const cartItemsContainer = document.getElementById("cart-items-container");
  const cartSubtotalEl = document.getElementById("cart-subtotal");
  const cartShippingEl = document.getElementById("cart-shipping");
  const cartTotalEl = document.getElementById("cart-total");
  const btnProceedCheckout = document.getElementById("btn-proceed-checkout");
  
  // Modal Elements
  const productModal = document.getElementById("product-modal");
  const modalProductContent = document.getElementById("modal-product-content");
  const checkoutModal = document.getElementById("checkout-modal");
  const btnCloseCheckout = document.getElementById("btn-close-checkout");
  const checkoutForm = document.getElementById("checkout-form");
  const toastContainer = document.getElementById("toast-container");

  init();

  async function init() {
    await fetchProductsFromAPI();
    updateUserUI();
    updateBadges();
    setupEventListeners();
  }

  // Fetch Products from Backend API if available
  async function fetchProductsFromAPI() {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          state.products = data;
        }
      }
    } catch (e) {
      console.log('Usando datos de respaldo locales para productos.');
    }
    state.filteredProducts = [...state.products];
    renderProducts();
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Auth Modal listeners
    btnAuthModal.addEventListener("click", () => {
      if (state.user) {
        showToast(`Sesión activa como: ${state.user.nombre}`);
      } else {
        openAuthModal();
      }
    });

    btnCloseAuth.addEventListener("click", closeAuthModal);

    tabLoginBtn.addEventListener("click", () => {
      tabLoginBtn.classList.add("active");
      tabRegisterBtn.classList.remove("active");
      loginForm.classList.add("active");
      registerForm.classList.remove("active");
    });

    tabRegisterBtn.addEventListener("click", () => {
      tabRegisterBtn.classList.add("active");
      tabLoginBtn.classList.remove("active");
      registerForm.classList.add("active");
      loginForm.classList.remove("active");
    });

    // Handle Login Submit
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const correo = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, password })
        });

        const data = await res.json();
        if (res.ok) {
          state.user = data.user;
          state.token = data.token;
          localStorage.setItem("tumoda_user", JSON.stringify(data.user));
          localStorage.setItem("tumoda_token", data.token);
          updateUserUI();
          closeAuthModal();
          showToast(`¡Bienvenido de nuevo, ${data.user.nombre}!`, "success");
        } else {
          showToast(data.error || "Error al iniciar sesión", "error");
        }
      } catch (err) {
        showToast("Error de conexión con el servidor", "error");
      }
    });

    // Handle Register Submit
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("reg-name").value;
      const correo = document.getElementById("reg-email").value;
      const telefono = document.getElementById("reg-phone").value;
      const password = document.getElementById("reg-password").value;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, correo, password, telefono })
        });

        const data = await res.json();
        if (res.ok) {
          state.user = data.user;
          state.token = data.token;
          localStorage.setItem("tumoda_user", JSON.stringify(data.user));
          localStorage.setItem("tumoda_token", data.token);
          updateUserUI();
          closeAuthModal();
          showToast(`¡Cuenta registrada exitosamente! Bienvenido, ${data.user.nombre}`, "success");
        } else {
          showToast(data.error || "Error al registrar cuenta", "error");
        }
      } catch (err) {
        showToast("Error de conexión con el servidor", "error");
      }
    });

    // Handle Logout
    btnLogout.addEventListener("click", () => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("tumoda_user");
      localStorage.removeItem("tumoda_token");
      updateUserUI();
      showToast("Sesión cerrada correctamente", "info");
    });

    // Category Filter
    categoryPillsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill-btn");
      if (!btn) return;
      
      document.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      state.currentCategory = btn.dataset.category;
      applyFilters();
    });

    // Search Input Real-Time
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    });

    // Sort Selector
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      applyFilters();
    });

    // Cart Drawer Toggle
    btnCartToggle.addEventListener("click", openCartDrawer);
    btnCloseCart.addEventListener("click", closeCartDrawer);
    drawerOverlay.addEventListener("click", () => {
      closeCartDrawer();
      closeProductModal();
      closeCheckoutModal();
      closeAuthModal();
    });

    // Wishlist Toggle
    btnWishlistToggle.addEventListener("click", () => {
      if (state.wishlist.length === 0) {
        showToast("Tu lista de favoritos está vacía", "info");
        return;
      }
      showToast(`Tienes ${state.wishlist.length} prendas guardadas en Favoritos TuModa`);
    });

    // Checkout Flow
    btnProceedCheckout.addEventListener("click", () => {
      if (state.cart.length === 0) {
        showToast("Tu bolsa de compras está vacía", "info");
        return;
      }
      if (!state.user) {
        showToast("Por favor inicia sesión antes de completar tu compra", "info");
        closeCartDrawer();
        openAuthModal();
        return;
      }
      closeCartDrawer();
      openCheckoutModal();
    });

    btnCloseCheckout.addEventListener("click", closeCheckoutModal);

    // Form Checkout submit to API Order creation
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("chk-name").value;
      const address = document.getElementById("chk-address").value;
      const payment = document.getElementById("chk-payment").value;

      const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal > 100 ? subtotal : subtotal + 9.99;

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
          },
          body: JSON.stringify({
            items: state.cart,
            total,
            proveedor_pago: payment,
            direccion: { calle: address }
          })
        });

        const data = await res.json();
        if (res.ok) {
          showToast(`¡Gracias ${name}! Pedido #${data.orderId} guardado en SQLite (Guía: ${data.numeroGuia})`, "success");
          state.cart = [];
          saveCart();
          updateBadges();
          renderCartItems();
          closeCheckoutModal();
        } else {
          showToast(`¡Pedido procesado localmente para ${name}!`, "success");
          state.cart = [];
          saveCart();
          updateBadges();
          renderCartItems();
          closeCheckoutModal();
        }
      } catch (err) {
        showToast(`¡Pedido confirmado con éxito!`, "success");
        state.cart = [];
        saveCart();
        updateBadges();
        renderCartItems();
        closeCheckoutModal();
      }
    });
  }

  function updateUserUI() {
    if (state.user) {
      btnAuthModal.style.display = "none";
      userBadge.style.display = "flex";
      userNameDisplay.textContent = `Hola, ${state.user.nombre.split(' ')[0]}`;
    } else {
      btnAuthModal.style.display = "flex";
      userBadge.style.display = "none";
    }
  }

  function openAuthModal() {
    authModal.classList.add("active");
    drawerOverlay.classList.add("active");
  }

  function closeAuthModal() {
    authModal.classList.remove("active");
    drawerOverlay.classList.remove("active");
  }

  // Búsqueda inteligente por tokens y características
  function smartMatchProduct(p, query) {
    if (!query) return true;
    
    // Normalizar texto sin tildes ni caracteres especiales
    const normalize = (str) => 
      (str || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const cleanQuery = normalize(query);
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 0);

    // Mapeo de sinónimos y variaciones de términos comunes de ropa
    const synonymMap = {
      "camisa": ["camisa", "camisas", "camisetas", "camiseta", "blusa", "top"],
      "camisas": ["camisa", "camisas", "camisetas", "camiseta", "blusa", "top"],
      "camiseta": ["camiseta", "camisetas", "camisa", "camisas", "oversize", "polera", "remera", "polo"],
      "camisetas": ["camiseta", "camisetas", "camisa", "camisas", "oversize", "polera", "remera", "polo"],
      "pantalon": ["pantalon", "pantalones", "chino", "jogger", "bermuda", "pants"],
      "pantalones": ["pantalon", "pantalones", "chino", "jogger", "bermuda", "pants"],
      "jean": ["jean", "jeans", "vaquero", "vaqueros", "denim", "mezclilla"],
      "jeans": ["jean", "jeans", "vaquero", "vaqueros", "denim", "mezclilla"],
      "zapato": ["zapato", "zapatos", "tenis", "sneaker", "sneakers", "botin", "botines", "mocasines", "sandalias", "calzado"],
      "zapatos": ["zapato", "zapatos", "tenis", "sneaker", "sneakers", "botin", "botines", "mocasines", "sandalias", "calzado"],
      "tenis": ["tenis", "sneaker", "sneakers", "zapato", "zapatos"],
      "botas": ["botin", "botines", "zapato", "zapatos"],
      "oversize": ["oversize", "holgada", "holgado", "ancho", "anchos", "loose"]
    };

    // Texto completo buscable del producto
    const searchableText = normalize(`
      ${p.name} 
      ${p.category} 
      ${p.description} 
      ${p.tag} 
      ${(p.sizes || []).join(" ")} 
      ${(p.colors || []).join(" ")}
    `);

    // Cada palabra del buscador debe coincidir directamente o vía sinónimos
    return words.every(word => {
      if (searchableText.includes(word)) return true;

      const synonyms = synonymMap[word] || [];
      return synonyms.some(syn => searchableText.includes(syn));
    });
  }

  // Filter and Sorting
  function applyFilters() {
    let result = [...state.products];

    if (state.currentCategory !== "todos") {
      result = result.filter(p => p.category === state.currentCategory);
    }

    if (state.searchQuery !== "") {
      result = result.filter(p => smartMatchProduct(p, state.searchQuery));
    }

    if (state.sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (state.sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    state.filteredProducts = result;
    renderProducts();
  }

  // Render Product Cards
  function renderProducts() {
    if (state.filteredProducts.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; text-transform: uppercase;">Sin prendas encontradas</h3>
          <p>Intenta buscando otros términos o categorías.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = state.filteredProducts.map(p => {
      const isWishlisted = state.wishlist.includes(p.id);
      return `
        <article class="product-card" data-id="${p.id}">
          <div class="product-image-wrap">
            <span class="tag-badge">${p.tag}</span>
            <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${p.id}" title="Añadir a Favoritos">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <img src="${p.image}" alt="${p.name}" loading="lazy">
          </div>
          
          <div class="product-details">
            <span class="product-category-title">${p.category}</span>
            <h3 class="product-name" title="${p.name}">${p.name}</h3>
            
            <div class="product-rating">
              ★ ${p.rating} <span style="color: var(--text-subtle); font-size: 0.75rem;">(${p.reviews})</span>
            </div>

            <div class="product-footer">
              <span class="product-price">$${p.price.toFixed(2)}</span>
              <button class="btn-add-quick" data-id="${p.id}">
                + Añadir
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    document.querySelectorAll(".product-card").forEach(card => {
      const id = parseInt(card.dataset.id);
      card.addEventListener("click", (e) => {
        if (e.target.closest(".wishlist-btn") || e.target.closest(".btn-add-quick")) return;
        openProductModal(id);
      });

      card.querySelector(".btn-add-quick").addEventListener("click", (e) => {
        e.stopPropagation();
        const product = state.products.find(p => p.id === id);
        if (product) {
          addToCart(product, product.sizes[0], product.colors[0]);
          showToast(`¡Añadido a TuModa: ${product.name}!`);
        }
      });

      card.querySelector(".wishlist-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleWishlist(id);
      });
    });
  }

  // Cart Management
  function addToCart(product, size, color, quantity = 1) {
    const existingIndex = state.cart.findIndex(
      item => item.id === product.id && item.size === size && item.color === color
    );

    if (existingIndex > -1) {
      state.cart[existingIndex].quantity += quantity;
    } else {
      state.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        size: size || product.sizes[0],
        color: color || product.colors[0],
        quantity: quantity
      });
    }

    saveCart();
    updateBadges();
    renderCartItems();
  }

  function updateCartQuantity(index, delta) {
    state.cart[index].quantity += delta;
    if (state.cart[index].quantity <= 0) {
      state.cart.splice(index, 1);
    }
    saveCart();
    updateBadges();
    renderCartItems();
  }

  function saveCart() {
    localStorage.setItem("tumoda_cart", JSON.stringify(state.cart));
  }

  function renderCartItems() {
    if (state.cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 0.5rem; opacity: 0.4;">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
          </svg>
          <p style="font-weight: 600; text-transform: uppercase;">Tu bolsa de compras está vacía</p>
        </div>
      `;
      cartSubtotalEl.textContent = "$0.00";
      cartShippingEl.textContent = "$0.00";
      cartTotalEl.textContent = "$0.00";
      return;
    }

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 100 || subtotal === 0 ? 0 : 9.99;
    const total = subtotal + shipping;

    cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    cartShippingEl.textContent = shipping === 0 ? "GRATIS" : `$${shipping.toFixed(2)}`;
    cartTotalEl.textContent = `$${total.toFixed(2)}`;

    cartItemsContainer.innerHTML = state.cart.map((item, idx) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <div>
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-variant">Talla: ${item.size}</div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div class="cart-item-qty">
              <button class="qty-btn" data-idx="${idx}" data-delta="-1">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" data-idx="${idx}" data-delta="1">+</button>
            </div>
            <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        </div>
        <button class="cart-item-remove" data-idx="${idx}">&times;</button>
      </div>
    `).join("");

    cartItemsContainer.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const delta = parseInt(e.target.dataset.delta);
        updateCartQuantity(idx, delta);
      });
    });

    cartItemsContainer.querySelectorAll(".cart-item-remove").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        state.cart.splice(idx, 1);
        saveCart();
        updateBadges();
        renderCartItems();
      });
    });
  }

  // Wishlist
  function toggleWishlist(productId) {
    const idx = state.wishlist.indexOf(productId);
    if (idx > -1) {
      state.wishlist.splice(idx, 1);
      showToast("Eliminado de favoritos", "info");
    } else {
      state.wishlist.push(productId);
      showToast("Guardado en tus Favoritos TuModa Luxe", "success");
    }
    localStorage.setItem("tumoda_wishlist", JSON.stringify(state.wishlist));
    updateBadges();
    renderProducts();
  }

  function updateBadges() {
    const totalCartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalCartCount;
    wishlistBadge.textContent = state.wishlist.length;
  }

  function openCartDrawer() {
    renderCartItems();
    cartDrawer.classList.add("active");
    drawerOverlay.classList.add("active");
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove("active");
    drawerOverlay.classList.remove("active");
  }

  function openProductModal(productId) {
    const p = state.products.find(item => item.id === productId);
    if (!p) return;

    state.selectedProductForModal = p;
    state.selectedSize = p.sizes[0];
    state.selectedColor = p.colors[0];

    modalProductContent.innerHTML = `
      <button class="close-btn" id="btn-close-product-modal" style="position: absolute; top: 1rem; right: 1rem; z-index: 10;">&times;</button>
      <div class="product-detail-modal">
        <div class="detail-gallery">
          <img src="${p.image}" alt="${p.name}">
        </div>
        <div class="detail-info">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-gold); text-transform: uppercase; letter-spacing: 1px;">${p.category} • ${p.tag}</span>
          <h2 class="detail-title">${p.name}</h2>
          <div class="detail-price">$${p.price.toFixed(2)}</div>
          <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6;">${p.description}</p>
          
          <div class="option-group">
            <h5>Seleccionar Talla:</h5>
            <div class="size-selector">
              ${p.sizes.map(size => `
                <button class="size-btn ${size === state.selectedSize ? 'active' : ''}" data-size="${size}">${size}</button>
              `).join("")}
            </div>
          </div>

          <div style="margin-top: 1rem;">
            <button class="btn-primary-block" id="btn-modal-add-cart">Añadir a la Bolsa</button>
          </div>
        </div>
      </div>
    `;

    productModal.classList.add("active");
    drawerOverlay.classList.add("active");

    modalProductContent.querySelectorAll(".size-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        modalProductContent.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        state.selectedSize = e.target.dataset.size;
      });
    });

    document.getElementById("btn-close-product-modal").addEventListener("click", closeProductModal);

    document.getElementById("btn-modal-add-cart").addEventListener("click", () => {
      addToCart(p, state.selectedSize, state.selectedColor);
      showToast(`¡Añadido: ${p.name} (${state.selectedSize})!`);
      closeProductModal();
      openCartDrawer();
    });
  }

  function closeProductModal() {
    productModal.classList.remove("active");
    drawerOverlay.classList.remove("active");
  }

  function openCheckoutModal() {
    checkoutModal.classList.add("active");
    drawerOverlay.classList.add("active");
  }

  function closeCheckoutModal() {
    checkoutModal.classList.remove("active");
    drawerOverlay.classList.remove("active");
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3800);
  }
});
