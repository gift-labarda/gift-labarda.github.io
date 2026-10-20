// Gift Labarda | Portfolio scripts (brief v4, "Plum Aurora Command Center")
// Everything here is an extra layer: all content is already in the HTML.

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const isPhone = window.matchMedia("(max-width: 699px)").matches;
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// ---------- Footer year ----------
$$(".year").forEach((el) => { el.textContent = new Date().getFullYear(); });

// ---------- Toast ----------
const toast = $(".toast");
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-showing");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-showing"), 2200);
}

// ---------- Light / dark theme (remembered) ----------
const themeToggle = $(".theme-toggle");
const themeMeta = $('meta[name="theme-color"]');

function showTheme() {
  const light = root.dataset.theme === "light";
  themeToggle.setAttribute("aria-pressed", String(light));
  themeToggle.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
  themeMeta.setAttribute("content", light ? "#FBF7FF" : "#1F1229");
}

themeToggle.addEventListener("click", () => {
  const light = root.dataset.theme !== "light";
  if (light) root.dataset.theme = "light";
  else delete root.dataset.theme;
  try { localStorage.setItem("theme", light ? "light" : "dark"); } catch (e) {}
  showTheme();
  stars.recolor();
});
showTheme();

// ---------- Phone menu ----------
const nav = $("#site-nav");
const menuBtn = $(".menu-btn");

function setMenu(open) {
  nav.classList.toggle("is-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
$$("a", nav).forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });

// ---------- Active nav link follows the section ----------
const navLinks = $$("a", nav);
const navTargets = navLinks.map((link) => $(link.hash));

function updateNav() {
  const line = window.innerHeight * 0.4;
  let current = -1;
  navTargets.forEach((target, i) => {
    if (target && target.getBoundingClientRect().top <= line) current = i;
  });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = navLinks.length - 1;
  navLinks.forEach((link, i) => {
    link.classList.toggle("is-active", i === current);
    if (i === current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

let navTicking = false;
window.addEventListener("scroll", () => {
  if (navTicking) return;
  navTicking = true;
  requestAnimationFrame(() => { updateNav(); navTicking = false; });
}, { passive: true });
updateNav();

// ---------- Live clock: my time in the Philippines and the visitor's time ----------
const clockPH = $(".clock-ph");
const clockYou = $(".clock-you");
const timeFormat = { hour: "numeric", minute: "2-digit" };

function updateClock() {
  const now = new Date();
  clockPH.textContent = now.toLocaleTimeString("en-US", { ...timeFormat, timeZone: "Asia/Manila" });
  const visitorZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const sameAsMe = now.toLocaleTimeString("en-US", { ...timeFormat, timeZone: "Asia/Manila" }) === now.toLocaleTimeString("en-US", timeFormat);
  clockYou.textContent = sameAsMe ? "Same time zone as you" : `Your time: ${now.toLocaleTimeString("en-US", timeFormat)}`;
  clockYou.hidden = false;
  clockYou.title = visitorZone || "";
}
updateClock();
setInterval(updateClock, 15000);

// ---------- Smooth scrolling (Lenis) ----------
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
  if (window.gsap && window.ScrollTrigger) {
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  } else {
    const loop = (time) => { lenis.raf(time); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  // Anchor links scroll smoothly and land below the top bar
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = link.hash.length > 1 ? $(link.hash) : null;
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
      history.replaceState(null, "", link.hash);
    });
  });
}

// ---------- Tools marquee: repeat the logos until each row is wide enough to loop without a gap ----------
if (!reduceMotion) {
  $$(".marquee").forEach((marquee) => {
    const lists = $$(".marquee-list", marquee);
    const originals = $$("li", lists[0]);
    let guard = 0;
    while (lists[0].scrollWidth < marquee.clientWidth + 40 && guard < 4) {
      lists.forEach((list) => {
        originals.forEach((item) => {
          const copy = item.cloneNode(true);
          copy.setAttribute("aria-hidden", "true");
          list.appendChild(copy);
        });
      });
      guard += 1;
    }
  });
}

// ---------- Flip cards (why tile) and the portrait flip ----------
$$(".flip").forEach((card) => {
  const btn = $(".flip-btn", card);
  btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", (event) => {
    // With a mouse, hover already flips the card. Keyboard and touch toggle it.
    if (finePointer && event.detail !== 0) return;
    const flipped = card.classList.toggle("is-flipped");
    btn.setAttribute("aria-pressed", String(flipped));
  });
});

