import { useEffect, useRef, useState } from "react";

/**
 * Seamless "boomerang" loop (forward → backward) of the light-mode hero video.
 *
 * Quality-first pipeline:
 *  - capture: high-res frames (up to 1600px wide) stored as JPEG blobs
 *    (tens of MB instead of hundreds)
 *  - playback: canvas is sized to the element's real pixel size (×dpr) and each
 *    frame is drawn with a cover-crop → always full-bleed, never stretched/blurry
 *  - frames are decoded on demand with a small bitmap cache + prefetch
 */
export default function BoomerangVideoBg({ src, active, className = "" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [started, setStarted] = useState(false);

  /* capture pass → JPEG blobs */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active) return;

    let capturing = true;
    let lastTime = -1;
    let rafId = 0;
    let seq = 0;
    let pending = 0;
    let ended = false;
    const blobs = new Array(400);
    let count = 0;

    const capCanvas = document.createElement("canvas");
    const capCtx = capCanvas.getContext("2d");

    const tryFinish = () => {
      if (ended && pending === 0 && count > 1) {
        capturing = false;
        video.__boomerangBlobs = blobs.slice(0, count);
        setStarted(true);
      }
    };

    const captureFrame = () => {
      if (!capturing || video.readyState < 2) return;
      if (video.currentTime === lastTime) return;
      lastTime = video.currentTime;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh || count >= 400) return;

      const CAP_W = Math.min(1920, vw);
      const w = CAP_W;
      const h = Math.round((CAP_W * vh) / vw);
      if (capCanvas.width !== w) {
        capCanvas.width = w;
        capCanvas.height = h;
      }
      capCtx.drawImage(video, 0, 0, w, h);
      const mySeq = seq++;
      pending++;
      capCanvas.toBlob(
        (b) => {
          if (b) {
            blobs[mySeq] = b;
            count = Math.max(count, mySeq + 1);
          }
          pending--;
          tryFinish();
        },
        "image/jpeg",
        0.92
      );
    };

    const vfc =
      typeof video.requestVideoFrameCallback === "function"
        ? video.requestVideoFrameCallback.bind(video)
        : null;
    const rafLoop = () => {
      captureFrame();
      if (capturing) rafId = requestAnimationFrame(rafLoop);
    };
    const vfcLoop = () => {
      captureFrame();
      if (capturing && vfc) vfc(vfcLoop);
    };
    const onLoaded = () => {
      video.play().catch(() => {});
      if (vfc) vfc(vfcLoop);
      else rafId = requestAnimationFrame(rafLoop);
    };
    const onEnded = () => {
      ended = true;
      capturing = false;
      tryFinish();
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("ended", onEnded);
    if (video.readyState >= 1) onLoaded();

    return () => {
      capturing = false;
      cancelAnimationFrame(rafId);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("ended", onEnded);
    };
  }, [src, active]);

  /* playback pass */
  useEffect(() => {
    if (!started || !active) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const blobs = video?.__boomerangBlobs;
    if (!canvas || !blobs || blobs.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dprCap = Math.min(window.devicePixelRatio || 1, 1.5);
    const fit = () => {
      const cw = Math.max(2, Math.min(2000, Math.round(canvas.clientWidth * dprCap)));
      const ch = Math.max(2, Math.min(1400, Math.round(canvas.clientHeight * dprCap)));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };
    fit();
    window.addEventListener("resize", fit);

    /* bitmap cache + prefetch */
    const cache = new Map();
    const load = (i) => {
      if (i < 0 || i >= blobs.length) return Promise.resolve(null);
      if (cache.has(i)) return Promise.resolve(cache.get(i));
      return createImageBitmap(blobs[i]).then((bm) => {
        cache.set(i, bm);
        if (cache.size > 12) {
          for (const k of cache.keys()) {
            if (Math.abs(k - i) > 5) {
              cache.get(k).close?.();
              cache.delete(k);
              break;
            }
          }
        }
        return bm;
      });
    };

    const draw = (bm) => {
      if (!bm) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const bw = bm.width;
      const bh = bm.height;
      const ea = cw / ch;
      const ba = bw / bh;
      let sw, sh, sx, sy;
      if (ba > ea) {
        sh = bh;
        sw = bh * ea;
        sx = (bw - sw) / 2;
        sy = 0;
      } else {
        sw = bw;
        sh = bw / ea;
        sx = 0;
        sy = (bh - sh) / 2;
      }
      ctx.drawImage(bm, sx, sy, sw, sh, 0, 0, cw, ch);
    };

    let index = 0;
    let dir = 1;
    let current = null;
    let last = performance.now();
    const interval = 1000 / 30;
    let rafId = 0;

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (now - last < interval) return;
      last = now;
      if (current) draw(current);
      let ni = index + dir;
      if (ni >= blobs.length - 1) {
        ni = blobs.length - 1;
        dir = -1;
      } else if (ni <= 0) {
        ni = 0;
        dir = 1;
      }
      index = ni;
      load(ni).then((bm) => {
        if (bm) {
          current = bm;
          load(ni + dir);
          load(ni + dir * 2);
        }
      });
    };
    load(0).then((bm) => {
      current = bm;
      draw(bm);
      rafId = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", fit);
      cache.forEach((bm) => bm.close?.());
      cache.clear();
    };
  }, [started, active]);

  return (
    <div className={className}>
      <video
        ref={videoRef}
        src={src}
        className="bv-video"
        style={{ display: started ? "none" : "block" }}
        muted
        playsInline
        preload="auto"
      />
      <canvas
        ref={canvasRef}
        className="bv-canvas"
        style={{ display: started ? "block" : "none" }}
      />
    </div>
  );
}
