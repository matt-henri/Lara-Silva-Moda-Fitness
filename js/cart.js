/**
 * Lara Silva Moda Fitness - Gerenciador da Sacola de Compras e Checkout WhatsApp
 */

class CartManager {
  constructor() {
    this.items = this.loadCart();
    this.drawerEl = document.getElementById('cart-drawer');
    this.overlayEl = document.getElementById('cart-overlay');
    this.itemsContainerEl = document.getElementById('cart-items-container');
    this.subtotalEl = document.getElementById('cart-subtotal-val');
    this.badges = document.querySelectorAll('.cart-badge');
    this.whatsappCheckoutBtn = document.getElementById('cart-whatsapp-checkout');

    this.initEventListeners();
    this.updateUI();
  }

  loadCart() {
    try {
      const saved = localStorage.getItem('aura_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('aura_cart', JSON.stringify(this.items));
    } catch (e) {
      console.error('Erro ao salvar sacola:', e);
    }
  }

  addItem(productId, size, color, quantity = 1, customImage = null) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product || !product.inStock) return;

    const itemImage = customImage || product.image;
    const existingIndex = this.items.findIndex(
      item => item.id === productId && item.size === size && item.color === color
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: itemImage,
        size: size,
        color: color,
        quantity: quantity
      });
    }

    this.saveCart();
    this.updateUI();
    this.openDrawer();
    this.showToast(`"${product.title}" (${size}, ${color}) adicionado à sacola.`);
  }

  removeItem(index) {
    this.items.splice(index, 1);
    this.saveCart();
    this.updateUI();
  }

  updateQuantity(index, delta) {
    if (this.items[index]) {
      this.items[index].quantity += delta;
      if (this.items[index].quantity <= 0) {
        this.removeItem(index);
      } else {
        this.saveCart();
        this.updateUI();
      }
    }
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  openDrawer() {
    if (this.drawerEl && this.overlayEl) {
      this.drawerEl.classList.add('open');
      this.overlayEl.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  closeDrawer() {
    if (this.drawerEl && this.overlayEl) {
      this.drawerEl.classList.remove('open');
      this.overlayEl.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  generateWhatsAppCheckoutUrl() {
    if (!this.items || this.items.length === 0) {
      return `https://api.whatsapp.com/send?phone=${SITE_CONFIG.whatsappNumber}&text=${encodeURIComponent(SITE_CONFIG.defaultMessage)}`;
    }

    let msg = `✨ *Novo Pedido - ${SITE_CONFIG.brandName}*\n`;
    msg += `─────────────────────────\n`;

    this.items.forEach((item, i) => {
      const price = typeof item.price === 'number' ? item.price : (parseFloat(item.price) || 0);
      const qty = parseInt(item.quantity, 10) || 1;
      msg += `${i + 1}. *${item.title}*\n`;
      msg += `   • Cor: ${item.color || 'Padrão'} | Tam: ${item.size} | Qtd: ${qty}\n`;
      msg += `   • Subtotal: ${formatCurrency(price * qty)}\n`;
    });

    msg += `─────────────────────────\n`;
    msg += `*Total do Pedido: ${formatCurrency(this.getTotal())}*\n\n`;
    msg += `Gostaria de confirmar a disponibilidade e os detalhes de pagamento/envio.`;

    return `https://api.whatsapp.com/send?phone=${SITE_CONFIG.whatsappNumber}&text=${encodeURIComponent(msg)}`;
  }

  updateUI() {
    // Atualiza contadores
    const count = this.getTotalCount();
    this.badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });

    // Atualiza subtotal
    if (this.subtotalEl) {
      this.subtotalEl.textContent = formatCurrency(this.getTotal());
    }

    // Renderiza itens da sacola
    if (this.itemsContainerEl) {
      if (this.items.length === 0) {
        this.itemsContainerEl.innerHTML = `
          <div class="cart-empty">
            <span class="material-symbols-outlined" style="font-size: 48px; color: var(--color-outline); margin-bottom: 12px;">shopping_bag</span>
            <p>Sua sacola está vazia.</p>
            <p style="font-size: 0.8rem; margin-top: 6px;">Adicione peças da coleção para finalizar via WhatsApp.</p>
          </div>
        `;
        if (this.whatsappCheckoutBtn) {
          this.whatsappCheckoutBtn.classList.add('disabled');
          this.whatsappCheckoutBtn.setAttribute('disabled', 'true');
        }
      } else {
        this.itemsContainerEl.innerHTML = this.items.map((item, index) => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" class="cart-item-img">
            <div class="cart-item-info">
              <h4 class="cart-item-title">${item.title}</h4>
              <div class="cart-item-variant">
                <span>Cor: <strong>${item.color || 'Padrão'}</strong></span> | 
                <span>Tam: <strong>${item.size}</strong></span>
              </div>
              <div class="cart-item-price">${formatCurrency(item.price)}</div>
              <div class="cart-qty-ctrl">
                <button class="qty-btn" onclick="window.cart.updateQuantity(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="window.cart.updateQuantity(${index}, 1)">+</button>
              </div>
            </div>
            <button class="cart-item-remove" onclick="window.cart.removeItem(${index})" title="Remover">&times;</button>
          </div>
        `).join('');

        if (this.whatsappCheckoutBtn) {
          this.whatsappCheckoutBtn.classList.remove('disabled');
          this.whatsappCheckoutBtn.removeAttribute('disabled');
        }
      }
    }
  }

  showToast(message, isError = false) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    toast.innerHTML = isError 
      ? `<span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle; margin-right: 6px;">info</span> ${message}`
      : message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  initEventListeners() {
    // Abrir sacola pelo header
    const cartToggles = document.querySelectorAll('[data-cart-toggle]');
    cartToggles.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    });

    // Fechar sacola
    const closeBtns = document.querySelectorAll('[data-cart-close]');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeDrawer());
    });

    if (this.overlayEl) {
      this.overlayEl.addEventListener('click', () => this.closeDrawer());
    }

    // Botão de checkout WhatsApp da sacola
    if (this.whatsappCheckoutBtn) {
      this.whatsappCheckoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.items && this.items.length > 0) {
          const checkoutUrl = this.generateWhatsAppCheckoutUrl();
          openWhatsAppUrl(checkoutUrl);
        }
      });
    }
  }
}