const portrait = $(".portrait");
portrait.addEventListener("click", (event) => {
  if (finePointer && event.detail !== 0) return;
  const flipped = portrait.classList.toggle("is-flipped");
  portrait.setAttribute("aria-pressed", String(flipped));
});

// ---------- Rotating word: clinic / coaching brand / ... ----------
const words = $$(".rotator-word");
if (!reduceMotion && words.length) {
  let wordIndex = 0;
  setInterval(() => {
    const current = words[wordIndex];
    wordIndex = (wordIndex + 1) % words.length;
    current.classList.remove("is-active");
    current.classList.add("is-leaving");
    words[wordIndex].classList.remove("is-leaving");
    words[wordIndex].classList.add("is-active");
    setTimeout(() => current.classList.remove("is-leaving"), 650);
  }, 2200);
}

// ---------- Dialog helpers (drawer and lightbox) ----------
let lastOpener = null;

function openDialog(dialog, opener) {
  lastOpener = opener || null;
  if (lenis) lenis.stop();
  dialog.showModal();
}

function closeDialog(dialog) {
  if (!dialog.open || dialog.classList.contains("is-closing")) return;
  const finish = () => {
    dialog.classList.remove("is-closing");
    dialog.close();
  };
  if (reduceMotion) { finish(); return; }
  dialog.classList.add("is-closing");
  dialog.addEventListener("animationend", finish, { once: true });
  setTimeout(() => { if (dialog.open) finish(); }, 400);
}

$$("dialog").forEach((dialog) => {
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDialog(dialog); });
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(dialog); });
  dialog.addEventListener("close", () => {
    if (lenis) lenis.start();
    if (lastOpener) lastOpener.focus({ preventScroll: true });
  });
});

// ---------- Drawer (services and full history) ----------
const drawer = $(".drawer");
const drawerBody = $(".drawer-body");
$(".drawer-close").addEventListener("click", () => closeDialog(drawer));

