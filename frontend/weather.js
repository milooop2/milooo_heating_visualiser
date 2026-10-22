// Animator pogody dla Milooo Heating Visualiser.
// Obsługuje: pozycję słońca/księżyca na łuku, dzień/noc, zachmurzenie, opady.
//
// Zasada: NIE ruszamy #day / #night. Przesuwamy TYLKO:
//   - #sun + #Zachmurzenie (razem, o ten sam wektor),
//   - #moon.
// Żadnego scale, żadnego matrix. Tylko translate(pt - offset).

const SVG_NS = "http://www.w3.org/2000/svg";

const CLOUD_STATE = {
  sunny: "clear",
  "clear-night": "clear",
  partlycloudy: "partly",
  windy: "partly",
  "windy-variant": "partly",
  cloudy: "overcast",
  fog: "overcast",
  rainy: "overcast",
  pouring: "overcast",
  "lightning-rainy": "overcast",
  snowy: "overcast",
  "snowy-rainy": "overcast",
  hail: "overcast",
  exceptional: "overcast",
};

const SNOW_CONDITIONS = new Set(["snowy", "snowy-rainy", "hail"]);

export class WeatherAnimator {
  constructor(svgRoot, getState) {
    this.root = svgRoot;
    this.getState = getState;

    // Elementy SVG
    this.horizontCode = svgRoot.querySelector("#horyzont-code");
    this.dayGroup     = svgRoot.querySelector("#day");
    this.nightGroup   = svgRoot.querySelector("#night");
    this.sun          = svgRoot.querySelector("#sun");
    this.moon         = svgRoot.querySelector("#moon");
    this.clouds       = svgRoot.querySelector("#Zachmurzenie");
    this.bgRect       = svgRoot.querySelector("#background rect");
    this.bgEffect     = svgRoot.querySelector("#background-effect");
    this.bgEffectRect = svgRoot.querySelector("#background-effect rect");

    // Pozycje elementów w #weatherdraw (z SVG – bo nie mają transform).
    // #sun: circle cx=311.94 cy=156.52
    // #Zachmurzenie: path start (318.62, 167.17)
    // #moon: path start (92.75, 265.27)
    this.sunPos  = { x: 311.94, y: 156.52 };
    this.moonPos = { x: 92.75,  y: 265.27 };

    this._pathLen = null;
    this._lastPrecipKey = null;
    this._raf = null;
    this._lastTick = 0;

    this._injectStyles();
  }

  _injectStyles() {
    if (this.root.querySelector("#weather-anim-styles")) return;
    const style = document.createElementNS(SVG_NS, "style");
    style.setAttribute("id", "weather-anim-styles");
    style.textContent = `
      @keyframes rainfall {
        0%   { transform: translateY(-3px); opacity: 0.8; }
        100% { transform: translateY(20px); opacity: 0.1; }
      }
      @keyframes snowfall {
        0%   { transform: translate(0, -2px); opacity: 1; }
        100% { transform: translate(var(--dx, 0px), 20px); opacity: 0.2; }
      }
    `;
    this.root.appendChild(style);
  }

