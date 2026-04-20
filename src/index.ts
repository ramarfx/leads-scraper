import { scrapeMoodleTasks } from "./scraper/scraper";

(async () => {
  const tasks = await scrapeMoodleTasks();

  console.log("\n📋 HASIL SCRAPING:\n");
  console.dir(tasks, { depth: null });
})();