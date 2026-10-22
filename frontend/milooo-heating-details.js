// Karta Lovelace dla rysunku Details.
// Rejestruje się jako customElements.define("milooo-heating-details", ...).

import { MiloooHeatingCore } from "./milooo-heating-core.js";

const SVG_NAME = "milooo-details.svg";

class MiloooHeatingDetails extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._hass = null;
        this._config = {};
        this._core = null;
        this._loaded = false;
    }

    setConfig(config) {
        this._config = config || {};
        this._render();
    }

    set hass(hass) {
        this._hass = hass;
        if (!this._loaded) {
            this._init();
        } else if (this._core) {
            this._core.apply();
        }
    }

    async _init() {
        this._core = new MiloooHeatingCore(this._hass, SVG_NAME);
        try {
            await this._core.load();
            this._loaded = true;
            this._render();
            this._core.mount(this.shadowRoot.querySelector(".svg-container"));
            this._core.apply();
        } catch (e) {
            console.error("MiloooHeatingDetails: init failed", e);
        }
    }

    _render() {
        if (!this.shadowRoot) return;
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                ha-card { overflow: hidden; }
                .svg-container {
                    width: 100%;
                    overflow: auto;
                    max-height: 100vh;
                }
                .svg-container svg {
                    display: block;
                    width: 100%;
                    height: auto;
                }
                .svg-container svg text {
                    user-select: none;
                    -webkit-user-select: none;
                }
            </style>
            <ha-card>
                <div class="svg-container">
                    <div style="padding:16px;color:#888;">Loading Details...</div>
                </div>
            </ha-card>
        `;
    }

    getCardSize() {
        return 12;
    }
}

window.customCards = window.customCards || [];
window.customCards.push({
    type: "milooo-heating-details",
    name: "Milooo Heating Details",
    description: "Heating visualization — Details view",
});

customElements.define("milooo-heating-details", MiloooHeatingDetails);