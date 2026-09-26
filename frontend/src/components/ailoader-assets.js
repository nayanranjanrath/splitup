export const AI_SVG = `<svg id="stage" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet"
     xmlns="http://www.w3.org/2000/svg" aria-label="Verifying your upload" role="img">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="#07090d"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="gradBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"  stop-color="#f0b23e"/>
      <stop offset="100%" stop-color="#8f7ff7"/>
    </linearGradient>
    <linearGradient id="gradFolder" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#10151c"/>
      <stop offset="100%" stop-color="#0a0e13"/>
    </linearGradient>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glowSoft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="1.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="barClip"><rect x="140" y="286" width="360" height="10" rx="5"/></clipPath>
  </defs>

  <rect x="0" y="0" width="640" height="360" fill="url(#bgGrad)"/>

  <g id="scene" transform="translate(320,180) scale(1.2) translate(-320,-222)">
  <!-- ground hints -->
  <ellipse cx="112" cy="238" rx="56" ry="5" fill="#0c1117"/>
  <ellipse cx="528" cy="238" rx="56" ry="5" fill="#0c1117"/>

  <!-- LEFT folder (source) -->
  <g id="folderL" transform="translate(112,236)">
    <rect x="-48" y="-66" width="36" height="16" rx="6" fill="url(#gradFolder)" stroke="#2b3440" stroke-width="2"/>
    <rect x="-48" y="-58" width="96" height="58" rx="9" fill="url(#gradFolder)" stroke="#2b3440" stroke-width="2"/>
    <line x1="-32" y1="-44" x2="20" y2="-44" stroke="#1a222c" stroke-width="2" stroke-linecap="round"/>
    <circle cx="34" cy="-46" r="2.2" fill="#1f2937"/>
  </g>

  <!-- RIGHT folder (destination) -->
  <g id="folderR" transform="translate(528,236)">
    <rect id="fRtab" x="-48" y="-66" width="36" height="16" rx="6" fill="url(#gradFolder)" stroke="#2b3440" stroke-width="2"/>
    <rect id="fRbody" x="-48" y="-58" width="96" height="58" rx="9" fill="url(#gradFolder)" stroke="#2b3440" stroke-width="2"/>
    <line x1="-32" y1="-44" x2="20" y2="-44" stroke="#1a222c" stroke-width="2" stroke-linecap="round"/>
    <circle id="fRdot" cx="34" cy="-46" r="2.2" fill="#1f2937"/>
  </g>
  <circle id="pulseR" cx="528" cy="200" r="10" fill="none" stroke="#f0b23e" stroke-width="2" opacity="0"/>

  <!-- free-flying image card (grab / deposit arcs) -->
  <g id="cardFree" opacity="0">
    <g id="cardFreeIn">
      <rect x="-10" y="-8" width="20" height="16" rx="3" fill="#f5f8fb"/>
      <circle cx="-3.5" cy="-3" r="2" fill="#f0b23e"/>
      <path d="M -7 5 L -2 -1 L 1 2.5 L 4 -1 L 7 5 Z" fill="#8f7ff7"/>
    </g>
  </g>

  <!-- ROBOT -->
  <g id="robot">
    <g id="robotFlip">
      <g id="robotLean">
        <!-- back arm -->
        <g id="armB" transform="translate(-7,-29)">
          <path d="M0 0 L-2 10" stroke="#aeb6c0" stroke-width="4" stroke-linecap="round" fill="none"/>
        </g>
        <!-- back leg -->
        <g id="legB" transform="translate(-4,-16)">
          <path d="M0 0 L1 11 L7.5 14" stroke="#aeb6c0" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </g>
        <!-- front leg -->
        <g id="legF" transform="translate(4,-16)">
          <path d="M0 0 L1 11 L7.5 14" stroke="#cfd6de" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </g>
        <!-- body -->
        <rect x="-11" y="-34" width="22" height="18" rx="7" fill="#d8dee6"/>
        <rect x="-6" y="-24" width="7" height="3" rx="1.5" fill="#9aa4b0"/>
        <!-- head -->
        <rect x="-8" y="-50" width="22" height="17" rx="8" fill="#e6ebf1"/>
        <rect x="-1" y="-46" width="13" height="8" rx="4" fill="#0b0e12"/>
        <circle cx="6.5" cy="-42" r="2.2" fill="#f0b23e" filter="url(#glowSoft)"/>
        <!-- antenna -->
        <line x1="0" y1="-50" x2="0" y2="-56" stroke="#cfd6de" stroke-width="2"/>
        <circle cx="0" cy="-57.5" r="2" fill="#f0b23e" filter="url(#glowSoft)"/>
        <!-- front arm -->
        <g id="armF" transform="translate(7,-29)">
          <path id="armFpath" d="M0 0 L6 3" stroke="#cfd6de" stroke-width="4" stroke-linecap="round" fill="none"/>
        </g>
        <!-- held image card -->
        <g id="cardHold" transform="translate(17,-27) rotate(-10)">
          <rect x="-10" y="-8" width="20" height="16" rx="3" fill="#f5f8fb"/>
          <circle cx="-3.5" cy="-3" r="2" fill="#f0b23e"/>
          <path d="M -7 5 L -2 -1 L 1 2.5 L 4 -1 L 7 5 Z" fill="#8f7ff7"/>
        </g>
      </g>
    </g>
  </g>

  <!-- PROGRESS BAR -->
  <rect x="140" y="286" width="360" height="10" rx="5" fill="#0f141a" stroke="#232b35" stroke-width="1"/>
  <g clip-path="url(#barClip)">
    <rect id="barFill" x="140" y="286" width="0" height="10" fill="url(#gradBar)" filter="url(#glowSoft)"/>
  </g>
  <circle id="barDot" cx="140" cy="291" r="3" fill="#d9f6ff" filter="url(#glowSoft)" opacity="0"/>
  <text id="pct" x="514" y="296" fill="#7f8994">0%</text>
  </g>

  <!-- loop fade -->
  <rect id="fade" x="0" y="0" width="640" height="360" fill="#000" opacity="0" pointer-events="none"/>
</svg>`;
export const AI_SCRIPT = `(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const robot = $("robot"), flip = $("robotFlip"), lean = $("robotLean");
  const legF = $("legF"), legB = $("legB"), armB = $("armB"), armF = $("armF");
  const cardHold = $("cardHold"), cardFree = $("cardFree"), cardFreeIn = $("cardFreeIn");
  const pulseR = $("pulseR"), fRbody = $("fRbody"), fRtab = $("fRtab"), fRdot = $("fRdot");
  const barFill = $("barFill"), barDot = $("barDot"), pct = $("pct"), fade = $("fade");

  // ---- config ----
  const D = 8.0;                 // loop length (s)
  const X_L = 150, X_R = 462;    // robot run endpoints
  const GY  = 236;               // ground y
  const T = { grabEnd:.6, runEnd:3.4, depEnd:4.1, turnEnd:4.45, retEnd:7.0 };

  // ---- helpers ----
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const lerp  = (a,b,u) => a + (b-a)*u;
  const sstep = u => { u = clamp(u,0,1); return u*u*(3-2*u); };
  const seg = (t,a,b) => sstep((t-a)/(b-a));
  const qbez = (p0,p1,p2,u) => {
    const v = 1-u;
    return [ v*v*p0[0] + 2*v*u*p1[0] + u*u*p2[0],
             v*v*p0[1] + 2*v*u*p1[1] + u*u*p2[1] ];
  };

  // progress keyframes (time, %) — piecewise-smooth
  const PK = [[0,0],[.6,4],[3.4,58],[4.1,82],[7.0,97],[7.5,100]];
  function progressAt(t){
    for (let i=0;i<PK.length-1;i++){
      const [t0,p0] = PK[i], [t1,p1] = PK[i+1];
      if (t <= t1) return lerp(p0, p1, sstep((t-t0)/(t1-t0)));
    }
    return 100;
  }

  let manualProgress = null;     // 0..100 when bound to real backend

  function render(t){
    t = ((t % D) + D) % D;

    // ---------- robot horizontal position & facing ----------
    let x = X_L, face = 1, moving = 0, freq = 11;
    if (t < T.grabEnd)            { x = X_L; moving = 0; }
    else if (t < T.runEnd)        { x = lerp(X_L, X_R, seg(t, T.grabEnd, T.runEnd)); face = 1; moving = 1; }
    else if (t < T.turnEnd)       { x = X_R; face = (t < T.depEnd) ? 1 : Math.cos(Math.PI * seg(t, T.depEnd, T.turnEnd)); moving = 0; }
    else if (t < T.retEnd)        { x = lerp(X_R, X_L, seg(t, T.turnEnd, T.retEnd)); face = -1; moving = 1; freq = 9; }
    else                          { x = X_L; face = (t > 7.2) ? 1 : -1 + 2*seg(t, 7.0, 7.2); moving = 0; }

    // ---------- run cycle ----------
    const phi = t * freq;
    const amp = moving ? 1 : 0;
    const swing = Math.sin(phi) * 36 * amp;
    const bob   = -Math.abs(Math.sin(phi)) * 2.6 * amp;
    const leanA = (face >= 0 ? 5 : -5) * amp * Math.sign(face || 1);

    robot.setAttribute("transform", \`translate(\${x},\${GY + bob})\`);
    flip.setAttribute("transform", \`scale(\${face === 0 ? .22 : face},1)\`);
    lean.setAttribute("transform", \`rotate(\${leanA * (face<0?-1:1) * 0})\`); // lean folded into flip-space below
    lean.setAttribute("transform", \`rotate(\${moving ? 4 : 0})\`);
    legF.setAttribute("transform", \`translate(4,-16) rotate(\${-swing})\`);
    legB.setAttribute("transform", \`translate(-4,-16) rotate(\${swing})\`);
    armB.setAttribute("transform", \`translate(-7,-29) rotate(\${-swing * .8})\`);

    // ---------- image card states ----------
    const carrying = t >= T.grabEnd && t < T.runEnd + .05;
    cardHold.setAttribute("opacity", carrying ? 1 : 0);
    if (!carrying) {
      // free card: spawn in left folder -> arc to hand ; hand-off arc into right folder ; respawn at rest
      let op = 0, pos = null, rot = -10, sc = 1;
      if (t < T.grabEnd) {                      // grab arc
        const u = seg(t, .08, T.grabEnd);
        pos = qbez([118,196],[138,178],[X_L+17, GY-27], u);
        op = 1;
      } else if (t >= T.runEnd && t < T.depEnd) { // deposit arc
        const u = seg(t, T.runEnd, T.depEnd);
        pos = qbez([X_R+17, GY-27],[492,166],[524,202], u);
        rot = lerp(-10, 8, u); sc = lerp(1, .55, u);
        op = 1 - sstep((t - (T.depEnd-.12))/.12);
      } else if (t >= 7.25) {                    // next file appears in source folder
        pos = [118,196]; op = seg(t, 7.25, 7.65);
      }
      if (pos){
        cardFree.setAttribute("opacity", op);
        cardFreeIn.setAttribute("transform", \`translate(\${pos[0]},\${pos[1]}) rotate(\${rot}) scale(\${sc})\`);
      } else cardFree.setAttribute("opacity", 0);
    } else cardFree.setAttribute("opacity", 0);

    // front arm: holding pose vs swing
    if (carrying || t < T.grabEnd) {
      armF.setAttribute("transform", \`translate(7,-29)\`);
      $("armFpath").setAttribute("d", "M0 0 L6 3");
    } else {
      armF.setAttribute("transform", \`translate(7,-29) rotate(\${swing * .8})\`);
      $("armFpath").setAttribute("d", "M0 0 L-1 10");
    }

    // ---------- right folder receive pulse ----------
    const age = t - 3.75;
    if (age > 0 && age < .8) {
      const u = age / .8;
      pulseR.setAttribute("opacity", (1-u) * .55);
      pulseR.setAttribute("r", 12 + u*44);
    } else pulseR.setAttribute("opacity", 0);
    const e = (age > 0) ? Math.exp(-age*3.2) : 0;   // folder energized glow
    const stroke = e > .04 ? \`rgb(\${lerp(43,34,e)|0},\${lerp(52,211,e)|0},\${lerp(64,238,e)|0})\` : "#2b3440";
    fRbody.setAttribute("stroke", stroke);
    fRtab.setAttribute("stroke", stroke);
    fRdot.setAttribute("fill", e > .04 ? "#22d3ee" : "#1f2937");

    // ---------- progress bar ----------
    const p = (manualProgress != null) ? clamp(manualProgress,0,100) : progressAt(t);
    const w = 360 * p / 100;
    barFill.setAttribute("width", w);
    barDot.setAttribute("cx", 140 + w);
    barDot.setAttribute("opacity", (p > 1 && p < 99.5) ? .95 : 0);
    pct.textContent = Math.round(p) + "%";
    pct.setAttribute("fill", p >= 99.5 ? "#67e8f9" : "#7f8994");

    // ---------- seamless-loop fade ----------
    let a = 0;
    if (t > D - .3) a = (t - (D - .3)) / .3;
    else if (t < .25) a = 1 - t / .25;
    fade.setAttribute("opacity", a);
  }

  // ---------- clocks ----------
  let manualClock = false, manualT = 0;
  window.__seek = t => { manualClock = true; manualT = t; render(t); };
  window.AILoader = {
    setProgress: v => { manualProgress = clamp(+v || 0, 0, 100); render(manualT); },
    demo: () => { manualProgress = null; }
  };

  const t0 = performance.now();
  (function frame(){
    if (!manualClock) render((performance.now() - t0) / 1000);
    requestAnimationFrame(frame);
  })();
  render(0);
})();`;
