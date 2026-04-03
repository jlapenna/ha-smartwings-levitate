# Levitate Blinds Card

A premium, custom Lovelace card for Home Assistant specifically designed for **Top-Down Bottom-Up (TDBU)** blinds, such as the Smartwings Levitate series. 

Traditional cover cards in Home Assistant only support a single position slider, making TDBU blinds awkward to control. This card solves that by providing a unified, visual, and intuitive interface that mirrors the physical blinds.

![Preview Placeholder](https://raw.githubusercontent.com/jlapenna/ha-smartwings-levitate/main/preview.png)
*(Note: Add a screenshot of the card to your repo and name it `preview.png`)*

## ✨ Features

- **Visual Editor Support:** Fully editable from the Home Assistant UI! No YAML required.
- **True-to-Life Visualization:** A dynamic window graphic that shows the actual fabric moving up and down as you adjust the rails.
- **Dual Independent Sliders:** Vertical sliders for both the Top Rail and Bottom Rail.
- **Group Support:** Works perfectly with Home Assistant Native Cover Groups to control an entire room's top or bottom rails simultaneously.
- **Themeable:** Respects your Home Assistant theme variables (card background, primary colors, text colors).

---

## 📦 Installation

### Option 1: HACS (Recommended)
1. Open **HACS** in your Home Assistant instance.
2. Click the three dots in the top right corner and select **Custom repositories**.
3. Add `https://github.com/jlapenna/ha-smartwings-levitate` and select the category **Lovelace**.
4. Click **Add**.
5. Search for **Levitate Blinds Card** in HACS and click **Download**.
6. When prompted, reload your browser cache.

### Option 2: Manual
1. Download `levitate-blinds-card.js` from this repository.
2. Copy the file into your `/config/www/` directory in Home Assistant.
3. Go to **Settings** -> **Dashboards** -> **Three dots (top right)** -> **Resources**.
4. Click **Add Resource**:
   - URL: `/local/levitate-blinds-card.js`
   - Resource type: `JavaScript Module`
5. Refresh your browser cache.

---

## ⚙️ Configuration

Add the card to your dashboard using the manual YAML editor.

### Basic Single Blind

```yaml
type: custom:levitate-blinds-card
name: Kitchen Window
top_entity: cover.kitchen_blinds_top
bottom_entity: cover.kitchen_blinds_bottom
```

### Room Group Control (Advanced)

If you have multiple TDBU blinds in one room (e.g., Left, Center, Right), you can control them all at once! 

1. Create a **Cover Group** Helper for all your Top rails (`cover.den_blinds_top_group`).
2. Create a **Cover Group** Helper for all your Bottom rails (`cover.den_blinds_bottom_group`).
3. Use those groups in the card:

```yaml
type: custom:levitate-blinds-card
name: Den Blinds (All)
top_entity: cover.den_blinds_top_group
bottom_entity: cover.den_blinds_bottom_group
```

---

## 📊 Configuration Options

| Name | Type | Requirement | Description |
| :--- | :---: | :---: | :--- |
| `type` | string | **Required** | Must be `custom:levitate-blinds-card` |
| `top_entity` | string | **Required** | The entity ID of your top rail motor. Must be a `cover` entity. |
| `bottom_entity` | string | **Required** | The entity ID of your bottom rail motor. Must be a `cover` entity. |
| `name` | string | Optional | Friendly name displayed at the top of the card. |

---

## 🎨 Theming & Styling

This card automatically adapts to your active Home Assistant theme. If you want to customize it further using `card-mod`, the following CSS variables are utilized:

- `--ha-card-background` / `--card-background-color`: The main background of the card.
- `--primary-color`: The color of the "fabric" and the slider thumbs.
- `--secondary-background-color`: The background color of the window frame/track.
- `--primary-text-color`: The color of the main title.
- `--secondary-text-color`: The color of the percentage labels.
- `--ha-card-border-radius`: The rounding of the card corners.

---

## 🛠️ How it Works

The card assumes your `cover` entities use a standard 0-100 `current_position` attribute where:
* `100%` means the rail is fully at the **top** (ceiling).
* `0%` means the rail is fully at the **bottom** (floor).

When you slide the Top rail down, it sends a `set_cover_position` command to lower the percentage. When you slide the Bottom rail up, it increases the percentage. The blue "fabric" is dynamically drawn between the two rail coordinates.
