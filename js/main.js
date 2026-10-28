// Gift Labarda | Portfolio scripts (brief v4, "Plum Aurora Command Center")
// Everything here is an extra layer: all content is already in the HTML.

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const isPhone = window.matchMedia("(max-width: 699px)").matches;
const isTouch = window.matchMedia("(hover: none)").matches;
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
  if (sameAsMe) {
    clockYou.textContent = "We're in the same time zone ✦";
  } else {
    const phParts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(now);
    const pick = (type) => Number(phParts.find((p) => p.type === type).value);
    const phAsLocal = new Date(pick("year"), pick("month") - 1, pick("day"), pick("hour"), pick("minute"));
    const diff = Math.round((phAsLocal - new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())) / 1800000) / 2;
    const hrs = Math.abs(diff);
    const unit = hrs === 1 ? "hour" : "hours";
    const rel = diff > 0 ? `${hrs} ${unit} behind me` : `${hrs} ${unit} ahead of me`;
    clockYou.textContent = `Your time: ${now.toLocaleTimeString("en-US", timeFormat)} (${rel}). I work async, so you're supported at the times that suit you.`;
  }
  clockYou.hidden = false;
  clockYou.title = visitorZone || "";
}
updateClock();
setInterval(updateClock, 15000);

// ---------- Smooth scrolling (Lenis) ----------
let lenis = null;
// Mouse and trackpad only: touch screens keep the phone's own native scrolling
if (window.Lenis && !reduceMotion && !isTouch) {
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

// ---------- Dialog helpers (drawer, lightbox, resume) ----------
let lastOpener = null;

function openDialog(dialog, opener) {
  lastOpener = opener || null;
  if (lenis) lenis.stop();
  dialog.classList.remove("is-closing");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (!dialog.open || dialog.classList.contains("is-closing")) return;
  // Finish once, from whichever comes first (the closing animation or a backup timer),
  // and clean up both, so nothing left over can close the dialog the next time it opens
  let done = false;
  let timer = null;
  const onEnd = (event) => { if (event.target === dialog) finish(); };
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    dialog.removeEventListener("animationend", onEnd);
    dialog.classList.remove("is-closing");
    if (!dialog.open) return;
    if (typeof dialog.close === "function") dialog.close();
    else {
      dialog.removeAttribute("open");
      dialog.dispatchEvent(new Event("close"));
    }
  };
  if (reduceMotion) { finish(); return; }
  dialog.classList.add("is-closing");
  dialog.addEventListener("animationend", onEnd);
  timer = setTimeout(finish, 450);
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

// ---------- Sparkle burst (unlock animation) ----------
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

let lastSubmit = "email";
$$('button[type="submit"]', form).forEach((btn) => {
  btn.addEventListener("click", () => { lastSubmit = btn.value; });
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
  const via = event.submitter ? event.submitter.value : lastSubmit;
  if (via === "whatsapp") {
    window.open(`https://wa.me/639454219903?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  } else {
    window.location.href = `mailto:workwithmslabarda@gmail.com?subject=${encodeURIComponent(`Work inquiry from ${name}`)}&body=${encodeURIComponent(text)}`;
  }
});

// ---------- "Message me" and "Ask about [package]": jump to the form, pre-filled ----------
function goToForm(message) {
  lastOpener = null;
  $$("dialog").forEach((dialog) => { if (dialog.open) closeDialog(dialog); });
  if (message) {
    fields.message.el.value = message;
    checkField("message");
  }
  const target = $(".quick-form");
  setTimeout(() => {
    if (lenis) lenis.scrollTo(target, { offset: -90 });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    setTimeout(() => fields.name.el.focus({ preventScroll: true }), reduceMotion ? 0 : 700);
  }, 250);
}

document.addEventListener("click", (event) => {
  const ask = event.target.closest(".ask-pack");
  if (ask) {
    goToForm(`Hi Gift, I'm interested in the ${ask.dataset.package} package.`);
    return;
  }
  const msg = event.target.closest(".message-me");
  if (msg) goToForm(msg.dataset.message);
});

// ---------- Resume viewer: view only ----------
const viewer = $(".resume-viewer");
let viewerLoaded = false;

$$(".open-resume").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!viewerLoaded) {
      // Pages are CSS backgrounds (not <img>), loaded only when the viewer opens
      $$(".resume-page", viewer).forEach((page) => { page.style.backgroundImage = `url("${page.dataset.bg}")`; });
      viewerLoaded = true;
    }
    viewer.classList.remove("is-blurred");
    openDialog(viewer, btn);
    $(".resume-scroll", viewer).scrollTop = 0;
    $(".resume-close", viewer).focus();
  });
});
$(".resume-close", viewer).addEventListener("click", () => closeDialog(viewer));

