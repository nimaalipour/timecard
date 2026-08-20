/* =========================================================
   Triangle Sky Race
   Answer triangle math questions and race your paper plane
   to the finish line. Right answers soar the maximum; wrong
   answers barely hop. 7 right answers reach the line, and a
   4th miss ends the race.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     1. THE CONTENT  (questions + every spoken line: content.js)
     --------------------------------------------------------- */
  var C = window.TSR_CONTENT;
  var QUESTIONS = C.questions;
  var RIGHT_FT = C.rightFt;
  var WRONG_FT = C.wrongFt;
  var FINISH_FT = C.finishFt;
  var NEED_RIGHT = C.needRight;
  var MAX_LIVES = C.lives;

  var PILOT = C.defaultPilot;
  function fmt(s) { return s.replace(/\{name\}/g, PILOT); }

  /* ---------------------------------------------------------
     2. SAVED SETTINGS + LITTLE SOUND BOX
     --------------------------------------------------------- */
  // some browsers (and sandboxed frames) refuse localStorage; the game
  // should still play, it just will not remember the best race
  var store = {
    get: function (key, fallback) {
      try { var v = localStorage.getItem(key); return v === null ? fallback : v; }
      catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* nothing to do */ }
    }
  };

  var audio = {
    ctx: null,
    master: null,          // one volume knob every sound goes through
    amb: null,             // the park ambience bus (breeze + birdsong)
    noiseBuf: null,        // two seconds of noise, reused by wind and rustles
    wind: null,            // live wind nodes while the plane is flying
    lastWind: 0,
    started: false,
    on: store.get('tsr_sound', 'on') !== 'off',

    wake: function () {
      // ask iPhones to treat the page as a game, not background sound —
      // otherwise the ringer/silent switch mutes every clip and effect
      if (navigator.audioSession) {
        try { navigator.audioSession.type = 'playback'; } catch (e) {}
      }
      if (!this.unmuteEl) {
        // and for older iPhones: a looping silent <audio> promotes the
        // audio session the same way (the classic "unmute" trick)
        var a = document.createElement('audio');
        a.setAttribute('playsinline', '');
        a.loop = true;
        a.src = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
        var played = a.play();
        if (played && played.catch) played.catch(function () {});
        this.unmuteEl = a;
      }
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.on ? 1 : 0.0001;
        this.master.connect(this.ctx.destination);
        this.amb = this.ctx.createGain();
        this.amb.gain.value = 0.0001;
        this.amb.connect(this.master);
        var len = this.ctx.sampleRate * 2;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        var data = this.noiseBuf.getChannelData(0);
        for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state !== 'running') {
        var r = this.ctx.resume();          // iOS also reports 'interrupted'
        if (r && r.catch) r.catch(function () {});
      }
      if (!this.started && this.ctx) { this.started = true; this.startAmbience(); }
    },

    setOn: function (on) {
      this.on = on;
      if (this.ctx) {
        var t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setTargetAtTime(on ? 1 : 0.0001, t, 0.04);
      }
    },

    tone: function (freq, dur, type, vol, slideTo, delay) {
      if (!this.on || !this.ctx) return;
      var c = this.ctx, t = c.currentTime + (delay || 0);
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    },

    noiseBurst: function (dur, filterType, f0, f1, vol, delay) {
      if (!this.on || !this.ctx) return;
      var c = this.ctx, t = c.currentTime + (delay || 0);
      var src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      var f = c.createBiquadFilter(); f.type = filterType;
      f.frequency.setValueAtTime(f0, t);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + dur + 0.1);
    },

    tap:  function () { this.tone(620, 0.07, 'triangle', 0.07, 420); },
    pick: function () {
      this.tone(520, 0.1, 'triangle', 0.11, 700);
      this.tone(780, 0.14, 'triangle', 0.09, 990, 0.08);
    },

    launch: function () {
      this.noiseBurst(0.7, 'bandpass', 300, 1600, 0.16);
      this.tone(220, 0.5, 'sawtooth', 0.035, 760);
    },

    windStart: function () {
      if (!this.ctx) return;
      this.windStop();
      var c = this.ctx;
      var src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      var f = c.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.value = 500; f.Q.value = 0.8;
      var g = c.createGain(); g.gain.value = 0.0001;
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start();
      this.wind = { src: src, filter: f, gain: g };
    },
    windSet: function (x) {        // 0..1, how fast the flight feels right now
      if (!this.wind) return;
      var t = this.ctx.currentTime;
      this.wind.gain.gain.setTargetAtTime(0.0001 + 0.11 * x, t, 0.09);
      this.wind.filter.frequency.setTargetAtTime(350 + 1500 * x, t, 0.12);
    },
    windStop: function () {
      if (!this.wind) return;
      var w = this.wind, t = this.ctx.currentTime;
      w.gain.gain.setTargetAtTime(0.0001, t, 0.05);
      w.src.stop(t + 0.4);
      this.wind = null;
    },

    land: function (quality) {
      this.tone(110, 0.16, 'sine', 0.2, 55);                       // the thump
      this.noiseBurst(0.22, 'highpass', 1500, null, 0.05, 0.02);   // grass rustle
      var base = 440 + quality * 220;                              // the chime climbs
      this.tone(base, 0.18, 'sine', 0.12, null, 0.12);
      this.tone(base * 1.25, 0.22, 'sine', 0.11, null, 0.25);
      if (quality > 0.8) this.tone(base * 1.5, 0.3, 'sine', 0.1, null, 0.4);
    },

    sparkle: function () {
      this.tone(1568, 0.14, 'sine', 0.07);
      this.tone(2093, 0.14, 'sine', 0.06, null, 0.09);
      this.tone(2637, 0.2, 'sine', 0.05, null, 0.18);
    },

    fanfare: function () {
      var notes = [523, 659, 784, 1047];
      for (var i = 0; i < notes.length; i++) {
        this.tone(notes[i], 0.35, 'triangle', 0.12, null, i * 0.14);
      }
      this.tone(262, 1.1, 'triangle', 0.05);
      this.tone(330, 1.1, 'triangle', 0.04);
      this.tone(392, 1.1, 'triangle', 0.04);
      this.sparkle();
    },

    sigh: function () {            // a soft "aww" for the game-over screen
      this.tone(392, 0.4, 'triangle', 0.09);
      this.tone(330, 0.4, 'triangle', 0.09, null, 0.32);
      this.tone(262, 0.7, 'triangle', 0.08, null, 0.64);
    },

    duck: function (down) {
      if (!this.ctx) return;
      this.amb.gain.setTargetAtTime(down ? 0.15 : 1, this.ctx.currentTime, 0.25);
    },

    startAmbience: function () {
      var self = this, c = this.ctx;
      // the softest breeze underneath everything
      var src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
      var g = c.createGain(); g.gain.value = 0.015;
      src.connect(f); f.connect(g); g.connect(this.amb);
      src.start();
      this.amb.gain.setTargetAtTime(1, c.currentTime, 1.5);
      (function nextChirp() {
        setTimeout(function () {
          if (self.on && self.ctx.state === 'running') self.chirp();
          nextChirp();
        }, 2600 + Math.random() * 5400);
      })();
    },

    chirp: function () {
      // a little bird somewhere off to one side
      var c = this.ctx, t = c.currentTime;
      var out = this.amb;
      if (c.createStereoPanner) {
        var pan = c.createStereoPanner();
        pan.pan.value = Math.random() * 1.4 - 0.7;
        pan.connect(this.amb);
        out = pan;
      }
      var n = 2 + Math.floor(Math.random() * 3);
      var f0 = 2100 + Math.random() * 1500;
      for (var i = 0; i < n; i++) {
        var st = t + i * (0.11 + Math.random() * 0.09);
        var o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f0 + Math.random() * 320, st);
        o.frequency.exponentialRampToValueAtTime(f0 * (1.12 + Math.random() * 0.22), st + 0.08);
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.045, st + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.11);
        o.connect(g); g.connect(out);
        o.start(st); o.stop(st + 0.15);
      }
    }
  };

  /* ---------------------------------------------------------
     3. THE PARK  (canvas world)
     --------------------------------------------------------- */
  var cv = document.getElementById('scene');
  var ctx = cv.getContext('2d');
  var W = 0, H = 0;
  var horizonY = 0;   // where the sky meets the grass
  var laneY = 0;      // the ground line the plane flies along
  var band = 0;       // height of the grassy area
  var S = 1;          // scenery scale, follows screen size

  var PPM = 14;                            // pixels per foot
  var WORLD_M = FINISH_FT + 90;            // a little park beyond the line
  var WORLD_W = WORLD_M * PPM;
  var CAM_MIN = -70;                       // keeps the plane off the left edge

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var clouds = [], birds = [], kites = [], balloons = [],
      rowFar = [], rowMain = [], rowNear = [], meadow = [], butterflies = [];

  function buildWorld() {
    var r = rng(20260820);
    var span = WORLD_W + 2600;
    clouds = []; birds = []; kites = []; balloons = [];
    rowFar = []; rowMain = []; rowNear = []; meadow = []; butterflies = [];

    for (var x = -300; x < span * 0.35; x += 190 + r() * 240) {
      clouds.push({ x: x, y: 18 + r() * 205, s: 0.5 + r() * 0.95, drift: 3 + r() * 5 });
    }
    for (var b = -100; b < span * 0.4; b += 620 + r() * 900) {
      birds.push({ x: b, y: 50 + r() * 120, s: 0.7 + r() * 0.6, ph: r() * 6.28 });
    }
    for (var k = 500; k < span * 0.75; k += 1300 + r() * 1500) {
      kites.push({ x: k, y: 70 + r() * 110, s: 0.8 + r() * 0.5, hue: Math.floor(r() * 360), ph: r() * 6.28 });
    }
    for (var bl = 900; bl < span * 0.9; bl += 2200 + r() * 2200) {
      balloons.push({ x: bl, ph: r() * 6.28, hue: Math.floor(r() * 360) });
    }
    // far row: hedges and small trees just under the horizon
    for (var f = -300; f < span * 0.85; f += 70 + r() * 90) {
      var fr = r();
      rowFar.push({ x: f, s: 0.55 + r() * 0.3, k: r(),
        type: fr < 0.55 ? 'tree' : fr < 0.85 ? 'bush' : 'hedge' });
    }
    // main row: the lane the plane flies down — keep the finish arch clear
    var archX = FINISH_FT * PPM;
    for (var n = -300; n < span; n += 105 + r() * 130) {
      var roll = r();
      var type = roll < 0.30 ? 'tree' : roll < 0.48 ? 'bush' : roll < 0.72 ? 'flowers' :
                 roll < 0.80 ? 'bench' : roll < 0.87 ? 'lamp' :
                 roll < 0.93 ? 'pond' : 'picnic';
      if (Math.abs(n - archX) < 150) continue;
      rowMain.push({ x: n, s: 0.8 + r() * 0.5, k: r(), type: type, hue: Math.floor(r() * 360) });
    }
    // near row: big soft shapes along the bottom
    for (var q = -400; q < span * 1.3; q += 260 + r() * 320) {
      rowNear.push({ x: q, s: 1 + r() * 0.6, k: r(),
        type: r() < 0.55 ? 'bush' : 'tree', hue: Math.floor(r() * 360) });
    }
    // meadow: grass tufts and little flowers carpeting the foreground
    for (var g = -400; g < span * 1.35; g += 5 + r() * 9) {
      meadow.push({ x: g, s: 0.7 + r() * 0.8, k: r(),
        flower: r() < 0.22, hue: Math.floor(r() * 360) });
    }
    for (var bf = 300; bf < span * 1.2; bf += 700 + r() * 900) {
      butterflies.push({ x: bf, y: r(), ph: r() * 6.28, hue: Math.floor(r() * 360) });
    }
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    horizonY = Math.round(H * (H > W ? 0.55 : 0.62));
    band = H - horizonY;
    laneY = Math.round(horizonY + band * 0.42);
    S = Math.max(0.72, Math.min(1.4, H / 780));
  }
  window.addEventListener('resize', resize);

  /* ---------- drawing helpers ---------- */
  function circle(x, y, r2) { ctx.beginPath(); ctx.arc(x, y, r2, 0, 6.2832); ctx.fill(); }

  // older browsers do not have roundRect
  if (!ctx.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r2) {
      this.moveTo(x + r2, y);
      this.arcTo(x + w, y, x + w, y + h, r2);
      this.arcTo(x + w, y + h, x, y + h, r2);
      this.arcTo(x, y + h, x, y, r2);
      this.arcTo(x, y, x + w, y, r2);
      this.closePath();
      return this;
    };
  }

  function wrap(x, w) { return ((x % w) + w) % w - 300; }

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, horizonY);
    g.addColorStop(0, '#59b6e9');
    g.addColorStop(0.5, '#93d6f2');
    g.addColorStop(1, '#dcf3fb');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizonY + 2);
  }

  function drawSun(cam) {
    var x = W - 92 - cam * 0.02, y = 78;
    var g = ctx.createRadialGradient(x, y, 6, x, y, 130);
    g.addColorStop(0, 'rgba(255,244,180,.95)');
    g.addColorStop(0.32, 'rgba(255,232,150,.32)');
    g.addColorStop(1, 'rgba(255,232,150,0)');
    ctx.fillStyle = g; circle(x, y, 130);
    ctx.fillStyle = '#fff6bd'; circle(x, y, 32);
  }

  function drawClouds(cam, time) {
    var span = WORLD_W + 2600;
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      var x = wrap(c.x - cam * 0.12 + time * c.drift, span);
      if (x < -340 || x > W + 340) continue;
      var s = c.s;
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      circle(x, c.y, 26 * s);
      circle(x + 32 * s, c.y - 14 * s, 34 * s);
      circle(x + 68 * s, c.y + 2 * s, 24 * s);
      ctx.fillRect(x - 2, c.y - 1, 72 * s, 22 * s);
      ctx.fillStyle = 'rgba(214,238,250,.9)';
      ctx.fillRect(x - 2, c.y + 14 * s, 72 * s, 7 * s);
    }
  }

  function drawBirds(cam, time) {
    var span = WORLD_W + 2600;
    ctx.strokeStyle = 'rgba(58,92,116,.45)';
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      var x = wrap(b.x - cam * 0.18 + time * 11, span);
      if (x < -40 || x > W + 40) continue;
      var flap = Math.sin(time * 5 + b.ph) * 4;
      var y = b.y + Math.sin(time * 0.8 + b.ph) * 8, s = b.s * 7;
      ctx.beginPath();
      ctx.moveTo(x - s, y + flap); ctx.quadraticCurveTo(x, y - 3, x + s, y + flap);
      ctx.stroke();
    }
  }

  function drawKites(cam, time) {
    for (var i = 0; i < kites.length; i++) {
      var k = kites[i], x = k.x - cam * 0.45;
      if (x < -90 || x > W + 90) continue;
      var sway = Math.sin(time * 0.9 + k.ph) * 14;
      var y = k.y + Math.sin(time * 1.3 + k.ph) * 8, s = 16 * k.s;
      ctx.save();
      ctx.translate(x + sway, y);
      ctx.rotate(Math.sin(time + k.ph) * 0.18);
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, s);
      ctx.quadraticCurveTo(-10, s + 34, 6, s + 66); ctx.stroke();
      ctx.fillStyle = 'hsl(' + k.hue + ',85%,62%)';
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.7, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  function drawBalloons(cam, time) {
    for (var i = 0; i < balloons.length; i++) {
      var b = balloons[i], x = b.x - cam * 0.9;
      if (x < -60 || x > W + 60) continue;
      var y = laneY - 90 * S + Math.sin(time * 0.8 + b.ph) * 10;
      ctx.strokeStyle = 'rgba(90,110,120,.5)'; ctx.lineWidth = 1;
      for (var j = 0; j < 3; j++) {
        var bx = x + (j - 1) * 13 * S, by = y - (j % 2) * 12 * S;
        ctx.beginPath(); ctx.moveTo(bx, by + 10 * S);
        ctx.quadraticCurveTo(x, laneY - 20 * S, x, laneY); ctx.stroke();
        ctx.fillStyle = 'hsl(' + ((b.hue + j * 70) % 360) + ',85%,64%)';
        ctx.beginPath(); ctx.ellipse(bx, by, 8 * S, 10 * S, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.45)'; circle(bx - 2.5 * S, by - 3 * S, 2.4 * S);
      }
    }
  }

  function hills(cam, p, baseY, amp, wave, color) {
    var off = cam * p;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-10, H);
    for (var x = -10; x <= W + 10; x += 10) {
      var wx = x + off;
      var y = baseY + Math.sin(wx / wave) * amp + Math.sin(wx / (wave * 0.41)) * amp * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 10, H); ctx.closePath(); ctx.fill();
  }

  function drawHills(cam) {
    hills(cam, 0.16, horizonY - 74 * S, 26 * S, 300, '#bfe6b3');
    hills(cam, 0.26, horizonY - 40 * S, 20 * S, 210, '#9bd894');
    hills(cam, 0.38, horizonY - 12 * S, 14 * S, 150, '#7cc873');
  }

  function drawGrass() {
    var g = ctx.createLinearGradient(0, horizonY - 6, 0, H);
    g.addColorStop(0, '#69bd57');
    g.addColorStop(0.35, '#7ac95e');
    g.addColorStop(0.75, '#5faf47');
    g.addColorStop(1, '#4b9c3c');
    ctx.fillStyle = g;
    ctx.fillRect(0, horizonY - 6, W, H - horizonY + 6);
  }

  function drawStripes(cam) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, horizonY - 6, W, H - horizonY + 6); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.032)';
    var wide = 120 * S;
    var start = -((cam * 0.85) % (wide * 2)) - wide * 2;
    for (var x = start; x < W + wide * 2; x += wide * 2) {
      ctx.beginPath();
      ctx.moveTo(x, H); ctx.lineTo(x + wide * 0.55, horizonY - 6);
      ctx.lineTo(x + wide * 1.15, horizonY - 6); ctx.lineTo(x + wide, H);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawTreeLine(cam) {
    var off = cam * 0.44, y = horizonY + 3;
    ctx.fillStyle = '#6bbc68';
    for (var x = -((off * 0.5) % 46) - 46; x < W + 46; x += 46) {
      circle(x, y - 12 * S, 15 * S);
      circle(x + 23, y - 6 * S, 11 * S);
    }
    ctx.fillRect(0, y - 6, W, 14);
  }

  function drawPath(cam) {
    var top = laneY + 14 * S, thick = 26 * S;
    ctx.fillStyle = '#efdfb6';
    ctx.beginPath();
    ctx.moveTo(-10, top + Math.sin((-10 + cam) / 320) * 10 * S);
    for (var x = -10; x <= W + 10; x += 12) {
      ctx.lineTo(x, top + Math.sin((x + cam) / 320) * 10 * S);
    }
    for (var x2 = W + 10; x2 >= -10; x2 -= 12) {
      ctx.lineTo(x2, top + thick + Math.sin((x2 + cam) / 320) * 10 * S);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath();
    ctx.moveTo(-10, top + Math.sin((-10 + cam) / 320) * 10 * S);
    for (var x3 = -10; x3 <= W + 10; x3 += 12) {
      ctx.lineTo(x3, top + Math.sin((x3 + cam) / 320) * 10 * S);
    }
    for (var x4 = W + 10; x4 >= -10; x4 -= 12) {
      ctx.lineTo(x4, top + 4 * S + Math.sin((x4 + cam) / 320) * 10 * S);
    }
    ctx.closePath(); ctx.fill();
  }

  /* ---------- park furniture ---------- */
  function tree(x, y, s, k, dark, mid, light) {
    ctx.fillStyle = 'rgba(30,70,30,.14)';
    ctx.beginPath(); ctx.ellipse(x, y + 2, 26 * s, 6 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#8d5f3d';
    ctx.fillRect(x - 4 * s, y - 32 * s, 8 * s, 33 * s);
    ctx.fillStyle = dark;  circle(x - 18 * s, y - 42 * s, 17 * s);
    ctx.fillStyle = mid;   circle(x + 17 * s, y - 40 * s, 16 * s);
    ctx.fillStyle = mid;   circle(x, y - 58 * s, 22 * s);
    ctx.fillStyle = light; circle(x - 5 * s + k * 8, y - 65 * s, 12 * s);
  }

  function bush(x, y, s, dark, mid, light) {
    ctx.fillStyle = 'rgba(30,70,30,.12)';
    ctx.beginPath(); ctx.ellipse(x, y + 2, 20 * s, 5 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = dark;  circle(x - 12 * s, y - 8 * s, 11 * s);
    ctx.fillStyle = mid;   circle(x + 11 * s, y - 7 * s, 10 * s);
    ctx.fillStyle = mid;   circle(x, y - 14 * s, 15 * s);
    ctx.fillStyle = light; circle(x - 4 * s, y - 19 * s, 7 * s);
  }

  function hedge(x, y, s) {
    s *= 1.5;
    ctx.fillStyle = 'rgba(30,70,30,.10)';
    ctx.beginPath(); ctx.ellipse(x, y + 1, 30 * s, 5 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#4e9f4d';
    ctx.beginPath(); ctx.roundRect(x - 28 * s, y - 26 * s, 56 * s, 26 * s, 9 * s); ctx.fill();
    ctx.fillStyle = '#63b65f';
    ctx.beginPath(); ctx.roundRect(x - 26 * s, y - 26 * s, 52 * s, 11 * s, 6 * s); ctx.fill();
  }

  function bench(x, y, s) {
    ctx.fillStyle = 'rgba(30,70,30,.12)';
    ctx.beginPath(); ctx.ellipse(x, y + 1, 24 * s, 5 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#a06b41';
    ctx.fillRect(x - 22 * s, y - 15 * s, 44 * s, 5 * s);
    ctx.fillRect(x - 22 * s, y - 26 * s, 44 * s, 4 * s);
    ctx.fillRect(x - 22 * s, y - 20 * s, 44 * s, 4 * s);
    ctx.fillStyle = '#7a4f2f';
    ctx.fillRect(x - 18 * s, y - 15 * s, 4 * s, 15 * s);
    ctx.fillRect(x + 14 * s, y - 15 * s, 4 * s, 15 * s);
  }

  function lamp(x, y, s) {
    ctx.fillStyle = '#46596c';
    ctx.fillRect(x - 2.5 * s, y - 54 * s, 5 * s, 54 * s);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.moveTo(x - 9 * s, y - 54 * s); ctx.lineTo(x + 9 * s, y - 54 * s);
    ctx.lineTo(x + 5 * s, y - 68 * s); ctx.lineTo(x - 5 * s, y - 68 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#46596c';
    ctx.beginPath(); ctx.ellipse(x, y, 7 * s, 3 * s, 0, 0, 6.2832); ctx.fill();
  }

  function pond(x, y, s, time) {
    ctx.fillStyle = '#9ad0e8';
    ctx.beginPath(); ctx.ellipse(x, y - 2 * s, 62 * s, 17 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#5cc0e6';
    ctx.beginPath(); ctx.ellipse(x, y - 3 * s, 57 * s, 14 * s, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
    for (var i = 0; i < 2; i++) {
      var w = 12 * s + ((time * 14 + i * 22) % 34) * s;
      ctx.globalAlpha = Math.max(0, 1 - w / (46 * s));
      ctx.beginPath(); ctx.ellipse(x - 10 * s, y - 3 * s, w, w * 0.26, 0, 0, 6.2832); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#3f9d55';
    ctx.beginPath(); ctx.ellipse(x + 26 * s, y + 1 * s, 10 * s, 4 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#ff8fbe'; circle(x + 26 * s, y - 3 * s, 3.4 * s);
    // a duck
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x - 24 * s, y - 6 * s, 8 * s, 5 * s, 0, 0, 6.2832); ctx.fill();
    circle(x - 30 * s, y - 12 * s, 4.2 * s);
    ctx.fillStyle = '#f7a83c';
    ctx.beginPath(); ctx.moveTo(x - 34 * s, y - 12 * s); ctx.lineTo(x - 39 * s, y - 10.5 * s);
    ctx.lineTo(x - 34 * s, y - 9 * s); ctx.closePath(); ctx.fill();
  }

  function flowers(x, y, s, hue) {
    for (var i = 0; i < 6; i++) {
      var fx = x + (i - 2.5) * 9 * s, fy = y - (6 + (i % 3) * 6) * s;
      ctx.strokeStyle = '#3f8f38'; ctx.lineWidth = 1.7 * s;
      ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.fillStyle = 'hsl(' + ((hue + i * 45) % 360) + ',88%,68%)';
      for (var pth = 0; pth < 4; pth++) {
        circle(fx + Math.cos(pth * 1.57) * 3 * s, fy + Math.sin(pth * 1.57) * 3 * s, 2.4 * s);
      }
      ctx.fillStyle = '#fff5b8'; circle(fx, fy, 1.9 * s);
    }
  }

  function picnic(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#f26d6d';
    ctx.beginPath(); ctx.ellipse(0, -2 * s, 30 * s, 11 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (var i = -2; i <= 2; i++) ctx.fillRect(i * 11 * s - 1.5 * s, -13 * s, 3 * s, 22 * s);
    ctx.fillStyle = '#c98a4b';
    ctx.beginPath(); ctx.roundRect(6 * s, -18 * s, 18 * s, 12 * s, 3 * s); ctx.fill();
    ctx.strokeStyle = '#c98a4b'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.arc(15 * s, -18 * s, 7 * s, Math.PI, 0); ctx.stroke();
    ctx.restore();
  }

  function marker(x, y, feet) {
    ctx.fillStyle = '#c9b58c'; ctx.fillRect(x - 2, y - 30 * S, 4, 30 * S);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(x - 22, y - 50 * S, 44, 21, 7); ctx.fill();
    ctx.fillStyle = '#4b9c3c';
    ctx.font = '700 13px Nunito, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(feet + 'ft', x, y - 50 * S + 11);
  }

  // the finish line: two poles, a banner, and a string of triangle pennants
  function drawFinish(cam, time) {
    var x = FINISH_FT * PPM - cam;
    if (x < -260 || x > W + 260) return;
    var y = laneY + 6 * S;
    var half = 74 * S, top = y - 118 * S;

    // pole shadows
    ctx.fillStyle = 'rgba(30,70,30,.14)';
    ctx.beginPath(); ctx.ellipse(x - half, y + 2, 10 * S, 4 * S, 0, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + half, y + 2, 10 * S, 4 * S, 0, 0, 6.2832); ctx.fill();

    // candy-striped poles
    for (var side = -1; side <= 1; side += 2) {
      var px = x + side * half;
      ctx.fillStyle = '#e6eef3';
      ctx.fillRect(px - 4 * S, top, 8 * S, y - top);
      ctx.fillStyle = '#e8564f';
      for (var st = top; st < y; st += 22 * S) {
        ctx.fillRect(px - 4 * S, st, 8 * S, 11 * S);
      }
      ctx.fillStyle = '#ffd45e'; circle(px, top - 4 * S, 6 * S);
    }

    // the banner
    var bh = 30 * S;
    ctx.fillStyle = '#2f7a34';
    ctx.beginPath(); ctx.roundRect(x - half - 6 * S, top, half * 2 + 12 * S, bh, 8 * S); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 ' + Math.round(17 * S) + 'px "Baloo 2", "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('FINISH', x, top + bh * 0.52);

    // checkered strip under the banner
    var sq = 7 * S, rows = 2;
    for (var ry = 0; ry < rows; ry++) {
      for (var cx2 = -half - 6 * S; cx2 < half + 6 * S; cx2 += sq) {
        var even = (Math.round(cx2 / sq) + ry) % 2 === 0;
        ctx.fillStyle = even ? '#22384a' : '#ffffff';
        ctx.fillRect(x + cx2, top + bh, Math.min(sq, half + 6 * S - cx2), sq);
      }
    }

    // a swinging string of triangle pennants (of course they are triangles)
    var sag = 16 * S, py = top + bh + rows * sq + 6 * S;
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - half, py);
    ctx.quadraticCurveTo(x, py + sag * 2, x + half, py); ctx.stroke();
    for (var p = 0; p < 7; p++) {
      var t2 = (p + 0.5) / 7;
      var fx = x - half + t2 * half * 2;
      var fy = py + 2 * sag * t2 * (1 - t2) * 2;
      var swing = Math.sin(time * 2 + p) * 0.12;
      ctx.save();
      ctx.translate(fx, fy); ctx.rotate(swing);
      ctx.fillStyle = 'hsl(' + (p * 51) % 360 + ',85%,62%)';
      ctx.beginPath(); ctx.moveTo(-6 * S, 0); ctx.lineTo(6 * S, 0); ctx.lineTo(0, 14 * S);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // the line itself, chalked across the path
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (var ly = 0; ly < 4; ly++) {
      ctx.fillRect(x - 3 * S + (ly % 2) * 3 * S, y + 8 * S + ly * 6 * S, 6 * S, 5 * S);
    }
  }

  function drawRowFar(cam) {
    var off = cam * 0.55, y = horizonY + band * 0.13;
    for (var i = 0; i < rowFar.length; i++) {
      var it = rowFar[i], x = it.x - off;
      if (x < -80 || x > W + 80) continue;
      var s = it.s * S * 0.72;
      if (it.type === 'tree') tree(x, y, s, it.k, '#3d8b47', '#4b9e51', '#63b566');
      else if (it.type === 'bush') bush(x, y, s, '#4b9e51', '#57aa58', '#6cbc6b');
      else hedge(x, y, s);
    }
  }

  function drawRowMain(cam, time) {
    var y = laneY;
    for (var i = 0; i < rowMain.length; i++) {
      var it = rowMain[i], x = it.x - cam;
      if (x < -150 || x > W + 150) continue;
      var s = it.s * S;
      switch (it.type) {
        case 'tree':    tree(x, y, s, it.k, '#2f7f3d', '#3d9346', '#57ad5b'); break;
        case 'bush':    bush(x, y, s, '#38904a', '#45a24f', '#5ab660'); break;
        case 'flowers': flowers(x, y, s, it.hue); break;
        case 'bench':   bench(x, y, s); break;
        case 'lamp':    lamp(x, y, s); break;
        case 'pond':    pond(x, y, s, time); break;
        case 'picnic':  picnic(x, y, s); break;
      }
    }
    // distance signs every 50 ft
    var first = Math.max(0, Math.floor(cam / (50 * PPM)) * 50);
    for (var m = first; m <= first + (W / PPM) + 100; m += 50) {
      if (m === 0 || Math.abs(m - FINISH_FT) < 30) continue;
      var mx = m * PPM - cam;
      if (mx < -40 || mx > W + 40) continue;
      marker(mx, y + 4, m);
    }
    drawFinish(cam, time);
  }

  function drawRowNear(cam) {
    var off = cam * 1.2, y = H + 22 * S;
    for (var i = 0; i < rowNear.length; i++) {
      var it = rowNear[i], x = it.x - off;
      if (x < -220 || x > W + 220) continue;
      var s = it.s * S * 1.7;
      if (it.type === 'tree') {
        ctx.fillStyle = '#2c7738'; circle(x - 24 * s * 0.5, y - 60 * s * 0.5, 26 * s * 0.5);
        ctx.fillStyle = '#35873f'; circle(x + 22 * s * 0.5, y - 54 * s * 0.5, 24 * s * 0.5);
        ctx.fillStyle = '#3f9647'; circle(x, y - 80 * s * 0.5, 32 * s * 0.5);
      } else {
        bush(x, y, s * 0.8, '#2c7738', '#35873f', '#43a04b');
      }
    }
  }

  function drawMeadow(cam) {
    var off = cam * 1.12;
    for (var i = 0; i < meadow.length; i++) {
      var t = meadow[i], x = t.x - off;
      if (x < -20 || x > W + 20) continue;
      var y = laneY + 48 * S + t.k * (band * 0.52);
      if (y > H + 10) continue;
      var depth = (y - laneY) / band;              // closer to camera = bigger
      var s = t.s * S * (0.7 + depth * 1.1);
      ctx.strokeStyle = depth > 0.55 ? '#3d8c34' : '#4aa03d';
      ctx.lineWidth = 2.4 * s; ctx.lineCap = 'round';
      var h = 13 * s;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 3 * s, y - h * 0.6, x - 6 * s, y - h);
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2 * s, y - h * 0.7, x + 5 * s, y - h * 1.05);
      ctx.moveTo(x, y); ctx.lineTo(x, y - h * 0.8);
      ctx.stroke();
      if (t.flower) {
        ctx.fillStyle = 'hsl(' + t.hue + ',90%,72%)';
        circle(x + 4 * s, y - h * 1.15, 3 * s);
        ctx.fillStyle = '#fff6c0'; circle(x + 4 * s, y - h * 1.15, 1.2 * s);
      }
    }
  }

  function drawFringe(cam) {
    var off = cam * 1.32, h = 30 * S, base = H + 4;
    ctx.fillStyle = '#3f8f38';
    ctx.beginPath();
    ctx.moveTo(-10, H + 12);
    for (var x = -10; x <= W + 10; x += 9) {
      var wx = x + off;
      ctx.lineTo(x, base - h * (0.55 + 0.45 * Math.abs(Math.sin(wx * 0.09) * Math.cos(wx * 0.031))));
    }
    ctx.lineTo(W + 10, H + 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4aa03d'; ctx.lineWidth = 3 * S; ctx.lineCap = 'round';
    for (var b = -10; b <= W + 10; b += 13) {
      var wb = b + off, bh = h * (0.9 + 0.7 * Math.abs(Math.sin(wb * 0.05)));
      ctx.beginPath();
      ctx.moveTo(b, base);
      ctx.quadraticCurveTo(b + 3 * S, base - bh * 0.6, b + 8 * S * Math.sin(wb * 0.02), base - bh);
      ctx.stroke();
    }
  }

  function drawButterflies(cam, time) {
    for (var i = 0; i < butterflies.length; i++) {
      var b = butterflies[i], x = b.x - cam * 1.05 + Math.sin(time * 0.7 + b.ph) * 40;
      if (x < -30 || x > W + 30) continue;
      var y = laneY + 30 * S + b.y * band * 0.4 + Math.sin(time * 2 + b.ph) * 16;
      var flap = Math.abs(Math.sin(time * 9 + b.ph));
      ctx.fillStyle = 'hsl(' + b.hue + ',90%,66%)';
      ctx.beginPath(); ctx.ellipse(x - 4 * S, y, (4.5 * flap + 1.5) * S, 5 * S, -0.4, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 4 * S, y, (4.5 * flap + 1.5) * S, 5 * S, 0.4, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(60,50,40,.6)';
      ctx.fillRect(x - 0.8 * S, y - 4 * S, 1.6 * S, 8 * S);
    }
  }

  /* ---------- the plane ---------- */
  function drawPlane(x, y, rot, s) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(23, 0); ctx.lineTo(-23, -14); ctx.lineTo(-13, 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d3e6f6';
    ctx.beginPath(); ctx.moveTo(23, 0); ctx.lineTo(-13, 1); ctx.lineTo(-23, 13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9fbdd4'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(23, 0); ctx.lineTo(-13, 1); ctx.stroke();
    ctx.fillStyle = '#ff8fb1';
    ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(-23, -14); ctx.lineTo(-19, -3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawPlaneShadow(x, alt) {
    var f = Math.max(0, 1 - alt / (band * 1.4));
    if (f <= 0.02) return;
    ctx.fillStyle = 'rgba(30,70,30,' + (0.22 * f) + ')';
    ctx.beginPath();
    ctx.ellipse(x, laneY + 2, 22 * f + 8, 5 * f + 2, 0, 0, 6.2832);
    ctx.fill();
  }

  var trail = [], puffs = [], sparkles = [];

  function drawTrail() {
    if (trail.length < 2) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var i = 1; i < trail.length; i++) {
      var a = trail[i - 1], b = trail[i];
      ctx.strokeStyle = 'rgba(255,255,255,' + (b.life * 0.5) + ')';
      ctx.lineWidth = 1 + b.life * 5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }

  function drawPuffs() {
    for (var i = 0; i < puffs.length; i++) {
      var p = puffs[i];
      ctx.fillStyle = 'rgba(' + p.c + ',' + p.life * 0.8 + ')';
      circle(p.x, p.y, p.r * (1.4 - p.life * 0.4));
    }
  }

  function drawSparkles(time) {
    for (var i = 0; i < sparkles.length; i++) {
      var s = sparkles[i];
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(time * 3 + i);
      ctx.fillStyle = 'rgba(255,238,140,' + s.life + ')';
      ctx.fillRect(-1.2, -5, 2.4, 10); ctx.fillRect(-5, -1.2, 10, 2.4);
      ctx.restore();
    }
  }

  /* ---------------------------------------------------------
     4. GAME STATE + LOOP
     --------------------------------------------------------- */
  var game = {
    qIndex: 0,
    lives: MAX_LIVES,
    right: 0,
    wrong: 0,
    journey: [],
    crossed: false,  // sparkles fire once when the plane passes the banner
    distM: 0,        // where the plane is parked, in feet
    planeM: 0,       // live plane position while flying
    alt: 0,          // height above the lane, px
    rot: -0.12,
    flight: null,
    cam: CAM_MIN,
    camTarget: CAM_MIN,
    time: 0
  };

  function planeScreenX() { return game.planeM * PPM - game.cam; }
  function planeScreenY() { return laneY - 12 - game.alt; }

  function camFor(m) {
    return Math.max(CAM_MIN, Math.min(WORLD_W - W, m * PPM - W * 0.34));
  }

  function frame(ts) {
    var dt = Math.min((ts - (frame.last || ts)) / 1000, 0.05);
    frame.last = ts;
    game.time += dt;

    /* --- flight --- */
    if (game.flight) {
      var fl = game.flight;
      var prevX = planeScreenX(), prevY = planeScreenY();
      fl.t = Math.min(1, fl.t + dt / fl.dur);
      var t = fl.t;

      var travelled = fl.gain * (1 - Math.pow(1 - t, 1.8));
      game.planeM = fl.start + travelled;
      game.alt = fl.peak * Math.sin(Math.PI * Math.pow(t, 0.92)) + Math.sin(t * 13) * 6 * (1 - t);
      if (game.alt < 0) game.alt = 0;

      if (!game.crossed && game.planeM >= FINISH_FT) {
        game.crossed = true;
        sparkleBurst();
        audio.sparkle();
      }

      game.camTarget = camFor(game.planeM);
      game.cam += (game.camTarget - game.cam) * Math.min(1, dt * 7);

      trail.push({ x: prevX, y: prevY, life: 1 });

      var dx = planeScreenX() - prevX, dy = planeScreenY() - prevY;
      if (Math.abs(dx) + Math.abs(dy) > 0.4) {
        var target = Math.atan2(dy, Math.max(dx, 0.6));
        game.rot += (Math.max(-0.9, Math.min(0.9, target)) - game.rot) * Math.min(1, dt * 9);
      }

      if (audio.wind && game.time - audio.lastWind > 0.08) {
        audio.lastWind = game.time;
        var spd = Math.pow(1 - t, 0.9);              // fast at launch, easing off
        audio.windSet((0.3 + 0.7 * spd) * Math.min(1, fl.gain / 45));
      }

      liveDistance(Math.round(travelled), Math.round(game.planeM));

      if (t >= 1) {
        game.distM = fl.start + fl.gain;
        game.planeM = game.distM;
        game.alt = 0;
        landPuff();
        audio.windStop();
        audio.land(fl.quality);
        if (fl.quality > 0.85) { sparkleBurst(); audio.sparkle(); }
        var done = fl.resolve;
        game.flight = null;
        done();
      }
    } else {
      game.camTarget = camFor(game.distM);
      game.cam += (game.camTarget - game.cam) * Math.min(1, dt * 4);
      game.rot += (-0.1 - game.rot) * Math.min(1, dt * 4);
      game.alt += (Math.sin(game.time * 1.6) * 2 + 2 - game.alt) * Math.min(1, dt * 3);
    }

    /* --- particles --- */
    var i;
    for (i = trail.length - 1; i >= 0; i--) {
      trail[i].life -= dt * 1.25;
      if (trail[i].life <= 0) trail.splice(i, 1);
    }
    for (i = puffs.length - 1; i >= 0; i--) {
      var p = puffs[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 130 * dt; p.life -= dt * 1.1;
      if (p.life <= 0) puffs.splice(i, 1);
    }
    for (i = sparkles.length - 1; i >= 0; i--) {
      var s2 = sparkles[i];
      s2.x += s2.vx * dt; s2.y += s2.vy * dt; s2.vy += 90 * dt; s2.life -= dt * 0.9;
      if (s2.life <= 0) sparkles.splice(i, 1);
    }

    /* --- render, back to front --- */
    var cam = game.cam;
    drawSky();
    drawSun(cam);
    drawClouds(cam, game.time);
    drawBirds(cam, game.time);
    drawKites(cam, game.time);
    drawHills(cam);
    drawGrass();
    drawStripes(cam);
    drawTreeLine(cam);
    drawRowFar(cam);
    drawPath(cam);
    drawBalloons(cam, game.time);
    drawRowMain(cam, game.time);
    drawTrail();
    drawPlaneShadow(planeScreenX(), game.alt);
    drawPuffs();
    drawPlane(planeScreenX(), planeScreenY(), game.rot, 1.05 * Math.min(1.25, S));
    drawSparkles(game.time);
    drawMeadow(cam);
    drawButterflies(cam, game.time);
    drawRowNear(cam);
    drawFringe(cam);

    requestAnimationFrame(frame);
  }

  function landPuff() {
    var x = planeScreenX(), y = laneY - 2;
    for (var i = 0; i < 18; i++) {
      puffs.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 160,
        vy: -Math.random() * 120,
        r: 3 + Math.random() * 5,
        life: 1,
        c: Math.random() < 0.5 ? '238,223,182' : '150,205,110'
      });
    }
  }

  function sparkleBurst() {
    var x = planeScreenX(), y = laneY - 34;
    for (var i = 0; i < 16; i++) {
      sparkles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 220,
        vy: -70 - Math.random() * 170,
        life: 1
      });
    }
  }

  /* ---------- read things out loud ----------
     Every line has a recorded clip (voicepack.js, made by make-voicepack.js)
     spoken by a warm neural voice. Clips play through WebAudio; the device's
     built-in voice is only the fallback when a clip is missing or offline. */
  var speech = {
    tts: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    pack: window.VOICE_PACK || {},
    auto: store.get('tsr_voice', 'on') !== 'off',
    voice: null,
    queue: [],       // spoken utterances stay referenced here — Chrome cuts off
                     // any utterance the garbage collector reaches mid-queue
    buffers: {},     // clip url -> AudioBuffer promise
    out: null,       // clip gain — straight to the speakers, NOT the master
                     // knob, so "Read it to me" still answers while muted
    current: null,   // the clip source playing right now
    timer: null,
    unlocked: false,
    gen: 0,

    hasClips: function () {
      for (var k in this.pack) return true;
      return false;
    },

    ensureOut: function () {
      if (!this.out && audio.ctx) {
        this.out = audio.ctx.createGain();
        this.out.gain.value = 1;
        this.out.connect(audio.ctx.destination);
      }
      return this.out;
    },

    fetchClip: function (url) {
      // the cache holds raw MP3 bytes and decodes per play — caching decoded
      // PCM instead would hold ~30x that and can crash an older phone's tab
      if (!this.buffers[url]) {
        if (url.lastIndexOf('data:', 0) === 0) {
          var bin = atob(url.slice(url.indexOf(',') + 1));
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          this.buffers[url] = Promise.resolve(arr.buffer);
        } else {
          this.buffers[url] = fetch(url).then(function (r) {
            if (!r.ok) throw new Error('clip ' + r.status);
            return r.arrayBuffer();
          });
          var self = this;
          this.buffers[url].catch(function () { delete self.buffers[url]; });
        }
      }
      return this.buffers[url].then(function (ab) {
        return new Promise(function (res, rej) {
          // slice() because decodeAudioData detaches the buffer it is given
          audio.ctx.decodeAudioData(ab.slice(0), res, rej);
        });
      });
    },

    preload: function (lines) {
      if (!audio.ctx || !this.auto) return;
      for (var i = 0; i < lines.length; i++) {
        var url = this.pack[lines[i].text || lines[i]];
        if (url) this.fetchClip(url).catch(function () {});
      }
    },

    findVoice: function () {
      var vs = window.speechSynthesis.getVoices();
      if (!vs.length) return;
      function scoreOf(v) {
        var n = v.name, sc = 0;
        if (/natural|neural/i.test(n)) sc += 100;   // Edge's online voices
        if (/premium|enhanced/i.test(n)) sc += 80;  // Apple's better voices
        if (/siri/i.test(n)) sc += 60;
        if (/google/i.test(n)) sc += 40;
        if (/samantha|aria|jenny|karen|zira|susan|ava|allison/i.test(n)) sc += 30;
        if (/^en[-_]us/i.test(v.lang)) sc += 12;
        else if (/^en/i.test(v.lang)) sc += 8;
        else sc -= 100;
        if (v.default) sc += 5;
        return sc;
      }
      var best = vs[0], bestScore = -1e9;
      for (var i = 0; i < vs.length; i++) {
        var sc = scoreOf(vs[i]);
        if (sc > bestScore) { bestScore = sc; best = vs[i]; }
      }
      this.voice = best;
    },

    unlock: function () {
      // iPhones and iPads only allow speech that a tap started — so the first
      // tap "speaks" a silent space, and every later line is allowed through
      if (!this.tts || this.unlocked) return;
      this.unlocked = true;
      var u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    },

    stop: function () {
      this.gen++;
      this.queue = [];
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      if (this.current) {
        try { this.current.onended = null; this.current.stop(); } catch (e) {}
        this.current = null;
      }
      if (this.tts) window.speechSynthesis.cancel();
      audio.duck(false);
      var lit = document.querySelectorAll('.reading');
      for (var i = 0; i < lit.length; i++) lit[i].classList.remove('reading');
    },

    playClip: function (url, mark, gen) {
      var self = this;
      return this.fetchClip(url).then(function (buf) {
        return new Promise(function (res) {
          if (gen !== self.gen) return res();
          var src = audio.ctx.createBufferSource();
          src.buffer = buf;
          src.connect(self.ensureOut());
          self.current = src;
          if (mark) mark.classList.add('reading');
          var finish = function () {
            if (mark) mark.classList.remove('reading');
            if (self.current === src) self.current = null;
          };
          // onended freezes if the context suspends mid-clip (backgrounded
          // phone) — give every clip a deadline so the chain cannot wedge
          var watchdog = setTimeout(function () {
            if (gen !== self.gen) return;
            try { src.onended = null; src.stop(); } catch (e) {}
            finish();
            res();
          }, buf.duration * 1000 + 1500);
          src.onended = function () {
            clearTimeout(watchdog);
            finish();
            setTimeout(res, 140);            // a small breath between lines
          };
          src.start();
        });
      });
    },

    speakLine: function (text, mark, gen) {
      var self = this;
      if (!this.tts) return Promise.resolve();
      return new Promise(function (res) {
        if (gen !== self.gen) return res();
        var u = new SpeechSynthesisUtterance(text);
        if (self.voice) u.voice = self.voice;
        u.rate = 0.95;
        u.pitch = 1.05;
        if (mark) u.onstart = function () { mark.classList.add('reading'); };
        u.onend = u.onerror = function () {
          if (mark) mark.classList.remove('reading');
          var ix = self.queue.indexOf(u);
          if (ix >= 0) self.queue.splice(ix, 1);
          res();
        };
        self.queue.push(u);
        window.speechSynthesis.speak(u);
        if (!self.timer) {
          // Chrome sometimes pauses its engine mid-read — nudge it along
          var ticks = 0;
          self.timer = setInterval(function () {
            ticks++;
            if (window.speechSynthesis.speaking && ticks < 60) window.speechSynthesis.resume();
            else { clearInterval(self.timer); self.timer = null; }
          }, 3000);
        }
      });
    },

    // lines: strings, or { text, mark } to light an element up while it is spoken
    say: function (lines) {
      if (!lines.length) return;
      var self = this;
      this.stop();
      var gen = this.gen;
      var log = window.__tsrVoiceLog = window.__tsrVoiceLog || [];
      var clips = 0;
      for (var i = 0; i < lines.length; i++) {
        var t = lines[i].text || lines[i];
        if (this.pack[t] && audio.ctx) clips++;
        else log.push({ miss: t });
      }
      log.push({ say: lines.length, clips: clips });
      audio.duck(true);
      // Chrome swallows an utterance queued in the same tick as cancel()
      var chain = new Promise(function (res) { setTimeout(res, 90); });
      lines.forEach(function (line) {
        chain = chain.then(function () {
          if (gen !== self.gen) return;
          var text = line.text || line;
          var mark = line.mark || null;
          var url = self.pack[text];
          if (url && audio.ctx) {
            log.push({ clip: url });
            return self.playClip(url, mark, gen).catch(function () {
              return self.speakLine(text, mark, gen);
            });
          }
          return self.speakLine(text, mark, gen);
        });
      });
      chain.then(function () {
        if (gen === self.gen) audio.duck(false);
      });
    }
  };
  // read-aloud works if there are clips to play or a device voice to fall back on
  speech.ok = speech.hasClips() || speech.tts;

  if (speech.tts) {
    speech.findVoice();
    window.speechSynthesis.onvoiceschanged = function () { speech.findVoice(); };
  }

  /* ---------------------------------------------------------
     5. UI
     --------------------------------------------------------- */
  var el = {
    hud: document.getElementById('hud'),
    hudQ: document.getElementById('hudQ'),
    hudLives: document.getElementById('hudLives'),
    hudTotal: document.getElementById('hudTotal'),
    placeTag: document.getElementById('placeTag'),
    flyMeter: document.getElementById('flyMeter'),
    flyDistance: document.getElementById('flyDistance'),
    start: document.getElementById('startScreen'),
    startBtn: document.getElementById('startBtn'),
    pilotName: document.getElementById('pilotName'),
    how: document.getElementById('howScreen'),
    howList: document.getElementById('howList'),
    gotItBtn: document.getElementById('gotItBtn'),
    bestLine: document.getElementById('bestLine'),
    question: document.getElementById('questionScreen'),
    qPlace: document.getElementById('qPlace'),
    qStory: document.getElementById('qStory'),
    qText: document.getElementById('qText'),
    qChoices: document.getElementById('qChoices'),
    win: document.getElementById('winScreen'),
    winTitle: document.getElementById('winTitle'),
    winScoreLabel: document.getElementById('winScoreLabel'),
    winDistance: document.getElementById('winDistance'),
    winMessage: document.getElementById('winMessage'),
    winJourney: document.getElementById('winJourney'),
    winBest: document.getElementById('winBest'),
    winAgainBtn: document.getElementById('winAgainBtn'),
    lose: document.getElementById('loseScreen'),
    loseTitle: document.getElementById('loseTitle'),
    loseMessage: document.getElementById('loseMessage'),
    loseJourney: document.getElementById('loseJourney'),
    loseAgainBtn: document.getElementById('loseAgainBtn'),
    muteBtn: document.getElementById('muteBtn'),
    muteIcon: document.getElementById('muteIcon'),
    voiceBtn: document.getElementById('voiceBtn'),
    voiceIcon: document.getElementById('voiceIcon')
  };

  function show(node) { node.classList.remove('hidden'); }
  function hide(node) { node.classList.add('hidden'); }

  function hidePanel(node) {
    return new Promise(function (res) {
      node.classList.add('leaving');
      setTimeout(function () { node.classList.add('hidden'); node.classList.remove('leaving'); res(); }, 260);
    });
  }

  function liveDistance(gain, total) {
    el.flyDistance.textContent = '+' + gain + ' ft';
    el.hudTotal.textContent = total + ' ft';
  }

  function heartRow() {
    var s = '';
    for (var i = 0; i < MAX_LIVES; i++) s += i < game.lives ? '❤️' : '🖤';
    return s;
  }

  function updateHud() {
    el.hudQ.textContent = Math.min(game.qIndex + 1, QUESTIONS.length) + '/' + QUESTIONS.length;
    el.hudLives.textContent = heartRow();
    el.hudTotal.textContent = Math.round(game.distM) + ' ft';
  }

  var bubble = document.createElement('div');
  bubble.className = 'bubble hidden';
  document.body.appendChild(bubble);

  function showBubble(gain, ok, note) {
    bubble.innerHTML = '<span class="gain' + (ok ? '' : ' gain--miss') + '">+' + gain + ' feet' +
                       (ok ? '!' : '...') + '</span>' +
                       '<p class="note"></p>' +
                       '<p class="tap">Tap anywhere to keep racing &rarr;</p>';
    bubble.querySelector('.note').textContent = note;
    bubble.classList.remove('hidden');
    requestAnimationFrame(function () { bubble.classList.add('show'); });
    return new Promise(function (res) {
      function finish() {
        window.removeEventListener('pointerdown', go);
        window.removeEventListener('keydown', go);
        bubble.classList.remove('show');
        setTimeout(function () { bubble.classList.add('hidden'); }, 300);
        res();
      }
      function go(e) {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target && e.target.closest && e.target.closest('.icon-btn')) return;
        finish();
      }
      setTimeout(function () {
        window.addEventListener('pointerdown', go);
        window.addEventListener('keydown', go);
      }, 350);
    });
  }

  function showHow() {
    el.howList.innerHTML = '';
    var lines = [];
    C.howLines.forEach(function (raw, i) {
      var text = fmt(raw);
      var row = document.createElement('div');
      row.className = 'how-row';
      row.innerHTML = '<span class="how-ico">' + C.howIcons[i] + '</span><span class="how-txt"></span>';
      row.querySelector('.how-txt').textContent = text;
      el.howList.appendChild(row);
      lines.push({ text: text, mark: row });
    });
    show(el.how);
    speech.preload(lines);
    if (speech.auto && audio.on) speech.say(lines);
  }

  var choiceOrder = [];        // display position -> original choice index

  function shuffled(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = a.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  function sceneLines(q) {
    var btns = el.qChoices.querySelectorAll('.choice');
    var lines = [q.story, q.q];
    for (var pos = 0; pos < choiceOrder.length; pos++) {
      var c = q.choices[choiceOrder[pos]];
      lines.push({ text: 'Number ' + (pos + 1) + '.', mark: btns[pos] });
      lines.push({ text: c.t, mark: btns[pos] });
    }
    return lines;
  }

  function correctChoice(q) {
    for (var i = 0; i < q.choices.length; i++) {
      if (q.choices[i].ok) return q.choices[i];
    }
    return q.choices[0];
  }

  function askQuestion() {
    var q = QUESTIONS[game.qIndex];
    hide(el.placeTag);
    updateHud();
    el.qPlace.textContent = 'Question ' + (game.qIndex + 1) + ' of ' + QUESTIONS.length;
    el.qStory.textContent = q.story;
    el.qText.textContent = q.q;
    el.qChoices.innerHTML = '';

    choiceOrder = shuffled(q.choices.length);
    window.__tsrOrder = choiceOrder.slice();     // for tests
    choiceOrder.forEach(function (orig, pos) {
      var c = q.choices[orig];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.innerHTML = '<span class="key">' + (pos + 1) + '</span><span class="txt"></span>';
      b.querySelector('.txt').textContent = c.t;
      b.addEventListener('click', function () { choose(orig, b); });
      el.qChoices.appendChild(b);
    });

    if (speech.ok) {
      var read = document.createElement('button');
      read.type = 'button';
      read.className = 'read-btn';
      read.innerHTML = '<span aria-hidden="true">&#128266;</span> Read it to me';
      read.addEventListener('click', function () {
        audio.tap();
        speech.unlock();
        speech.say(sceneLines(q));
      });
      el.qChoices.appendChild(read);
    }

    show(el.question);
    speech.preload(sceneLines(q));
    if (speech.auto && audio.on) speech.say(sceneLines(q));
    window.addEventListener('keydown', keyPick);
  }

  function keyPick(e) {
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= choiceOrder.length) {
      var btns = el.qChoices.querySelectorAll('.choice');
      choose(choiceOrder[n - 1], btns[n - 1]);
    }
  }

  var answering = false;

  function pickFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function choose(i, btnEl) {
    if (answering) return;
    answering = true;
    window.removeEventListener('keydown', keyPick);
    speech.stop();
    audio.pick();

    var q = QUESTIONS[game.qIndex];
    var choice = q.choices[i];
    var ok = !!choice.ok;
    var outOfLives = false;

    var lines = [];             // what the narrator says after landing
    if (ok) {
      game.right++;
      lines.push(fmt(pickFrom(C.praises)));
    } else {
      if (game.lives === 0) outOfLives = true;   // the 4th miss ends the race
      else game.lives--;
      game.wrong++;
      lines.push(pickFrom(C.misses));
      lines.push('The right answer was: ' + correctChoice(q).t + '.');
    }
    lines.push(q.f);
    if (!ok && !outOfLives && game.lives === 0) lines.push(fmt(C.lastLife));

    var gain = ok ? RIGHT_FT : WRONG_FT;
    var quality = ok ? 1 : 0.25;
    var wins = ok && game.right >= NEED_RIGHT;

    var buttons = el.qChoices.querySelectorAll('.choice');
    for (var b = 0; b < buttons.length; b++) {
      var isPicked = buttons[b] === btnEl;
      var isRight = q.choices[choiceOrder[b]].ok;
      buttons[b].disabled = true;
      if (isPicked && ok) buttons[b].classList.add('picked');
      else if (isPicked) buttons[b].classList.add('picked-wrong');
      else if (isRight && !ok) buttons[b].classList.add('right');   // show the answer
      else buttons[b].classList.add('dim');
    }
    updateHud();

    speech.preload(lines);
    setTimeout(function () {
      hidePanel(el.question).then(function () {
        var togo = Math.max(0, FINISH_FT - Math.round(game.distM + gain));
        el.placeTag.textContent = wins ? '🏁 The Finish Line!'
                                       : '→ ' + togo + ' ft to the finish line';
        show(el.placeTag);
        show(el.flyMeter);
        audio.launch();
        audio.windStart();
        return fly(gain, quality);
      }).then(function () {
        hide(el.flyMeter);
        updateHud();
        if (speech.auto && audio.on) speech.say(lines);
        return showBubble(gain, ok, lines.join(' '));
      }).then(function () {
        answering = false;
        game.journey.push({ n: game.qIndex + 1, label: q.label, ok: ok, gain: gain });
        game.qIndex++;
        if (outOfLives) lose();
        else if (wins) win();
        else askQuestion();
      });
    }, ok ? 520 : 1100);        // a beat longer on a miss, to see the answer
  }

  function fly(gainM, quality) {
    return new Promise(function (res) {
      game.flight = {
        start: game.distM,
        gain: gainM,
        peak: Math.min(H * 0.44, 70 + gainM * 3.4),
        dur: 1.5 + gainM / 50 * 1.5,
        quality: quality,
        t: 0,
        resolve: res
      };
    });
  }

  function paintJourney(list) {
    list.innerHTML = '';
    game.journey.forEach(function (stop) {
      var li = document.createElement('li');
      li.className = 'journey-stop' + (stop.ok ? '' : ' journey-stop--detour');
      var name = document.createElement('span');
      name.className = 'journey-place';
      name.textContent = (stop.ok ? '✅ ' : '❌ ') + 'Q' + stop.n + ' · ' + stop.label;
      var m = document.createElement('span');
      m.className = 'journey-metres';
      m.textContent = '+' + stop.gain + ' ft';
      li.appendChild(name); li.appendChild(m);
      list.appendChild(li);
    });
  }

  function win() {
    var tier = game.wrong === 0 ? C.wins.perfect :
               game.wrong >= MAX_LIVES ? C.wins.photo : C.wins.star;
    var title = fmt(tier.title), msg = fmt(tier.msg);

    var prevBest = store.get('tsr_best', null);   // fewest misses on a win
    var isRecord = prevBest === null || game.wrong < parseInt(prevBest, 10);
    if (isRecord) store.set('tsr_best', String(game.wrong));

    el.win.querySelector('.plane-badge').textContent = tier.emoji;
    el.winTitle.textContent = title;
    el.winScoreLabel.textContent = PILOT + '’s race';
    el.winDistance.textContent = Math.round(game.distM) + ' ft';
    el.winMessage.textContent = msg + ' ' + game.right + ' right answers, ' +
      (game.wrong === 0 ? 'no misses.' : game.wrong + (game.wrong === 1 ? ' miss.' : ' misses.'));
    paintJourney(el.winJourney);
    el.winBest.innerHTML = isRecord
      ? '&#127881; ' + (prevBest === null ? 'Your very first win is on the record board!'
                                          : 'New record! Your fewest misses yet.')
      : 'Best race so far: <strong>' + prevBest + (prevBest === '1' ? ' miss' : ' misses') + '</strong>';
    show(el.win);
    audio.fanfare();
    if (speech.auto && audio.on) speech.say([title, msg]);
    hide(el.placeTag);
  }

  function lose() {
    var title = fmt(C.lose.title), msg = fmt(C.lose.msg);
    el.loseTitle.textContent = title;
    el.loseMessage.textContent = msg;
    paintJourney(el.loseJourney);
    show(el.lose);
    audio.sigh();
    if (speech.auto && audio.on) speech.say([title, msg]);
    hide(el.placeTag);
  }

  function startGame() {
    speech.stop();
    game.qIndex = 0;
    game.lives = MAX_LIVES;
    game.right = 0;
    game.wrong = 0;
    game.journey = [];
    game.crossed = false;
    game.distM = 0;
    game.planeM = 0;
    game.alt = 0;
    game.cam = CAM_MIN;
    game.camTarget = CAM_MIN;
    trail = []; puffs = []; sparkles = [];
    show(el.hud);
    updateHud();
    askQuestion();
  }

  function paintBestLine() {
    var best = store.get('tsr_best', null);
    if (best === null) return;
    el.bestLine.innerHTML = 'Best race: crossed the line with <strong>' +
      best + (best === '1' ? ' miss' : ' misses') + '</strong>';
    el.bestLine.classList.remove('hidden');
  }

  /* ---------- wiring ---------- */
  el.startBtn.addEventListener('click', function () {
    var name = (el.pilotName.value || '').trim();
    PILOT = name || C.defaultPilot;
    store.set('tsr_pilot', PILOT);
    audio.wake();
    speech.unlock();
    audio.tap();
    hidePanel(el.start).then(showHow);
  });

  // Enter in the name box starts the race too
  el.pilotName.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') el.startBtn.click();
  });

  el.gotItBtn.addEventListener('click', function () {
    audio.wake();
    audio.tap();
    speech.stop();
    hidePanel(el.how).then(startGame);
  });

  function again(panel) {
    audio.wake();
    speech.unlock();
    audio.tap();
    paintBestLine();
    hidePanel(panel).then(function () { show(el.start); });
  }
  el.winAgainBtn.addEventListener('click', function () { again(el.win); });
  el.loseAgainBtn.addEventListener('click', function () { again(el.lose); });

  el.muteBtn.addEventListener('click', function () {
    audio.wake();
    audio.setOn(!audio.on);
    store.set('tsr_sound', audio.on ? 'on' : 'off');
    el.muteIcon.innerHTML = audio.on ? '&#128266;' : '&#128263;';
    el.muteBtn.setAttribute('aria-pressed', String(audio.on));
    el.muteBtn.setAttribute('aria-label', audio.on ? 'Turn sound off' : 'Turn sound on');
    if (audio.on) audio.pick();
    else speech.stop();
  });

  el.voiceBtn.addEventListener('click', function () {
    audio.wake();
    speech.unlock();
    audio.tap();
    speech.auto = !speech.auto;
    store.set('tsr_voice', speech.auto ? 'on' : 'off');
    el.voiceIcon.innerHTML = speech.auto ? '&#128483;&#65039;' : '&#129296;';
    el.voiceBtn.setAttribute('aria-pressed', String(speech.auto));
    el.voiceBtn.setAttribute('aria-label', speech.auto ? 'Turn read-aloud off' : 'Turn read-aloud on');
    if (!speech.auto) speech.stop();
    else if (!el.question.classList.contains('hidden')) speech.say(sceneLines(QUESTIONS[game.qIndex]));
  });

  /* ---------- boot ---------- */
  el.pilotName.value = store.get('tsr_pilot', C.defaultPilot);
  paintBestLine();
  el.muteIcon.innerHTML = audio.on ? '&#128266;' : '&#128263;';
  el.voiceIcon.innerHTML = speech.auto ? '&#128483;&#65039;' : '&#129296;';
  el.voiceBtn.setAttribute('aria-pressed', String(speech.auto));
  if (!speech.ok) hide(el.voiceBtn);

  // phones suspend audio when the app goes to the background — any tap or
  // return to the app wakes it ('interrupted' is iOS for suspended)
  function nudgeAudio() {
    if (audio.ctx && audio.ctx.state !== 'running') {
      var r = audio.ctx.resume();
      if (r && r.catch) r.catch(function () {});
    }
  }
  document.addEventListener('pointerdown', nudgeAudio);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) nudgeAudio();
  });

  resize();
  buildWorld();
  requestAnimationFrame(frame);
})();
