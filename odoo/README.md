# Odoo 15 — Lab 13

A dockerized Odoo 15 stack for the Enterprise Computing lab.

## Prerequisites

- Docker and Docker Compose installed
- Run all commands from this directory (the one containing `docker-compose.yml`)

## Start the stack

First time (or after changing `Dockerfile` / `requirements.txt`):

```bash
docker compose up -d --build
```

Subsequent runs:

```bash
docker compose up -d
```

The first build takes several minutes (it compiles Python dependencies). Be patient.

## Access Odoo

Open your browser at: **http://localhost:8015**

Default credentials when creating the database:

- Master password (admin): `123456` (defined in `config/odoo.conf`)
- Database user / password: `odoo` / `odoo` (from `.env`)

On first launch, Odoo will show the database creation form. Pick a database name, set the admin email/password, and click **Create database**.

## Stop / restart

```bash
# stop everything
docker compose down

# restart only Odoo (keeps the database running)
docker compose restart odoo

# restart everything
docker compose restart
```

`docker compose down` keeps your data — the database and Odoo filestore live in named docker volumes (`odoo15-db-data`, `odoo15-web-data`). To wipe them and start fresh:

```bash
docker compose down -v
```

## See the logs

Live tail the Odoo container logs:

```bash
docker compose logs -f odoo
```

Same for the database:

```bash
docker compose logs -f db
```

The Odoo log file is also written to the host at `./logs/odoo.log`:

```bash
tail -f logs/odoo.log
```

## Add a custom addon module

1. Drop your module folder inside `./addons/`. The folder must contain a valid `__manifest__.py`. Layout example:

   ```
   addons/
     my_module/
       __init__.py
       __manifest__.py
       models/
       views/
       ...
   ```

2. Restart Odoo so it picks up the new module:

   ```bash
   docker compose restart odoo
   ```

3. In the Odoo web UI:
   - Enable developer mode: **Settings → Developer Tools → Activate the developer mode**
   - Go to **Apps**, click **Update Apps List**, then search for your module and click **Install**

### Updating an installed module

After editing your module code:

```bash
docker compose restart odoo
```

Then in **Apps**, find your module and click **Upgrade**. For Python-only changes, a restart alone is enough; for view/data changes you must upgrade.

## Project layout

```
.
├── docker-compose.yml   # services: odoo + db
├── Dockerfile           # custom Odoo image with extra Python deps
├── requirements.txt     # extra Python packages installed in the image
├── .env                 # DB credentials, addons path
├── config/
│   └── odoo.conf        # Odoo server configuration
├── addons/              # your custom modules go here
└── logs/                # Odoo log files (bind-mounted from container)
```

## Troubleshooting

- **Port 8015 already in use** — change the host port in `docker-compose.yml` (`"0.0.0.0:8015:8069"` → e.g. `"0.0.0.0:8016:8069"`) and `docker compose up -d`.
- **Module doesn't appear in Apps** — make sure you clicked **Update Apps List** in developer mode, and that the folder contains `__manifest__.py`.
- **Permission errors on `./logs` or `./addons`** — the Odoo container runs as the `odoo` user (uid 101). If you hit write errors, run `sudo chown -R 101:101 logs addons` from this directory.
- **Need a clean slate** — `docker compose down -v` removes volumes (deletes all databases and filestore).
