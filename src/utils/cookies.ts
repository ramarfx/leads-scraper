import fs from "fs/promises";
import { Protocol } from "puppeteer";
import type { SimpleCookie } from "../types/cookies";

const COOKIE_PATH = "cookies.json";

export async function saveCookies(rawCookies: any[]) {
  const cookies: SimpleCookie[] = rawCookies.map(c => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expires: c.expires,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite
  }));

  await fs.writeFile("cookies.json", JSON.stringify(cookies, null, 2));
}

export async function loadCookies(): Promise<SimpleCookie[]> {
  try {
    const data = await fs.readFile(COOKIE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}