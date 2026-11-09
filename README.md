# Wardrobe Weather Card

An independent community dashboard card for Home Assistant. It suggests clothing for current weather and renders a five-day outfit plan.

**Community release v0.1.0. Not endorsed by Home Assistant or included in HACS defaults.** This is a frontend card, not a Supervisor app/add-on or backend integration.

![Illustrated preview of cardigan, dress, and leggings outfits](docs/preview.svg)

## Features

- Outfit illustrations: trousers, leggings, skirts, dresses, outerwear, knitwear, footwear and accessories.
- Upper-body layer counts, excluding accessories.
- Comfort choice: cold, comfortable or warm.
- Current conditions and a daily forecast planner with high/low temperatures.
- Rain/snow/wind adjustments; missing forecast data is explicitly shown.
- Optional real designer product examples, separate from the generated outfit illustration.

## Manual installation

1. Copy `dist/wardrobe-weather-card.js` to `/config/www/wardrobe-weather-card.js`.
2. In dashboard Resources, register `/local/wardrobe-weather-card.js?v=0.1.0` as a JavaScript module.
3. Reload Home Assistant in your browser.
4. Add the card through the card picker, or use:

```yaml
type: custom:wardrobe-weather-card
entity: weather.your_weather_entity
title: What to wear
show_forecast: true
show_designer: false
```

Use an existing weather entity; do not create an entity with the example ID. The entity must provide a numeric current temperature and °F or °C units. The planner requires daily forecast support.

## HACS custom repository installation

Add `https://github.com/SRVR-JOE/wardrobe-weather-card` as a HACS custom repository with type **Dashboard**, download it, and add the card. A custom repository install does not imply inclusion in HACS defaults or official Home Assistant approval.

## Configuration

| Option | Default | Purpose |
| --- | --- | --- |
| entity | required | Home Assistant weather entity |
| title | What to wear | Card title |
| show_forecast | true | Five-day visual forecast |
| show_designer | false | Optional Tory Burch product examples |

The weather link opens the selected entity's Home Assistant details.

## How the advice works

The current outfit uses apparent temperature when provided, otherwise air temperature. Comfort preferences offset the recommendation temperature by 7°F; the actual displayed temperature is unchanged. General outfit bands are below 32, 45, 60, 70 and 80°F. Rain/snow and strong wind adjust outerwear. These are adjustable clothing suggestions, not individualized protection guarantees.

Forecast outfits use the daytime high; a separate colder-hours note uses the daily low. The forecast follows outfit style and comfort, but intentionally ignores a manually selected top combination for the current day. It shows up to five unique local calendar dates, starting today when supplied. Missing days are never invented.

Style and comfort are saved in browser local storage, shared by this card on the same browser origin. The top-layer choice resets on reload. No account or cloud AI service is used.

## Privacy and images

Weather stays in Home Assistant's frontend connection. The default illustration is locally rendered SVG. With `show_designer: true`, remote product images and links point to Tory Burch; opening that section may contact its image servers. These are fixed examples, not a live stock or price feed. Product imagery and brand names remain their owners' property, and no affiliation is claimed.

## Development

Node 20 or newer. No npm dependencies required.

```sh
npm run build
npm test
```

Source lives in `src/`; `dist/` contains the single installable bundle. Commit both for HACS.

## Release and review

See [RELEASING.md](RELEASING.md). Original source and garment artwork are MIT licensed; see [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY.md).

## Compatibility and limits

- Developed against Home Assistant 2026.10.1; older versions have not been certified.
- English labels, °C/°F, browser-local preferences.
- Forecast subscription uses Home Assistant's daily weather API.
- Automated tests cover clothing logic, missing data, date filtering and forecast teardown. The included demo uses synthetic weather for browser checks.
- Designer photos depend on the vendor CDN and may fail; product links remain usable.

