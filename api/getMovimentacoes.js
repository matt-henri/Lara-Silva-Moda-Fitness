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
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Busca movimentações agrupadas por mês (1 a 12), tipo (entrada/saida) e categoria
    const movimentacoes = await sql`
      SELECT 
        EXTRACT(MONTH FROM data)::int AS mes,
        tipo,
        categoria,
        SUM(quantidade)::int AS total
      FROM movimentacoes_estoque
      WHERE EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
      GROUP BY mes, tipo, categoria
      ORDER BY mes ASC
    `;

    res.status(200).json(movimentacoes);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ erro: 'Não foi possível carregar as movimentações do banco' });
  }
};
