// Fetch the smaller sources: country names and currencies, the UNDP Human Development
// data, the Passport Index matrix and an exchange-rate snapshot. Cached in data-raw (git-ignored).

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { getText } from './lib/http.mjs';

const SOURCES = [
  // [file, url, note]
  ['countries.json', 'https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json', 'mledoze/countries (ODbL): names in many languages, ISO codes, currencies'],
  ['hdr25.csv', 'https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv', 'UNDP Human Development Report 2025 composite indices'],
  ['passport-matrix-iso3.csv', 'https://raw.githubusercontent.com/imorte/passport-index-data/main/passport-index-matrix-iso3.csv', 'Passport Index data, February 2026 (MIT)'],
  ['passport-LICENSE.txt', 'https://raw.githubusercontent.com/imorte/passport-index-data/main/LICENSE', 'license of the passport data'],
  ['fx-usd.json', 'https://open.er-api.com/v6/latest/USD', 'ExchangeRate-API open endpoint, rates against USD (refreshed daily)'],
  ['places.geojson', 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson', 'Natural Earth populated places (public domain), used to place the dots near cities'],
  ['arg-cpi.json', 'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26&limit=200&format=json&start_date=2020-12&sort=asc', 'INDEC consumer price index, national, monthly (Dec 2016=100), via Datos Argentina'],
  ['gho-uhc.json', 'https://ghoapi.azureedge.net/api/UHC_INDEX_REPORTED', 'WHO Global Health Observatory: UHC service coverage index (SDG 3.8.1)'],
];

async function main() {
  await mkdir('data-raw/misc', { recursive: true });
  for (const [file, url, note] of SOURCES) {
    const path = `data-raw/misc/${file}`;
    if (existsSync(path) && !process.argv.includes('--force')) { console.log('cached ', file); continue; }
    const body = await getText(url);
    await writeFile(path, body);
    console.log('fetched', file.padEnd(28), `${(body.length / 1024).toFixed(0)} KB`, '-', note);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
