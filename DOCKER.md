# 🐳 Polaris in Docker

Il sito è statico (`index.html`) e viene servito da **nginx** dentro un container.

## Avvio rapido (con docker compose)

```bash
cd doposcuola-arcobaleno
docker compose up -d --build
```

Apri poi: **http://localhost:8080**

Per fermarlo:
```bash
docker compose down
```

## Senza compose (solo docker)

```bash
# build dell'immagine
docker build -t polaris-doposcuola .

# avvio del container sulla porta 8080
docker run -d --name polaris-doposcuola -p 8080:80 polaris-doposcuola

# log / stop / rimozione
docker logs -f polaris-doposcuola
docker stop polaris-doposcuola && docker rm polaris-doposcuola
```

## Aggiornare il sito

Dopo aver modificato `index.html`:
```bash
docker compose up -d --build   # ricostruisce e riavvia
```

## Note
- La porta esterna è **8080** (modificabile in `docker-compose.yml`, campo `ports`).
- Le immagini dell'hero/gallery sono ospitate su Unsplash (rete esterna): servono per vederle.
- Il backend prenotazioni gira su **Google Apps Script** (non nel container): il form lo chiama via HTTPS, quindi funziona anche dal sito containerizzato.
- File esclusi dall'immagine: vedi `.dockerignore` (cartella `apps-script/`, i `.md`, ecc.).
