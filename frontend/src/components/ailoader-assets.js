export const AI_SVG = `
<svg
  id="stage"
  viewBox="0 0 760 430"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1020"/>
      <stop offset="100%" stop-color="#15102a"/>
    </linearGradient>

    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd86b"/>
      <stop offset="100%" stop-color="#f2a93b"/>
    </linearGradient>

    <linearGradient id="violet" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>

    <filter id="glow">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="softGlow">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect
    x="0"
    y="0"
    width="760"
    height="430"
    rx="24"
    fill="url(#bg)"
  />

  <!-- Decorative grid -->
  <g opacity=".12" stroke="#ffffff">
    <path d="M40 80H720"/>
    <path d="M40 140H720"/>
    <path d="M40 200H720"/>
    <path d="M40 260H720"/>
    <path d="M40 320H720"/>
    <path d="M100 40V350"/>
    <path d="M180 40V350"/>
    <path d="M260 40V350"/>
    <path d="M340 40V350"/>
    <path d="M420 40V350"/>
    <path d="M500 40V350"/>
    <path d="M580 40V350"/>
    <path d="M660 40V350"/>
  </g>

  <!-- Left folder -->
  <g id="folderL">
    <path
      id="fLtab"
      d="M72 150H185L201 170H72Z"
      fill="#1c2744"
      stroke="#4d638d"
      stroke-width="2"
    />

    <rect
      id="fLbody"
      x="72"
      y="168"
      width="180"
      height="125"
      rx="12"
      fill="#111a30"
      stroke="#4d638d"
      stroke-width="2"
    />

    <circle
      id="fLdot"
      cx="102"
      cy="200"
      r="6"
      fill="#7c8db5"
    />

    <text
      x="125"
      y="205"
      fill="#b9c4dd"
      font-size="15"
      font-family="Arial, sans-serif"
    >
      PROOF
    </text>
  </g>

  <!-- Right folder -->
  <g id="folderR">
    <path
      id="fRtab"
      d="M508 150H621L637 170H508Z"
      fill="#352b12"
      stroke="#d4a84b"
      stroke-width="2"
    />

    <rect
      id="fRbody"
      x="508"
      y="168"
      width="180"
      height="125"
      rx="12"
      fill="#17130a"
      stroke="#d4a84b"
      stroke-width="2"
    />

    <circle
      id="fRdot"
      cx="538"
      cy="200"
      r="6"
      fill="#ffd86b"
    />

    <text
      x="560"
      y="205"
      fill="#f5d98a"
      font-size="15"
      font-family="Arial, sans-serif"
    >
      VERIFIED
    </text>
  </g>

  <!-- Right folder pulse -->
  <circle
    id="pulseR"
    cx="598"
    cy="230"
    r="70"
    fill="none"
    stroke="#ffd86b"
    stroke-width="2"
    opacity="0"
  />

  <!-- Free card -->
  <g id="cardFree">
    <rect
      id="cardFreeIn"
      x="0"
      y="0"
      width="74"
      height="52"
      rx="8"
      fill="#222c48"
      stroke="#8796ba"
      stroke-width="2"
    />

    <rect
      x="12"
      y="12"
      width="50"
      height="7"
      rx="3"
      fill="#8796ba"
    />

    <rect
      x="12"
      y="27"
      width="36"
      height="7"
      rx="3"
      fill="#526486"
    />
  </g>

  <!-- Robot -->
  <g id="robot">
    <g id="robotFlip">
      <g id="robotLean">

        <!-- body -->
        <rect
          x="318"
          y="170"
          width="112"
          height="105"
          rx="22"
          fill="#151d32"
          stroke="#a78bfa"
          stroke-width="3"
        />

        <!-- head -->
        <rect
          x="326"
          y="112"
          width="96"
          height="70"
          rx="22"
          fill="#1c2744"
          stroke="#a78bfa"
          stroke-width="3"
        />

        <!-- antenna -->
        <path
          d="M374 112V92"
          stroke="#a78bfa"
          stroke-width="4"
          stroke-linecap="round"
        />

        <circle
          cx="374"
          cy="86"
          r="7"
          fill="#ffd86b"
          filter="url(#softGlow)"
        />

        <!-- eyes -->
        <circle
          cx="354"
          cy="145"
          r="7"
          fill="#ffd86b"
        />

        <circle
          cx="394"
          cy="145"
          r="7"
          fill="#ffd86b"
        />

        <!-- mouth -->
        <rect
          x="352"
          y="159"
          width="44"
          height="6"
          rx="3"
          fill="#596989"
        />

        <!-- body panel -->
        <rect
          x="341"
          y="193"
          width="66"
          height="38"
          rx="10"
          fill="#0e1425"
          stroke="#3e4d70"
          stroke-width="2"
        />

        <circle
          cx="358"
          cy="212"
          r="5"
          fill="#7c3aed"
          filter="url(#softGlow)"
        />

        <circle
          cx="374"
          cy="212"
          r="5"
          fill="#ffd86b"
          filter="url(#softGlow)"
        />

        <circle
          cx="390"
          cy="212"
          r="5"
          fill="#7c3aed"
          filter="url(#softGlow)"
        />

        <!-- legs -->
        <g id="legB">
          <rect
            x="335"
            y="270"
            width="28"
            height="52"
            rx="12"
            fill="#1c2744"
            stroke="#8796ba"
            stroke-width="2"
          />

          <rect
            x="397"
            y="270"
            width="28"
            height="52"
            rx="12"
            fill="#1c2744"
            stroke="#8796ba"
            stroke-width="2"
          />
        </g>

        <g id="legF">
          <rect
            x="335"
            y="270"
            width="28"
            height="52"
            rx="12"
            fill="#263252"
            stroke="#a78bfa"
            stroke-width="2"
          />

          <rect
            x="397"
            y="270"
            width="28"
            height="52"
            rx="12"
            fill="#263252"
            stroke="#a78bfa"
            stroke-width="2"
          />
        </g>

        <!-- arms -->
        <g id="armB">
          <rect
            x="294"
            y="185"
            width="26"
            height="76"
            rx="13"
            fill="#1c2744"
            stroke="#8796ba"
            stroke-width="2"
          />
        </g>

        <g id="armF">
          <rect
            x="428"
            y="185"
            width="26"
            height="76"
            rx="13"
            fill="#263252"
            stroke="#a78bfa"
            stroke-width="2"
          />

          <path
            id="armFpath"
            d="M441 252L454 276"
            stroke="#a78bfa"
            stroke-width="7"
            stroke-linecap="round"
          />
        </g>

        <!-- held card -->
        <g id="cardHold">
          <rect
            x="452"
            y="270"
            width="74"
            height="52"
            rx="8"
            fill="#342b13"
            stroke="#ffd86b"
            stroke-width="2"
          />

          <rect
            x="464"
            y="282"
            width="50"
            height="7"
            rx="3"
            fill="#ffd86b"
          />

          <rect
            x="464"
            y="297"
            width="36"
            height="7"
            rx="3"
            fill="#b88a2e"
          />
        </g>

      </g>
    </g>
  </g>

  <!-- Progress -->
  <g id="progress">
    <rect
      x="160"
      y="355"
      width="440"
      height="10"
      rx="5"
      fill="#202a42"
    />

    <rect
      id="barFill"
      x="160"
      y="355"
      width="0"
      height="10"
      rx="5"
      fill="url(#gold)"
    />

    <circle
      id="barDot"
      cx="160"
      cy="360"
      r="8"
      fill="#ffd86b"
      filter="url(#softGlow)"
    />

    <text
      id="pct"
      x="620"
      y="365"
      fill="#ffd86b"
      font-size="16"
      font-family="Arial, sans-serif"
      font-weight="700"
    >
      0%
    </text>
  </g>

  <!-- Fade overlay -->
  <rect
    id="fade"
    x="0"
    y="0"
    width="760"
    height="430"
    rx="24"
    fill="#0b1020"
    opacity="0"
    pointer-events="none"
  />
</svg>
`;


