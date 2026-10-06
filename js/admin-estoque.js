/**
 * Lara Silva Moda Fitness - Painel Administrativo & Dashboard
 * Gestão de Estoque em Tempo Real + Preço de Custo, Venda e Margem de Lucro + Gráficos Financeiros Conectados ao Banco Neon
 */

let sessionPassword = '';
let allProducts = [];
let currentFilterCategory = 'ALL';
let currentSearchTerm = '';
let currentChartCategory = 'ALL';
let currentFinancialChartCategory = 'ALL';

// Instâncias do Chart.js
let monthlyFlowChart = null;
let financialFlowChart = null;
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

// Estrutura de dados limpa (iniciada em zero) para unidades físicas e valores financeiros (R$)
function createCleanMonthlyData() {
  const data = {
    'ALL': { 
      entradas: Array(12).fill(0), 
      saidas: Array(12).fill(0),
      vendas: Array(12).fill(0),
      custoVendas: Array(12).fill(0),
      custoEntradas: Array(12).fill(0),
      lucroReal: Array(12).fill(0)
    }
  };
  CATEGORIES.forEach(cat => {
    data[cat] = { 
      entradas: Array(12).fill(0), 
      saidas: Array(12).fill(0),
      vendas: Array(12).fill(0),
      custoVendas: Array(12).fill(0),
      custoEntradas: Array(12).fill(0),
      lucroReal: Array(12).fill(0)
    };
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
    if (financialFlowChart) financialFlowChart.resize();
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
  setupFinancialChart();
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
      preco: parseFloat(item.preco) || 0,
      preco_custo: parseFloat(item.preco_custo) || 0,
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
          <p style="font-size: 13px; margin-top: 6px;">Verifique se o servidor local está ativo.</p>
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
      const vendaTotal = parseFloat(r.valor_venda_total) || 0;
      const custoTotal = parseFloat(r.valor_custo_total) || 0;

      if (mIdx >= 0 && mIdx < 12) {
        // Incrementa quantidades físicas
        monthlyData['ALL'][tipo][mIdx] += qtd;
        
        // Incrementa valores financeiros em R$
        if (tipo === 'saida') {
          monthlyData['ALL'].vendas[mIdx] += vendaTotal;
          monthlyData['ALL'].custoVendas[mIdx] += custoTotal;
          monthlyData['ALL'].lucroReal[mIdx] += (vendaTotal - custoTotal);
        } else {
          monthlyData['ALL'].custoEntradas[mIdx] += custoTotal;
        }

        // Incrementa na Categoria Específica
        if (monthlyData[cat]) {
          monthlyData[cat][tipo][mIdx] += qtd;
          if (tipo === 'saida') {
            monthlyData[cat].vendas[mIdx] += vendaTotal;
            monthlyData[cat].custoVendas[mIdx] += custoTotal;
            monthlyData[cat].lucroReal[mIdx] += (vendaTotal - custoTotal);
          } else {
            monthlyData[cat].custoEntradas[mIdx] += custoTotal;
          }
        }
      }
    });

    updateMonthlyChart();
    updateFinancialChart();
    updateKPIs();
  } catch (err) {
    console.warn('Histórico ainda vazio ou recém-criado:', err);
    updateMonthlyChart();
    updateFinancialChart();
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
  
  // Totais Financeiros do Estoque Físico Atual
  const totalValue = allProducts.reduce((acc, p) => {
    const price = parseFloat(p.preco) || 0;
    const qty = parseInt(p.quantidade) || 0;
    return acc + (price * qty);
  }, 0);

  const totalCost = allProducts.reduce((acc, p) => {
    const cost = parseFloat(p.preco_custo) || 0;
    const qty = parseInt(p.quantidade) || 0;
    return acc + (cost * qty);
  }, 0);

  const totalStockProfit = totalValue - totalCost;
  const stockMarginPct = totalValue > 0 ? ((totalStockProfit / totalValue) * 100) : 0;

  // Mês Atual
  const curMonthIndex = new Date().getMonth();
  const currentInputs = monthlyData['ALL'].entradas[curMonthIndex] || 0;
  const currentOutputs = monthlyData['ALL'].saidas[curMonthIndex] || 0;
  const currentMonthSales = monthlyData['ALL'].vendas[curMonthIndex] || 0;
  const currentMonthProfit = monthlyData['ALL'].lucroReal[curMonthIndex] || 0;
  const currentMonthMargin = currentMonthSales > 0 ? ((currentMonthProfit / currentMonthSales) * 100) : 0;

  // Atualização dos elementos operacionais
  const kpiTotalStock = document.getElementById('kpiTotalStock');
  const kpiProductCount = document.getElementById('kpiProductCount');
  const kpiMonthInputs = document.getElementById('kpiMonthInputs');
  const kpiMonthOutputs = document.getElementById('kpiMonthOutputs');
  const kpiMonthProfit = document.getElementById('kpiMonthProfit');
  const kpiMonthProfitTag = document.getElementById('kpiMonthProfitTag');

  if (kpiTotalStock) kpiTotalStock.textContent = totalStock;
  if (kpiProductCount) kpiProductCount.textContent = `${allProducts.length} itens cadastrados`;
  if (kpiMonthInputs) kpiMonthInputs.textContent = `${currentInputs}`;
  if (kpiMonthOutputs) kpiMonthOutputs.textContent = `${currentOutputs}`;
  
  if (kpiMonthProfit) {
    kpiMonthProfit.textContent = currentMonthProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  if (kpiMonthProfitTag) {
    kpiMonthProfitTag.textContent = currentOutputs > 0 
      ? `${currentOutputs} venda${currentOutputs === 1 ? '' : 's'} (${currentMonthMargin >= 0 ? '+' : ''}${currentMonthMargin.toFixed(1)}% margem)`
      : 'Vendas do mês';
  }

  // Atualização dos elementos financeiros gerais
  const kpiTotalCost = document.getElementById('kpiTotalCost');
  const kpiTotalValue = document.getElementById('kpiTotalValue');
  const kpiStockProfit = document.getElementById('kpiStockProfit');
  const kpiStockProfitMarginTag = document.getElementById('kpiStockProfitMarginTag');

  if (kpiTotalCost) {
    kpiTotalCost.textContent = totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  if (kpiTotalValue) {
    kpiTotalValue.textContent = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  if (kpiStockProfit) {
    kpiStockProfit.textContent = totalStockProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  if (kpiStockProfitMarginTag) {
    kpiStockProfitMarginTag.textContent = `${stockMarginPct >= 0 ? '+' : ''}${stockMarginPct.toFixed(1)}% margem`;
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

// GRÁFICO 1: FLUXO FÍSICO DE PRODUTOS (UNIDADES)
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

// GRÁFICO 2: PERFORMANCE FINANCEIRA (CUSTO, VENDAS & LUCRO REAL EM R$)
function setupFinancialChart() {
  const ctx = document.getElementById('financialFlowChart');
  if (!ctx) return;

  const dataCategory = monthlyData[currentFinancialChartCategory] || monthlyData['ALL'];

  if (financialFlowChart) {
    financialFlowChart.destroy();
  }

  financialFlowChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTH_LABELS,
      datasets: [
        {
          label: 'Custo dos Produtos (Vendas)',
          data: [...dataCategory.custoVendas],
          backgroundColor: '#f59e0b', // Âmbar / Laranja elegante
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.75
        },
        {
          label: 'Valor de Vendas (Faturamento)',
          data: [...dataCategory.vendas],
          backgroundColor: '#2563eb', // Azul Royal
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.75
        },
        {
          label: 'Lucro Real Líquido',
          data: [...dataCategory.lucroReal],
          backgroundColor: '#10b981', // Verde Esmeralda
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.75
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
              const val = context.raw || 0;
              const formatted = val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              return ` ${context.dataset.label}: ${formatted}`;
            },
            afterBody: function(contexts) {
              if (!contexts || contexts.length < 3) return '';
              const vendas = contexts[1] ? contexts[1].raw : 0;
              const lucro = contexts[2] ? contexts[2].raw : 0;
              if (vendas > 0) {
                const margem = ((lucro / vendas) * 100).toFixed(1);
                return ` Margem de Lucro Real: ${margem}%`;
              }
              return '';
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
            callback: function(value) {
              return 'R$ ' + value.toLocaleString('pt-BR');
            }
          },
          beginAtZero: true
        }
      }
    }
  });
}

function updateFinancialChart() {
  if (!financialFlowChart) return;
  const dataCategory = monthlyData[currentFinancialChartCategory] || monthlyData['ALL'];
  financialFlowChart.data.datasets[0].data = [...dataCategory.custoVendas];
  financialFlowChart.data.datasets[1].data = [...dataCategory.vendas];
  financialFlowChart.data.datasets[2].data = [...dataCategory.lucroReal];
  financialFlowChart.update();
}

function selectFinancialChartCategory(cat) {
  currentFinancialChartCategory = cat;

  document.querySelectorAll('#chartFinancialCategoryPills .cat-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.financialCategory === cat);
  });

  updateFinancialChart();
}

// GRÁFICO 3: ROSCA POR CATEGORIA
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
  if (!confirm('Deseja realmente zerar todo o histórico de testes de entradas e saídas?\n\nOs gráficos voltarão a 0 e começarão a registrar as vendas, custos e lucros reais a partir de agora.')) {
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
      updateFinancialChart();
      updateKPIs();
      alert('✓ Histórico de testes zerado com sucesso!\n\nAgora cada item que você remover (-) será computado como venda no gráfico com faturamento e lucro calculados, e cada item adicionado (+) como reposição.');
    } else {
      const err = await res.json();
      alert('Erro ao resetar: ' + (err.erro || 'Falha na autenticação'));
    }
  } catch (e) {
    alert('Erro de conexão ao tentar resetar dados.');
  }
}

