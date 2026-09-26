const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/home/user/.local/share/choreographer/deps/chrome-linux64/chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => errs.push("PAGEERROR " + e.message.slice(0, 160)));
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-mode", "light");
    try { localStorage.setItem("splitup-mode", "light"); } catch {}
  });
  await new Promise((r) => setTimeout(r, 6000));
  const info = await page.evaluate(() => {
    const v = document.querySelector(".plate-video-light");
    const dv = document.querySelector(".plate-video");
    const stage = document.querySelector(".hero-stage");
    const cs = v ? getComputedStyle(v) : null;
    return {
      lightVideoExists: !!v,
      display: cs?.display,
      opacity: cs?.opacity,
      readyState: v?.readyState,
      videoError: v?.error ? v.error.code : null,
      currentSrc: v?.currentSrc?.slice(0, 80),
      rect: v ? v.getBoundingClientRect().width + "x" + v.getBoundingClientRect().height : null,
      darkVideoOpacity: dv ? getComputedStyle(dv).opacity : null,
      stageRect: stage ? stage.getBoundingClientRect().width + "x" + stage.getBoundingClientRect().height : null,
      dataMode: document.documentElement.getAttribute("data-mode"),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  console.log("ERRORS:", errs.slice(0, 6));
  await browser.close();
})().catch((e) => console.error("FATAL", e.message));
