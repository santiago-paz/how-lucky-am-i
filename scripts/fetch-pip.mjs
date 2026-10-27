// Fetch the World Bank Poverty and Inequality Platform (PIP) distribution.
//
// For a grid of 100 income lines (2021 PPP dollars per person per day) we ask PIP what share of
// each country, and of the world, lives below that line. Each answer is one point on a
// cumulative distribution (CDF). Together they give the exact survey-based distribution,
// with no curve fitting.
//
// Raw responses are cached in data-raw/pip (git-ignored). Re-running only fetches what is missing.

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { getText, getJSON, pool } from './lib/http.mjs';
import { parseCSVObjects } from './lib/csv.mjs';

// PIP year: the nowcast for the current year (the last year with survey data is two years back).
export const YEAR = Number(process.env.PIP_YEAR || 2026);
export const LINES = 100;
export const Z_MIN = 0.3;
export const Z_MAX = 1000;
export const Z = Array.from({ length: LINES }, (_, k) =>
  +(Z_MIN * Math.pow(Z_MAX / Z_MIN, k / (LINES - 1))).toPrecision(4)
);

const OUT = `data-raw/pip/${YEAR}`;
const BASE = 'https://api.worldbank.org/pip/v1';

async function cached(file, make) {
  if (existsSync(file)) return readFile(file, 'utf8');
  const body = await make();
  await writeFile(file, body);
  return body;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`PIP ${YEAR}: ${LINES} lines from $${Z[0]} to $${Z[LINES - 1]} a day`);

  let done = 0;
  await pool(
    Z.map((z, k) => async () => {
      await cached(`${OUT}/c_${k}.csv`, () =>
        getText(`${BASE}/pip?country=all&year=${YEAR}&povline=${z}&fill_gaps=true&reporting_level=all&format=csv`)
      );
      await cached(`${OUT}/w_${k}.json`, () =>
        getText(`${BASE}/pip-grp?country=WLD&year=${YEAR}&povline=${z}&format=json`)
      );
      if (++done % 20 === 0) console.log(`  ${done}/${LINES}`);
    }),
    5
  );

  // World time series at the standard poverty lines (for the "born at the right time" chart).
  for (const line of [3, 4.2, 8.3]) {
    await cached(`${OUT}/world_ts_${line}.json`, () =>
      getText(`${BASE}/pip-grp?country=WLD&year=all&povline=${line}&format=json`)
    );
  }
  // Regions at the extreme poverty line, latest year.
  await cached(`${OUT}/regions_3.json`, () =>
    getText(`${BASE}/pip-grp?country=all&year=${YEAR}&povline=3&format=json`)
  );

  // Compose one compact file.
  const countries = {};
  const world = [];
  for (let k = 0; k < LINES; k++) {
    const rows = parseCSVObjects(await readFile(`${OUT}/c_${k}.csv`, 'utf8'));
    const byCountry = {};
    for (const r of rows) (byCountry[r.country_code] ||= []).push(r);
    for (const [iso, list] of Object.entries(byCountry)) {
      // Prefer the national estimate. Argentina is urban-only in PIP, so it falls back to urban.
      const pick = list.find((r) => r.reporting_level === 'national') || list.find((r) => r.reporting_level === 'urban') || list[0];
      const c = (countries[iso] ||= {
        name: pick.country_name,
        level: pick.reporting_level,
        welfare: pick.welfare_type,
        pop: +pick.reporting_pop,
        mean: +pick.mean,
        median: +pick.median || null,
        type: pick.distribution_type,
        F: [],
      });
      c.F[k] = +pick.headcount;
    }
    const w = JSON.parse(await readFile(`${OUT}/w_${k}.json`, 'utf8'))[0];
    world[k] = w.headcount;
    if (k === 0) world.pop = w.reporting_pop;
  }
  const w0 = JSON.parse(await readFile(`${OUT}/w_0.json`, 'utf8'))[0];
  // keep the data version so the sources section can cite it
  const info = await getJSON(`${BASE}/versions?format=json`).catch(() => []);
  const version = Array.isArray(info) && info[0] ? info[0].version || info[0].identifier || null : null;
  const composed = { year: YEAR, version, z: Z, world, worldPop: w0.reporting_pop, worldMean: w0.mean, countries };
  await writeFile(`${OUT}/pip-${YEAR}.json`, JSON.stringify(composed));
  const levels = {};
  Object.values(countries).forEach((c) => (levels[c.level] = (levels[c.level] || 0) + 1));
  console.log(`composed ${Object.keys(countries).length} countries`, levels, 'world pop', w0.reporting_pop, 'world mean', w0.mean);
}

main().catch((e) => { console.error(e); process.exit(1); });
