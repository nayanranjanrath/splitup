const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/home/user/.local/share/choreographer/deps/chrome-linux64/chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const routes = ["/", "/home", "/search", "/login", "/register", "/create", "/discuss", "/groups", "/profile/x", "/platform/x", "/chat/x", "/groupchat/x", "/google-callback", "/saved", "/applied", "/my-requests"];
  for (const r of routes) {
    const page = await browser.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message.slice(0, 200)));
    page.on("console", (m) => {
      const t = m.text();
      if (m.type() === "error" && !/localhost:3000|ERR_CONNECTION|Failed to load resource/.test(t))
        errs.push("CONSOLE: " + t.slice(0, 200));
    });
    try {
      await page.goto("http://localhost:5173" + r, { waitUntil: "domcontentloaded", timeout: 15000 });
    } catch (e) {
      errs.push("NAV: " + e.message.slice(0, 120));
    }
    await new Promise((res) => setTimeout(res, 1500));
    const len = await page.evaluate(() => (document.body ? document.body.innerText.length : 0));
    console.log(r.padEnd(16), "textLen:", len, errs.length ? "ERR => " + errs[0] : "ok");
    await page.close();
  }
  await browser.close();
})().catch((e) => console.error("FATAL", e.message));
