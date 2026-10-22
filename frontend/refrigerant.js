// Animacja przepływu czynnika chłodniczego w rurach (details).
// 3 warianty: Heating / Cooling / SelfDefrost.
// Sterujemy BEZPOŚREDNIO ścieżkami (<path>), nie grupami.

const COLORS = {
  red:      "#ea00ff",
  cold:     "#4c0a54",
  warm:     "#b30aa9",
  inactive: "#00ff99",
};

const PUMP_ON_COLOR = "#00ff00";

const TARGETS = {
  Cooling: {
    red:  ["OU_refignant_heating_supply_before_bypass_A",
           "OU_refignant_heating_supply_before_bypass_B",
           "pipe-outlet_to_evaporatorB"],
    cold: ["pipe-inlet_to_evaporatorA", "pipe-liquid-evaporatorA",
           "OU_liquid-pipe_afterBypass_A", "LiquidPipe", "IU_Liquid_pipe_A"],
    warm: ["IU_Gas_Pipe_A", "OU_refignant_heating_supply_after_bypass",
           "4waypipe", "OU_liquid-pipe_return_A","OU_liquid-pipe_return_B"],
  },
  SelfDefrost: {
    red:      ["OU_refignant_heating_supply_before_bypass_A",
               "OU_refignant_heating_supply_before_bypass_B",
               "pipe-outlet_to_evaporatorB"],
    inactive: ["OU_refignant_heating_supply_after_bypass", "OU_liquid-pipe_afterBypass_A",
               "4waypipe","OU_liquid-pipe_return_B","LiquidPipe", "GasPipe", "IU_Liquid_pipe_A", "IU_Gas_Pipe_A"],
    cold:     ["pipe-inlet_to_evaporatorA", "pipe-liquid-evaporatorA",
               "OU_liquid-pipe_Bypass_A", "OU_liquid-pipe_return_A"],
  },
};

const ALL_PIPES = [
  "OU_refignant_heating_supply_before_bypass_A",
  "OU_refignant_heating_supply_before_bypass_B",
  "OU_refignant_heating_supply_after_bypass",
  "pipe-inlet_to_evaporatorA",
  "pipe-liquid-evaporatorA",
  "pipe-outlet_to_evaporatorB",
  "4waypipe",
  "OU_liquid-pipe_return_A",
  "OU_liquid-pipe_afterBypass_A",
  "OU_liquid-pipe_Bypass_A",
  "LiquidPipe",
  "GasPipe",
  "IU_Liquid_pipe_A",
  "IU_Gas_Pipe_A",
  "OU_liquid-pipe_return_B",
];

const FLOW = {
  Heating: {
    "OU_refignant_heating_supply_before_bypass_A": "reverse",
    "OU_refignant_heating_supply_before_bypass_B": "reverse",
    "OU_refignant_heating_supply_after_bypass":    "reverse",
    "pipe-inlet_to_evaporatorA":                   "normal",
    "pipe-liquid-evaporatorA":                     "reverse",
    "pipe-outlet_to_evaporatorB":                  "reverse",
    "4waypipe":                                    "reverse",
    "OU_liquid-pipe_return_A":                     "reverse",
    "OU_liquid-pipe_return_B":                     "reverse",
    "OU_liquid-pipe_afterBypass_A":                "reverse",
    "OU_liquid-pipe_Bypass_A":                     "off",
    "LiquidPipe":                                  "reverse",
    "GasPipe":                                     "normal",
    "IU_Liquid_pipe_A":                            "normal",
    "IU_Gas_Pipe_A":                               "reverse",
  },
  Cooling: {
    "OU_refignant_heating_supply_before_bypass_A": "reverse",
    "OU_refignant_heating_supply_before_bypass_B": "reverse",
    "OU_refignant_heating_supply_after_bypass":    "normal",
    "pipe-inlet_to_evaporatorA":                   "reverse",
    "pipe-liquid-evaporatorA":                     "normal",
    "pipe-outlet_to_evaporatorB":                  "normal",
    "4waypipe":                                    "reverse",
    "OU_liquid-pipe_return_A":                     "reverse",
    "OU_liquid-pipe_return_B":                     "reverse",
    "OU_liquid-pipe_afterBypass_A":                "normal",
    "OU_liquid-pipe_Bypass_A":                     "off",
    "LiquidPipe":                                  "normal",
    "GasPipe":                                     "reverse",
    "IU_Liquid_pipe_A":                            "reverse",
    "IU_Gas_Pipe_A":                               "normal",
  },
  SelfDefrost: {
    "OU_refignant_heating_supply_before_bypass_A": "reverse",
    "OU_refignant_heating_supply_before_bypass_B": "reverse",
    "OU_refignant_heating_supply_after_bypass":    "off",
    "pipe-inlet_to_evaporatorA":                   "reverse",
    "pipe-liquid-evaporatorA":                     "normal",
    "pipe-outlet_to_evaporatorB":                  "normal",
    "4waypipe":                                    "off",
    "OU_liquid-pipe_return_A":                     "reverse",
    "OU_liquid-pipe_return_B":                     "off",
    "OU_liquid-pipe_afterBypass_A":                "off",
    "OU_liquid-pipe_Bypass_A":                     "normal",
    "LiquidPipe":                                  "off",
    "GasPipe":                                     "off",
    "IU_Liquid_pipe_A":                            "off",
    "IU_Gas_Pipe_A":                               "off",
  },
};

