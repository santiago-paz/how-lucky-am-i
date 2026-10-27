// Fetch country indicators from the World Bank World Development Indicators (WDI) and
// Worldwide Governance Indicators (WGI). One request per indicator: the multi-indicator
// endpoint times out. Cached in data-raw/wdi (git-ignored).

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { getJSON, pool } from './lib/http.mjs';

// key: [indicator id, optional date range, optional source id]
export const WDI = {
  pop: ['SP.POP.TOTL'],
  pop0014: ['SP.POP.0014.TO.ZS'],
  pop65: ['SP.POP.65UP.TO.ZS'],
  gnipc: ['NY.GNP.PCAP.PP.CD'],
  pppPrivate2021: ['PA.NUS.PRVT.PP', '2021:2021'],
  pppGdp2021: ['PA.NUS.PPP', '2021:2021'],
  fx: ['PA.NUS.FCRF', '2021:2025'],
  cpi: ['FP.CPI.TOTL', '2019:2025'],
  inflation: ['FP.CPI.TOTL.ZG', '2019:2025'],
  life: ['SP.DYN.LE00.IN'],
  u5: ['SH.DYN.MORT'],
  uhc: ['SH.UHC.SRVS.CV.XD', undefined, 57], // lives in the WDI archives
  oop: ['SH.XPD.OOPC.CH.ZS'],
  catastrophic10: ['SH.UHC.OOPC.10.ZS', undefined, 57],
  elec: ['EG.ELC.ACCS.ZS'],
  cooking: ['EG.CFT.ACCS.ZS'],
  water: ['SH.H2O.SMDW.ZS'],
  waterBasic: ['SH.H2O.BASW.ZS'],
  sanitation: ['SH.STA.SMSS.ZS'],
  sanitationBasic: ['SH.STA.BASS.ZS'],
  internet: ['IT.NET.USER.ZS'],
  vulnerable: ['SL.EMP.VULN.ZS'],
  informal: ['SL.ISV.IFRM.ZS', undefined, 57],
  literacy: ['SE.ADT.LITR.ZS'],
  homicide: ['VC.IHR.PSRC.P5'],
  // Worldwide Governance Indicators, "score" series (0 to 100, higher is better).
  polStability: ['GOV_WGI_PV.SC', undefined, 3],
  ruleOfLaw: ['GOV_WGI_RL.SC', undefined, 3],
  govEffectiveness: ['GOV_WGI_GE.SC', undefined, 3],
  voice: ['GOV_WGI_VA.SC', undefined, 3],
  corruption: ['GOV_WGI_CC.SC', undefined, 3],
  // Educational attainment of adults 25+, cumulative: share who completed at least this level.
  attPrimary: ['SE.PRM.CUAT.ZS'],
  attLowerSec: ['SE.SEC.CUAT.LO.ZS'],
  attUpperSec: ['SE.SEC.CUAT.UP.ZS'],
  attShortTertiary: ['SE.TER.CUAT.ST.ZS'],
  attBachelor: ['SE.TER.CUAT.BA.ZS'],
  attMaster: ['SE.TER.CUAT.MS.ZS'],
  attDoctoral: ['SE.TER.CUAT.DO.ZS'],
  // Food insecurity (FAO, 3-year averages).
  foodInsecure: ['SN.ITK.MSFI.ZS'],
  undernourished: ['SN.ITK.DEFC.ZS'],
  // Global Findex 2025 (survey year 2024), source 28: share of adults who could come up with
  // emergency funds in 30 days without great difficulty, and who have an account.
  emergencyFunds: ['fin24aSD_ND', undefined, 28],
  account: ['account.t.d', undefined, 28],
  slums: ['EN.POP.SLUM.UR.ZS'],
  urban: ['SP.URB.TOTL.IN.ZS'],
  gini: ['SI.POV.GINI'],
};

const OUT = 'data-raw/wdi';

async function main() {
  await mkdir(OUT, { recursive: true });
  const jobs = Object.entries(WDI).map(([key, [id, date, source]]) => async () => {
    const file = `${OUT}/${key}.json`;
    if (existsSync(file)) return;
    const params = new URLSearchParams({ format: 'json', per_page: '5000' });
    if (date) params.set('date', date); else params.set('mrnev', '1');
    if (source) params.set('source', String(source));
    const url = `https://api.worldbank.org/v2/country/all/indicator/${id}?${params}`;
    const json = await getJSON(url);
    const rows = Array.isArray(json) ? json[1] || [] : [];
    if (!rows.length) { console.warn('EMPTY ', key.padEnd(18), id, JSON.stringify(json).slice(0, 160)); return; }
    await writeFile(file, JSON.stringify({ id, url, rows }));
    console.log(key.padEnd(18), id.padEnd(20), rows.length, 'rows', (json[0] && json[0].lastupdated) || '');
  });
  await pool(jobs, 4);

  const meta = await getJSON('https://api.worldbank.org/v2/country?format=json&per_page=400');
  await writeFile(`${OUT}/_countries.json`, JSON.stringify(meta[1]));
  console.log('country metadata', meta[1].length);
}

main().catch((e) => { console.error(e); process.exit(1); });