$$("[data-drawer]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const template = $(`#drawer-${btn.dataset.drawer}`);
    if (!template) return;
    drawerBody.replaceChildren(template.content.cloneNode(true));
    const heading = $("h2", drawerBody);
    if (heading) heading.id = "drawer-title";
    // "See related work" jumps to the work tile with the right filter
    $$(".see-work", drawerBody).forEach((seeBtn) => {
      seeBtn.addEventListener("click", () => {
        closeDialog(drawer);
        lastOpener = null;
        coverflow.setFilter(seeBtn.dataset.filterTo);
        const work = $("#work");
        if (lenis) lenis.scrollTo(work, { offset: -80 });
        else work.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
    openDialog(drawer, btn);
  });
});

// ---------- Lightbox (work samples) ----------
const lightbox = $(".lightbox");
const lbMedia = $(".lightbox-media");
const lbBody = $(".lightbox-body");
$(".lightbox-close").addEventListener("click", () => closeDialog(lightbox));

function openLightbox(card, opener) {
  const content = $(".work-detail", card).content.cloneNode(true);
  lbMedia.replaceChildren();
  const images = $(".lb-images", content);
  if (images) {
    lbMedia.append(...images.children);
    images.remove();
  } else {
    // Websites and landing pages: show the full screenshot in a scrollable frame
    const shot = $(".frame-screen img", card);
    if (shot) {
      const wrap = document.createElement("div");
      wrap.className = "lb-shot";
      const img = shot.cloneNode();
      img.alt = `Screenshot of ${$(".work-title", card).textContent}`;
      img.removeAttribute("loading");
      wrap.appendChild(img);
      lbMedia.appendChild(wrap);
    }
  }
  lbBody.replaceChildren(content);
  const heading = $("h3", lbBody);
  if (heading) heading.id = "lightbox-title";
  openDialog(lightbox, opener);
  // Zoom in from the clicked card
  const from = card.getBoundingClientRect();
  const to = lightbox.getBoundingClientRect();
  lightbox.style.setProperty("--ox", `${from.left + from.width / 2 - to.left}px`);
  lightbox.style.setProperty("--oy", `${from.top + from.height / 2 - to.top}px`);
}

// ---------- Coverflow with filters ----------
const coverflow = (() => {
  const wrap = $(".coverflow");
  const track = $(".coverflow-track", wrap);
  const cards = $$(".work-card", track);
  const prev = $(".cf-prev", wrap);
  const next = $(".cf-next", wrap);
  const count = $(".cf-count", wrap);
  const filterBtns = $$(".filter");
  const pill = $(".filter-pill");
  let visible = cards.slice();
  let active = 0;

  wrap.classList.add("is-3d");

  function layout() {
    const spacing = isPhone ? 150 : 210;
    cards.forEach((card) => {
      const i = visible.indexOf(card);
      if (i === -1) {
        card.classList.add("is-out");
        card.classList.remove("is-active");
        card.hidden = true;
        return;
      }
      card.hidden = false;
      const offset = i - active;
      const abs = Math.abs(offset);
      card.classList.toggle("is-out", abs > 3);
      card.classList.toggle("is-active", offset === 0);
      card.style.zIndex = String(100 - abs);
      card.style.transform = `translateX(${offset * spacing}px) translateZ(${-abs * 140}px) rotateY(${offset * -32}deg) scale(${1 - Math.min(abs, 3) * 0.06})`;
      card.style.filter = abs ? `brightness(${1 - Math.min(abs, 3) * 0.15})` : "";
      $(".work-open", card).tabIndex = offset === 0 ? 0 : -1;
      $(".work-open", card).setAttribute("aria-hidden", offset === 0 ? "false" : "true");
    });
    count.textContent = visible.length ? `${active + 1} / ${visible.length}` : "";
    prev.disabled = active <= 0;
    next.disabled = active >= visible.length - 1;
  }

  function go(index) {
    active = Math.max(0, Math.min(visible.length - 1, index));
    layout();
  }

  function movePill() {
    const current = filterBtns.find((b) => b.getAttribute("aria-pressed") === "true");
    pill.parentElement.style.setProperty("--pill-x", `${current.offsetLeft - 4}px`);
    pill.parentElement.style.setProperty("--pill-w", `${current.offsetWidth}px`);
  }

  function setFilter(type) {
    filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === type)));
    visible = cards.filter((c) => type === "all" || c.dataset.type === type);
    active = 0;
    layout();
    movePill();
  }

  filterBtns.forEach((b) => b.addEventListener("click", () => setFilter(b.dataset.filter)));
  prev.addEventListener("click", () => go(active - 1));
  next.addEventListener("click", () => go(active + 1));

  // Click a side card to bring it forward; click the front card to open it
  cards.forEach((card) => {
    $(".work-open", card).addEventListener("click", (event) => {
      if (dragMoved) { event.preventDefault(); return; }
      const i = visible.indexOf(card);
      if (i !== active) go(i);
      else openLightbox(card, event.currentTarget);
    });
  });

  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") { go(active + 1); $(".work-open", visible[active]).focus(); }
    if (event.key === "ArrowLeft") { go(active - 1); $(".work-open", visible[active]).focus(); }
  });

  // Drag and swipe
  let startX = 0;
  let dragging = false;
  let dragMoved = false;
  track.addEventListener("pointerdown", (event) => {
    dragging = true;
    dragMoved = false;
    startX = event.clientX;
  });
  window.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    if (Math.abs(event.clientX - startX) > 8) {
      dragMoved = true;
      track.classList.add("is-dragging");
    }
  });
  window.addEventListener("pointerup", (event) => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
    setTimeout(() => { dragMoved = false; }, 0);
  });
  track.addEventListener("dragstart", (event) => event.preventDefault());

  // Autoplay while visible, paused on hover or focus
  let paused = false;
  let onScreen = false;
  wrap.addEventListener("pointerenter", () => { paused = true; });
  wrap.addEventListener("pointerleave", () => { paused = false; });
  wrap.addEventListener("focusin", () => { paused = true; });
  wrap.addEventListener("focusout", () => { paused = false; });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { onScreen = entries[0].isIntersecting; }, { threshold: 0.4 }).observe(wrap);
  }
  if (!reduceMotion) {
    setInterval(() => {
      if (paused || !onScreen || document.hidden || lightbox.open) return;
      go(active >= visible.length - 1 ? 0 : active + 1);
    }, 3800);
  }

  window.addEventListener("resize", () => { layout(); movePill(); });
  if (document.fonts) document.fonts.ready.then(movePill);
  setFilter("all");
  return { setFilter };
})();

