import puppeteer, { Browser, Page } from "puppeteer";
import type { Task } from "../types/task";

const MOODLE_URL = process.env.MOODLE_URL!;
const USERNAME = process.env.MOODLE_USERNAME!;
const PASSWORD = process.env.MOODLE_PASSWORD!;

export async function scrapeMoodleTasks(): Promise<Task[]> {
  const browser: Browser = await puppeteer.launch({
    headless: false, // ubah ke true kalau sudah stabil
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page: Page = await browser.newPage();

  try {
    console.log("🔐 Login ke Moodle...");

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

    console.log("Login berhasil");

    // 👉 ke dashboard
    await page.goto(`${MOODLE_URL}/my/`, {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector('.block_calendar_upcoming', { timeout: 10000 });
    
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Mengambil data tugas untuk Kelas C...");

    const tasks = await page.evaluate(() => {
      const results: { title: string; deadline: string | null }[] = [];

      const items = document.querySelectorAll('.block_calendar_upcoming .event[data-region="event-item"]');

      items.forEach((el) => {
        const titleEl = el.querySelector('a[data-type="event"]');
        const title = titleEl ? (titleEl as HTMLElement).innerText.trim() : "";

        if (title.toLowerCase().includes("kelas c")) {
          // Ambil deadline
          let deadline: string | null = null;
          const dateEl = el.querySelector(".date");

          if (dateEl) {
            deadline = (dateEl as HTMLElement).innerText.trim();
          }

          results.push({
            title,
            deadline,
          });
        }
      });

      return results;
    });

    console.log(`✅ Dapat ${tasks.length} item untuk Kelas C`);
    console.log(tasks);

    return tasks;
  } catch (error) {
    console.error("❌ Error scraping:", error);
    return [];
  } finally {
    await browser.close();
  }
}