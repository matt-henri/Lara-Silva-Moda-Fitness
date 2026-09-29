/**
 * Lara Silva Moda Fitness - Painel Administrativo & Dashboard
 * Gestão de Estoque em Tempo Real + Gráficos Mensais Conectados ao Banco Neon
 */

let sessionPassword = '';
let allProducts = [];
let currentFilterCategory = 'ALL';
let currentSearchTerm = '';
let currentChartCategory = 'ALL';

// Instâncias do Chart.js
let monthlyFlowChart = null;
let categoryDonutChart = null;

// Categorias Oficiais do Sistema
const CATEGORIES = [
  'TOP',
  'SHORT',
  'CALÇAS',
  'CONJUNTOS SHORT',
  'CONJUNTOS CALÇA',
  'MACACÃO E MACAQUINHO'
];

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Estrutura de dados limpa (iniciada em zero)
function createCleanMonthlyData() {
  const data = {
    'ALL': { entradas: Array(12).fill(0), saidas: Array(12).fill(0) }
  };
  CATEGORIES.forEach(cat => {
    data[cat] = { entradas: Array(12).fill(0), saidas: Array(12).fill(0) };
  });
  return data;
}

let monthlyData = createCleanMonthlyData();

/* ================================================================
   1. INICIALIZAÇÃO & AUTENTICAÇÃO
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  displayCurrentDate();

  const pwdInput = document.getElementById('adminPassword');
  if (pwdInput) {
    pwdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') login();
    });
  }
});

function displayCurrentDate() {
  const badge = document.getElementById('currentDateBadge');
  if (!badge) return;
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const today = new Date().toLocaleDateString('pt-BR', options);
  badge.textContent = today.charAt(0).toUpperCase() + today.slice(1);
}

async function login() {
  const pwdInput = document.getElementById('adminPassword');
  const errorMsg = document.getElementById('loginError');
  if (!pwdInput) return;

  const pwd = pwdInput.value.trim();
  if (!pwd) {
    pwdInput.focus();
    return;
  }

  sessionPassword = pwd;
  
  // Exibe o painel principal
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('adminContent').style.display = 'flex';
  if (errorMsg) errorMsg.style.display = 'none';

  // Carrega produtos do banco e histórico real
  await initAdmin();
}

/**
 * Logout: Redireciona diretamente para a página de vendas oficial
 */
function logout() {
  sessionPassword = '';
  window.location.href = 'https://ls-moda-fitness.vercel.app/';
}

/* ================================================================
   2. CONTROLE DE NAVEGAÇÃO / SIDEBAR
================================================================ */
function switchTab(tabId) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  const tabDashboard = document.getElementById('tabDashboard');
  const tabEstoque = document.getElementById('tabEstoque');
  const pageTitle = document.getElementById('pageTitle');
  const pageDesc = document.getElementById('pageDesc');

  if (tabId === 'dashboard') {
    tabDashboard.classList.add('active');
    tabEstoque.classList.remove('active');
    pageTitle.textContent = 'Dashboard';
    pageDesc.textContent = 'Visão geral de desempenho e fluxo de produtos';
    
    if (monthlyFlowChart) monthlyFlowChart.resize();
    if (categoryDonutChart) categoryDonutChart.resize();
  } else if (tabId === 'estoque') {
    tabDashboard.classList.remove('active');
    tabEstoque.classList.add('active');
    pageTitle.textContent = 'Gestão de Estoque';
    pageDesc.textContent = 'Acompanhe e ajuste o inventário físico de peças';
  }

  toggleSidebar(false);
}

function toggleSidebar(open) {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar || !backdrop) return;

  if (open) {
    sidebar.classList.add('open');
    backdrop.classList.add('active');
  } else {
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
  }
}

/* ================================================================
   3. CARREGAMENTO DOS DADOS DO BANCO (PRODUTOS & MOVIMENTAÇÕES)
================================================================ */
async function initAdmin() {
  setupMonthlyChart();
  setupDonutChart();
  
  await fetchProducts();
  await fetchMovimentacoes();
  
  updateKPIs();
  renderLowStockAlerts();
  renderInventory();
}

