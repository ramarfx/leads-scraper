import puppeteer, { Browser, Page } from "puppeteer";
import type { Task } from "../types/task";
import { loadCookies, saveCookies } from "../utils/cookies";

const MOODLE_URL = process.env.MOODLE_URL!;
const USERNAME = process.env.MOODLE_USERNAME!;
const PASSWORD = process.env.MOODLE_PASSWORD!;

/**
 * Menginisialisasi dan mengembalikan instance browser Puppeteer.
 */
async function initBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: false, // Set ke true untuk mode production
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

/**
 * Menangani alur login manual melalui form Moodle.
 */
async function performLogin(page: Page): Promise<void> {
  console.log("Memulai proses login...");

  await page.goto(`${MOODLE_URL}/login/index.php`, {
    waitUntil: "networkidle2",
  });

  await page.waitForSelector("#username");
  await page.type("#username", USERNAME);
  await page.type("#password", PASSWORD);

  await Promise.all([
    page.click("#loginbtn"),
    page.waitForNavigation({ waitUntil: "networkidle2" }),
  ]);

  console.log("Login berhasil.");
}

/**
 * Memeriksa sesi aktif melalui cookies, dan melakukan login ulang jika sesi kadaluarsa.
 */
async function ensureAuthenticatedSession(
  browser: Browser,
  page: Page,
): Promise<void> {
  const cookies = await loadCookies();

  if (cookies.length > 0) {
    console.log("Memuat cookies...");
    await browser.setCookie(...cookies);
  }

  await page.goto(`${MOODLE_URL}/my/`, {
    waitUntil: "networkidle2",
  });

  const isLoggedIn = (await page.$("#loginbtn")) === null;

  if (!isLoggedIn) {
    console.log("Sesi tidak ditemukan atau telah kadaluarsa.");
    await performLogin(page);

    console.log("Menyimpan cookies baru...");
    const newCookies = await browser.cookies();
    await saveCookies(newCookies);
  } else {
    console.log("Berhasil login menggunakan cookies.");
  }
}

/**
 * Mengekstrak daftar tugas khusus untuk Kelas C dari halaman dasbor.
 */
async function extractTasksForKelasC(page: Page): Promise<Task[]> {
  await page.waitForSelector(".block_calendar_upcoming", { timeout: 10000 });

  // Jeda tambahan untuk memastikan proses render klien selesai
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("Mengekstrak data tugas Kelas C...");

  const tasks = await page.evaluate(() => {
    const results: { title: string; deadline: string | null }[] = [];
    const items = document.querySelectorAll(
      '.block_calendar_upcoming .event[data-region="event-item"]',
    );

    items.forEach((el) => {
      const titleEl = el.querySelector('a[data-type="event"]');
      const title = titleEl ? (titleEl as HTMLElement).innerText.trim() : "";

      if (title.toLowerCase().includes("kelas c")) {
        let deadline: string | null = null;
        const dateEl = el.querySelector(".date");

        if (dateEl) {
          deadline = (dateEl as HTMLElement).innerText.trim();
        }

        results.push({ title, deadline });
      }
    });

    return results;
  });

  return tasks;
}

/**
 * Fungsi orkestrator scraping Moodle.
 */
export async function scrapeMoodleTasks(): Promise<Task[]> {
  const browser = await initBrowser();
  const page = await browser.newPage();

  try {
    await ensureAuthenticatedSession(browser, page);

    const tasks = await extractTasksForKelasC(page);
    console.log(
      `Proses selesai. Ditemukan ${tasks.length} tugas untuk Kelas C.`,
    );

    return tasks;
  } catch (error) {
    console.error("Terjadi kesalahan saat melakukan scraping:", error);
    return [];
  } finally {
    await browser.close();
  }
}