/* ================================================================
   6. GESTÃO DE ESTOQUE (LISTA, PREÇOS EDITÁVEIS, MARGEM & AJUSTE)
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

    const costVal = parseFloat(p.preco_custo || 0).toFixed(2);
    const priceVal = parseFloat(p.preco || 0).toFixed(2);

    const costNum = parseFloat(costVal) || 0;
    const priceNum = parseFloat(priceVal) || 0;
    const profitNum = priceNum - costNum;
    const marginPct = priceNum > 0 ? ((profitNum / priceNum) * 100) : 0;

    const marginClass = profitNum > 0 ? 'positive' : profitNum < 0 ? 'negative' : 'neutral';
    const profitFormatted = (profitNum >= 0 ? '+R$ ' : '-R$ ') + Math.abs(profitNum).toFixed(2).replace('.', ',');
    const marginPctFormatted = (profitNum >= 0 ? '+' : '') + marginPct.toFixed(1).replace('.', ',') + '% margem';

    return `
      <div class="inventory-item" id="item-${p.id}">
        <img src="${imgSrc}" class="item-img" alt="${p.nome_produto}" onerror="this.src='https://placehold.co/100x100/f1f5f9/64748b?text=Foto'">
        
        <div class="item-info">
          <div class="item-header-row">
            <h3 class="item-name">${p.nome_produto}</h3>
            <div class="item-badges">
              <span class="detail-category">${p.categoria}</span>
              <span class="detail-badge">Cor: ${p.cor || 'Padrão'}</span>
              <span class="detail-badge">Tam: ${p.tamanho || 'U'}</span>
            </div>
          </div>

          <!-- LINHA FINANCEIRA EDITÁVEL: CUSTO, VENDA E MARGEM DE LUCRO CALCULADA -->
          <div class="pricing-control-row">
            <div class="price-input-box" title="Valor que você pagou na peça (custo unitário)">
              <label class="price-label">Valor de Custo</label>
              <div class="input-currency-wrap">
                <span class="currency-symbol">R$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  class="price-input" 
                  id="cost-input-${p.id}"
                  value="${costVal}" 
                  oninput="handlePriceChange(${p.id})"
                  onkeydown="if(event.key === 'Enter') savePrices(${p.id})"
                  onblur="savePrices(${p.id})"
                  placeholder="0.00"
                >
              </div>
            </div>

            <div class="price-input-box" title="Valor que você vende ao cliente (preço de varejo)">
              <label class="price-label">Valor de Venda</label>
              <div class="input-currency-wrap">
                <span class="currency-symbol">R$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  class="price-input" 
                  id="price-input-${p.id}"
                  value="${priceVal}" 
                  oninput="handlePriceChange(${p.id})"
                  onkeydown="if(event.key === 'Enter') savePrices(${p.id})"
                  onblur="savePrices(${p.id})"
                  placeholder="0.00"
                >
              </div>
            </div>

            <div class="margin-box" title="Margem calculada automaticamente pelo sistema (Venda - Custo)">
              <label class="price-label">Margem de Lucro</label>
              <div class="margin-badge ${marginClass}" id="margin-badge-${p.id}">
                <span class="margin-profit-val">${profitFormatted}</span>
                <span class="margin-pct-tag">${marginPctFormatted}</span>
              </div>
            </div>

            <div class="price-action-box">
              <button 
                class="btn-save-prices" 
                id="btn-save-${p.id}" 
                onclick="savePrices(${p.id})"
                title="Salvar alterações de custo e venda no banco de dados"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>

        <div class="item-controls" title="Ajuste rápido de estoque físico">
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
 * Cálculo Automático da Margem de Lucro em Tempo Real enquanto o usuário digita
 */