// ---------- Sparkle burst and confetti ----------
function burst(x, y, count = 14, chars = ["✦", "✧", "·"]) {
  if (reduceMotion) return;
  for (let i = 0; i < count; i += 1) {
    const s = document.createElement("span");
    s.className = "burst";
    s.textContent = chars[i % chars.length];
    const angle = (Math.PI * 2 * i) / count;
    const dist = 40 + Math.random() * 50;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    s.style.setProperty("--rot", `${Math.random() * 180}deg`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}

function confetti(x, y) {
  if (reduceMotion) return;
  const colors = ["#D3C2E1", "#7E5F96", "#C7798F", "#FBF7FF", "#4F2E69"];
  for (let i = 0; i < 46; i += 1) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    c.style.background = colors[i % colors.length];
    c.style.setProperty("--dx", `${(Math.random() - 0.5) * 420}px`);
    c.style.setProperty("--dy", `${-80 - Math.random() * 240 + Math.random() * 200}px`);
    c.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1500);
  }
}

// ---------- Locked tiles: unlock animation ----------
$$(".unlock").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tile = btn.closest(".tile-locked");
    const lock = $(".lock", tile);
    const message = $(".unlock-msg", tile);
    tile.classList.add("is-shaking");
    setTimeout(() => {
      tile.classList.remove("is-shaking");
      tile.classList.add("is-unlocked");
      const box = lock.getBoundingClientRect();
      burst(box.left + box.width / 2, box.top + box.height / 2);
      message.textContent = btn.dataset.unlocked;
      message.tabIndex = -1;
      message.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 420);
  });
});

// ---------- Giveaway: confetti on "Enter now" (the email still opens) ----------
$(".enter-btn").addEventListener("click", (event) => {
  const box = event.currentTarget.getBoundingClientRect();
  confetti(box.left + box.width / 2, box.top + box.height / 2);
});

// ---------- Email button: copy the address and show a toast ----------
$(".copy-email").addEventListener("click", () => {
  const address = "workwithmslabarda@gmail.com";
  const done = () => showToast("Copied! " + address);
  // Older method, used when the clipboard API is missing or refused
  const fallback = () => {
    const field = document.createElement("textarea");
    field.value = address;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    try { if (document.execCommand("copy")) done(); } catch (e) {}
    field.remove();
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(address).then(done, fallback);
  } else {
    fallback();
  }
});

// ---------- Quick message form ----------
const form = $(".quick-form");
const fields = {
  name: { el: $("#f-name"), msg: "Please add your name." },
  business: { el: $("#f-business"), msg: "Please add your business name." },
  message: { el: $("#f-message"), msg: "Please tell me a little about what you need." },
};

function checkField(key) {
  const { el, msg } = fields[key];
  const ok = el.value.trim().length > 0;
  el.setAttribute("aria-invalid", String(!ok));
  $(`#${el.id}-err`).textContent = ok ? "" : msg;
  return ok;
}