export class RefrigerantAnimator {
  constructor(svgRoot) {
    this.root = svgRoot;
    this._injectStyles();
  }

  _injectStyles() {
    if (this.root.querySelector("#refrigerant-anim-styles")) return;
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.setAttribute("id", "refrigerant-anim-styles");
    style.textContent = `
      @keyframes milooo-refrigerant-flow {
        from { stroke-dashoffset: 0; }
        to   { stroke-dashoffset: -50; }
      }
    `;
    this.root.appendChild(style);
  }

  _resolvePaths(id) {
    const el = this.root.querySelector("#" + CSS.escape(id));
    return el && el.tagName === "path" ? [el] : [];
  }

  _reset() {
    for (const id of ALL_PIPES) {
      for (const p of this._resolvePaths(id)) {
        p.style.stroke = "";
        p.style.strokeOpacity = "";
        p.style.strokeDasharray = "";
        p.style.animationName = "";
        p.style.animationDuration = "";
        p.style.animationTimingFunction = "";
        p.style.animationIterationCount = "";
        p.style.animationDirection = "";
      }
    }
  }

  _applyColors(map) {
    for (const [colorKey, ids] of Object.entries(map)) {
      const color = COLORS[colorKey];
      if (!color) continue;
      for (const id of ids) {
        for (const p of this._resolvePaths(id)) {
          p.style.stroke = color;
          p.style.strokeOpacity = "1";
        }
      }
    }
  }

  _startFlow(variant) {
    const flowMap = FLOW[variant] || {};
    for (const id of ALL_PIPES) {
      const dir = flowMap[id];
      if (!dir || dir === "off") continue;
      for (const p of this._resolvePaths(id)) {
        p.style.strokeDasharray = "8 12";
        p.style.animationName = "milooo-refrigerant-flow";
        p.style.animationDuration = "1.5s";
        p.style.animationTimingFunction = "linear";
        p.style.animationIterationCount = "infinite";
        p.style.animationDirection = dir === "reverse" ? "reverse" : "normal";
      }
    }
  }

  _apply4WayValve(isCooling) {
    const heatEl = this.root.querySelector("#" + CSS.escape("4way-valve-heating"));
    const coolEl = this.root.querySelector("#" + CSS.escape("4way-valve-cooling"));
    if (heatEl) heatEl.style.display = isCooling ? "none" : "inline";
    if (coolEl) coolEl.style.display = isCooling ? "inline" : "none";
  }

  _applyCirculationPump(pumpActive) {
    const el = this.root.querySelector("#circulate-pump-state");
    if (!el) return;
    el.style.stroke = pumpActive ? PUMP_ON_COLOR : "";
  }

  apply({ variant, enabled, pumpActive, compActive }) {
    if (!enabled) {
      this._reset();
      this._apply4WayValve(false);
      this._applyCirculationPump(false);
      return;
    }

    this._apply4WayValve(variant !== "Heating");
    this._applyCirculationPump(!!pumpActive);

    this._reset();
    if (variant !== "Heating") {
      this._applyColors(TARGETS[variant] || {});
    }

    if (compActive) {
      this._startFlow(variant);
    }
  }
}