// Deterrents (a website cannot fully block screenshots; these make copying harder)
["contextmenu", "dragstart", "selectstart", "copy", "cut"].forEach((type) => {
  viewer.addEventListener(type, (event) => event.preventDefault());
});

document.addEventListener("keydown", (event) => {
  if (!viewer.open) return;
  const key = (event.key || "").toLowerCase();
  if ((event.ctrlKey || event.metaKey) && (key === "s" || key === "p")) {
    event.preventDefault();
    showToast("This resume is view only. Message me for a copy.");
  }
  if (key === "printscreen") viewer.classList.add("is-blurred");
});

document.addEventListener("keyup", (event) => {
  if (!viewer.open || (event.key || "").toLowerCase() !== "printscreen") return;
  // Best effort: overwrite what the key just copied
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText("").catch(() => {});
  showToast("This resume is view only. Message me for a copy.");
  setTimeout(() => viewer.classList.remove("is-blurred"), 1200);
});

// Blur the pages whenever the tab or app is not in front (also iOS and Android app switching)
const blurViewer = () => { if (viewer.open) viewer.classList.add("is-blurred"); };
const unblurViewer = () => { if (!document.hidden) viewer.classList.remove("is-blurred"); };
window.addEventListener("blur", blurViewer);
window.addEventListener("pagehide", blurViewer);
window.addEventListener("focus", unblurViewer);
window.addEventListener("pageshow", unblurViewer);
document.addEventListener("visibilitychange", () => (document.hidden ? blurViewer() : unblurViewer()));

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
    const noTilt = tile.matches(".tile-work, .tile-contact, .tile-tools, .tile-create, .tile-services, .tile-packages");
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
  // iOS shows and hides its address bar while scrolling; ignore those resizes
  ScrollTrigger.config({ ignoreMobileResize: true });
  const horizontal = window.matchMedia("(min-width: 700px)").matches;

  // Tiles enter with stagger: fade, rise, slight scale, blur to sharp.
  // The name tile is left alone: its letters have their own intro.
  ScrollTrigger.batch(".tile:not(.tile-name)", {
    start: "top 92%",
    once: true,
    onEnter: (batch) => gsap.from(batch, {
      opacity: 0,
      y: isTouch ? 20 : 30,
      scale: 0.96,
      filter: isTouch ? "none" : "blur(8px)",
      duration: isTouch ? 0.7 : 0.9,
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


// ---------- Greeting by the visitor's own time ----------
(() => {
  const greet = $(".greet");
  if (!greet) return;
  const hour = new Date().getHours();
  const text = hour < 5 ? "Hello, night owl 🌙" : hour < 12 ? "Good morning ☀️" : hour < 18 ? "Good afternoon ✦" : "Good evening 🌙";
  greet.textContent = text;
  greet.hidden = false;
})();

// ---------- Floating "Message me" button: shows after the hero, hides at the contact form ----------
(() => {
  const fab = $(".fab-message");
  const hero = $(".tile-name");
  const contact = $("#contact");
  if (!fab || !hero || !contact || !("IntersectionObserver" in window)) return;
  let pastHero = false;
  let atContact = false;
  const update = () => fab.classList.toggle("is-visible", pastHero && !atContact);
  new IntersectionObserver(([entry]) => { pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0; update(); }).observe(hero);
  new IntersectionObserver(([entry]) => { atContact = entry.isIntersecting; update(); }, { threshold: 0.15 }).observe(contact);
})();

// ---------- Quiz: "What's your business running on?" ----------
(() => {
  const quiz = $(".quiz");
  if (!quiz) return;
  const form = $(".quiz-form", quiz);
  const steps = $$(".quiz-step", quiz);
  const bar = $(".quiz-bar", quiz);
  const count = $(".quiz-count", quiz);
  const backBtn = $(".quiz-back", quiz);
  const nextBtn = $(".quiz-next", quiz);
  const result = $(".quiz-result", quiz);
  let index = 0;

  const starts = {
    "inbox and calendar": "Take over your inbox and calendar so nothing slips",
    "lead follow-up": "Set up a follow-up system so every lead hears back fast",
    "client communication": "Handle client replies and messages the same day",
    "social media and content": "Plan and post your content on a steady calendar",
    "admin and data entry": "Clear the admin backlog and keep records clean",
    "processes and SOPs": "Write simple SOPs so the business runs without you",
    "email marketing": "Build email campaigns and automations that keep clients engaged",
    "website and landing pages": "Build or update your landing pages and booking pages",
    "ads": "Support your Meta ads setup and track your leads",
    "marketing strategy": "Build your marketing plan: content pillars, a monthly calendar and a growth roadmap",
  };
  const types = [
    { max: 5, emoji: "🧱", name: "The Steady Builder", pack: "Standard: Get organized", desc: "You've built good habits. Now protect your time: hand off the daily admin so you can focus on growth." },
    { max: 8, emoji: "🤹", name: "The Juggler", pack: "Premium: Run smoother", desc: "You're keeping a lot of balls in the air, and a few are about to drop. A system for follow-ups and content will take the pressure off." },
    { max: 99, emoji: "🦸", name: "The Superhero Founder", pack: "Premium+: Your operations partner", desc: "You're doing everything yourself, and it's working, for now. It's time for a partner who handles operations so you can lead." },
  ];

  function stepValid(step) {
    const kind = step.dataset.kind;
    if (kind === "text") return true;
    const checked = $$("input:checked", step);
    if (!checked.length) return false;
    const other = $(".quiz-other", step);
    if (other && !other.hidden && !other.value.trim()) return false;
    return true;
  }

  function show(i) {
    index = i;
    steps.forEach((s, n) => {
      s.classList.toggle("is-active", n === i);
      s.hidden = n !== i;
    });
    bar.style.width = `${((i + 1) / steps.length) * 100}%`;
    count.textContent = `Question ${i + 1} of ${steps.length}`;
    backBtn.style.visibility = i === 0 ? "hidden" : "visible";
    nextBtn.firstChild.textContent = i === steps.length - 1 ? "See my result " : "Next ";
    nextBtn.disabled = !stepValid(steps[i]);
  }

  form.addEventListener("change", (event) => {
    const step = event.target.closest(".quiz-step");
    if (!step) return;
    // "Something else" reveals a text box
    const other = $(".quiz-other", step);
    if (other) {
      const wantsOther = $$('input[value="other"]:checked', step).length > 0;
      other.hidden = !wantsOther;
      if (wantsOther && event.target.value === "other") other.focus();
    }
    // Multi-select limit
    const max = Number(step.dataset.max || 0);
    if (max) {
      const boxes = $$('input[type="checkbox"]', step);
      const picked = boxes.filter((b) => b.checked).length;
      boxes.forEach((b) => { b.disabled = !b.checked && picked >= max; });
    }
    nextBtn.disabled = !stepValid(step);
    // Single choice (scored questions): move on by itself
    if (step.dataset.kind === "single" && event.target.type === "radio" && event.target.value !== "other" && index < steps.length - 1) {
      setTimeout(() => show(index + 1), reduceMotion ? 0 : 320);
    }
  });
  form.addEventListener("input", (event) => {
    const step = event.target.closest(".quiz-step");
    if (step) nextBtn.disabled = !stepValid(step);
  });
  form.addEventListener("submit", (event) => event.preventDefault());

  backBtn.addEventListener("click", () => { if (index > 0) show(index - 1); });
  nextBtn.addEventListener("click", () => {
    if (!stepValid(steps[index])) return;
    if (index < steps.length - 1) show(index + 1);
    else finish();
  });

  let summary = "";
  function finish() {
    const data = new FormData(form);
    let niche = data.get("niche");
    if (niche === "other") niche = (data.get("niche-other") || "").trim() || "business";
    const slipping = data.getAll("slipping").filter((v) => v !== "other");
    const otherSlip = (data.get("slipping-other") || "").trim();
    const notes = (data.get("notes") || "").trim();
    let score = ["q1", "q2", "q3"].reduce((sum, k) => sum + Number(data.get(k) || 0), 0);
    const totalSlipping = slipping.length + (otherSlip ? 1 : 0);
    score += totalSlipping >= 3 ? 2 : totalSlipping === 2 ? 1 : 0;
    const type = types.find((t) => score <= t.max);

    $(".quiz-emoji", result).textContent = type.emoji;
    $(".quiz-type", result).textContent = type.name;
    $(".quiz-desc", result).textContent = type.desc;
    $(".quiz-pack", result).textContent = type.pack;
    const list = $(".quiz-starts", result);
    list.innerHTML = "";
    const items = slipping.map((s) => starts[s]).filter(Boolean);
    if (otherSlip) items.push(`Sort out: ${otherSlip}`);
    if (!items.length) items.push("Map your weekly workflow and find what to hand off first");
    items.slice(0, 4).forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });

    const slipText = [...slipping, ...(otherSlip ? [otherSlip] : [])].join(", ");
    const article = /^[aeiou]/i.test(niche) ? "an" : "a";
    summary = `Hi Gift, I run ${article} ${niche}. I took your check-up and I'm ${type.name} ${type.emoji}.`;
    if (slipText) summary += ` What's slipping: ${slipText}.`;
    if (notes) summary += ` More about me: ${notes}`;
    summary += ` I'm interested in ${type.pack.split(":")[0]}.`;

    form.hidden = true;
    $(".quiz-progress", quiz).hidden = true;
    count.hidden = true;
    result.hidden = false;
    result.focus({ preventScroll: true });
    if (!reduceMotion && typeof burst === "function") {
      const box = $(".quiz-type", result).getBoundingClientRect();
      burst(box.left + box.width / 2, box.top + box.height / 2, 18);
    }
  }

  $(".quiz-send", result).addEventListener("click", () => goToForm(summary));
  $(".quiz-retake", result).addEventListener("click", () => {
    form.reset();
    $$(".quiz-other", form).forEach((o) => { o.hidden = true; });
    $$('input[type="checkbox"]', form).forEach((b) => { b.disabled = false; });
    form.hidden = false;
    $(".quiz-progress", quiz).hidden = false;
    count.hidden = false;
    result.hidden = true;
    show(0);
  });

  show(0);
})();

// ---------- Live website previews ----------
// Website and landing page cards load a fresh screenshot of the real site.
// The saved image shows first and stays if the live one can't load.
(() => {
  const cards = $$('.work-card[data-type="site"], .work-card[data-type="page"]');
  if (!cards.length) return;
  const shotUrl = (url) =>
    "https://s0.wp.com/mshots/v1/" + encodeURIComponent(url) + "?w=720&h=1350&vpw=1280&vph=2400";

  function loadLive(card, tries) {
    const img = $(".frame-screen img", card);
    const link = $(".work-detail", card).content.querySelector("a.btn-primary[href^='http']");
    if (!img || !link) return;
    const src = shotUrl(link.href);
    const probe = new Image();
    probe.referrerPolicy = "no-referrer";
    probe.onload = () => {
      // While a new screenshot is being made, the service sends a small placeholder. Try again shortly.
      if (probe.naturalWidth < 600) {
        if (tries > 0) setTimeout(() => loadLive(card, tries - 1), 5000);
        return;
      }
      img.src = src;
      card.classList.add("is-live");
    };
    probe.src = src;
  }

  // Start when the work section gets close, then refresh every card at once
  const section = cards[0].closest("section") || cards[0];
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    cards.forEach((card) => loadLive(card, 4));
  }, { rootMargin: "800px 0px" });
  io.observe(section);
})();