async function fetchProducts() {
  try {
    const res = await fetch('/api/getProdutos');
    if (!res.ok) throw new Error('Falha na resposta da API');
    const data = await res.json();
    
    allProducts = data.map(item => ({
      ...item,
      categoria: identifyCategory(item.nome_produto)
    }));

    const totalQty = allProducts.reduce((acc, p) => acc + (parseInt(p.quantidade) || 0), 0);
    const navBadge = document.getElementById('navStockCount');
    if (navBadge) navBadge.textContent = totalQty;

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    const list = document.getElementById('inventoryList');
    if (list) {
      list.innerHTML = `
        <div class="empty-state">
          <p style="color: var(--color-rose); font-weight: 700;">Erro ao conectar com o banco de dados.</p>
          <p style="font-size: 13px; margin-top: 6px;">Verifique se o terminal está rodando com <code>npm run serve</code>.</p>
        </div>
      `;
    }
  }
}

async function fetchMovimentacoes() {
  monthlyData = createCleanMonthlyData();
  try {
    const res = await fetch('/api/getMovimentacoes');
    if (!res.ok) throw new Error('Falha ao buscar movimentações');
    const registros = await res.json();

    registros.forEach(r => {
      const mIdx = (parseInt(r.mes) || 1) - 1;
      const qtd = parseInt(r.total) || 0;
      const tipo = r.tipo === 'entrada' ? 'entradas' : 'saidas';
      const cat = r.categoria;

      if (mIdx >= 0 && mIdx < 12) {
        // Incrementa no Total Geral
        monthlyData['ALL'][tipo][mIdx] += qtd;
        
        // Incrementa na Categoria Específica
        if (monthlyData[cat]) {
          monthlyData[cat][tipo][mIdx] += qtd;
        }
      }
    });

    updateMonthlyChart();
    updateKPIs();
  } catch (err) {
    console.warn('Histórico ainda vazio ou recém-criado:', err);
    updateMonthlyChart();
  }
}

/**
 * Identifica a categoria do produto com base no nome
 */
function identifyCategory(nome) {
  if (!nome) return 'TOP';
  const n = nome.toLowerCase();

  if (n.includes('macaquinho') || n.includes('macacão') || n.includes('macacao')) {
    return 'MACACÃO E MACAQUINHO';
  }
  if (n.includes('conjunto') && (n.includes('calça') || n.includes('calca') || n.includes('legging'))) {
    return 'CONJUNTOS CALÇA';
  }
  if (n.includes('conjunto') && n.includes('short')) {
    return 'CONJUNTOS SHORT';
  }
  if (n.includes('short') || n.includes('biker') || n.includes('bermuda')) {
    return 'SHORT';
  }
  if (n.includes('calça') || n.includes('calca') || n.includes('legging')) {
    return 'CALÇAS';
  }
  if (n.includes('top') || n.includes('cropt') || n.includes('sutiã')) {
    return 'TOP';
  }
  return 'TOP';
}

