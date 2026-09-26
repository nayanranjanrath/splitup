const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/home/user/.local/share/choreographer/deps/chrome-linux64/chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.evaluate(() => document.documentElement.setAttribute("data-mode", "light"));
  await new Promise((r) => setTimeout(r, 5000));
  await page.screenshot({ path: "light-hero.png" });
  await browser.close();
  console.log("shot ok");
})().catch((e) => console.error("FATAL", e.message));