function handlePriceChange(id) {
  const costInput = document.getElementById(`cost-input-${id}`);
  const priceInput = document.getElementById(`price-input-${id}`);
  const badge = document.getElementById(`margin-badge-${id}`);
  const saveBtn = document.getElementById(`btn-save-${id}`);
  
  if (!costInput || !priceInput || !badge) return;

  const cost = parseFloat(costInput.value) || 0;
  const price = parseFloat(priceInput.value) || 0;
  const profit = price - cost;
  const marginPct = price > 0 ? ((profit / price) * 100) : 0;

  const marginClass = profit > 0 ? 'positive' : profit < 0 ? 'negative' : 'neutral';
  badge.className = `margin-badge ${marginClass}`;

  const profitFormatted = (profit >= 0 ? '+R$ ' : '-R$ ') + Math.abs(profit).toFixed(2).replace('.', ',');
  const marginPctFormatted = (profit >= 0 ? '+' : '') + marginPct.toFixed(1).replace('.', ',') + '% margem';

  badge.innerHTML = `
    <span class="margin-profit-val">${profitFormatted}</span>
    <span class="margin-pct-tag">${marginPctFormatted}</span>
  `;

  if (saveBtn) {
    saveBtn.classList.remove('saved');
    saveBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      <span>Salvar</span>
    `;
  }
}

/**
 * Salva Preço de Custo e Preço de Venda no Banco de Dados
 */
async function savePrices(id) {
  const costInput = document.getElementById(`cost-input-${id}`);
  const priceInput = document.getElementById(`price-input-${id}`);
  const saveBtn = document.getElementById(`btn-save-${id}`);

  if (!costInput || !priceInput) return;

  const cost = parseFloat(costInput.value);
  const price = parseFloat(priceInput.value);

  if (isNaN(cost) || isNaN(price) || cost < 0 || price < 0) {
    alert('Por favor, informe valores válidos maiores ou iguais a zero.');
    return;
  }

  const prod = allProducts.find(p => p.id === id);
  if (!prod) return;

  // Evita requisição duplicada se já estiver salvo com os mesmos valores
  if (parseFloat(prod.preco_custo || 0) === cost && parseFloat(prod.preco || 0) === price && saveBtn && saveBtn.classList.contains('saved')) {
    return;
  }

  if (saveBtn) {
    saveBtn.classList.add('saving');
    saveBtn.innerHTML = `<span>Salvando...</span>`;
  }

  try {
    const res = await fetch('/api/updateEstoque', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_id: id,
        action: 'update_prices',
        preco: price,
        preco_custo: cost,
        password: sessionPassword
      })
    });

    if (res.ok) {
      prod.preco = price;
      prod.preco_custo = cost;

      if (saveBtn) {
        saveBtn.classList.remove('saving');
        saveBtn.classList.add('saved');
        saveBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Salvo!</span>
        `;
        setTimeout(() => {
          if (saveBtn && saveBtn.classList.contains('saved')) {
            saveBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span>Salvar</span>
            `;
          }
        }, 2200);
      }

      // Atualiza KPIs e gráficos financeiros em tempo real
      updateKPIs();
      updateFinancialChart();
    } else {
      const err = await res.json();
      alert('Erro ao salvar valores: ' + (err.erro || 'Falha na autenticação'));
      if (saveBtn) {
        saveBtn.classList.remove('saving');
        saveBtn.innerHTML = `<span>Salvar</span>`;
      }
    }
  } catch (e) {
    console.error('Erro de conexão ao salvar preços:', e);
    alert('Erro de conexão com o banco de dados.');
    if (saveBtn) {
      saveBtn.classList.remove('saving');
      saveBtn.innerHTML = `<span>Salvar</span>`;
    }
  }
}

/**
 * Atualização em Tempo Real de Estoque Físico:
 * - Ação (-) -> Registra Venda (Saída) com cálculo de receita e lucro real no gráfico do mês e banco Neon
 * - Ação (+) -> Registra Reposição (Entrada) com cálculo de custo no gráfico do mês e banco Neon
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

  const price = prod ? (parseFloat(prod.preco) || 0) : 0;
  const cost = prod ? (parseFloat(prod.preco_custo) || 0) : 0;
  const profit = price - cost;

  if (prod) {
    prod.quantidade = newQty;
    
    // Atualiza histórico em memória imediatamente (Físico + Financeiro)
    if (action === 'decrement') {
      // Venda / Saída
      monthlyData['ALL'].saidas[curMonth] += 1;
      monthlyData['ALL'].vendas[curMonth] += price;
      monthlyData['ALL'].custoVendas[curMonth] += cost;
      monthlyData['ALL'].lucroReal[curMonth] += profit;

      if (monthlyData[prod.categoria]) {
        monthlyData[prod.categoria].saidas[curMonth] += 1;
        monthlyData[prod.categoria].vendas[curMonth] += price;
        monthlyData[prod.categoria].custoVendas[curMonth] += cost;
        monthlyData[prod.categoria].lucroReal[curMonth] += profit;
      }
    } else if (action === 'increment') {
      // Reposição / Entrada
      monthlyData['ALL'].entradas[curMonth] += 1;
      monthlyData['ALL'].custoEntradas[curMonth] += cost;

      if (monthlyData[prod.categoria]) {
        monthlyData[prod.categoria].entradas[curMonth] += 1;
        monthlyData[prod.categoria].custoEntradas[curMonth] += cost;
      }
    }

    // Atualiza imediatamente ambos os gráficos, KPIs e a Rosca
    updateKPIs();
    updateMonthlyChart();
    updateFinancialChart();
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
      
      // Reverte memória
      if (action === 'decrement') {
        monthlyData['ALL'].saidas[curMonth] = Math.max(0, monthlyData['ALL'].saidas[curMonth] - 1);
        monthlyData['ALL'].vendas[curMonth] = Math.max(0, monthlyData['ALL'].vendas[curMonth] - price);
        monthlyData['ALL'].custoVendas[curMonth] = Math.max(0, monthlyData['ALL'].custoVendas[curMonth] - cost);
        monthlyData['ALL'].lucroReal[curMonth] = monthlyData['ALL'].vendas[curMonth] - monthlyData['ALL'].custoVendas[curMonth];

        if (prod && monthlyData[prod.categoria]) {
          monthlyData[prod.categoria].saidas[curMonth] = Math.max(0, monthlyData[prod.categoria].saidas[curMonth] - 1);
          monthlyData[prod.categoria].vendas[curMonth] = Math.max(0, monthlyData[prod.categoria].vendas[curMonth] - price);
          monthlyData[prod.categoria].custoVendas[curMonth] = Math.max(0, monthlyData[prod.categoria].custoVendas[curMonth] - cost);
          monthlyData[prod.categoria].lucroReal[curMonth] = monthlyData[prod.categoria].vendas[curMonth] - monthlyData[prod.categoria].custoVendas[curMonth];
        }
      } else if (action === 'increment') {
        monthlyData['ALL'].entradas[curMonth] = Math.max(0, monthlyData['ALL'].entradas[curMonth] - 1);
        monthlyData['ALL'].custoEntradas[curMonth] = Math.max(0, monthlyData['ALL'].custoEntradas[curMonth] - cost);

        if (prod && monthlyData[prod.categoria]) {
          monthlyData[prod.categoria].entradas[curMonth] = Math.max(0, monthlyData[prod.categoria].entradas[curMonth] - 1);
          monthlyData[prod.categoria].custoEntradas[curMonth] = Math.max(0, monthlyData[prod.categoria].custoEntradas[curMonth] - cost);
        }
      }

      updateKPIs();
      updateMonthlyChart();
      updateFinancialChart();

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
      monthlyData['ALL'].vendas[curMonth] = Math.max(0, monthlyData['ALL'].vendas[curMonth] - price);
      monthlyData['ALL'].custoVendas[curMonth] = Math.max(0, monthlyData['ALL'].custoVendas[curMonth] - cost);
      monthlyData['ALL'].lucroReal[curMonth] = monthlyData['ALL'].vendas[curMonth] - monthlyData['ALL'].custoVendas[curMonth];

      if (prod && monthlyData[prod.categoria]) {
        monthlyData[prod.categoria].saidas[curMonth] = Math.max(0, monthlyData[prod.categoria].saidas[curMonth] - 1);
        monthlyData[prod.categoria].vendas[curMonth] = Math.max(0, monthlyData[prod.categoria].vendas[curMonth] - price);
        monthlyData[prod.categoria].custoVendas[curMonth] = Math.max(0, monthlyData[prod.categoria].custoVendas[curMonth] - cost);
        monthlyData[prod.categoria].lucroReal[curMonth] = monthlyData[prod.categoria].vendas[curMonth] - monthlyData[prod.categoria].custoVendas[curMonth];
      }
    } else if (action === 'increment') {
      monthlyData['ALL'].entradas[curMonth] = Math.max(0, monthlyData['ALL'].entradas[curMonth] - 1);
      monthlyData['ALL'].custoEntradas[curMonth] = Math.max(0, monthlyData['ALL'].custoEntradas[curMonth] - cost);

      if (prod && monthlyData[prod.categoria]) {
        monthlyData[prod.categoria].entradas[curMonth] = Math.max(0, monthlyData[prod.categoria].entradas[curMonth] - 1);
        monthlyData[prod.categoria].custoEntradas[curMonth] = Math.max(0, monthlyData[prod.categoria].custoEntradas[curMonth] - cost);
      }
    }

    updateKPIs();
    updateMonthlyChart();
    updateFinancialChart();
    alert('Erro de conexão com o banco de dados.');
  }
}
