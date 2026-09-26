const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/home/user/.local/share/choreographer/deps/chrome-linux64/chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const routes = ["/", "/home", "/search", "/login", "/register", "/create", "/discuss", "/groups", "/profile/x", "/platform/x"];
  for (const r of routes) {
    const page = await browser.newPage();
    const errors = [];
    const restricted = true; // block ALL external hosts, like a locked-down network
    if (restricted) {
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const u = req.url();
        if (u.startsWith("http://localhost") || u.startsWith("data:")) req.continue();
        else req.abort();
      });
    }
    page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
    page.on("console", (m) => {
      const t = m.text();
      if (m.type() === "error" && !/localhost:3000|Failed to load resource|ERR_|net::/.test(t))
        errors.push("CONSOLE: " + t);
    });
    try {
      await page.goto("http://localhost:5173" + r, { waitUntil: "domcontentloaded", timeout: 20000 });
    } catch (e) {
      errors.push("NAV: " + e.message);
    }
    await new Promise((res) => setTimeout(res, 1800));
    const text = await page.evaluate(() => (document.body ? document.body.innerText.slice(0, 70).replace(/\n/g, " | ") : "(no body)"));
    console.log("ROUTE", r.padEnd(12), "=>", JSON.stringify(text));
    errors.slice(0, 4).forEach((e) => console.log("      ", e));
    await page.close();
  }
  await browser.close();
})().catch((e) => {
  console.error("FATAL", e.message);
  process.exit(1);
});
