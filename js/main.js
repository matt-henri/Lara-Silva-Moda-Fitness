/**
 * Lara Silva Moda Fitness - Lógica Principal da Aplicação & UI
 */

// Estado das seleções ativas por card de produto (productId -> { size: string|null, color: string })
window.productSelections = {};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializa o Gerenciador da Sacola
  window.cart = new CartManager();

  // 2. Renderização do Catálogo de Produtos
  const catalogGrid = document.getElementById('catalog-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');

  function renderProducts(category = 'all') {
    if (!catalogGrid) return;

    const filtered = category === 'all' 
      ? PRODUCTS 
      : PRODUCTS.filter(p => p.category === category);

    catalogGrid.innerHTML = filtered.map(product => {
      // Inicializa estado de seleção para este produto (cor 0 pré-selecionada, tamanho null)
      if (!window.productSelections[product.id]) {
        const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0].name : 'Padrão';
        window.productSelections[product.id] = {
          size: null,
          color: defaultColor
        };
      }

      const activeColor = window.productSelections[product.id].color;
      const activeSize = window.productSelections[product.id].size;

      // Badge
      const badgeHtml = product.badge ? `
        <span class="product-badge ${product.inStock ? 'badge-new' : 'badge-soldout'}">
          ${product.badge}
        </span>
      ` : '';

      // Preços
      const oldPriceHtml = product.oldPrice 
        ? `<span class="product-old-price">${formatCurrency(product.oldPrice)}</span>` 
        : '';

      // Seletor de Cores (Bolinhas)
      const colorsHtml = (product.colors && product.colors.length > 0) ? `
        <div class="product-option-block">
          <div class="option-label">
            <span>Cor</span>
            <span id="selected-color-label-${product.id}">${activeColor}</span>
          </div>
          <div class="color-swatches" id="color-swatches-${product.id}">
            ${product.colors.map((c, idx) => `
              <button 
                type="button"
                class="color-dot ${c.name === activeColor ? 'active' : ''}" 
                style="background-color: ${c.hex};" 
                title="${c.name}"
                onclick="handleColorSelect('${product.id}', '${c.name}', this)"
                aria-label="Cor ${c.name}"
              ></button>
            `).join('')}
          </div>
        </div>
      ` : '';

      // Seletor de Tamanhos (Círculos P, M, G, GG)
      const sizesHtml = product.sizes ? `
        <div class="product-option-block">
          <div class="option-label">
            <span>Tamanho</span>
            <span id="selected-size-label-${product.id}">${activeSize ? activeSize : 'Selecione'}</span>
          </div>
          <div class="size-selector" id="size-selector-${product.id}">
            ${product.sizes.map(s => `
              <button 
                type="button"
                class="size-circle ${s === activeSize ? 'active' : ''}" 
                onclick="handleSizeSelect('${product.id}', '${s}', this)"
                aria-label="Tamanho ${s}"
              >
                ${s}
              </button>
            `).join('')}
          </div>
        </div>
      ` : '';

      // Ações (Adicionar ao Carrinho + Comprar)
      const actionsHtml = product.inStock ? `
        <div class="product-card-actions">
          <button 
            type="button"
            class="btn btn-card-cart" 
            onclick="handleAddToCartClick('${product.id}')"
            title="Adicionar à Sacola"
          >
            Adicionar
          </button>
          <button 
            type="button"
            class="btn btn-card-buy" 
            onclick="handleDirectBuyClick('${product.id}')"
            title="Comprar via WhatsApp"
          >
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Comprar
          </button>
        </div>
      ` : `
        <div class="product-card-actions" style="grid-template-columns: 1fr;">
          <button class="btn btn-secondary btn-full" disabled style="opacity: 0.5; cursor: not-allowed;">
            Esgotado
          </button>
        </div>
      `;

      return `
        <article class="product-card" id="card-${product.id}" data-category="${product.category}">
          <div class="product-media">
            ${badgeHtml}
            <img src="${product.image}" alt="${product.title}" class="product-img" loading="lazy" id="product-img-${product.id}">
          </div>
          <div class="product-info">
            <h3 class="product-title">${product.title}</h3>
            <div class="product-prices">
              <span class="product-price">${formatCurrency(product.price)}</span>
              ${oldPriceHtml}
            </div>

            ${colorsHtml}
            ${sizesHtml}
            ${actionsHtml}
          </div>
        </article>
      `;
    }).join('');
  }

  // Filtragem de Categorias
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      renderProducts(cat);
    });
  });

  // Render inicial
  renderProducts();

  // 3. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (questionBtn && answer) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        // Fecha todos os outros
        faqItems.forEach(other => {
          other.classList.remove('active');
          const otherAns = other.querySelector('.faq-answer');
          if (otherAns) otherAns.style.maxHeight = null;
        });

        if (!isOpen) {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      });
    }
  });

  // 4. Menu Mobile
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav .nav-link');

  function toggleMobileMenu() {
    mobileNav.classList.toggle('open');
    mobileNavOverlay.classList.toggle('open');
  }

  function closeMobileMenu() {
    mobileNav.classList.remove('open');
    mobileNavOverlay.classList.remove('open');
  }

  if (mobileMenuBtn && mobileNav && mobileNavOverlay) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    mobileNavOverlay.addEventListener('click', closeMobileMenu);
    mobileNavLinks.forEach(link => link.addEventListener('click', closeMobileMenu));
  }

  // 5. Configuração do Botão Flutuante do WhatsApp
  const whatsappFloating = document.getElementById('whatsapp-floating');
  if (whatsappFloating) {
    whatsappFloating.href = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(SITE_CONFIG.defaultMessage)}`;
  }
});

// Manipulador de Seleção de Cor
window.handleColorSelect = function(productId, colorName, btnElement) {
  const product = PRODUCTS.find(p => p.id === productId);
  const colorObj = product && product.colors ? product.colors.find(c => c.name === colorName) : null;
  const colorImage = colorObj && colorObj.image ? colorObj.image : (product ? product.image : null);

  if (!window.productSelections[productId]) {
    window.productSelections[productId] = { size: null, color: colorName, image: colorImage };
  } else {
    window.productSelections[productId].color = colorName;
    window.productSelections[productId].image = colorImage;
  }

  // Atualiza a foto do produto no card instantaneamente
  if (colorImage) {
    const imgEl = document.getElementById(`product-img-${productId}`);
    if (imgEl) {
      imgEl.src = colorImage;
    }
  }

  // Atualiza classes ativas
  const container = document.getElementById(`color-swatches-${productId}`);
  if (container) {
    container.querySelectorAll('.color-dot').forEach(el => el.classList.remove('active'));
    btnElement.classList.add('active');
  }

  // Atualiza label
  const label = document.getElementById(`selected-color-label-${productId}`);
  if (label) label.textContent = colorName;
};

// Manipulador de Seleção de Tamanho
window.handleSizeSelect = function(productId, sizeName, btnElement) {
  if (!window.productSelections[productId]) {
    window.productSelections[productId] = { size: sizeName, color: 'Padrão' };
  } else {
    window.productSelections[productId].size = sizeName;
  }

  // Atualiza classes ativas
  const container = document.getElementById(`size-selector-${productId}`);
  if (container) {
    container.classList.remove('shake-error');
    container.querySelectorAll('.size-circle').forEach(el => el.classList.remove('active'));
    btnElement.classList.add('active');
  }

  // Atualiza label
  const label = document.getElementById(`selected-size-label-${productId}`);
  if (label) label.textContent = sizeName;
};

// Validação de Tamanho Selecionado
function validateSizeSelection(productId) {
  const selection = window.productSelections[productId];
  if (!selection || !selection.size) {
    // Exibe toast de erro
    if (window.cart) {
      window.cart.showToast("Por favor, selecione um tamanho antes de continuar.", true);
    }

    // Aplica animação de shake no seletor de tamanho do card
    const sizeContainer = document.getElementById(`size-selector-${productId}`);
    if (sizeContainer) {
      sizeContainer.classList.remove('shake-error');
      // Força reflow para reiniciar animação
      void sizeContainer.offsetWidth;
      sizeContainer.classList.add('shake-error');
    }
    return false;
  }
  return true;
}

// Manipulador do botão "Adicionar ao Carrinho"
window.handleAddToCartClick = function(productId) {
  if (!validateSizeSelection(productId)) return;

  const selection = window.productSelections[productId];
  window.cart.addItem(productId, selection.size, selection.color, 1, selection.image);
};

// Manipulador do botão "Comprar"
window.handleDirectBuyClick = function(productId) {
  if (!validateSizeSelection(productId)) return;

  const selection = window.productSelections[productId];
  const url = generateProductWhatsAppUrl(productId, selection.size, selection.color);
  window.open(url, '_blank');
};
