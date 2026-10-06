const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  try {
    // Conecta ao banco de dados usando a chave secreta do .env
    const sql = neon(process.env.DATABASE_URL);
    
    // Garante coluna preco_custo
    await sql`ALTER TABLE estoque_fitness ADD COLUMN IF NOT EXISTS preco_custo NUMERIC(10,2) DEFAULT 0.00`;

    // Busca todos os produtos da nossa tabela
    const produtos = await sql`SELECT * FROM estoque_fitness ORDER BY id ASC`;
    
    // Retorna os dados como JSON para o seu JavaScript do front-end ler
    res.status(200).json(produtos);
  } catch (error) {
    console.error('Erro no banco de dados:', error);
    res.status(500).json({ erro: 'Não foi possível carregar o estoque' });
  }
};
