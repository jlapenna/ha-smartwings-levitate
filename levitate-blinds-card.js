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
    this.isDragging = false;
    this.activeRail = null;
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
    if (!this.container) {
      this.initDom();
    } else {
      this.shadowRoot.querySelector('.name').innerText = this.config.name || 'Blind';
    }
  }

  initDom() {
    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          background: var(--ha-card-background, var(--card-background-color, white));
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, none);
        }
        .container {
          position: relative;
          width: 140px;
          height: 260px;
          background: var(--secondary-background-color, #e0e0e0);
          border-radius: 8px;
          border: 2px solid var(--divider-color, #ccc);
          touch-action: none;
        }
        .fabric {
          position: absolute;
          left: 0;
          right: 0;
          background: var(--primary-color, #03a9f4);
          opacity: 0.6;
          pointer-events: none;
        }
        .rail {
          position: absolute;
          left: -8px;
          right: -8px;
          height: 32px;
          background: var(--primary-text-color, #444);
          border-radius: 6px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          z-index: 3;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: grab;
          touch-action: none;
        }
        .rail:active { cursor: grabbing; }
        .rail::after {
          content: '|||';
          color: var(--card-background-color, #fff);
          font-size: 10px;
          letter-spacing: 2px;
          opacity: 0.7;
        }
        .name {
          font-weight: 500;
          font-size: 18px;
          color: var(--primary-text-color);
        }
        .percentages {
          display: flex;
          justify-content: space-between;
          width: 140px;
          font-size: 14px;
          color: var(--secondary-text-color);
          font-weight: bold;
        }
      </style>
      <ha-card>
        <div class="name">${this.config.name || 'Blind'}</div>
        <div class="container" id="container">
          <div class="fabric" id="fabric"></div>
          <div class="rail top" id="rail-top"></div>
          <div class="rail bottom" id="rail-bottom"></div>
        </div>
        <div class="percentages">
          <span id="top-pct">Top: --%</span>
          <span id="bot-pct">Bot: --%</span>
        </div>
      </ha-card>
    `;

    this.container = this.shadowRoot.getElementById('container');
    this.railTop = this.shadowRoot.getElementById('rail-top');
    this.railBottom = this.shadowRoot.getElementById('rail-bottom');
    this.fabric = this.shadowRoot.getElementById('fabric');
    this.topPct = this.shadowRoot.getElementById('top-pct');
    this.botPct = this.shadowRoot.getElementById('bot-pct');

    const handlePointerDown = (e, railType) => {
      this.isDragging = true;
      this.activeRail = railType;
      e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
      if (!this.isDragging || !this.activeRail) return;
      const rect = this.container.getBoundingClientRect();
      let y = e.clientY - rect.top;
      y = Math.max(0, Math.min(y, rect.height));
      
      let pctFromTop = (y / rect.height) * 100;
      let position = Math.round(100 - pctFromTop);
      
      if (this.activeRail === 'top') {
        this.currentTopPos = position;
      } else {
        this.currentBottomPos = position;
      }
      this.updateVisuals();
    };

    const handlePointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      e.target.releasePointerCapture(e.pointerId);
      
      const entity = this.activeRail === 'top' ? this.config.top_entity : this.config.bottom_entity;
      const position = this.activeRail === 'top' ? this.currentTopPos : this.currentBottomPos;
      
      this._hass.callService('cover', 'set_cover_position', {
        entity_id: entity,
        position: position
      });
      this.activeRail = null;
    };

    this.railTop.addEventListener('pointerdown', (e) => handlePointerDown(e, 'top'));
    this.railBottom.addEventListener('pointerdown', (e) => handlePointerDown(e, 'bottom'));
    this.railTop.addEventListener('pointermove', handlePointerMove);
    this.railBottom.addEventListener('pointermove', handlePointerMove);
    this.railTop.addEventListener('pointerup', handlePointerUp);
    this.railBottom.addEventListener('pointerup', handlePointerUp);
    this.railTop.addEventListener('pointercancel', handlePointerUp);
    this.railBottom.addEventListener('pointercancel', handlePointerUp);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.config) return;
    const topState = hass.states[this.config.top_entity];
    const bottomState = hass.states[this.config.bottom_entity];
    if (!topState || !bottomState) return;

    if (!this.isDragging) {
      this.currentTopPos = topState.attributes.current_position ?? 0;
      this.currentBottomPos = bottomState.attributes.current_position ?? 0;
      this.updateVisuals();
    }
  }

  updateVisuals() {
    if (this.currentTopPos === undefined || this.currentBottomPos === undefined) return;
    const topY = 100 - this.currentTopPos;
    const bottomY = 100 - this.currentBottomPos;

    this.railTop.style.top = \`calc(\${topY}% - 16px)\`;
    this.railBottom.style.top = \`calc(\${bottomY}% - 16px)\`;

    const minY = Math.min(topY, bottomY);
    const maxY = Math.max(topY, bottomY);
    this.fabric.style.top = \`\${minY}%\`;
    this.fabric.style.bottom = \`\${100 - maxY}%\`;
    
    this.topPct.innerText = \`Top: \${this.currentTopPos}%\`;
    this.botPct.innerText = \`Bot: \${this.currentBottomPos}%\`;
  }

  getCardSize() { return 4; }
}

customElements.define('levitate-blinds-card', LevitateBlindsCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "levitate-blinds-card",
  name: "Levitate Blinds Card",
  description: "A specialized card for Top-Down Bottom-Up blinds.",
  preview: true
});