/* ================================================================
   4. ATUALIZAÇÃO DE KPIS & ALERTAS EM TEMPO REAL
================================================================ */
function updateKPIs() {
  const totalStock = allProducts.reduce((acc, p) => acc + (parseInt(p.quantidade) || 0), 0);
  const totalValue = allProducts.reduce((acc, p) => {
    const price = parseFloat(p.preco) || 0;
    const qty = parseInt(p.quantidade) || 0;
    return acc + (price * qty);
  }, 0);

  // Mês Atual
  const curMonthIndex = new Date().getMonth();
  const currentInputs = monthlyData['ALL'].entradas[curMonthIndex] || 0;
  const currentOutputs = monthlyData['ALL'].saidas[curMonthIndex] || 0;

  const kpiTotalStock = document.getElementById('kpiTotalStock');
  const kpiProductCount = document.getElementById('kpiProductCount');
  const kpiMonthInputs = document.getElementById('kpiMonthInputs');
  const kpiMonthOutputs = document.getElementById('kpiMonthOutputs');
  const kpiTotalValue = document.getElementById('kpiTotalValue');

  if (kpiTotalStock) kpiTotalStock.textContent = totalStock;
  if (kpiProductCount) kpiProductCount.textContent = `${allProducts.length} itens cadastrados`;
  if (kpiMonthInputs) kpiMonthInputs.textContent = `${currentInputs}`;
  if (kpiMonthOutputs) kpiMonthOutputs.textContent = `${currentOutputs}`;
  if (kpiTotalValue) {
    kpiTotalValue.textContent = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const navBadge = document.getElementById('navStockCount');
  if (navBadge) navBadge.textContent = totalStock;
}

function renderLowStockAlerts() {
  const container = document.getElementById('lowStockList');
  if (!container) return;

  const lowStock = allProducts.filter(p => (parseInt(p.quantidade) || 0) < 5);

  if (lowStock.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: var(--color-emerald); font-weight: 700;">✓ Estoque Saudável!</p>
        <p style="font-size: 12px; margin-top: 4px;">Nenhum produto está com menos de 5 unidades.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lowStock.map(p => {
    const imgSrc = p.imagem || 'https://placehold.co/80x80/f1f5f9/64748b?text=Foto';
    return `
      <div class="low-stock-item">
        <div class="low-stock-info">
          <img src="${imgSrc}" class="low-stock-thumb" alt="${p.nome_produto}">
          <div>
            <div class="low-stock-name">${p.nome_produto}</div>
            <div class="low-stock-meta">${p.cor} | Tam: ${p.tamanho}</div>
          </div>
        </div>
        <span class="low-stock-badge">${p.quantidade} un. restante${p.quantidade === 1 ? '' : 's'}</span>
      </div>
    `;
  }).join('');
}

/* ================================================================
   5. GRÁFICOS INTERATIVOS (CHART.JS)
================================================================ */
function setupMonthlyChart() {
  const ctx = document.getElementById('monthlyFlowChart');
  if (!ctx) return;

  const dataCategory = monthlyData[currentChartCategory] || monthlyData['ALL'];

  if (monthlyFlowChart) {
    monthlyFlowChart.destroy();
  }

  monthlyFlowChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTH_LABELS,
      datasets: [
        {
          label: 'Entradas (Reposição)',
          data: [...dataCategory.entradas],
          backgroundColor: '#2563eb', // Azul
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        },
        {
          label: 'Saídas (Vendas)',
          data: [...dataCategory.saidas],
          backgroundColor: '#10b981', // Verde
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: '700' },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${context.raw} unidades`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
            color: '#64748b'
          }
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#94a3b8',
            precision: 0,
            stepSize: 1
          },
          beginAtZero: true
        }
      }
    }
  });
}

function updateMonthlyChart() {
  if (!monthlyFlowChart) return;
  const dataCategory = monthlyData[currentChartCategory] || monthlyData['ALL'];
  monthlyFlowChart.data.datasets[0].data = [...dataCategory.entradas];
  monthlyFlowChart.data.datasets[1].data = [...dataCategory.saidas];
  monthlyFlowChart.update();
}

function selectChartCategory(cat) {
  currentChartCategory = cat;

  document.querySelectorAll('#chartCategoryPills .cat-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === cat);
  });

  updateMonthlyChart();
}

function setupDonutChart() {
  const ctx = document.getElementById('categoryDonutChart');
  if (!ctx) return;

  const counts = CATEGORIES.map(cat => {
    return allProducts
      .filter(p => p.categoria === cat)
      .reduce((acc, p) => acc + (parseInt(p.quantidade) || 0), 0);
  });

  if (categoryDonutChart) {
    categoryDonutChart.destroy();
  }

  const hasData = counts.some(c => c > 0);

  categoryDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: CATEGORIES,
      datasets: [{
        data: hasData ? counts : [0, 0, 0, 0, 0, 0],
        backgroundColor: [
          '#2563eb', // Azul (Top)
          '#06b6d4', // Ciano (Short)
          '#8b5cf6', // Roxo (Calças)
          '#10b981', // Esmeralda (Conjuntos Short)
          '#f59e0b', // Âmbar (Conjuntos Calça)
          '#ec4899'  // Rosa (Macacão)
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            padding: 10,
            font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
            color: '#334155'
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          bodyFont: { family: 'Inter', size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${context.raw} peças`;
            }
          }
        }
      }
    }
  });
}

