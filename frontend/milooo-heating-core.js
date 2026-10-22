// Wspólna biblioteka dla kart Milooo Heating Visualiser.

import { formatValue } from "./formatters.js";
import { WeatherAnimator } from "./weather.js";
import { DhwColorizer } from "./dhw.js";
import { FanAnimator } from "./fan.js";
import { RefrigerantAnimator } from "./refrigerant.js";
import { HeatExchangerColorizer } from "./heat_exchanger.js";

const WS_TYPE = "milooo_heating_visualiser/get_config";
const SVG_BASE = "/milooo_heating_visualiser/frontend/";
const SVG_CACHE_BUST = "?v=28";

// Mapowanie: urządzenie → ID grup RYSUNKU (ukrywane, gdy urządzenie nie dodane)
const DEVICE_DRAWINGS = {
  heat_pump_outdoor: ["HeatPump Outdoor Unit"],
  heat_pump_indoor:  ["Heat Pump Indoor Unit"],
  dhw:               ["Domestic-hot-water", "DHW-heat-pump-set"],
  weather:           ["weatherdraw"],
};

// Mapowanie: urządzenie → ID grup DANYCH (ukrywane, gdy brak urządzenia LUB brak encji)
const DEVICE_DATA = {
  heat_pump_outdoor: ["OutdoorUnit"],
  heat_pump_indoor:  ["IndoorUnit"],
  dhw:               ["DHW"],
  zone_1:            ["Zone1"],
  zone_2:            ["Zone2"],
  weather:           ["weather"],
};

export class MiloooHeatingCore {
  constructor(hass, svgName) {
    this._hass = hass;
    this._svgName = svgName;
    this._svgDoc = null;
    this._svgRoot = null;
    this._fields = {};
    this._devices = {};
    this._devices_present = [];
    this._mapping = {};
    this._loaded = false;
    this._weatherAnimator = null;
    this._dhwColorizer = null;
  }

  async load() {
    const resp = await this._hass.callWS({ type: WS_TYPE });
    this._fields = resp.fields || {};
    this._devices = resp.devices || {};
    this._devices_present = resp.devices_present || [];
    this._mapping = resp.mapping || {};
    this._loaded = true;
    await this._loadSvg();
  }

  async _loadSvg() {
    if (this._svgDoc) return this._svgDoc;
    const resp = await fetch(SVG_BASE + this._svgName + SVG_CACHE_BUST);
    const text = await resp.text();
    const parser = new DOMParser();
    this._svgDoc = parser.parseFromString(text, "image/svg+xml");
    return this._svgDoc;
  }

  mount(container) {
    if (!this._svgDoc) return;
    const clone = this._svgDoc.documentElement.cloneNode(true);
    clone.setAttribute("width", "100%");
    clone.setAttribute("height", "auto");
    this._svgRoot = clone;
    container.replaceChildren(clone);
  }

