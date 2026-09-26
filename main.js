// @ohaiibuzzle — tiny bits of JS. No frameworks were harmed.
(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const rand = (a, b) => a + Math.random() * (b - a);

    const shuffle = (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    /* ---------- bokeh ---------- */
    const bokeh = $(".bokeh");
    const cols = ["#ff5fa8", "#9b7bff", "#ffb547", "#3fd9c8", "#ff8a5c", "#7aa2ff"];
    const n = innerWidth < 600 ? 10 : 18;
    for (let i = 0; i < n; i++) {
        const s = document.createElement("span");
        const size = rand(40, 220);
        s.style.cssText = `
            width:${size}px;height:${size}px;
            left:${rand(-5, 95)}%;top:${rand(-5, 95)}%;
            --col:${cols[i % cols.length]};
            --o:${rand(.12, .38).toFixed(2)};
            --b:${rand(2, 14).toFixed(0)}px;
            --d:${rand(20, 45).toFixed(0)}s;
            --dx:${rand(-80, 80).toFixed(0)}px;
            --dy:${rand(-80, 80).toFixed(0)}px;
            animation-delay:${-rand(0, 40).toFixed(0)}s;`;
        bokeh.appendChild(s);
    }

    /* ---------- boop the name ---------- */
    const name = $("#name");
    const nicknames = ["buzzle", "buzz", "ohaii", "🐝", "buzzle"];
    let nick = 0;
    name.addEventListener("click", () => {
        name.classList.remove("boop");
        void name.offsetWidth;
        name.classList.add("boop");
        nick = (nick + 1) % nicknames.length;
        name.textContent = nicknames[nick];
    });

    /* ---------- project filters ---------- */
    const chips = $$(".chip");
    const cards = $$("#grid .card");
    chips.forEach((chip) =>
        chip.addEventListener("click", () => {
            chips.forEach((c) => c.classList.toggle("on", c === chip));
            const f = chip.dataset.f;
            cards.forEach((card) => {
                const show = f === "all" || card.dataset.cat === f;
                card.classList.toggle("hide", !show);
                card.classList.remove("pop");
                if (show && !reduced) {
                    void card.offsetWidth;
                    card.classList.add("pop");
                }
            });
        })
    );

    /* ---------- photos ---------- */
    // the list lives in photos.js (kept in sync by _tools/sync-photos.py)
    const PHOTOS = window.PHOTOS || [];
    const isPlace = (p) => p.kind === "places";
    const isPortrait = (p) => p.h > p.w;
    // no captions on purpose: just a description for screen readers
    // (photos.js "alt", or a generic one if a photo doesn't have it yet)
    const label = (p) => p.alt || (isPlace(p) ? "Photo of a place" : "Cosplay photo");

    // shuffled fresh on every page load, but always opening on a place
    const order = shuffle(PHOTOS);
    // (a landscape-shaped one, so the strip never opens on a tall photo)
    let firstPlace = order.findIndex((p) => isPlace(p) && !isPortrait(p));
    if (firstPlace < 0) firstPlace = order.findIndex(isPlace);
    if (firstPlace > 0) order.unshift(...order.splice(firstPlace, 1));

    // the photos live in a wall inside the intro's frame (built by layout() below)
    const strip = $("#strip");

    /* ---------- one more thing: the Frame-style intro ---------- */
    const stage = $("#stage");
    const slides = $("#slides");
    const title = $("#omt-title");

    // split ONE MORE / THING into letters with random flicker delays
    $$(".line", title).forEach((line) => {
        line.setAttribute("aria-hidden", "true");
        line.innerHTML = [...line.textContent.trim()]
            .map((c) => (c === " " ? " " : `<span class="ch" style="--d:${rand(0, 0.9).toFixed(2)}s">${c}</span>`))
            .join("");
    });

    // one photo all the way through: the TV opens on a place, goes full-screen,
    // then the camera pulls back to show it between two more photos
    const opener = order.find((p) => isPlace(p) && !isPortrait(p)) || order[0];
    const others = order.filter((p) => p !== opener);
    // the side panels are portrait-shaped, so prefer portrait photos for them
    const flank = [...others.filter(isPortrait), ...others.filter((p) => !isPortrait(p))].slice(0, 2);
    const photoImg = (src) => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        return img;
    };
    const slideImg = photoImg(`img/photos/${opener.id}.jpg`);
    slides.appendChild(slideImg);
    const sides = $$(".side", stage);
    // the side panels are small, so thumbnails are plenty
    flank.forEach((p, k) => sides[k].appendChild(photoImg(`img/photos/${p.id}-s.jpg`)));
    const introImgs = $$("img", stage).filter((img) => !strip.contains(img));

    // step → geometry in px: the TV's box, the two side panels and the brackets
    const geometry = (step) => {
        const W = stage.clientWidth;
        const H = stage.clientHeight;
        const tw = Math.min(600, W * (W > H ? 0.46 : 0.84));
        const th = tw * 0.625; // 16:10, mounted landscape on every screen
        const tv = { x: (W - tw) / 2, y: (H - th) / 2, w: tw, h: th };
        const full = { x: 0, y: 0, w: W, h: H };
        const fs = Math.min(34, W * 0.062);
        const pad = 40;

        // step 5: three portrait panels side by side. They all fit on wide
        // screens; on phones the middle one is bigger and the sides peek in.
        const gap = W > H ? 16 : 10;
        let pw = W > H ? Math.min((W * 0.92 - gap * 2) / 3, H * 0.62 * 0.75) : W * 0.56;
        const ph = pw / (W > H ? 0.75 : 0.5625);
        const mid = { x: (W - pw) / 2, y: (H - ph) / 2, w: pw, h: ph };
        const trio = [
            { ...mid, x: mid.x - gap - pw },
            { ...mid, x: mid.x + pw + gap },
        ];
        // before that, the side panels sit where the same zoom would put them
        // while the middle one fills the screen: just off both edges
        const kx = W / mid.w;
        const ky = H / mid.h;
        const zoomed = trio.map((r) => ({ x: (r.x - mid.x) * kx, y: 0, w: r.w * kx, h: H }));

        if (step === 0) return { tv, sides: zoomed, bw: 60, bh: 40 };
        if (step <= 2) return { tv, sides: zoomed, bw: Math.min(W - 32, fs * 11.5 + pad * 2), bh: fs * 2.9 + pad * 2 };
        if (step === 3) return { tv, sides: zoomed, bw: tw + 44, bh: th + 44 };
        if (step === 4) return { tv: full, sides: zoomed, bw: W * 0.72, bh: H * 0.64 };
        if (step === 5) return { tv: mid, sides: trio, bw: Math.min(W - 24, pw * 3 + gap * 2 + 44), bh: ph + 44 };
        return { tv: mid, sides: trio, bw: Math.min(860, W * 0.9), bh: Math.min(440, H * 0.72) };
    };

    let current = 0;

    const setStep = (step) => {
        current = step;
        const { tv, sides: panels, bw, bh } = geometry(step);
        const px = (v) => `${Math.round(v)}px`;
        const set = (k, v) => stage.style.setProperty(k, px(v));
        set("--tx", tv.x);
        set("--ty", tv.y);
        set("--tw", tv.w);
        set("--th", tv.h);
        set("--bw", bw);
        set("--bh", bh);
        panels.forEach((r, k) => {
            if (!sides[k]) return;
            Object.assign(sides[k].style, { left: px(r.x), top: px(r.y), width: px(r.w), height: px(r.h) });
        });
        [...stage.classList].filter((c) => /^s\d$/.test(c)).forEach((c) => stage.classList.remove(c));
        for (let s = 1; s <= step; s++) stage.classList.add(`s${s}`);
        // (off before the TV shows up, so replay restarts its slow zoom)
        slideImg.classList.toggle("on", step >= 3);
        // let the strip slide in and settle before it starts drifting
        if (step === 6) hold(2500);
    };

    /* ---------- the photo wall: rows of photos scrolling sideways, looping ---------- */
    const GAP = 10;    // keep in sync with the gaps in .strip-track / .strip-row
    const DRIFT = 28;  // px per second
    let period = 0;    // width of one full copy of the wall
    let drift = 0;     // float scroll position, since scrollLeft may round
    let lastSet = 0;
    let glide = null;  // arrow-button animation: { from, to, t0 }
    let holdUntil = 0;
    let hovering = false;
    let onScreen = false;
    let raf = 0;
    let lastT = 0;
    let plan = null;

    const hold = (ms) => (holdUntil = Math.max(holdUntil, performance.now() + ms));
    const ratio = (i) => order[i].w / order[i].h;

    // split the photos into rows of nearly equal length (longest first into
    // the shortest row), then shuffle each row so shapes mix. The opener
    // stays at the start of the top row.
    const planRows = (n, gapRatio) => {
        const rows = Array.from({ length: n }, () => ({ items: [], len: 0 }));
        const add = (row, i) => {
            row.items.push(i);
            row.len += ratio(i) + gapRatio;
        };
        add(rows[0], 0);
        const rest = order.map((_, i) => i).slice(1).sort((a, b) => ratio(b) - ratio(a));
        for (const i of rest) add(rows.reduce((m, r) => (r.len < m.len ? r : m)), i);
        rows.forEach((r, k) => {
            r.items = k === 0 ? [0, ...shuffle(r.items.slice(1))] : shuffle(r.items);
        });
        return rows;
    };

    const tile = (i, clone) => {
        const p = order[i];
        const b = document.createElement("button");
        b.type = "button";
        if (clone) {
            // repeats exist only for the loop; keep them out of tab order and screen readers
            b.tabIndex = -1;
            b.setAttribute("aria-hidden", "true");
        } else {
            b.setAttribute("aria-label", `Open photo ${i + 1} of ${order.length}: ${label(p)}`);
        }
        b.innerHTML = `<img src="img/photos/${p.id}-s.jpg" alt="${clone ? "" : label(p)}" loading="lazy" decoding="async">`;
        b.addEventListener("click", () => openLB(i));
        return b;
    };

    const layout = () => {
        if (!order.length) return;
        const cs = getComputedStyle(strip);
        const inner = strip.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        const n = Math.min(order.length, inner < 480 ? 2 : 3);
        const rowH = (inner - GAP * (n - 1)) / n;
        if (!plan || plan.length !== n) plan = planRows(n, GAP / rowH);

        // every row is stretched to the same length so the loop is seamless
        // (photos in shorter rows get a few % wider and crop a sliver off)
        const natural = plan.map((r) => r.items.reduce((sum, i) => sum + ratio(i) * rowH + GAP, 0));
        const L = Math.max(...natural);
        const copies = Math.ceil(strip.clientWidth / L) + 2;

        const track = document.createElement("div");
        track.className = "strip-track";
        plan.forEach((r, k) => {
            const row = document.createElement("div");
            row.className = "strip-row";
            const stretch = (L - GAP * r.items.length) / (natural[k] - GAP * r.items.length);
            for (let c = 0; c < copies; c++) {
                for (const i of r.items) {
                    const t = tile(i, c !== 1);
                    t.style.width = `${ratio(i) * rowH * stretch}px`;
                    row.appendChild(t);
                }
            }
            track.appendChild(row);
        });
        strip.replaceChildren(track);

        // keep the same spot in the loop across re-layouts
        const frac = period ? (((drift - period) % period) + period) % period / period : 0;
        period = L;
        drift = period + frac * period;
        strip.scrollLeft = lastSet = drift;
    };

    // stay inside the middle copy; jumping by one copy looks identical
    const wrap = () => {
        if (!period) return 0;
        const shift = drift >= period * 2 ? -period : drift < period ? period : 0;
        drift += shift;
        return shift;
    };

    const tick = (t) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(64, t - (lastT || t));
        lastT = t;
        if (glide) {
            const k = Math.min(1, (t - glide.t0) / 650);
            drift = glide.from + (glide.to - glide.from) * (1 - Math.pow(1 - k, 3));
            if (k === 1) glide = null;
        } else if (current < 6 || hovering || lb.open || t < holdUntil) {
            return;
        } else {
            drift += (DRIFT * dt) / 1000;
        }
        const shift = wrap();
        if (glide && shift) {
            glide.from += shift;
            glide.to += shift;
        }
        strip.scrollLeft = drift;
        lastSet = strip.scrollLeft;
    };

    const startDrift = () => {
        if (reduced || raf || !onScreen) return;
        lastT = 0;
        raf = requestAnimationFrame(tick);
    };
    const stopDrift = () => {
        cancelAnimationFrame(raf);
        raf = 0;
    };

    new IntersectionObserver((entries) => {
        onScreen = entries[0].isIntersecting;
        onScreen ? startDrift() : stopDrift();
    }, { threshold: 0.3 }).observe(stage);

    // the first real interaction with the wall moves the headline out of the way
    const settle = () => current === 6 && stage.classList.add("settled");

    // anyone touching the wall gets control; the drift resumes after a bit
    strip.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && (hovering = true));
    strip.addEventListener("pointerleave", (e) => {
        if (e.pointerType === "mouse") {
            hovering = false;
            hold(1500);
        }
    });
    strip.addEventListener("pointerdown", () => (hold(5000), settle()));
    strip.addEventListener("wheel", () => (hold(4000), settle()), { passive: true });
    strip.addEventListener("focusin", () => (hold(8000), settle()));
    strip.addEventListener("scroll", () => {
        // a scroll we didn't cause (swipe, trackpad, keys): follow it, and loop it
        if (Math.abs(strip.scrollLeft - lastSet) > 2) {
            settle();
            glide = null;
            drift = strip.scrollLeft;
            if (wrap()) strip.scrollLeft = drift;
            lastSet = strip.scrollLeft;
            hold(4000);
        }
    }, { passive: true });

    const nudge = (d) => {
        hold(6000);
        settle();
        const by = d * strip.clientWidth * 0.8;
        if (reduced || !raf) {
            drift += by;
            wrap();
            strip.scrollLeft = lastSet = drift;
        } else {
            glide = { from: drift, to: drift + by, t0: performance.now() };
        }
    };
    $("#strip-prev").addEventListener("click", () => nudge(-1));
    $("#strip-next").addEventListener("click", () => nudge(1));

    layout();
    let resizeTimer = 0;
    addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layout, 150);
    });

    // [delay from start in ms, step]
    const TIMELINE = [
        [300, 1],     // fade up, brackets appear
        [1200, 2],    // ONE MORE / THING flickers in
        [3800, 3],    // everything shrinks into the TV on the wall
        [5800, 4],    // TV goes full-bleed on the same photo, in colour
        [7800, 5],    // pull back: it's the middle of three photos
        [9800, 6],    // reveal + the photo wall
    ];

    let timers = [];
    const play = () => {
        timers.forEach(clearTimeout);
        timers = [];
        stage.classList.remove("settled");
        introImgs.forEach((img) => (img.loading = "eager"));
        glide = null;
        drift = period;
        strip.scrollLeft = lastSet = drift;
        if (reduced) return setStep(6);
        stage.classList.add("playing");
        setStep(0);
        TIMELINE.forEach(([t, step]) => timers.push(setTimeout(() => setStep(step), t)));
    };

    const skip = () => {
        timers.forEach(clearTimeout);
        setStep(6);
    };

    setStep(0);
    addEventListener("resize", () => setStep(current));

    let played = false;
    new IntersectionObserver(
        (entries) => {
            if (!played && entries[0].isIntersecting) {
                played = true;
                play();
            }
        },
        { threshold: 0.55 }
    ).observe(stage);

    // start loading the big photos a bit before the stage scrolls into view
    new IntersectionObserver(
        (entries, obs) => {
            if (entries[0].isIntersecting) {
                introImgs.forEach((img) => (img.loading = "eager"));
                obs.disconnect();
            }
        },
        { rootMargin: "800px 0px" }
    ).observe(stage);

    $("#replay").addEventListener("click", play);
    $("#skip").addEventListener("click", skip);

    // the nav "???" link should play the show, not spoil it
    $(".nav-secret").addEventListener("click", () => {
        played = true;
        setTimeout(play, 500);
    });

    /* ---------- lightbox ---------- */
    const lb = $("#lightbox");
    const lbImg = $("#lb-img");
    const lbCap = $("#lb-cap");
    let cur = 0;

    const show = (i) => {
        cur = (i + order.length) % order.length;
        const p = order[cur];
        lbImg.src = `img/photos/${p.id}.jpg`;
        lbImg.alt = label(p);
        lbCap.textContent = `${cur + 1} / ${order.length}`;
        // warm up the neighbours
        [cur + 1, cur - 1].forEach((k) => {
            new Image().src = `img/photos/${order[(k + order.length) % order.length].id}.jpg`;
        });
    };

    function openLB(i) {
        show(i);
        lb.showModal();
    }

    lb.addEventListener("click", (e) => {
        const a = e.target.closest("[data-lb]")?.dataset.lb;
        if (a === "close") lb.close();
        else if (a === "prev") show(cur - 1);
        else if (a === "next") show(cur + 1);
        else if (e.target === lb || e.target.tagName === "FIGURE") lb.close();
    });

    lb.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") show(cur + 1);
        if (e.key === "ArrowLeft") show(cur - 1);
    });

    let touchX = null;
    lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
    lb.addEventListener("touchend", (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
        touchX = null;
    });
})();