  start() {
    if (this._raf) return;
    const loop = (t) => {
      if (t - this._lastTick > 1000) {
        this._lastTick = t;
        this._tick();
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
    this._tick();
  }

  stop() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  _tick() {
    const state = this.getState() || {};
    const { sunSun, condition, precipRate } = state;
    const enabled       = state.enabled !== false;
    const precipEnabled = state.precipEnabled !== false;
    const bgEnabled     = state.bgEnabled !== false;

    // --- 1. Dzień / noc + pozycja z sun.sun (azimuth + elevation) ---
    let isDay = true;
    let t = 0.5;

    if (sunSun && sunSun.attributes) {
      const elevation = sunSun.attributes.elevation;
      const azimuth   = sunSun.attributes.azimuth;

      if (typeof elevation === "number" && typeof azimuth === "number") {
        isDay = elevation > 0;

        if (isDay) {
          t = Math.min(1, Math.max(0, (azimuth - 90) / 180));
        } else {
          let az = azimuth;
          if (az < 90) az += 360;
          t = Math.min(1, Math.max(0, (az - 270) / 180));
        }
      }
    }

    // --- 2. Pozycja słońca/księżyca na łuku (TYLKO translate) ---
    if (enabled && this.horizontCode && this.dayGroup && this.nightGroup) {
      if (this._pathLen === null) {
        this._pathLen = this.horizontCode.getTotalLength();
      }
      const pt = this.horizontCode.getPointAtLength(this._pathLen * t);

      if (isDay) {
        // Przesuń #sun i #Zachmurzenie o ten sam wektor: pt - sunPos
        const dx = pt.x - this.sunPos.x;
        const dy = pt.y - this.sunPos.y;
        const tr = `translate(${dx.toFixed(3)},${dy.toFixed(3)})`;
        if (this.sun)    this.sun.setAttribute("transform", tr);
        if (this.clouds) this.clouds.setAttribute("transform", tr);

        this.dayGroup.style.display   = "inline";
        this.nightGroup.style.display = "none";
        if (this.sun)  this.sun.style.display  = "";
        if (this.moon) this.moon.style.display = "none";
      } else {
        // Przesuń #moon o wektor: pt - moonPos
        const dx = pt.x - this.moonPos.x;
        const dy = pt.y - this.moonPos.y;
        const tr = `translate(${dx.toFixed(3)},${dy.toFixed(3)})`;
        if (this.moon) this.moon.setAttribute("transform", tr);

        this.dayGroup.style.display   = "none";
        this.nightGroup.style.display = "inline";
        if (this.sun)    this.sun.style.display    = "none";
        if (this.moon)   this.moon.style.display   = "";
        if (this.clouds) this.clouds.style.display = "none";
      }
    }

    // --- 3. Zachmurzenie ---
    this._applyClouds(condition, isDay, enabled);

    // --- 4. Tło dzień/noc ---
    if (this.bgRect && bgEnabled) {
      this.bgRect.style.fill = isDay
        ? "url(#linearGradient-day)"
        : "url(#linearGradient33)";
    }

    // --- 5. Opady ---
    this._applyPrecipitation(precipRate, condition, precipEnabled);
  }

  _applyClouds(condition, isDay, enabled) {
    if (!this.clouds) return;

    if (!enabled || !isDay || !condition) {
      this.clouds.style.display = "none";
      return;
    }

    const state = CLOUD_STATE[condition] || "clear";
    if (state === "clear") {
      this.clouds.style.display = "none";
      return;
    }
    this.clouds.style.display = "";
    this.clouds.style.opacity = state === "partly" ? "0.55" : "1";
  }

  _applyPrecipitation(precipRate, condition, enabled) {
    if (!this.bgEffect || !this.bgEffectRect) return;

    const rate = parseFloat(precipRate) || 0;
    const isSnow = SNOW_CONDITIONS.has(condition);

    let intensity = 0;
    if (enabled && rate > 0) {
      intensity = Math.min(1, rate / 5);
    }

    const key = `${isSnow ? "s" : "r"}-${intensity.toFixed(2)}`;
    if (this._lastPrecipKey === key) return;
    this._lastPrecipKey = key;

    Array.from(this.bgEffect.children).forEach((c) => {
      if (c !== this.bgEffectRect) c.remove();
    });

    if (intensity <= 0) {
      this.bgEffectRect.style.opacity = "0";
      return;
    }
    this.bgEffectRect.style.opacity = "0";

    const vb = this.root.viewBox.baseVal;
    const scaleX = 9.19;
    const scaleY = 7.47;
    const w = (vb.width  || 1920) / scaleX;
    const h = (vb.height || 1080) / scaleY;
    const count = Math.round(25 + intensity * 120);

    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;

      if (isSnow) {
        const dur = 4 + Math.random() * 3;
        const delay = -Math.random() * dur;
        const c = document.createElementNS(SVG_NS, "circle");
        c.setAttribute("cx", x.toFixed(2));
        c.setAttribute("cy", y.toFixed(2));
        c.setAttribute("r", (0.15 + Math.random() * 0.25).toFixed(2));
        c.setAttribute("fill", "#ffffff");
        c.setAttribute("stroke", "#4a6fa5");
        c.setAttribute("stroke-width", "0.1");
        c.style.setProperty("--dx", `${(Math.random() - 0.5) * 10}px`);
        c.style.animation = `snowfall ${dur.toFixed(2)}s linear ${delay.toFixed(2)}s infinite`;
        this.bgEffect.appendChild(c);
      } else {
        const dur = 0.6 + Math.random() * 0.8;
        const delay = -Math.random() * dur;
        const l = document.createElementNS(SVG_NS, "line");
        l.setAttribute("x1", x.toFixed(2));
        l.setAttribute("y1", y.toFixed(2));
        l.setAttribute("x2", (x + 0.4).toFixed(2));
        l.setAttribute("y2", (y + 1.8).toFixed(2));
        l.setAttribute("stroke", "#0f2c59");
        l.setAttribute("stroke-width", "0.3");
        l.setAttribute("opacity", "0.9");
        l.style.animation = `rainfall ${dur.toFixed(2)}s linear ${delay.toFixed(2)}s infinite`;
        this.bgEffect.appendChild(l);
      }
    }
  }
}