/**
 * Reseta todo o histórico de testes no banco de dados e na tela
 */
async function resetHistory() {
  if (!confirm('Deseja realmente zerar todo o histórico de testes de entradas e saídas?\n\nO gráfico voltará a 0 e começará a registrar as vendas e reposições reais a partir de agora.')) {
    return;
  }

  try {
    const res = await fetch('/api/updateEstoque', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset_history',
        password: sessionPassword
      })
    });

    if (res.ok) {
      monthlyData = createCleanMonthlyData();
      updateMonthlyChart();
      updateKPIs();
      alert('✓ Histórico de testes zerado com sucesso!\n\nAgora cada item que você remover (-) será computado como venda no gráfico, e cada item adicionado (+) como reposição.');
    } else {
      const err = await res.json();
      alert('Erro ao resetar: ' + (err.erro || 'Falha na autenticação'));
    }
  } catch (e) {
    alert('Erro de conexão ao tentar resetar dados.');
  }
}

/* ================================================================
   6. GESTÃO DE ESTOQUE (LISTA, FILTROS & AJUSTE +/- EM TEMPO REAL)
================================================================ */
function renderInventory() {
  const list = document.getElementById('inventoryList');
  if (!list) return;

  let filtered = allProducts;

  if (currentFilterCategory !== 'ALL') {
    filtered = filtered.filter(p => p.categoria === currentFilterCategory);
  }

  if (currentSearchTerm) {
    const term = currentSearchTerm.toLowerCase();
    filtered = filtered.filter(p => 
      (p.nome_produto && p.nome_produto.toLowerCase().includes(term)) ||
      (p.cor && p.cor.toLowerCase().includes(term)) ||
      (p.tamanho && p.tamanho.toLowerCase().includes(term))
    );
  }

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p style="font-weight: 700; color: var(--text-main);">Nenhum produto encontrado</p>
        <p style="font-size: 13px; margin-top: 4px;">Tente ajustar o termo de pesquisa ou selecione outra categoria.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(p => {
    const imgSrc = p.imagem || 'https://placehold.co/100x100/f1f5f9/64748b?text=Sem+Foto';
    const isLow = parseInt(p.quantidade) < 5;

    return `
      <div class="inventory-item">
        <img src="${imgSrc}" class="item-img" alt="${p.nome_produto}" onerror="this.src='https://placehold.co/100x100/f1f5f9/64748b?text=Foto'">
        
        <div class="item-info">
          <h3 class="item-name">${p.nome_produto}</h3>
          <div class="item-details">
            <span class="detail-category">${p.categoria}</span>
            <span class="detail-badge">Cor: ${p.cor || 'Padrão'}</span>
            <span class="detail-badge">Tam: ${p.tamanho || 'U'}</span>
            <span class="detail-badge price-tag">R$ ${parseFloat(p.preco || 0).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div class="item-controls">
          <button class="btn-qty" onclick="updateStock(${p.id}, 'decrement', this)" aria-label="Registrar Venda / Saída">-</button>
          <span class="qty-display ${isLow ? 'low-stock' : ''}">${p.quantidade}</span>
          <button class="btn-qty" onclick="updateStock(${p.id}, 'increment', this)" aria-label="Registrar Reposição / Entrada">+</button>
        </div>
      </div>
    `;
  }).join('');
}

function filterStockCategory(cat) {
  currentFilterCategory = cat;
  document.querySelectorAll('.stock-filter-chips .chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === cat);
  });
  renderInventory();
}

function filterStockList() {
  const input = document.getElementById('stockSearchInput');
  currentSearchTerm = input ? input.value.trim() : '';
  renderInventory();
}

/**
 * Atualização em Tempo Real:
 * - Ação (-) -> Registra Venda (Saída) imediatamente no gráfico do mês e banco Neon
 * - Ação (+) -> Registra Reposição (Entrada) imediatamente no gráfico do mês e banco Neon
 */