Object.keys(fields).forEach((key) => {
  fields[key].el.addEventListener("blur", () => { if (fields[key].el.value) checkField(key); });
  fields[key].el.addEventListener("input", () => {
    if (fields[key].el.getAttribute("aria-invalid") === "true") checkField(key);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const results = Object.keys(fields).map(checkField);
  if (results.includes(false)) {
    fields[Object.keys(fields)[results.indexOf(false)]].el.focus();
    return;
  }
  const name = fields.name.el.value.trim();
  const business = fields.business.el.value.trim();
  const message = fields.message.el.value.trim();
  const text = `Hi Gift, I'm ${name} from ${business}. ${message}`;
  if (event.submitter && event.submitter.value === "whatsapp") {
    window.open(`https://wa.me/639454219903?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  } else {
    window.location.href = `mailto:workwithmslabarda@gmail.com?subject=${encodeURIComponent(`Work inquiry from ${name}`)}&body=${encodeURIComponent(text)}`;
  }
});

// ---------- Ripple on button click ----------
$$(".btn").forEach((btn) => {
  btn.addEventListener("pointerdown", (event) => {
    if (reduceMotion) return;
    const box = btn.getBoundingClientRect();
    const r = document.createElement("span");
    r.className = "ripple";
    r.style.left = `${event.clientX - box.left}px`;
    r.style.top = `${event.clientY - box.top}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 650);
  });
});

// ---------- Starfield canvas (twinkling stars, sparkles, mouse parallax) ----------
const stars = (() => {
  const canvas = $(".stars");
  const ctx = canvas.getContext("2d");
  const count = isPhone ? 28 : 70;
  let list = [];
  let width = 0;
  let height = 0;
  let color = "251,247,255";
  let px = 0;
  let py = 0;
  let running = false;

  function recolor() {
    color = root.dataset.theme === "light" ? "126,95,150" : "251,247,255";
    if (reduceMotion) draw(0);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    list = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.3,
      depth: Math.random() * 0.8 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.8 + 0.4,
      sparkle: Math.random() < 0.08,
    }));
  }

  function sparkleShape(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x, y, x + size, y);
    ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y);
    ctx.quadraticCurveTo(x, y, x, y - size);
    ctx.fill();
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    list.forEach((s) => {
      const alpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(time * 0.001 * s.speed + s.phase));
      const x = s.x + px * s.depth * 18;
      const y = s.y + py * s.depth * 18;
      ctx.fillStyle = `rgba(${color},${alpha.toFixed(3)})`;
      if (s.sparkle) sparkleShape(x, y, 3 + s.r * 2);
      else {
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function loop(time) {
    if (!running) return;
    draw(time);
    requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    requestAnimationFrame(loop);
  }

  resize();
  recolor();
  if (reduceMotion) draw(0);
  else start();

  window.addEventListener("resize", () => { resize(); if (reduceMotion) draw(0); });
  // Pause when the tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) running = false;
    else start();
  });
  if (finePointer && !reduceMotion) {
    window.addEventListener("pointermove", (event) => {
      px = event.clientX / width - 0.5;
      py = event.clientY / height - 0.5;
    }, { passive: true });
  }
  return { recolor };
})();

