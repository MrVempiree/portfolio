/* ============================================================
   VEMPIRE — interactions
   Three.js hero · 3D tilt cards · scroll reveal · counters ·
   typed terminal · mobile nav
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- header state + mobile nav ---------------- */
  var header = document.getElementById("siteHeader");
  var onScroll = function () {
    header.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------- scroll reveal ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          ro.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------- animated counters ---------------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduced) { el.textContent = target.toLocaleString("en-US"); return; }
    var dur = 1300, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll(".count");
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------------- 3D tilt cards ---------------- */
  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var raf = null;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform =
            "perspective(950px) rotateX(" + (-py * 7).toFixed(2) + "deg)" +
            " rotateY(" + (px * 9).toFixed(2) + "deg) translateZ(0)";
        });
      });
      card.addEventListener("pointerleave", function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      });
    });
  }

  /* ---------------- typed terminal ---------------- */
  var term = document.getElementById("terminalBody");
  var LINES = [
    "$ whoami",
    "vempire — cybersecurity researcher, India (remote)",
    "$ ls toolkit/",
    "cors-hunter  takeover-check  web-security-labs  + more",
    "$ ./status --now",
    "[github] 6 public repos — Quickdraw · YOLO earned",
    "$ echo $MODE",
    "test_verify_report"
  ];
  function renderTerm(done, current) {
    var html = "";
    done.forEach(function (line) { html += escapeLine(line) + "\n"; });
    if (current !== null) html += escapeLine(current) + '<span class="tp">▌</span>';
    term.innerHTML = html;
  }
  function escapeLine(line) {
    var esc = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (esc.charAt(0) === "$") esc = '<span class="tp">$</span>' + esc.slice(1);
    return esc;
  }
  function typeTerm() {
    if (reduced) { renderTerm(LINES, null); return; }
    var done = [], li = 0, ci = 0;
    (function tick() {
      if (li >= LINES.length) { renderTerm(done, null); return; }
      var line = LINES[li];
      var isCmd = line.charAt(0) === "$";
      ci += isCmd ? 1 : 3;
      if (ci >= line.length) {
        done.push(line); li++; ci = 0;
        renderTerm(done, li < LINES.length ? "" : null);
        setTimeout(tick, isCmd ? 260 : 130);
      } else {
        renderTerm(done, line.slice(0, ci));
        setTimeout(tick, isCmd ? 34 : 10);
      }
    })();
  }
  if (term) {
    if ("IntersectionObserver" in window) {
      var to = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { typeTerm(); to.disconnect(); }
        });
      }, { threshold: 0.35 });
      to.observe(term);
    } else { typeTerm(); }
  }

  /* ---------------- Three.js hero ---------------- */
  var canvas = document.getElementById("hero-canvas");
  if (canvas && window.THREE && !reduced) {
    try { initHero(canvas); } catch (err) { /* CSS fallback gradient stays visible */ }
  }

  function initHero(cv) {
    var renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07080b, 0.055);
    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    var group = new THREE.Group();
    scene.add(group);

    /* outer wireframe icosahedron — crimson */
    var outer = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.7, 1),
      new THREE.MeshBasicMaterial({ color: 0xe5323e, wireframe: true, transparent: true, opacity: 0.5 })
    );
    group.add(outer);

    /* inner octahedron — silver, counter-rotating */
    var inner = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.5, 0),
      new THREE.MeshBasicMaterial({ color: 0x9aa3b2, wireframe: true, transparent: true, opacity: 0.55 })
    );
    group.add(inner);

    /* orbit ring */
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.015, 8, 140),
      new THREE.MeshBasicMaterial({ color: 0xc8102e, transparent: true, opacity: 0.8 })
    );
    ring.rotation.x = Math.PI / 2.25;
    ring.rotation.y = 0.35;
    group.add(ring);
    var ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(4.1, 0.01, 8, 140),
      new THREE.MeshBasicMaterial({ color: 0x6b7280, transparent: true, opacity: 0.45 })
    );
    ring2.rotation.x = Math.PI / 1.8;
    ring2.rotation.y = -0.5;
    group.add(ring2);

    /* particle shell */
    var N = 750, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    var cRed = new THREE.Color(0xe5323e), cSilver = new THREE.Color(0xc9d2e0), tmp = new THREE.Color();
    for (var i = 0; i < N; i++) {
      var r = 4.4 + Math.random() * 3.4;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      tmp.copy(Math.random() < 0.22 ? cRed : cSilver);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    var pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pgeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var points = new THREE.Points(pgeo, new THREE.PointsMaterial({
      size: 0.045, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true
    }));
    group.add(points);

    var mx = 0, my = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function layout() {
      var w = cv.clientWidth || window.innerWidth;
      var h = cv.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      group.position.x = w > 900 ? 3.1 : 0;
      group.position.y = w > 900 ? 0.2 : 1.4;
      var s = w > 900 ? 1 : 0.78;
      group.scale.set(s, s, s);
    }
    window.addEventListener("resize", layout);
    layout();

    var clock = new THREE.Clock();
    (function animate() {
      requestAnimationFrame(animate);
      if (document.hidden) return;
      var t = clock.getElapsedTime();
      outer.rotation.y = t * 0.16;
      outer.rotation.x = t * 0.07;
      inner.rotation.y = -t * 0.3;
      inner.rotation.z = t * 0.12;
      ring.rotation.z = t * 0.1;
      ring2.rotation.z = -t * 0.07;
      points.rotation.y = t * 0.02;
      group.position.y += Math.sin(t * 0.7) * 0.0009;
      mx += (tx - mx) * 0.04;
      my += (ty - my) * 0.04;
      camera.position.x = mx * 0.7;
      camera.position.y = -my * 0.5;
      camera.lookAt(group.position.x * 0.6, 0, 0);
      renderer.render(scene, camera);
    })();
  }
})();
