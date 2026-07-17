# GDE

## Django com Docker

Este projeto contém uma aplicação Django simples configurada para rodar em Docker.

### Como usar

1. Instale o Docker e o Docker Compose.
2. No terminal, execute:
   ```bash
   docker compose up --build
   ```
3. Acesse http://localhost:8080/audio/

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
- host dentro do Docker: `db`
- porta dentro do Docker: `5432`
- host no computador local: `localhost`
- porta no computador local: `5433`

Se quiser alterar essas variáveis, edite `docker-compose.yml`.

### Usar PostgreSQL 18 local do Windows

Para usar o banco `sabe_local1` do PostgreSQL instalado no Windows, defina a senha do usuário `postgres` e suba o app com o override:

```powershell
$env:POSTGRES_PASSWORD="sua-senha-do-postgres"
docker compose -f docker-compose.yml -f docker-compose.local-postgres.yml up -d --build web https
```

Nessa configuração, o app usa:

- banco: `sabe_local1`
- usuário: `postgres`
- host visto pelo container: `host.docker.internal`
- porta: `5432`

Para gerar backup desse banco pelo Windows:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -Fc sabe_local1 -f backupled.dump
```

Depois de apontar para um banco novo, aplique as migrações:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local-postgres.yml run --rm web python manage.py migrate
```

## Deploy no Easypanel

Use o `Dockerfile` ou o arquivo `docker-compose.easypanel.yml`.

Configure as variáveis de ambiente:

```env
SECRET_KEY=gere-uma-chave-segura
DEBUG=False
ALLOWED_HOSTS=audio.seudominio.com
CSRF_TRUSTED_ORIGINS=https://audio.seudominio.com
DATABASE_URL=postgres://usuario:senha@host-do-postgres:5432/nome-do-banco
```

Se preferir configurar o banco em variáveis separadas, use:

```env
POSTGRES_DB=mydatabase
POSTGRES_USER=myuser
POSTGRES_PASSWORD=senha-segura
POSTGRES_HOST=host-do-postgres
POSTGRES_PORT=5432
```

No deploy pela aba GitHub/Dockerfile do Easypanel, `POSTGRES_HOST=db` só funciona se existir um serviço chamado `db` na mesma stack. Se o PostgreSQL foi criado como serviço separado no Easypanel, use o host interno informado por esse serviço ou a variável `DATABASE_URL`.

O app escuta na porta `8080`. O HTTPS deve ser feito pelo proxy/domínio do Easypanel.

### Leitura de partitura em PDF

O container instala o Audiveris 5.10.2 para converter partituras impressas em PDF para MusicXML. Na tela **Praticar > Leitura musical**, envie um arquivo PDF, MusicXML, XML ou MXL. O sistema usa a primeira linha melódica reconhecida, preserva notas, acidentes, durações, compasso e BPM e permite ouvir ou carregar o resultado na prática guiada.

O reconhecimento de PDF pode levar alguns minutos. Use preferencialmente partituras impressas, nítidas e com uma linha melódica em clave de sol. Partituras manuscritas e arranjos com várias vozes podem precisar de correção em um editor MusicXML.

O primeiro build fica maior e mais demorado por causa do motor OMR. A VPS deve ter memória suficiente; a configuração atual limita o Java a aproximadamente 2,5 GB.

