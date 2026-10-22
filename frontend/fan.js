// Animacja wentylatorów jednostki zewnętrznej.
// Obraca grupę łopatek (#g8-7-7 dla fan 1, #g18-1 dla fan 2) wokół (0, 0).
// Prędkość zależy od encji fan1_speed / fan2_speed (rpm).

export class FanAnimator {
  constructor(svgRoot, getState) {
    this.root = svgRoot;
    this.getState = getState;
    this.fan1 = svgRoot.querySelector("#OU-fan1");
    this.fan2 = svgRoot.querySelector("#OU-fan2");
    this._angle1 = 0;
    this._angle2 = 0;
    this._lastTs = null;
    this._raf = null;
    this._running = false;
  }

  start() {
    if (this._raf) return;
    this._running = true;
    this._lastTs = performance.now();
    const loop = (ts) => {
      if (!this._running) return;
      const dt = (ts - this._lastTs) / 1000;  // sekundy
      this._lastTs = ts;
      this._tick(dt);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    this._running = false;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  _tick(dt) {
    const state = this.getState() || {};
    const enabled = state.enabled === true;
    if (!enabled) return;

    const rpm1 = parseFloat(state.fan1Speed) || 0;
    const rpm2 = parseFloat(state.fan2Speed) || 0;

    // Prędkość kątowa: rpm/60*360 °/s. Skalujemy, żeby było widać.
    // 600 rpm = 360°/s * 0.1 = 36°/s (wolno, ale widać)
    const scale = 0.1;
    const speed1 = (rpm1 / 60) * 360 * scale;
    const speed2 = (rpm2 / 60) * 360 * scale;

    // Minimum: jeśli rpm < 10, nie obracaj (stoi).
    const a1 = rpm1 >= 10 ? speed1 * dt : 0;
    const a2 = rpm2 >= 10 ? speed2 * dt : 0;

    this._angle1 = (this._angle1 + a1) % 360;
    this._angle2 = (this._angle2 + a2) % 360;

    if (this.fan1) this.fan1.setAttribute("transform", `rotate(${this._angle1.toFixed(2)})`);
    if (this.fan2) this.fan2.setAttribute("transform", `rotate(${this._angle2.toFixed(2)})`);
  }
}