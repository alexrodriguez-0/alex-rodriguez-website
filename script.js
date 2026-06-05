const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const header = document.querySelector(".site-header");
const revealNodes = document.querySelectorAll(".reveal");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 24);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );
  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("in-view"));
}

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function setupHeroCluster() {
  const canvas = document.getElementById("hero-cluster");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let galaxies = [];
  let stars = [];
  let pointer = { x: 0.72, y: 0.48 };
  let lastFrame = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    stars = Array.from({ length: Math.min(150, Math.floor(width * height / 6800)) }, (_, index) => ({
      x: seededRandom(index + 3) * width,
      y: seededRandom(index + 9) * height,
      r: 0.4 + seededRandom(index + 17) * 1.3,
      glow: 0.2 + seededRandom(index + 21) * 0.7,
    }));

    galaxies = Array.from({ length: 44 }, (_, index) => {
      const lane = index % 4;
      return {
        phase: seededRandom(index + 101) * Math.PI * 2,
        radius: 88 + seededRandom(index + 117) * (lane === 0 ? 210 : 410),
        squash: 0.36 + seededRandom(index + 131) * 0.3,
        size: 5 + seededRandom(index + 147) * 12,
        speed: 0.06 + seededRandom(index + 163) * 0.13,
        tilt: seededRandom(index + 181) * Math.PI,
        color: seededRandom(index + 199) > 0.55 ? "#f6bc5f" : "#dcecff",
        lane,
      };
    });
  }

  function drawGalaxy(x, y, galaxy, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(galaxy.tilt + Math.sin(time * 0.6 + galaxy.phase) * 0.25);
    const size = galaxy.size;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.8);
    gradient.addColorStop(0, "rgba(255,255,255,0.92)");
    gradient.addColorStop(0.35, galaxy.color === "#f6bc5f" ? "rgba(246,188,95,0.82)" : "rgba(92,207,255,0.76)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.7, size * galaxy.squash, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.2, size * 0.16), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStrongLensing(cx, cy, scale, time) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.14);
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i += 1) {
      const start = 0.12 + i * 0.92 + Math.sin(time * 0.18 + i) * 0.03;
      const end = start + 0.7 + seededRandom(i + 31) * 0.44;
      ctx.strokeStyle = `rgba(92, 207, 255, ${0.68 - i * 0.08})`;
      ctx.lineWidth = 2.4 - i * 0.18;
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * (1.08 + i * 0.08), scale * (0.62 + i * 0.07), 0, start, end);
      ctx.stroke();
    }
    for (let i = 0; i < 5; i += 1) {
      ctx.strokeStyle = `rgba(255,255,255,${0.2 - i * 0.02})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * (0.62 + i * 0.18), scale * (0.36 + i * 0.1), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(timeMs) {
    if (lastFrame && timeMs - lastFrame < 34) {
      if (!prefersReducedMotion) requestAnimationFrame(draw);
      return;
    }
    lastFrame = timeMs;

    if (document.hidden) {
      if (!prefersReducedMotion) requestAnimationFrame(draw);
      return;
    }

    const time = timeMs * 0.001;
    const cx = width * (width < 760 ? 0.66 : 0.72);
    const cy = height * 0.49;
    const pullX = (pointer.x - 0.72) * 18;
    const pullY = (pointer.y - 0.48) * 18;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 0.48;

    for (const [index, galaxy] of galaxies.entries()) {
      if (index % 2 === 1) continue;
      const phase = galaxy.phase + time * galaxy.speed;
      const radius = galaxy.radius * (width < 760 ? 0.72 : 1);
      const x = cx + pullX + Math.cos(phase + galaxy.lane * 0.28) * radius * 1.36;
      const y = cy + pullY + Math.sin(phase + galaxy.lane * 0.28) * radius * (0.38 + galaxy.lane * 0.06);
      drawGalaxy(x, y, galaxy, time);
    }

    drawStrongLensing(cx + pullX, cy + pullY, Math.min(width, height) * 0.2, time);
    ctx.restore();

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer = {
        x: event.clientX / Math.max(1, window.innerWidth),
        y: event.clientY / Math.max(1, window.innerHeight),
      };
    },
    { passive: true }
  );

  resize();
  draw(0);
}

function setupEscapeCanvas() {
  const canvas = document.getElementById("phase-canvas");
  const massSlider = document.getElementById("mass-slider");
  const samplingSlider = document.getElementById("sampling-slider");
  const edgeMetric = document.getElementById("edge-metric");
  if (!canvas || !massSlider || !samplingSlider || !edgeMetric) return;

  const ctx = canvas.getContext("2d");
  const state = { width: canvas.width, height: canvas.height };

  function options() {
    return {
      mass: Number(massSlider.value) / 100,
      sampling: Number(samplingSlider.value) / 100,
    };
  }

  function measuredFraction(opts) {
    return 0.66 + 0.28 * Math.pow(opts.sampling, 0.9);
  }

  function escapeVelocity(radius, opts) {
    const base = 3650 - 1160 * Math.pow(radius - 0.2, 0.76);
    return base * Math.sqrt(opts.mass);
  }

  function mapX(radius) {
    const padLeft = 74;
    const padRight = 34;
    return padLeft + ((radius - 0.2) / 0.8) * (state.width - padLeft - padRight);
  }

  function mapY(velocity) {
    const padTop = 40;
    const padBottom = 66;
    return padTop + ((3800 - velocity) / 7600) * (state.height - padTop - padBottom);
  }

  function drawAxes(dark = false) {
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = dark ? "#0b151a" : "#fbfcfc";
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.strokeStyle = dark ? "rgba(255,255,255,0.09)" : "rgba(7,16,22,0.1)";
    ctx.lineWidth = 1;
    for (let r = 0.2; r <= 1.001; r += 0.1) {
      const x = mapX(r);
      ctx.beginPath();
      ctx.moveTo(x, mapY(3800));
      ctx.lineTo(x, mapY(-3800));
      ctx.stroke();
    }
    for (let v = -3000; v <= 3000; v += 1000) {
      const y = mapY(v);
      ctx.beginPath();
      ctx.moveTo(mapX(0.2), y);
      ctx.lineTo(mapX(1), y);
      ctx.stroke();
    }

    ctx.strokeStyle = dark ? "rgba(255,255,255,0.56)" : "rgba(7,16,22,0.84)";
    ctx.beginPath();
    ctx.moveTo(mapX(0.2), mapY(-3800));
    ctx.lineTo(mapX(0.2), mapY(3800));
    ctx.lineTo(mapX(1), mapY(3800));
    ctx.stroke();

    ctx.fillStyle = dark ? "rgba(248,251,251,0.72)" : "rgba(7,16,22,0.82)";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText("projected radius", state.width / 2 - 62, state.height - 20);
    ctx.save();
    ctx.translate(24, state.height / 2 + 60);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("line-of-sight velocity", 0, 0);
    ctx.restore();
  }

  function drawProfile(opts, multiplier, color, width, label, dash = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    for (const sign of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i <= 140; i += 1) {
        const radius = 0.2 + (i / 140) * 0.8;
        const velocity = sign * escapeVelocity(radius, opts) * multiplier;
        const x = mapX(radius);
        const y = mapY(velocity);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    if (label) {
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = "800 15px system-ui, sans-serif";
      const r = multiplier < 1 ? 0.62 : 0.55;
      const v = escapeVelocity(r, opts) * multiplier + (multiplier < 1 ? -220 : 210);
      ctx.fillText(label, mapX(r), mapY(v));
    }
    ctx.restore();
  }

  function drawGalaxies(opts) {
    const fraction = measuredFraction(opts);
    const count = Math.round(170 + opts.sampling * 330);
    ctx.fillStyle = "rgba(7,16,22,0.72)";
    for (let i = 0; i < count; i += 1) {
      const radius = 0.2 + seededRandom(i * 13 + 1) * 0.8;
      const edge = escapeVelocity(radius, opts) * fraction;
      const sign = seededRandom(i * 17 + 2) > 0.5 ? 1 : -1;
      const core = 0.1 + Math.pow(seededRandom(i * 19 + 3), 0.72) * 0.58;
      const tail = 0.55 + Math.pow(seededRandom(i * 29 + 5), 0.86) * 0.42;
      const ratio = seededRandom(i * 23 + 4) > 0.68 ? tail : core;
      const velocity = sign * edge * Math.min(0.97, ratio);
      ctx.globalAlpha = 0.32 + seededRandom(i * 31 + 6) * 0.52;
      ctx.beginPath();
      ctx.arc(mapX(radius), mapY(velocity), 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    const opts = options();
    const fraction = measuredFraction(opts);
    drawAxes(false);
    drawGalaxies(opts);
    drawProfile(opts, 1, "rgba(36,113,255,0.95)", 3, "true escape profile");
    drawProfile(opts, fraction, "rgba(231,101,79,0.95)", 2.5, "measured edge", [8, 8]);
    edgeMetric.textContent = `${Math.round(fraction * 100)}% of true profile`;
  }

  function handleResize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    state.width = 920;
    state.height = Math.round(920 * (rect.height / Math.max(1, rect.width)));
    if (!Number.isFinite(state.height) || state.height < 460) state.height = 620;
    canvas.width = Math.floor(state.width * ratio);
    canvas.height = Math.floor(state.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  massSlider.addEventListener("input", draw);
  samplingSlider.addEventListener("input", draw);
  window.addEventListener("resize", handleResize, { passive: true });
  handleResize();
}

function setupCosmologyCanvas() {
  const canvas = document.getElementById("cosmo-canvas");
  const expansionSlider = document.getElementById("expansion-slider");
  const samplingSlider = document.getElementById("cosmo-sampling-slider");
  const edgeMetric = document.getElementById("cosmo-edge-metric");
  if (!canvas || !expansionSlider || !samplingSlider || !edgeMetric) return;

  const ctx = canvas.getContext("2d");
  const state = { width: canvas.width, height: canvas.height };

  function expansionStrength() {
    return (Number(expansionSlider.value) - 50) / 50;
  }

  function samplingStrength() {
    return Number(samplingSlider.value) / 100;
  }

  function measuredFraction() {
    return 0.66 + 0.28 * Math.pow(samplingStrength(), 0.9);
  }

  function baseEscape(radius) {
    return 3650 - 1160 * Math.pow(radius - 0.2, 0.76);
  }

  function expandedEscape(radius, strength) {
    const outerWeight = Math.pow((radius - 0.2) / 0.8, 1.55);
    return baseEscape(radius) * (1 - 0.22 * strength * outerWeight);
  }

  function mapX(radius) {
    const padLeft = 74;
    const padRight = 34;
    return padLeft + ((radius - 0.2) / 0.8) * (state.width - padLeft - padRight);
  }

  function mapY(velocity) {
    const padTop = 40;
    const padBottom = 66;
    return padTop + ((3800 - velocity) / 7600) * (state.height - padTop - padBottom);
  }

  function drawAxes() {
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#fbfcfc";
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.strokeStyle = "rgba(7,16,22,0.1)";
    ctx.lineWidth = 1;
    for (let r = 0.2; r <= 1.001; r += 0.1) {
      const x = mapX(r);
      ctx.beginPath();
      ctx.moveTo(x, mapY(3800));
      ctx.lineTo(x, mapY(-3800));
      ctx.stroke();
    }
    for (let v = -3000; v <= 3000; v += 1000) {
      const y = mapY(v);
      ctx.beginPath();
      ctx.moveTo(mapX(0.2), y);
      ctx.lineTo(mapX(1), y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(7,16,22,0.84)";
    ctx.beginPath();
    ctx.moveTo(mapX(0.2), mapY(-3800));
    ctx.lineTo(mapX(0.2), mapY(3800));
    ctx.lineTo(mapX(1), mapY(3800));
    ctx.stroke();

    ctx.fillStyle = "rgba(7,16,22,0.82)";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText("projected radius", state.width / 2 - 62, state.height - 20);
    ctx.save();
    ctx.translate(24, state.height / 2 + 60);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("line-of-sight velocity", 0, 0);
    ctx.restore();
  }

  function drawCurve(strength, multiplier, color, label, width, dash = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    for (const sign of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i <= 140; i += 1) {
        const radius = 0.2 + (i / 140) * 0.8;
        const x = mapX(radius);
        const y = mapY(sign * expandedEscape(radius, strength) * multiplier);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    if (label) {
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = "800 15px system-ui, sans-serif";
      const r = 0.62;
      const offset = multiplier < 1 ? -220 : 230;
      ctx.fillText(label, mapX(r), mapY(expandedEscape(r, strength) * multiplier + offset));
    }
    ctx.restore();
  }

  function drawGalaxies(strength) {
    const fraction = measuredFraction();
    const count = Math.round(150 + samplingStrength() * 300);
    ctx.fillStyle = "rgba(7,16,22,0.72)";
    for (let i = 0; i < count; i += 1) {
      const radius = 0.2 + seededRandom(i * 41 + 2) * 0.8;
      const edge = expandedEscape(radius, strength) * fraction;
      const sign = seededRandom(i * 43 + 4) > 0.5 ? 1 : -1;
      const core = 0.1 + Math.pow(seededRandom(i * 47 + 6), 0.72) * 0.56;
      const tail = 0.56 + Math.pow(seededRandom(i * 59 + 10), 0.86) * 0.41;
      const ratio = seededRandom(i * 53 + 8) > 0.68 ? tail : core;
      const velocity = sign * edge * Math.min(0.97, ratio);
      ctx.globalAlpha = 0.24 + seededRandom(i * 61 + 12) * 0.5;
      ctx.beginPath();
      ctx.arc(mapX(radius), mapY(velocity), 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    const strength = expansionStrength();
    const fraction = measuredFraction();
    drawAxes();
    drawGalaxies(strength);
    drawCurve(0, 1, "rgba(7,16,22,0.38)", "reference", 2.2, [7, 7]);
    drawCurve(strength, 1, strength >= 0 ? "rgba(92,207,255,0.96)" : "rgba(246,188,95,0.96)", "changed expansion", 3);
    drawCurve(strength, fraction, "rgba(231,101,79,0.96)", "measured edge", 2.5, [8, 8]);
    edgeMetric.textContent = `${Math.round(fraction * 100)}% of true profile`;
  }

  function handleResize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    state.width = 920;
    state.height = Math.round(920 * (rect.height / Math.max(1, rect.width)));
    if (!Number.isFinite(state.height) || state.height < 460) state.height = 620;
    canvas.width = Math.floor(state.width * ratio);
    canvas.height = Math.floor(state.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  expansionSlider.addEventListener("input", draw);
  samplingSlider.addEventListener("input", draw);
  window.addEventListener("resize", handleResize, { passive: true });
  handleResize();
}

setupHeroCluster();
setupEscapeCanvas();
setupCosmologyCanvas();
