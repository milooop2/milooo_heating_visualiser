// Kolorowanie wymiennika ciepła (rect#Heat_exchanger_state) gradientem
// zależnym od temperatury czynnika (hp_indoor_ref_temp).
//
// Skala: 27°C (zimno/niebieski) → 80°C (gorąco/czerwony).
// Cooling → poniżej 27°C → zawsze pełny niebieski.

const GRADIENT_ID = "heat-exchanger-gradient";

export class HeatExchangerColorizer {
  constructor(svgRoot) {
    this.root = svgRoot;
    this.rect = svgRoot.querySelector("#Heat_exchanger_state");
    this.grad = null;

    // Zakres temperatur
    this.MIN = 27;
    this.MAX = 40;
    this.SOFT = 0.2;   // miękkie przejście

    this._lastTemp = null;

    if (this.rect) this._ensureGradient();
  }

  _ensureGradient() {
    let grad = this.root.querySelector(`#${GRADIENT_ID}`);
    if (grad) { this.grad = grad; return; }

    const defs = this.root.querySelector("defs");
    if (!defs) return;

    const SVG_NS = "http://www.w3.org/2000/svg";
    grad = document.createElementNS(SVG_NS, "linearGradient");
    grad.setAttribute("id", GRADIENT_ID);
    grad.setAttribute("x1", "0");
    grad.setAttribute("y1", "0");
    grad.setAttribute("x2", "0");
    grad.setAttribute("y2", "1");

    const stops = [
      { offset: "0",    color: "#ff0000", id: "hx-stop-hot-top" },
      { offset: "0.4",  color: "#ff0000", id: "hx-stop-hot-bot" },
      { offset: "0.6",  color: "#0011ff", id: "hx-stop-cold-top" },
      { offset: "1",    color: "#0011ff", id: "hx-stop-cold-bot" },
    ];

    for (const s of stops) {
      const stop = document.createElementNS(SVG_NS, "stop");
      stop.setAttribute("offset", s.offset);
      stop.setAttribute("stop-color", s.color);
      stop.setAttribute("id", s.id);
      grad.appendChild(stop);
    }
    defs.appendChild(grad);
    this.grad = grad;
  }

  update(temp) {
    const t = parseFloat(temp);
    if (isNaN(t) || !this.grad) return;

    if (this._lastTemp === t) return;
    this._lastTemp = t;

    // ratio 0 (zimno) .. 1 (gorąco)
    let ratio = (t - this.MIN) / (this.MAX - this.MIN);
    ratio = Math.min(1, Math.max(0, ratio));

    // boundary: 0 = cały niebieski, 1 = cały czerwony
    const boundary = ratio;

    const hotBot  = this.grad.querySelector("#hx-stop-hot-bot");
    const coldTop = this.grad.querySelector("#hx-stop-cold-top");
    if (!hotBot || !coldTop) return;

    const hotBotOffset  = Math.max(0, boundary - this.SOFT);
    const coldTopOffset = Math.min(1, boundary + this.SOFT);

    hotBot.setAttribute("offset",  hotBotOffset.toFixed(3));
    coldTop.setAttribute("offset", coldTopOffset.toFixed(3));

    // Podmień fill recta na gradient
    if (this.rect) this.rect.style.fill = `url(#${GRADIENT_ID})`;
  }

  setInactive() {
    // Brak danych — wracamy do domyślnego wyglądu (przezroczysty)
    if (this.rect) this.rect.style.fill = "";
    this._lastTemp = null;
  }
}