async function updateStock(id, action, btnElement) {
  const qtyDisplay = action === 'increment' 
    ? btnElement.previousElementSibling 
    : btnElement.nextElementSibling;
  
  const originalQty = parseInt(qtyDisplay.innerText) || 0;
  
  // Impede diminuir abaixo de zero
  if (action === 'decrement' && originalQty <= 0) {
    alert('O estoque deste produto já está zerado.');
    return;
  }

  // 1. Atualização Otimista Imediata na tela
  let newQty = originalQty;
  if (action === 'increment') newQty++;
  if (action === 'decrement') newQty--;
  
  qtyDisplay.innerText = newQty;
  qtyDisplay.classList.toggle('low-stock', newQty < 5);

  const prod = allProducts.find(p => p.id === id);
  const curMonth = new Date().getMonth();

  if (prod) {
    prod.quantidade = newQty;
    
    // Atualiza histórico em memória imediatamente
    if (action === 'decrement') {
      // Venda / Saída
      monthlyData['ALL'].saidas[curMonth] += 1;
      if (monthlyData[prod.categoria]) {
        monthlyData[prod.categoria].saidas[curMonth] += 1;
      }
    } else if (action === 'increment') {
      // Reposição / Entrada
      monthlyData['ALL'].entradas[curMonth] += 1;
      if (monthlyData[prod.categoria]) {
        monthlyData[prod.categoria].entradas[curMonth] += 1;
      }
    }

    // Atualiza imediatamente o Gráfico, os KPIs e a Rosca
    updateKPIs();
    updateMonthlyChart();
    renderLowStockAlerts();
    setupDonutChart();
  }

  // 2. Sincroniza com a API e banco Neon
  try {
    const res = await fetch('/api/updateEstoque', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_id: id,
        action: action,
        password: sessionPassword,
        categoria: prod ? prod.categoria : undefined
      })
    });

    if (!res.ok) {
      // Reverte se o servidor recusar
      qtyDisplay.innerText = originalQty;
      qtyDisplay.classList.toggle('low-stock', originalQty < 5);
      if (prod) prod.quantidade = originalQty;
      
      // Reverte gráfico
      if (action === 'decrement') {
        monthlyData['ALL'].saidas[curMonth] = Math.max(0, monthlyData['ALL'].saidas[curMonth] - 1);
        if (prod && monthlyData[prod.categoria]) {
          monthlyData[prod.categoria].saidas[curMonth] = Math.max(0, monthlyData[prod.categoria].saidas[curMonth] - 1);
        }
      } else if (action === 'increment') {
        monthlyData['ALL'].entradas[curMonth] = Math.max(0, monthlyData['ALL'].entradas[curMonth] - 1);
        if (prod && monthlyData[prod.categoria]) {
          monthlyData[prod.categoria].entradas[curMonth] = Math.max(0, monthlyData[prod.categoria].entradas[curMonth] - 1);
        }
      }

      updateKPIs();
      updateMonthlyChart();

      const erro = await res.json();
      alert('Erro: ' + (erro.erro || 'Não foi possível alterar o estoque.'));
      
      if (res.status === 401) {
        logout();
      }
    }
  } catch(e) {
    // Reverte em caso de falha de conexão
    qtyDisplay.innerText = originalQty;
    qtyDisplay.classList.toggle('low-stock', originalQty < 5);
    if (prod) prod.quantidade = originalQty;
    
    if (action === 'decrement') {
      monthlyData['ALL'].saidas[curMonth] = Math.max(0, monthlyData['ALL'].saidas[curMonth] - 1);
      if (prod && monthlyData[prod.categoria]) {
        monthlyData[prod.categoria].saidas[curMonth] = Math.max(0, monthlyData[prod.categoria].saidas[curMonth] - 1);
      }
    } else if (action === 'increment') {
      monthlyData['ALL'].entradas[curMonth] = Math.max(0, monthlyData['ALL'].entradas[curMonth] - 1);
      if (prod && monthlyData[prod.categoria]) {
        monthlyData[prod.categoria].entradas[curMonth] = Math.max(0, monthlyData[prod.categoria].entradas[curMonth] - 1);
      }
    }

    updateKPIs();
    updateMonthlyChart();
    alert('Erro de conexão com o banco de dados.');
  }
}