// ---------- Desktop only: tilt, spotlight, magnetic buttons, custom cursor ----------
if (finePointer && !reduceMotion) {
  $$(".tile").forEach((tile) => {
    const noTilt = tile.matches(".tile-work, .tile-contact, .tile-giveaway, .tile-tools");
    tile.addEventListener("pointermove", (event) => {
      const box = tile.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      tile.style.setProperty("--mx", `${x * 100}%`);
      tile.style.setProperty("--my", `${y * 100}%`);
      if (noTilt) return;
      // Bigger tiles tilt less, so they never feel wobbly (max 6 degrees)
      const max = Math.min(6, 2400 / box.width);
      tile.style.setProperty("--rx", `${((0.5 - y) * max).toFixed(2)}deg`);
      tile.style.setProperty("--ry", `${((x - 0.5) * max).toFixed(2)}deg`);
    });
    tile.addEventListener("pointerleave", () => {
      tile.style.setProperty("--rx", "0deg");
      tile.style.setProperty("--ry", "0deg");
    });
  });

  $$(".magnetic").forEach((btn) => {
    btn.addEventListener("pointermove", (event) => {
      const box = btn.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height / 2);
      btn.style.transform = `translate(${dx * 0.2}px, ${dy * 0.3}px)`;
    });
    btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
  });

  root.classList.add("has-cursor");
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  const ringLabel = $(".cursor-label");
  const glow = $(".cursor-glow");
  let mx = 0;
  let my = 0;
  let rx = 0;
  let ry = 0;

  window.addEventListener("pointermove", (event) => {
    mx = event.clientX;
    my = event.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    dot.classList.add("is-visible");
    ring.classList.add("is-visible");
    const labelled = event.target.closest && event.target.closest("[data-cursor]");
    ringLabel.textContent = labelled ? labelled.dataset.cursor : "";
    ring.classList.toggle("has-label", Boolean(labelled));
    ring.classList.toggle("is-link", !labelled && Boolean(event.target.closest && event.target.closest("a, button, input, textarea")));
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    dot.classList.remove("is-visible");
    ring.classList.remove("is-visible");
  });

  (function follow() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    glow.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(follow);
  })();
}

// ---------- Scroll animations (GSAP + ScrollTrigger) ----------
const steps = $$(".process li");
const lineFill = $(".process-line-fill");

if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
  steps.forEach((s) => s.classList.add("is-lit"));
} else {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const horizontal = window.matchMedia("(min-width: 700px)").matches;

  // Tiles enter with stagger: fade, rise, slight scale, blur to sharp.
  // The name tile is left alone: its letters have their own intro.
  ScrollTrigger.batch(".tile:not(.tile-name)", {
    start: "top 92%",
    once: true,
    onEnter: (batch) => gsap.from(batch, {
      opacity: 0,
      y: 30,
      scale: 0.96,
      filter: "blur(8px)",
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.08,
      clearProps: "opacity,transform,filter",
    }),
  });

  // Section titles reveal word by word
  $$(".split").forEach((title) => {
    const html = title.innerHTML;
    if (title.querySelector("em")) {
      // Keep the italic accent word intact
      title.innerHTML = html.replace(/(<em[^>]*>.*?<\/em>)|([^\s<]+)/g, (m) => `<span class="word">${m}</span>`);
    } else {
      title.innerHTML = title.textContent.split(" ").map((w) => `<span class="word">${w}</span>`).join(" ");
    }
    gsap.from($$(".word", title), {
      opacity: 0,
      yPercent: 60,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.05,
      scrollTrigger: { trigger: title, start: "top 90%", once: true },
    });
  });

  // Logos fall in with a bounce the first time the tools tile appears
  gsap.from(".tool", {
    y: isPhone ? -40 : -80,
    opacity: 0,
    rotation: () => gsap.utils.random(-12, 12),
    duration: 0.9,
    ease: "bounce.out",
    stagger: { each: 0.025, from: "random" },
    clearProps: "transform,opacity",
    scrollTrigger: { trigger: ".tile-tools", start: "top 95%", once: true },
  });

  // Process: a glowing line draws across and each step lights up in turn
  gsap.fromTo(lineFill, horizontal ? { scaleX: 0 } : { scaleY: 0 }, {
    scaleX: 1,
    scaleY: 1,
    ease: "none",
    scrollTrigger: {
      trigger: ".tile-process",
      start: "top 85%",
      end: "bottom 55%",
      scrub: true,
      onUpdate: (self) => {
        steps.forEach((s, i) => s.classList.toggle("is-lit", self.progress >= i / steps.length + 0.05));
      },
    },
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
}