  apply() {
    if (!this._svgRoot || !this._hass) return;

    const q = (id) => this._svgRoot.querySelector(`[id="${id}"]`);
    const present = new Set(this._devices_present || []);

    // --- 1. RYSUNKI: pokaż/ukryj na podstawie devices_present ---
    for (const [deviceId, groupIds] of Object.entries(DEVICE_DRAWINGS)) {
      const isPresent = present.has(deviceId);
      for (const gid of groupIds) {
        const el = q(gid);
        if (el) el.style.display = isPresent ? "" : "none";
      }
    }

    // --- 2. DANE: pokaż/ukryj na podstawie devices_present + hasAny ---
    const fieldsByDevice = {};
    for (const [fieldId, meta] of Object.entries(this._fields)) {
      if (meta.device) {
        if (!fieldsByDevice[meta.device]) fieldsByDevice[meta.device] = [];
        fieldsByDevice[meta.device].push(fieldId);
      }
    }

    for (const [deviceId, groupIds] of Object.entries(DEVICE_DATA)) {
      const isPresent = present.has(deviceId);
      const fields = fieldsByDevice[deviceId] || [];
      const hasAny = fields.some((fId) => {
        const meta = this._fields[fId];
        if (!meta || meta.input_type !== "entity") return false;
        const value = this._mapping[fId];
        return value !== undefined && value !== null && value !== "";
      });

      const show = isPresent && hasAny;
      for (const gid of groupIds) {
        const el = q(gid);
        if (el) el.style.display = show ? "" : "none";
      }
    }

    // --- 3. Iteracja po polach (dane, etykiety, odnośniki) ---
    for (const [fieldId, meta] of Object.entries(this._fields)) {
      const inputType = meta.input_type || "entity";

      if (inputType === "boolean" || inputType === "choice") continue;

      if (inputType === "entity") {
        const entityId = this._mapping[fieldId];
        const stateObj = entityId ? this._hass.states[entityId] : null;

        const dataEl = meta.data_id ? q(meta.data_id) : null;
        const labelEl = meta.label_id ? q(meta.label_id) : null;
        const signEl = meta.sign_id ? q(meta.sign_id) : null;

        if (!stateObj || stateObj.state === "unknown" || stateObj.state === "unavailable") {
          if (dataEl) dataEl.style.display = "none";
          if (labelEl) labelEl.style.display = "none";
          if (signEl) signEl.style.display = "none";
          continue;
        }

        if (dataEl) {
          dataEl.style.display = "";
          const unit = stateObj.attributes.unit_of_measurement || "";
          const formatted = formatValue(stateObj.state, meta.device_class);
          dataEl.textContent = `${formatted}${unit ? " " + unit : ""}`;
          this._attachMoreInfo(dataEl, entityId);
        }

        if (labelEl) {
          const labelSource = this._mapping["label_source"] || "HA";
          if (labelSource === "HA") {
            // Opcja 1: Użyj friendly_name (długie, z prefiksem)
            labelEl.textContent = stateObj.attributes.friendly_name || stateObj.entity_id;
          } else if (labelSource === "name") {
            // Opcja 2: Użyj samej nazwy encji (np. "fan_1_speed")
            const entityName = entityId.split(".")[1]; // np. "fan_1_speed"
            labelEl.textContent = entityName;
          }

          const hideField = meta.hide_label_field;
          const showLabels = hideField ? this._isBooleanEnabled(hideField) : true;
          labelEl.style.display = showLabels ? "" : "none";
        }

        if (signEl) {
          const hideSignField = meta.hide_sign_field;
          const showSign = hideSignField ? this._isBooleanEnabled(hideSignField) : true;
          signEl.style.display = showSign ? "" : "none";
        }
      }
    }

    // --- 4. Weather Animator ---
    this._applyWeather();
    // --- 5. DHW kolor ---
    this._applyDhw();
    // --- 6. Animacja wentylatorów ---
    this._applyFanAnimation();
    // --- 7. Kolor sprężarki ---
    this._applyCompressorColor();
    // --- 8. Kolor parownika (OU-Radiator) ---
    this._applyEvaporatorColor();
    // --- 9. Przepływ czynnika w rurach ---
    this._applyRefrigerantFlow();
    // --- 10. Animacja wymmienika ciepła w Jednoste wewnętnrzej ---
    this._applyHeatExchangerColor();
      }

_applyHeatExchangerColor() {
  if (!this._heatExchangerColorizer) {
    this._heatExchangerColorizer = new HeatExchangerColorizer(this._svgRoot);
  }

  const tempId = this._mapping["hp_indoor_ref_temp"];
  const stateObj = tempId ? this._hass.states[tempId] : null;
  if (!stateObj || stateObj.state === "unknown" || stateObj.state === "unavailable") {
    this._heatExchangerColorizer.setInactive();
    return;
  }

  this._heatExchangerColorizer.update(stateObj.state);
}

_applyRefrigerantFlow() {
  if (!this._refrigerantAnimator) {
    this._refrigerantAnimator = new RefrigerantAnimator(this._svgRoot);
  }

  const enabled = this._isBooleanEnabled("outdoor_fan_animation_enabled");
  if (!enabled) {
    this._refrigerantAnimator.apply({ variant: "Heating", enabled: false, pumpActive: false, compActive: false });
    return;
  }

  const valveId = this._mapping["hp_2way_valve_state"];
  const valveState = valveId ? this._hass.states[valveId]?.state : null;

  const flowId = this._mapping["hp_water_flow"];
  const flowRaw = flowId ? this._hass.states[flowId]?.state : null;
  const flow = parseFloat(flowRaw) || 0;

  const dutyId = this._mapping["hp_pump_duty"];
  const dutyState = dutyId ? this._hass.states[dutyId]?.state : null;
  const duty = dutyState === "on";

  const defrostId = this._mapping["hp_defrosting_state"];
  const defrostState = defrostId ? this._hass.states[defrostId]?.state : null;
  const defrosting = defrostState === "on";

  const compId = this._mapping["hp_comp_freq"];
  const compRaw = compId ? this._hass.states[compId]?.state : null;
  const compFreq = parseFloat(compRaw) || 0;
  const compActive = compFreq > 0;

  const pumpActive = (flow > 2) || duty;

  let variant = "Heating";
  if (defrosting) {
    variant = pumpActive ? "Cooling" : "SelfDefrost";
  } else if (valveState === "Cooling") {
    variant = pumpActive ? "Cooling" : "SelfDefrost";
  }

  this._refrigerantAnimator.apply({ variant, enabled: true, pumpActive, compActive });
}

