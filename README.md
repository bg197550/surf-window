# Surf Window

A camera-first New England surf dashboard with beach views, live marine and weather model conditions, 48-hour surf windows, NOAA tide times, a Surf-Forecast widget, and links to Surf Captain and Surfline.

Open `index.html` in a browser or serve this repository as a static site. No build step or API key is required.

## Beaches and cameras

Nahant, North Hampton State Beach, Jenness, Kennebunk, Long Sands, Point Judith, First Beach (Newport), Second Beach (Middletown), Narragansett, Nantasket/Hull, and Good Harbor. In-page players are configured for Cinnamon Rainbows, the two YouTube feeds, the Jenness Summer Sessions Rhombus share player (with the older cropped-page view kept as a second option), and the Surfline-hosted players used by partner pages (Long Sands, Point Judith, First/Second Beach, Good Harbor). Narragansett plays the Warm Winds live stream directly (HLS video via hls.js, native on Safari/iOS), with the Northeast Surfing cam as a still image. Nantasket/Hull shows the Northeast Surfing cam as a still image refreshed every 30 seconds, because its player page blocks embedding.

You can add a public YouTube cam to any beach through **Add custom cam**. That choice is saved in your browser only.

## Data and limitations

Current wind comes from the nearest NWS observation station for each beach (used by Best surf right now, the cards and beach pages) when the report is under 90 minutes old; otherwise the model wind is used and labeled as such.

Measured waves come from NDBC buoys 44013 (Boston), 44098 (Jeffreys Ledge) and 44097 (Block Island). `.github/workflows/update-buoys.yml` runs `scripts/update-buoys.mjs` every 30 minutes and force-pushes a single-commit `data` branch containing `buoys.json`; the page reads it from raw.githubusercontent.com, so main history and Pages deploys aren't touched.

`suite.css` and `suite.js` hold the shared app bar and section tabs; Weather Window loads them from this site so both stay identical. Both sites include a web app manifest and icons, so they can be added to a phone's home screen.

The overview's Best surf right now card picks the beach with the biggest estimated surf (at least 2 ft) where the current wind is offshore or calm, or explains why nothing qualifies. When something qualifies, that card and every qualifying beach card are highlighted and labeled "Good surf now".

Each beach page has a NOAA NEXRAD radar loop (last 50 minutes in 5-minute frames, base reflectivity composite from the Iowa Environmental Mesonet, drawn with Leaflet on a standard OpenStreetMap basemap) and a Windy surface-wind map. No API keys.

Beach surf height is an estimate calibrated to Surf Captain's reports: primary swell height × a period factor (about 0.85 at 8 s, 1.0 at 9–10 s, 1.2 at 12 s), reduced for the swell's angle to the beach; short-period wind chop adds only a little. Buoy calibration can scale it by 0.75–1.3. Add `surfFactor` to a beach to fine-tune it.

The overview opens with a regional outlook for Massachusetts, New Hampshire & Southern Maine, and Rhode Island. For each region it picks the next Good daylight window in the 7-day model (or the next Fair one if there's no Good), names the beach, gives the expected surf height and wind condition (e.g. offshore 5–10 mph), and links straight to that beach's Surfline, Surf Captain, and Surf-Forecast pages to confirm. Everything is computed in the browser from free data; there are no API keys or paid services.

Surf windows are daylight blocks in the next 48 hours rated Good or Fair from the Open-Meteo hourly forecast: the larger of the swell and wind-wave trains (height and period), whether the swell direction reaches the beach, and wind direction and speed relative to the beach's facing (`shore` angle). Thresholds live in `SURF` and `rateHour()` in `index.html`.

Tides are NOAA CO-OPS high/low predictions from the nearest reference station (Boston, Fort Point NH, Portland, or Newport), set in `beachTide`. Current tide height is interpolated between highs and lows.


Open-Meteo provides the offshore marine model and nearby weather, refreshed every 15 minutes while the dashboard is open. Offshore wave height is not beach breaking-wave height. Surf-Forecast supplies the embedded 48-hour widget. Surf Captain and Surfline are linked for beach-level checks; their report figures are not scraped or republished.

The GitHub Pages workflow publishes changes to this repository once Pages is enabled in Settings → Pages with Source set to GitHub Actions. The separately hosted private version has its own deployment and does not update from GitHub.
