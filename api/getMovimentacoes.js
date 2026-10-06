const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);

    // Garante que a tabela exista antes de consultar
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

    // Garante que as colunas de valores existam
    await sql`ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS preco_venda NUMERIC(10,2) DEFAULT 0.00`;
    await sql`ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS preco_custo NUMERIC(10,2) DEFAULT 0.00`;

    // Busca movimentações agrupadas por mês (1 a 12), tipo (entrada/saida) e categoria com valores financeiros
    const movimentacoes = await sql`
      SELECT 
        EXTRACT(MONTH FROM m.data)::int AS mes,
        m.tipo,
        m.categoria,
        SUM(m.quantidade)::int AS total,
        SUM(m.quantidade * COALESCE(NULLIF(m.preco_venda, 0), p.preco, 0))::numeric AS valor_venda_total,
        SUM(m.quantidade * COALESCE(NULLIF(m.preco_custo, 0), p.preco_custo, 0))::numeric AS valor_custo_total
      FROM movimentacoes_estoque m
      LEFT JOIN estoque_fitness p ON m.produto_id = p.id
      WHERE EXTRACT(YEAR FROM m.data) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
      GROUP BY mes, m.tipo, m.categoria
      ORDER BY mes ASC
    `;

    res.status(200).json(movimentacoes);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ erro: 'Não foi possível carregar as movimentações do banco' });
  }
};
