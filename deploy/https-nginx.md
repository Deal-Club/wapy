# HTTPS sur `wapy.51.210.108.173.sslip.io` (serveur Plesk)

Le VPS tourne sous **Plesk** : nginx (Plesk) détient les ports 80/443 et sert les
sites en prod. On **ne touche pas** aux configs Plesk. On ajoute un bloc nginx
**isolé par `server_name`** (fichier dédié dans `conf.d`), validé par `nginx -t`
avant tout reload (rollback auto sinon), et un certificat Let's Encrypt via acme.sh.

La stack Docker (postgres/waha/api/web/caddy) tourne dans `/home/ubuntu/wapy-platform/deploy`,
Caddy exposé sur **127.0.0.1:8080** uniquement. nginx proxy le domaine vers ce port.

## 1. Bloc nginx `/etc/nginx/conf.d/wapy-proxy.conf`

Important : écouter sur l'**IP spécifique** (Plesk bind nginx sur `51.210.108.173`),
sinon le bloc est masqué par le serveur par défaut de Plesk.

```nginx
server {
    listen 51.210.108.173:80;
    server_name wapy.51.210.108.173.sslip.io;
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/wapy-acme;
        default_type "text/plain";
        allow all;
    }
    location / { return 301 https://$host$request_uri; }
}
server {
    listen 51.210.108.173:443 ssl;
    server_name wapy.51.210.108.173.sslip.io;
    ssl_certificate     /etc/nginx/wapy/wapy.crt;
    ssl_certificate_key /etc/nginx/wapy/wapy.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`sudo nginx -t && sudo systemctl reload nginx`

## 2. Certificat Let's Encrypt (acme.sh, mode webroot)

```bash
curl https://get.acme.sh | sh -s email=login@lannkin.com
/root/.acme.sh/acme.sh --server letsencrypt \
  --issue -d wapy.51.210.108.173.sslip.io -w /var/www/wapy-acme
/root/.acme.sh/acme.sh --install-cert -d wapy.51.210.108.173.sslip.io \
  --key-file /etc/nginx/wapy/wapy.key \
  --fullchain-file /etc/nginx/wapy/wapy.crt \
  --reloadcmd "systemctl reload nginx"
```

Renouvellement automatique : cron acme.sh (`--cron`, 4×/jour) recharge nginx.

## 3. Sécurité

Le port 8080 n'est **pas** exposé publiquement (Caddy bind `127.0.0.1:8080`), donc
l'app n'est accessible qu'en HTTPS via le domaine. Les scripts de mise en place
(`wapy_https_1.sh`, `wapy_https_2.sh`) valident `nginx -t` et rollback en cas d'erreur.
