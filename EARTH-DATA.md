# Earth geography and scale

Land geometry: Natural Earth, 1:110m physical land polygons (`ne_110m_land.geojson`). Bundled as an ES module in `earth-land.js` so the website does not depend on a live map API.

- Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson
- License: public domain, https://www.naturalearthdata.com/about/terms-of-use/
- Bundled October 23, 2026. Made with Natural Earth.

The game uses Earth's average radius reduced by 1,000: 6,371 game metres, or approximately 40.03 game kilometres in circumference. The atlas globe has real generalized continental coastlines, not survey precision. Geographic positions use spherical geodesic offsets from the selected habitat; the nearby ground is rendered as local terrain tiles rather than a planet-sized mesh.

Terrain heights, vegetation, water/food/shelter sites, and broad climate bands are procedural prototype content. They are not real elevation, land-cover, hydrology, habitat-range, or species-distribution datasets. Rabbit travel between habitats is a testing shortcut. No claim of ecological accuracy is made for these generated local scenes.

Only nearby 96 m terrain tiles are loaded: at most 25 on Standard and 9 on Low. Geometry and instanced GPU resources for distant tiles are disposed. The low-detail atlas globe renders only when opened or manipulated. Regions regenerate deterministically from the habitat origin and tile coordinates. Food resources currently reset if a tile unloads or the game reloads, as in the earlier prototype.
