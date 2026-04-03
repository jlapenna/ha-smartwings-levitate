# Levitate Blinds Card

A custom Home Assistant Lovelace card specifically designed for **Top-Down Bottom-Up (TDBU)** blinds, such as the Smartwings Levitate series.

## Features

- **Visual Feedback:** A realistic window visualization shows the fabric moving in real-time.
- **Dual Sliders:** Independent vertical sliders for both the Top Rail and Bottom Rail.
- **Intuitive UI:** Mirroring the physical behavior of TDBU blinds.

## Installation

### HACS (Recommended)

1. Open **HACS** in your Home Assistant instance.
2. Click the three dots in the top right and select **Custom repositories**.
3. Add `https://github.com/jlapenna/ha-smartwings-levitate` with the category **Lovelace**.
4. Search for **Levitate Blinds Card** and click **Download**.

### Manual

1. Download `levitate-blinds-card.js` from the latest release.
2. Upload it to your `/config/www/` directory.
3. Add the resource to your dashboard:
   - URL: `/local/levitate-blinds-card.js`
   - Type: `JavaScript Module`

## Configuration

```yaml
type: custom:levitate-blinds-card
name: Kitchen Blinds
top_entity: cover.kitchen_blinds_top
bottom_entity: cover.kitchen_blinds_bottom
```

### Options

| Name | Type | Requirement | Description |
| --- | --- | --- | --- |
| `type` | string | **Required** | `custom:levitate-blinds-card` |
| `top_entity` | string | **Required** | The entity ID for the top rail motor. |
| `bottom_entity` | string | **Required** | The entity ID for the bottom rail motor. |
| `name` | string | Optional | Friendly name to display at the top of the card. |
