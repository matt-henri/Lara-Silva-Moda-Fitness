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
      // Badge
      const badgeHtml = product.badge ? `
        <span class="product-badge ${product.inStock ? 'badge-new' : 'badge-soldout'}">
          ${product.badge}
        </span>
      ` : '';

      // Installments
      const installmentsPrice = (product.price / 3).toFixed(2).replace('.', ',');
      const installmentsText = `3x de R$ ${installmentsPrice}`;

      return `
        <a href="produto.html?id=${product.id}" class="product-card-minimal">
          <div class="product-media-minimal">
            ${badgeHtml}
            <img src="${product.image}" alt="${product.title}" class="product-img-minimal" loading="lazy">
          </div>
          <div class="product-info-minimal">
            <h3 class="product-title-minimal">${product.title}</h3>
            <div class="product-pricing-minimal">
              <span class="product-price-minimal">${formatCurrency(product.price)}</span>
              <span class="product-installments-minimal">${installmentsText}</span>
            </div>
          </div>
        </a>
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
    whatsappFloating.href = `https://api.whatsapp.com/send?phone=${SITE_CONFIG.whatsappNumber}&text=${encodeURIComponent(SITE_CONFIG.defaultMessage)}`;
    
    // Hide on mobile when hero section is visible
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            whatsappFloating.classList.add('hide-on-mobile');
          } else {
            whatsappFloating.classList.remove('hide-on-mobile');
          }
        });
      }, { threshold: 0.1 });
      observer.observe(heroSection);
    }
  }
});