/*
 * Animation script
 *
 * IMPORTANT:
 * This animation is now scoped to the AiLoader instance.
 * AiLoader.jsx passes its DOM root using:
 *
 *     run(root)
 *
 * Therefore we use:
 *
 *     root.querySelector(...)
 *
 * instead of:
 *
 *     document.getElementById(...)
 *
 * This prevents the animation from accidentally searching the
 * entire application DOM.
 */
export const AI_SCRIPT = `(root => {
  "use strict";

  if (!root) return;

  const $ = id => root.querySelector("#" + id);

  const robot = $("robot");
  const flip = $("robotFlip");
  const lean = $("robotLean");

  const legF = $("legF");
  const legB = $("legB");

  const armB = $("armB");
  const armF = $("armF");

  const cardHold = $("cardHold");
  const cardFree = $("cardFree");
  const cardFreeIn = $("cardFreeIn");

  const pulseR = $("pulseR");

  const fRbody = $("fRbody");
  const fRtab = $("fRtab");
  const fRdot = $("fRdot");

  const barFill = $("barFill");
  const barDot = $("barDot");
  const pct = $("pct");

  const fade = $("fade");

  const armFpath = $("armFpath");

  /*
   * Make sure the SVG actually contains the elements
   * required by the animation.
   *
   * If something is missing, simply stop the animation
   * instead of throwing a setAttribute error.
   */
  const required = [
    robot,
    flip,
    lean,
    legF,
    legB,
    armB,
    armF,
    cardHold,
    cardFree,
    cardFreeIn,
    pulseR,
    fRbody,
    fRtab,
    fRdot,
    barFill,
    barDot,
    pct,
    fade,
    armFpath
  ];

  if (required.some(el => !el)) {
    console.warn("AI loader: required SVG element is missing.");
    return;
  }

  /*
   * Animation helpers
   */

  const clamp = (v, min, max) =>
    Math.max(min, Math.min(max, v));

  const lerp = (a, b, t) =>
    a + (b - a) * t;

  const easeInOut = t => {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };

  const easeOut = t => {
    t = clamp(t, 0, 1);
    return 1 - Math.pow(1 - t, 3);
  };

  const easeIn = t => {
    t = clamp(t, 0, 1);
    return t * t * t;
  };

  /*
   * Set transform safely.
   */
  const transform = (el, value) => {
    if (el) el.setAttribute("transform", value);
  };

  /*
   * Initial positions.
   */
  transform(robot, "translate(0 0)");
  transform(flip, "translate(0 0)");
  transform(lean, "rotate(0 374 215)");

  transform(legF, "translate(0 0)");
  transform(legB, "translate(0 0)");

  transform(armB, "rotate(0 307 185)");
  transform(armF, "rotate(0 441 185)");

  transform(cardHold, "translate(0 0)");

  cardFree.setAttribute("opacity", "1");
  cardFreeIn.setAttribute("opacity", "1");

  pulseR.setAttribute("opacity", "0");

  /*
   * Animation timeline.
   *
   * Total duration is roughly 6 seconds.
   */
  const duration = 6.4;

  /*
   * Manual clock support.
   */
  let manualClock = false;

  /*
   * Render one frame.
   */
  function render(t) {

    /*
     * Keep animation looping.
     */
    const time = ((t % duration) + duration) % duration;

    /*
     * ---------------------------------------------
     * PHASE 1 — robot moves toward proof folder
     * ---------------------------------------------
     */

    const p1 = clamp(time / 1.6, 0, 1);
    const e1 = easeInOut(p1);

    const robotX = lerp(0, -155, e1);

    transform(robot, "translate(" + robotX + " 0)");

    /*
     * Walking motion.
     */
    const walk = Math.sin(time * 10);

    transform(
      legF,
      "translate(0 " + (walk * 3) + ") rotate(" +
      (walk * 4) +
      " 374 270)"
    );

    transform(
      legB,
      "translate(0 " + (-walk * 3) + ") rotate(" +
      (-walk * 4) +
      " 374 270)"
    );

    transform(
      armB,
      "rotate(" +
      (walk * 5) +
      " 307 185)"
    );

    transform(
      armF,
      "rotate(" +
      (-walk * 5) +
      " 441 185)"
    );

    /*
     * Slight body movement.
     */
    transform(
      lean,
      "rotate(" +
      (Math.sin(time * 5) * 1.8) +
      " 374 215)"
    );

    /*
     * ---------------------------------------------
     * PHASE 2 — pick up proof
     * ---------------------------------------------
     */

    const pickStart = 1.6;
    const pickEnd = 2.5;

    if (time >= pickStart && time < pickEnd) {

      const p = easeInOut(
        (time - pickStart) /
        (pickEnd - pickStart)
      );

      /*
       * Robot bends slightly.
       */
      transform(
        lean,
        "rotate(" +
        lerp(0, -8, p) +
        " 374 215)"
      );

      /*
       * Arm reaches down.
       */
      transform(
        armF,
        "rotate(" +
        lerp(0, 42, p) +
        " 441 185)"
      );

      /*
       * Free card moves toward robot.
       */
      transform(
        cardFree,
        "translate(" +
        lerp(0, 85, p) +
        " " +
        lerp(0, 55, p) +
        ")"
      );

      cardFree.setAttribute(
        "opacity",
        String(1 - p)
      );

      cardFreeIn.setAttribute(
        "opacity",
        String(1 - p)
      );

      transform(
        cardHold,
        "translate(" +
        lerp(0, -4, p) +
        " " +
        lerp(0, 6, p) +
        ")"
      );
    }

    /*
     * ---------------------------------------------
     * PHASE 3 — robot carries proof to verification
     * ---------------------------------------------
     */

    const carryStart = 2.5;
    const carryEnd = 4.7;

    if (time >= carryStart && time < carryEnd) {

      const p = easeInOut(
        (time - carryStart) /
        (carryEnd - carryStart)
      );

      const x = lerp(-155, 155, p);

      transform(
        robot,
        "translate(" + x + " 0)"
      );

      transform(
        lean,
        "rotate(" +
        (Math.sin(time * 7) * 1.5) +
        " 374 215)"
      );

      /*
       * Walking animation while carrying.
       */
      const walk = Math.sin(time * 11);

      transform(
        legF,
        "translate(0 " +
        (walk * 3) +
        ") rotate(" +
        (walk * 4) +
        " 374 270)"
      );

      transform(
        legB,
        "translate(0 " +
        (-walk * 3) +
        ") rotate(" +
        (-walk * 4) +
        " 374 270)"
      );

      transform(
        armB,
        "rotate(" +
        (walk * 4) +
        " 307 185)"
      );

      transform(
        armF,
        "rotate(" +
        (-walk * 4) +
        " 441 185)"
      );

      /*
       * Card follows robot.
       */
      transform(
        cardHold,
        "translate(" +
        x +
        " 0)"
      );
    }

    /*
     * ---------------------------------------------
     * PHASE 4 — verification
     * ---------------------------------------------
     */

    const verifyStart = 4.7;
    const verifyEnd = 5.5;

    if (time >= verifyStart && time < verifyEnd) {

      const p = easeInOut(
        (time - verifyStart) /
        (verifyEnd - verifyStart)
      );

      /*
       * Robot pauses.
       */
      transform(
        robot,
        "translate(155 0)"
      );

      transform(
        cardHold,
        "translate(155 0)"
      );

      /*
       * Verification pulse.
       */
      pulseR.setAttribute(
        "opacity",
        String(0.25 + 0.55 * p)
      );

      pulseR.setAttribute(
        "r",
        String(45 + 35 * p)
      );

      /*
       * Folder glow.
       */
      fRbody.setAttribute(
        "stroke-width",
        String(2 + p * 2)
      );

      fRtab.setAttribute(
        "stroke-width",
        String(2 + p * 2)
      );

      fRdot.setAttribute(
        "r",
        String(6 + p * 3)
      );

      /*
       * Card moves into verified folder.
       */
      transform(
        cardHold,
        "translate(" +
        (155 + 75 * p) +
        " " +
        (-25 * p) +
        ") scale(" +
        (1 - 0.35 * p) +
        ")"
      );
    }

    /*
     * ---------------------------------------------
     * PHASE 5 — finish / progress
     * ---------------------------------------------
     */

    const progress = clamp(
      time / duration,
      0,
      1
    );

    const progressWidth = 440 * progress;

    barFill.setAttribute(
      "width",
      String(progressWidth)
    );

    barDot.setAttribute(
      "cx",
      String(160 + progressWidth)
    );

    pct.textContent =
      Math.round(progress * 100) + "%";

    /*
     * Fade near the end before loop restart.
     */
    if (time >= 5.5) {

      const p = easeOut(
        (time - 5.5) /
        (duration - 5.5)
      );

      fade.setAttribute(
        "opacity",
        String(p * 0.65)
      );

    } else {

      fade.setAttribute(
        "opacity",
        "0"
      );
    }

    /*
     * Reset pulse outside verification phase.
     */
    if (time < verifyStart || time >= verifyEnd) {
      pulseR.setAttribute(
        "opacity",
        "0"
      );

      pulseR.setAttribute(
        "r",
        "70"
      );

      fRbody.setAttribute(
        "stroke-width",
        "2"
      );

      fRtab.setAttribute(
        "stroke-width",
        "2"
      );

      fRdot.setAttribute(
        "r",
        "6"
      );
    }

    /*
     * Reset free card after loop starts.
     */
    if (time < pickStart) {

      cardFree.setAttribute(
        "opacity",
        "1"
      );

      cardFreeIn.setAttribute(
        "opacity",
        "1"
      );

      transform(
        cardFree,
        "translate(0 0)"
      );

      transform(
        cardHold,
        "translate(0 0)"
      );

      transform(
        armF,
        "rotate(0 441 185)"
      );

      transform(
        lean,
        "rotate(0 374 215)"
      );
    }

    /*
     * Make sure card is visible while carrying.
     */
    if (time >= carryStart && time < verifyEnd) {
      cardHold.setAttribute(
        "opacity",
        "1"
      );
    }

    /*
     * Hide the held card after verification.
     */
    if (time >= verifyEnd) {
      cardHold.setAttribute(
        "opacity",
        "0"
      );
    } else {
      cardHold.setAttribute(
        "opacity",
        "1"
      );
    }
  }

  /*
   * Optional external control.
   *
   * These are intentionally attached to the loader root,
   * rather than using global window properties.
   */
  root.__seek = value => {
    manualClock = true;
    render(Number(value) || 0);
  };

  root.__render = render;

  /*
   * Start animation.
   */
  const t0 = performance.now();

  function frame() {

    if (!manualClock) {
      render(
        (performance.now() - t0) / 1000
      );
    }

    root.__aiLoaderFrame =
      requestAnimationFrame(frame);
  }

  /*
   * Initial frame.
   */
  render(0);

  /*
   * Start requestAnimationFrame loop.
   */
  root.__aiLoaderFrame =
    requestAnimationFrame(frame);

})(arguments[0]);`;