  _applyEvaporatorColor() {
    const el1 = this._svgRoot?.querySelector("#OU-Radiator_1");
    const el2 = this._svgRoot?.querySelector("#OU-Radiator_2");
    if (!el1 && !el2) return;

    // Jeśli animacja wyłączona – radiator domyślny kolor
    if (!this._isBooleanEnabled("outdoor_fan_animation_enabled")) {
      if (el1) el1.style.fill = "";
      if (el2) el2.style.fill = "";
      return;
    }

    const entityId = this._mapping["hp_defrost"];
    const stateObj = entityId ? this._hass.states[entityId] : null;

    let fill = "";

    if (stateObj && stateObj.state !== "unknown" && stateObj.state !== "unavailable") {
      const temp = parseFloat(stateObj.state);
      if (!isNaN(temp)) {
        if (temp <= -20)      fill = "#e0f0ff";  // mocny szron
        else if (temp <= -10) fill = "#b8d8f0";  // średni szron
        else if (temp <= -5)  fill = "#a0c8e8";  // lekki szron
        // powyżej -5°C – brak szronu (domyślny kolor)
      }
    }

    if (el1) el1.style.fill = fill;
    if (el2) el2.style.fill = fill;
  }

  _applyCompressorColor() {
    const el = this._svgRoot?.querySelector("#compressor-whiteboard");
    if (!el) return;

    // Jeśli animacja wyłączona – sprężarka biała
    if (!this._isBooleanEnabled("outdoor_fan_animation_enabled")) {
      el.style.fill = "";
      return;
    }

    const entityId = this._mapping["hp_comp_freq"];
    const stateObj = entityId ? this._hass.states[entityId] : null;

    if (!stateObj || stateObj.state === "unknown" || stateObj.state === "unavailable") {
      el.style.fill = "";
      return;
    }

    const hz = parseFloat(stateObj.state);
    if (isNaN(hz) || hz <= 0) {
      el.style.fill = "";
    } else {
      el.style.fill = "#00ff00";
    }
  }

_applyFanAnimation() {
  if (!this._fanAnimator) {
    this._fanAnimator = new FanAnimator(this._svgRoot, () => {
      const get = (fieldId) => {
        const entityId = this._mapping[fieldId];
        return entityId ? this._hass.states[entityId]?.state : null;
      };
      return {
        fan1Speed: get("hp_fan1_speed"),
        fan2Speed: get("hp_fan2_speed"),
        enabled: this._isBooleanEnabled("outdoor_fan_animation_enabled"),
      };
    });
    this._fanAnimator.start();
  }
}
  _applyWeather() {
    if (!this._weatherAnimator) {
      this._weatherAnimator = new WeatherAnimator(this._svgRoot, () => {
        const get = (fieldId) => {
          const entityId = this._mapping[fieldId];
          return entityId ? this._hass.states[entityId]?.state : null;
        };
        return {
          sunrise: get("weather_sunrise"),
          sunset:  get("weather_sunset"),
          condition: get("weather_condition"),
          precipRate: get("weather_rain"),
          sunSun: this._hass.states["sun.sun"],   // NOWE – cały obiekt sun.sun (do animacji)
          enabled:       this._isBooleanEnabled("weather_animation_enabled"),
          precipEnabled: this._isBooleanEnabled("weather_precipitation_enabled"),
          bgEnabled:     this._isBooleanEnabled("weather_daynight_background_enabled"),
        };
      });
      this._weatherAnimator.start();
    } else {
      // Animator już działa – tick() odświeży dane przy następnym RAF
    }
  }
  
  _applyDhw() {
  if (!this._dhwColorizer) {
    this._dhwColorizer = new DhwColorizer(this._svgRoot);
  }
  const entityId = this._mapping["dhw_temp"];
  const stateObj = entityId ? this._hass.states[entityId] : null;
  if (stateObj && stateObj.state !== "unknown" && stateObj.state !== "unavailable") {
    this._dhwColorizer.update(stateObj.state);
  }
}

  _isBooleanEnabled(fieldId) {
    const raw = this._mapping[fieldId];
    if (raw === undefined) {
      const meta = this._fields[fieldId];
      return meta ? meta.default : true;
    }
    return raw === true || raw === "true" || raw === "on";
  }

  _attachMoreInfo(el, entityId) {
    const old = el.parentNode.querySelector(".more-info-hit");
    if (old) old.remove();

    const bbox = el.getBBox();
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("class", "more-info-hit");
    rect.setAttribute("x", bbox.x - 2);
    rect.setAttribute("y", bbox.y - 2);
    rect.setAttribute("width", bbox.width + 4);
    rect.setAttribute("height", bbox.height + 4);
    rect.setAttribute("fill", "transparent");
    rect.setAttribute("style", "cursor: pointer; touch-action: manipulation;");

    const open = (e) => {
      e.stopPropagation();
      el.dispatchEvent(new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId },
      }));
    };
    rect.addEventListener("click", open);
    rect.addEventListener("touchstart", open, { passive: true });

    el.parentNode.insertBefore(rect, el.nextSibling);
  }
}