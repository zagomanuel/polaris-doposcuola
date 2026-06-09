# Polaris Doposcuola - sito statico servito da nginx
FROM nginx:1.27-alpine

# Config nginx (gzip + cache asset)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sito statico
COPY index.html /usr/share/nginx/html/
# Se in futuro aggiungi una cartella di immagini locali, scommenta:
# COPY images/ /usr/share/nginx/html/images/

EXPOSE 80

# Healthcheck semplice
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
