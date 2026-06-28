# Copie para .env e preencha com seus valores reais
cp .env.example .env

# Gere secrets fortes para o JWT
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
echo "COFRE_JWT_SECRET=$(openssl rand -hex 32)" >> .env

# (Opcional) Cole seu TELEGRAM_BOT_TOKEN do @BotFather
# echo "TELEGRAM_BOT_TOKEN=seu_token_aqui" >> .env

# Suba os containers
docker compose up -d --build

# Acompanhe os logs
docker compose logs -f api

# Quando precisar rodar migrations
docker compose exec api node dist/scripts/migrate.js

# Para parar tudo
docker compose down

# Para parar E remover volumes (apaga o banco)
docker compose down -v
