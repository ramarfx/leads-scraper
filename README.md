# Moodle Task Scraper (LeADS UPNVJ)

otomatisasi menggunakan Puppeteer untuk mengambil data tugas (assignment) dari dashboard Moodle. Dapat digunakan untuk AI Agent taks managenet automation

## Prasyarat
* [Bun](https://bun.sh/) (Runtime JavaScript & Package Manager)
* Google Chrome atau Chromium (untuk menjalankan Puppeteer)
* Akses ke akun LeADS UPNVJ / Moodle kampus  `nama-kampus.ac.id`

## Instalasi

```bash
bun install
```

## Konfigurasi
Buat file `.env` dengan value sebagai berikut:

```env
MOODLE_URL=https://leads.upnvj.ac.id
MOODLE_USERNAME=
MOODLE_PASSWORD=
```

## Cara Menjalankan

Untuk menjalankan script:

```bash
bun run src/index.ts
```

### Mode Production
Untuk menjalankan script dalam mode production, disarankan mengganti `headles: true` dengan `headles: false` pada file scraper/scraper.ts

```ts
async function initBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: true, 
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  });
}
```
