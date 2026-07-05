# GDE

## Django com Docker

Este projeto contém uma aplicação Django simples configurada para rodar em Docker.

### Como usar

1. Instale o Docker e o Docker Compose.
2. No terminal, execute:
   ```bash
   docker compose up --build
   ```
3. Acesse http://localhost:8000

### Estrutura

- `Dockerfile` - imagem Python + Django
- `docker-compose.yml` - serviço web no Docker
- `requirements.txt` - dependências do Django
- `manage.py` - script de gerenciamento Django
- `mysite/` - código do projeto Django

### Comandos úteis

```bash
# criar banco de dados e aplicar migrações
docker compose run --rm web python manage.py migrate

# criar superusuário
docker compose run --rm web python manage.py createsuperuser
```

### PostgreSQL

O projeto agora usa PostgreSQL via Docker Compose. As credenciais padrão são:

- banco: `mydatabase`
- usuário: `myuser`
- senha: `mypassword`
- host: `db`
- porta: `5432`

Se quiser alterar essas variáveis, edite `docker-compose.yml`.

