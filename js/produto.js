/**
 * Lara Silva Moda Fitness - Lógica da Página de Produto
 */

let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let currentImage = null;

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o carrinho
  window.cart = new CartManager();

  // Lê o ID da URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    window.location.href = 'index.html';
    return;
  }

  // Busca o produto
  currentProduct = PRODUCTS.find(p => p.id === productId);

  if (!currentProduct) {
    window.location.href = 'index.html';
    return;
  }

  // Define seleções iniciais
  selectedColor = currentProduct.colors && currentProduct.colors.length > 0 ? currentProduct.colors[0].name : 'Padrão';
  currentImage = currentProduct.colors && currentProduct.colors.length > 0 && currentProduct.colors[0].image 
    ? currentProduct.colors[0].image 
    : currentProduct.image;
    
  renderProductDetails();
  setupEventListeners();
  setupAccordion();
  setupMobileMenu(); // Reusa a lógica de menu mobile se não estiver no main.js
});

function renderProductDetails() {
  document.title = `${currentProduct.title} | LARA SILVA`;
  
  // Textos e Preços
  document.getElementById('product-title').textContent = currentProduct.title;
  document.getElementById('product-price').textContent = formatCurrency(currentProduct.price);
  
  const installmentsPrice = (currentProduct.price / 8).toFixed(2).replace('.', ',');
  document.getElementById('product-installments').innerHTML = `ou <strong>R$ ${formatCurrency(currentProduct.price + (currentProduct.price * 0.1))}</strong> em até 8x de <strong>R$ ${installmentsPrice}</strong> sem juros`;
  
  if (currentProduct.oldPrice) {
    const oldPriceEl = document.getElementById('product-old-price');
    oldPriceEl.textContent = formatCurrency(currentProduct.oldPrice);
    oldPriceEl.style.display = 'inline';
    
    const discountEl = document.getElementById('product-discount');
    const discountPercent = Math.round(((currentProduct.oldPrice - currentProduct.price) / currentProduct.oldPrice) * 100);
    discountEl.textContent = `${discountPercent}% OFF`;
    discountEl.style.display = 'inline-block';
  }

  document.getElementById('product-description').textContent = currentProduct.description;

  // Imagem Principal
  document.getElementById('main-product-image').src = currentImage;

  // Renderiza Cores
  if (currentProduct.colors && currentProduct.colors.length > 0) {
    const colorsContainer = document.getElementById('color-swatches-container');
    document.getElementById('selected-color-label').textContent = selectedColor;
    
    colorsContainer.innerHTML = currentProduct.colors.map(c => `
      <button 
        type="button"
        class="color-dot-large ${c.name === selectedColor ? 'active' : ''}" 
        style="background-color: ${c.hex};" 
        title="${c.name}"
        data-color="${c.name}"
        data-image="${c.image || currentProduct.image}"
        aria-label="Cor ${c.name}"
      ></button>
    `).join('');
  } else {
    document.getElementById('color-swatches-container').parentElement.style.display = 'none';
  }

  // Renderiza Tamanhos
  if (currentProduct.sizes && currentProduct.sizes.length > 0) {
    const sizesContainer = document.getElementById('size-selector-container');
    sizesContainer.innerHTML = currentProduct.sizes.map(s => `
      <button 
        type="button"
        class="size-btn-large ${s === selectedSize ? 'active' : ''}" 
        data-size="${s}"
        aria-label="Tamanho ${s}"
      >
        ${s}
      </button>
    `).join('');
  } else {
    document.getElementById('size-selector-container').parentElement.style.display = 'none';
  }
}

function setupEventListeners() {
  // Cores
  const colorsContainer = document.getElementById('color-swatches-container');
  if (colorsContainer) {
    colorsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.color-dot-large');
      if (!btn) return;

      // Remove active class
      colorsContainer.querySelectorAll('.color-dot-large').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');

      selectedColor = btn.dataset.color;
      currentImage = btn.dataset.image;
      
      document.getElementById('selected-color-label').textContent = selectedColor;
      document.getElementById('main-product-image').src = currentImage;
    });
  }

  // Tamanhos
  const sizesContainer = document.getElementById('size-selector-container');
  if (sizesContainer) {
    sizesContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.size-btn-large');
      if (!btn) return;

      sizesContainer.querySelectorAll('.size-btn-large').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');

      selectedSize = btn.dataset.size;
      document.getElementById('selected-size-label').textContent = selectedSize;
      
      // Reseta animação de erro se existir
      sizesContainer.parentElement.classList.remove('shake-error');
    });
  }

  // Adicionar à Sacola
  const addBtn = document.getElementById('btn-add-to-bag');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (!currentProduct) return;
      
      if (currentProduct.sizes && currentProduct.sizes.length > 0 && !selectedSize) {
        if (window.cart) window.cart.showToast("Por favor, selecione um tamanho.", true);
        const sizesWrapper = document.getElementById('size-selector-container').parentElement;
        sizesWrapper.classList.remove('shake-error');
        void sizesWrapper.offsetWidth;
        sizesWrapper.classList.add('shake-error');
        return;
      }

      window.cart.addItem(currentProduct.id, selectedSize, selectedColor, 1, currentImage);
      // O carrinho já abre automaticamente via cart.js (showDrawer)
    });
  }
}

function setupAccordion() {
  const headers = document.querySelectorAll('.accordion-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('active');
    });
  });
}

function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

  if (mobileMenuBtn && mobileNav && mobileNavOverlay) {
    function toggleMobileMenu() {
      mobileNav.classList.toggle('open');
      mobileNavOverlay.classList.toggle('open');
    }

    function closeMobileMenu() {
      mobileNav.classList.remove('open');
      mobileNavOverlay.classList.remove('open');
    }

    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    mobileNavOverlay.addEventListener('click', closeMobileMenu);
  }
}

// Helper para formatar moeda
function formatCurrency(val) {
  const num = typeof val === 'number' ? val : (parseFloat(val) || 0);
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}
