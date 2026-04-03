class LevitateBlindsCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  render() {
    if (!this._config) return;
    
    this.shadowRoot.innerHTML = `
      <style>
        .card-config {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
        }
        label {
          font-size: 14px;
          color: var(--secondary-text-color);
          margin-bottom: 8px;
        }
        input {
          padding: 10px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-size: 14px;
        }
        input:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      </style>
      <div class="card-config">
        <div class="input-group">
          <label>Name (Optional)</label>
          <input type="text" id="name" value="${this._config.name || ''}" placeholder="e.g. Kitchen Blinds">
        </div>
        <div class="input-group">
          <label>Top Rail Entity (Required)</label>
          <input type="text" id="top_entity" value="${this._config.top_entity || ''}" placeholder="cover.my_blind_top">
        </div>
        <div class="input-group">
          <label>Bottom Rail Entity (Required)</label>
          <input type="text" id="bottom_entity" value="${this._config.bottom_entity || ''}" placeholder="cover.my_blind_bottom">
        </div>
      </div>
    `;

    const updateConfig = () => {
      const newConfig = {
        ...this._config,
        name: this.shadowRoot.getElementById('name').value,
        top_entity: this.shadowRoot.getElementById('top_entity').value,
        bottom_entity: this.shadowRoot.getElementById('bottom_entity').value,
      };
      
      const event = new Event("config-changed", {
        bubbles: true,
        composed: true,
      });
      event.detail = { config: newConfig };
      this.dispatchEvent(event);
    };

    this.shadowRoot.getElementById('name').addEventListener('input', updateConfig);
    this.shadowRoot.getElementById('top_entity').addEventListener('input', updateConfig);
    this.shadowRoot.getElementById('bottom_entity').addEventListener('input', updateConfig);
  }
}
customElements.define('levitate-blinds-card-editor', LevitateBlindsCardEditor);


class LevitateBlindsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() {
    return document.createElement("levitate-blinds-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:levitate-blinds-card",
      name: "Levitate Blinds",
      top_entity: "",
      bottom_entity: ""
    };
  }

  setConfig(config) {
    if (!config.top_entity || !config.bottom_entity) {
      throw new Error("Please define top_entity and bottom_entity");
    }
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    const topState = hass.states[this.config.top_entity];
    const bottomState = hass.states[this.config.bottom_entity];

    if (!topState || !bottomState) return;

    this.render(topState, bottomState);
  }

  render(topState, bottomState) {
    const topPos = topState.attributes.current_position ?? 0;
    const bottomPos = bottomState.attributes.current_position ?? 0;
    
    const topY = 100 - topPos;
    const bottomY = 100 - bottomPos;

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          background: var(--ha-card-background, var(--card-background-color, white));
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, none);
        }
        .container {
          position: relative;
          width: 80px;
          height: 180px;
          background: var(--secondary-background-color, #eee);
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid var(--divider-color, #ccc);
        }
        .fabric {
          position: absolute;
          left: 0;
          right: 0;
          background: var(--primary-color, #03a9f4);
          opacity: 0.6;
          top: ${Math.min(topY, bottomY)}%;
          bottom: ${100 - Math.max(topY, bottomY)}%;
          transition: all 0.3s ease;
        }
        .rail {
          position: absolute;
          left: -2px;
          right: -2px;
          height: 12px;
          background: #444;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          z-index: 3;
          transition: top 0.3s ease;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .rail::after {
          content: '';
          width: 20px;
          height: 2px;
          background: rgba(255,255,255,0.5);
          border-radius: 1px;
        }
        .rail.top { top: calc(${topY}% - 6px); }
        .rail.bottom { top: calc(${bottomY}% - 6px); }
        
        .controls {
          display: flex;
          gap: 20px;
          width: 100%;
          justify-content: center;
        }
        .slider-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .slider-label {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          color: var(--secondary-text-color);
        }
        input[type=range] {
          writing-mode: bt-lr;
          appearance: slider-vertical;
          width: 8px;
          height: 100px;
          padding: 0 10px;
        }
        .name {
          font-weight: 500;
          font-size: 14px;
          color: var(--primary-text-color);
        }
      </style>
      <ha-card>
        <div class="name">${this.config.name || 'Blind'}</div>
        <div class="container">
          <div class="fabric"></div>
          <div class="rail top"></div>
          <div class="rail bottom"></div>
        </div>
        <div class="controls">
          <div class="slider-group">
            <div class="slider-label">Top</div>
            <input type="range" id="topSlider" min="0" max="100" value="${topPos}">
            <div class="slider-label">${topPos}%</div>
          </div>
          <div class="slider-group">
            <div class="slider-label">Bot</div>
            <input type="range" id="bottomSlider" min="0" max="100" value="${bottomPos}">
            <div class="slider-label">${bottomPos}%</div>
          </div>
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById('topSlider').addEventListener('change', (e) => {
      this._hass.callService('cover', 'set_cover_position', {
        entity_id: this.config.top_entity,
        position: parseInt(e.target.value)
      });
    });

    this.shadowRoot.getElementById('bottomSlider').addEventListener('change', (e) => {
      this._hass.callService('cover', 'set_cover_position', {
        entity_id: this.config.bottom_entity,
        position: parseInt(e.target.value)
      });
    });
  }

  getCardSize() {
    return 3;
  }
}

customElements.define('levitate-blinds-card', LevitateBlindsCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "levitate-blinds-card",
  name: "Levitate Blinds Card",
  description: "A specialized card for Top-Down Bottom-Up blinds.",
  preview: true
});