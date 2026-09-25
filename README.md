# Surf Window

A camera-first New England surf dashboard with beach views, live marine and weather model conditions, 48-hour surf windows, NOAA tide times, a Surf-Forecast widget, and links to Surf Captain and Surfline.

Open `index.html` in a browser or serve this repository as a static site. No build step or API key is required.

## Beaches and cameras

Nahant, Hampton, Jenness, Kennebunk, Long Sands, Point Judith, First Beach (Newport), Second Beach (Middletown), Narragansett, Nantasket/Hull, and Good Harbor. In-page players are configured for Cinnamon Rainbows, the two YouTube feeds, the Jenness Summer Sessions page crop, and the Surfline-hosted players used by partner pages (Long Sands, Point Judith, First/Second Beach, Good Harbor). Nantasket/Hull and Narragansett block embedding, so they link to their publisher pages.

You can add a public YouTube cam to any beach through **Add custom cam**. That choice is saved in your browser only.

## Data and limitations

Surf windows are daylight blocks in the next 48 hours rated Good or Fair from the Open-Meteo hourly forecast: the larger of the swell and wind-wave trains (height and period), whether the swell direction reaches the beach, and wind direction and speed relative to the beach's facing (`shore` angle). Thresholds live in `SURF` and `rateHour()` in `index.html`.

Tides are NOAA CO-OPS high/low predictions from the nearest reference station (Boston, Fort Point NH, Portland, or Newport), set in `beachTide`. Current tide height is interpolated between highs and lows.


Open-Meteo provides the offshore marine model and nearby weather, refreshed every 15 minutes while the dashboard is open. Offshore wave height is not beach breaking-wave height. Surf-Forecast supplies the embedded 48-hour widget. Surf Captain and Surfline are linked for beach-level checks; their report figures are not scraped or republished.

The GitHub Pages workflow publishes changes to this repository once Pages is enabled in Settings → Pages with Source set to GitHub Actions. The separately hosted private version has its own deployment and does not update from GitHub.
