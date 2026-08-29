/**
 * Lara Silva Moda Fitness - Configurações Gerais & Catálogo de Produtos
 */

const SITE_CONFIG = {
  brandName: "LARA SILVA MODA FITNESS",
  whatsappNumber: "5534998672696",
  currencySymbol: "R$",
  defaultMessage: "Olá! Gostaria de tirar dúvidas sobre as peças da Lara Silva Moda Fitness."
};

const PRODUCTS = [
  {
    id: "top-ribbed-white",
    title: "Top Canelado Performance",
    category: "top",
    price: 189.90,
    oldPrice: 219.90,
    badge: "Novo",
    image: "assets/top/topBranco.webp",
    sizes: ["P", "M", "G"],
    colors: [
      { name: "Branco Neve", hex: "#F3F3F3", image: "assets/top/topBranco.webp" },
      { name: "Preto Ônix", hex: "#1A1A1A", image: "assets/top/topPreto.webp" },
      { name: "Verde Militar", hex: "#59614C", image: "assets/top/topVerde.webp" }
    ],
    inStock: true,
    description: "Top canelado de alta sustentação e compressão balanceada. Tecido respirável com proteção UV50+."
  },
  {
    id: "legging-high-waist-black",
    title: "Legging Treino Cintura Alta",
    category: "calcas",
    price: 249.90,
    oldPrice: 289.90,
    badge: "Mais Vendido",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4jGmh5fm4fe__4NhD2FUsyRHK-HXMhI4vB5IG5xLjqJxj3WVvFTXSX9i-3TQVvC5ShwmF4vgzdjEGbHsZ5tx1n01zbp_6P10iNCGpSMCFtwaSWZXH1DwRMkgaElOWMvU53dJP9I-ooQjdjhavxwZpX0pP097NLNnOOt5yHD9H4mmMewljUpddR_KbXqepbJODRaN6Qvhrbn2xRCCsmAxEkO52jb-qALw4LsS8eqOVoKRxq6EywONg",
    sizes: ["P", "M", "G", "GG"],
    colors: [
      { name: "Verde Militar", hex: "#59614C" },
      { name: "Preto Ônix", hex: "#1A1A1A" },
      { name: "Taupe Avelã", hex: "#A69282" }
    ],
    inStock: true,
    description: "Legging de cós ultra-alto sem costura frontal. Zero transparência com tecnologia squat-proof."
  },
  {
    id: "shorts-seamless-grey",
    title: "Shorts Biker Seamless",
    category: "short",
    price: 159.90,
    oldPrice: null,
    badge: "Destaque",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYVVYJPxiyb0qhrcyL9-e8TnyJoJMG95jiz0iqm0vG0hPk2UglI2GnUTKmAw3htPMheONEC4Ee_24SmzfRWdtv-H4LbI4olmcyT57lxrffY5CXBj04mWekUid-e3kFFI5AFwJ2wosTcH04hT05ZaH7M0oJgys60KfD2FS0IBhNPaZLW-mYbQ9Dx7HENNZt3g0drhu842RzvLpRCrC4a9xYpRu-tlVapbvKxuVvgfDoN2D688xuUwe4",
    sizes: ["P", "M", "G"],
    colors: [
      { name: "Cinza Glacial", hex: "#C8C9CE" },
      { name: "Preto Ônix", hex: "#1A1A1A" },
      { name: "Lilás Pastel", hex: "#D6C7E2" }
    ],
    inStock: true,
    description: "Biker shorts com compressão anatômica. Liberdade absoluta para treinos intensos ou compor looks urbanos."
  },
  {
    id: "bodysuit-elevate-navy",
    title: "Macacão Fitness Elevate",
    category: "macacao",
    price: 319.90,
    oldPrice: null,
    badge: "Esgotado",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOpkMPC_475GW9IpBtGxpzit_1ffEoUG58mZ8kgmNnDwvQZJl-DvyhgiuVInOCwRi7pDB3lVGOaV03RbVIIG2wCX8opVpQaqzuyEe7ZEhwB7kx5ynXC3X6XaeRyufDxHi6TTQkwcGKLvrEEFzcnk8cIIQVTk7qk2dDKeageqOSi_NUgt1xp7pQSfwNcyDxGQyplo0uQTlJYBJkkkIemERMl2TOc45r93yfCNYoDdH1Ca67jheESRDX",
    sizes: ["P", "M"],
    colors: [
      { name: "Azul Noturno", hex: "#222C42" },
      { name: "Preto Ônix", hex: "#1A1A1A" }
    ],
    inStock: false,
    description: "Macacão fitness de peça única com modelagem esculpidora e decote nas costas."
  },
  {
    id: "top-essential-crop",
    title: "Top Tiras Strappy",
    category: "top",
    price: 169.90,
    oldPrice: 199.90,
    badge: "Novo",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzp93B9Sfy2jKpDaPUBAJGuWnYQgQCpSGt2k-ipAVX7I5XCH0zCb1tI1O66l0RoWDzWCM3ieReoWTfrP-na7KMwVE7vPOIk32DyAb8QhbrMc4MgncTVEE_eeBm1ADEkU0aqNIT9M_Mb9YHVMAzDOyJBww1OSHLQwbGNbAfvNyU9zcMWxaA2T_XEBJsvYApHpGfwaIoQJwbEBtV0stI7z_k_wctpF8jbNjNPr4On7ldfdrgBwBlg3T6",
    sizes: ["P", "M", "G"],
    colors: [
      { name: "Off-White", hex: "#F7F6F0" },
      { name: "Nude Bege", hex: "#D8BC9D" },
      { name: "Preto Ônix", hex: "#1A1A1A" }
    ],
    inStock: true,
    description: "Top minimalista com tiras duplas ultrafinas e sustentação média."
  },
  {
    id: "legging-sculpt-taupe",
    title: "Legging Modeladora Seamless",
    category: "calcas",
    price: 259.90,
    oldPrice: null,
    badge: "Exclusivo",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4BpWD8tAEuGlqzjMj-FogQx9z3xja38VnNGh1rQjLzqO_7VkkOs3iCyVXh9-00bEWpT-B3a-rI-tt-9yK0i_VfrZOPOTjtK0CupFIHRZVVSgF88JbiVjrqQ9HO8xUcUff40nLv-hzFnSfW6Ltd0E9EqajdL0dOOAwxOVgmZ721dJZht7kvWBoSPU9h84vQoFB4xw7T8i6aEEX7DaGaH-llWEd_PRYk6ho9UCF2-EMTvAE4qPeWtoO",
    sizes: ["P", "M", "G"],
    colors: [
      { name: "Preto Ônix", hex: "#1A1A1A" },
      { name: "Azul Céu", hex: "#A8C5DA" },
      { name: "Taupe Avelã", hex: "#A69282" }
    ],
    inStock: true,
    description: "Tecido duplo com toque suave de seda e efeito modelador natural."
  }
];

// Helper para formatar moeda
function formatCurrency(val) {
  const num = typeof val === 'number' ? val : (parseFloat(val) || 0);
  return `${SITE_CONFIG.currencySymbol} ${num.toFixed(2).replace('.', ',')}`;
}

// Helper universal para abrir WhatsApp (funciona em Desktop, iOS Safari, Android Chrome e WebViews)
function openWhatsAppUrl(url) {
  if (!url) return;
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  
  if (isMobile) {
    window.location.href = url;
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      link.remove();
    }, 100);
  }
}

// Helper para gerar link de WhatsApp para um produto específico
function generateProductWhatsAppUrl(productId, selectedSize, selectedColor) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return `https://api.whatsapp.com/send?phone=${SITE_CONFIG.whatsappNumber}`;
  
  const sizeText = selectedSize ? `no tamanho *${selectedSize}*` : '';
  const colorText = selectedColor ? `na cor *${selectedColor}*` : '';
  const text = `Olá! Gostaria de comprar o *${product.title}* (${formatCurrency(product.price)}) ${colorText} ${sizeText}. Está disponível?`;
  return `https://api.whatsapp.com/send?phone=${SITE_CONFIG.whatsappNumber}&text=${encodeURIComponent(text.trim())}`;
}
