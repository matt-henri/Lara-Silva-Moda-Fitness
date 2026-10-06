const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  // Apenas aceita requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { produto_id, action, password, categoria: customCategoria } = req.body;

  // Verifica a senha administrativa
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ erro: 'Senha incorreta!' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Garante que a tabela de histórico exista
    await sql`
      CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
        id SERIAL PRIMARY KEY,
        produto_id INT,
        tipo VARCHAR(20) NOT NULL,
        quantidade INT DEFAULT 1,
        categoria VARCHAR(50),
        preco_venda NUMERIC(10,2) DEFAULT 0.00,
        preco_custo NUMERIC(10,2) DEFAULT 0.00,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Garante colunas de custo e venda
    await sql`ALTER TABLE estoque_fitness ADD COLUMN IF NOT EXISTS preco_custo NUMERIC(10,2) DEFAULT 0.00`;
    await sql`ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS preco_venda NUMERIC(10,2) DEFAULT 0.00`;
    await sql`ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS preco_custo NUMERIC(10,2) DEFAULT 0.00`;

    // Ação para resetar todo o histórico de testes
    if (action === 'reset_history') {
      await sql`DELETE FROM movimentacoes_estoque`;
      return res.status(200).json({ sucesso: true, mensagem: 'Histórico de movimentações resetado com sucesso!' });
    }

    if (!produto_id) {
      return res.status(400).json({ erro: 'ID do produto é obrigatório' });
    }

    // AÇÃO: Atualizar Preço de Venda e Preço de Custo
    if (action === 'update_prices') {
      const precoVenda = parseFloat(req.body.preco);
      const precoCusto = parseFloat(req.body.preco_custo);

      if (isNaN(precoVenda) || isNaN(precoCusto)) {
        return res.status(400).json({ erro: 'Valores inválidos para preço de venda ou custo.' });
      }

      await sql`
        UPDATE estoque_fitness 
        SET preco = ${precoVenda}, preco_custo = ${precoCusto} 
        WHERE id = ${produto_id}
      `;

      return res.status(200).json({
        sucesso: true,
        produto_id,
        preco: precoVenda,
        preco_custo: precoCusto
      });
    }

    // Busca dados atuais do produto para registrar a categoria e valores
    const prodRows = await sql`SELECT nome_produto, quantidade, preco, preco_custo FROM estoque_fitness WHERE id = ${produto_id}`;
    if (prodRows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    const precoVendaItem = parseFloat(prodRows[0].preco) || 0;
    const precoCustoItem = parseFloat(prodRows[0].preco_custo) || 0;

    let categoria = customCategoria || 'TOP';
    const nome = prodRows[0].nome_produto ? prodRows[0].nome_produto.toLowerCase() : '';
    if (nome.includes('macaquinho') || nome.includes('macacão') || nome.includes('macacao')) {
      categoria = 'MACACÃO E MACAQUINHO';
    } else if (nome.includes('conjunto') && (nome.includes('calça') || nome.includes('calca') || nome.includes('legging'))) {
      categoria = 'CONJUNTOS CALÇA';
    } else if (nome.includes('conjunto') && nome.includes('short')) {
      categoria = 'CONJUNTOS SHORT';
    } else if (nome.includes('short') || nome.includes('biker') || nome.includes('bermuda')) {
      categoria = 'SHORT';
    } else if (nome.includes('calça') || nome.includes('calca') || nome.includes('legging')) {
      categoria = 'CALÇAS';
    } else if (nome.includes('top') || nome.includes('cropt') || nome.includes('sutiã')) {
      categoria = 'TOP';
    }

    // INCREMENTO (+) -> Registra como Entrada / Reposição
    if (action === 'increment') {
      await sql`UPDATE estoque_fitness SET quantidade = quantidade + 1 WHERE id = ${produto_id}`;
      await sql`
        INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, categoria, preco_venda, preco_custo) 
        VALUES (${produto_id}, 'entrada', 1, ${categoria}, ${precoVendaItem}, ${precoCustoItem})
      `;
      return res.status(200).json({ sucesso: true, tipo: 'entrada', categoria });
    } 
    // DECREMENTO (-) -> Registra como Saída / Venda
    else if (action === 'decrement') {
      const currentQty = prodRows[0].quantidade || 0;
      if (currentQty <= 0) {
        return res.status(400).json({ erro: 'O estoque deste produto já está zerado.' });
      }
      await sql`UPDATE estoque_fitness SET quantidade = GREATEST(quantidade - 1, 0) WHERE id = ${produto_id}`;
      await sql`
        INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, categoria, preco_venda, preco_custo) 
        VALUES (${produto_id}, 'saida', 1, ${categoria}, ${precoVendaItem}, ${precoCustoItem})
      `;
      return res.status(200).json({ sucesso: true, tipo: 'saida', categoria });
    } else {
      return res.status(400).json({ erro: 'Ação inválida' });
    }

  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ erro: 'Erro no servidor ao processar estoque' });
  }
};
