# R3: Passports, visa-free travel and the right to live and work abroad

Prepared 2026-10-27 for the "How Lucky Am I?" project. SP = the scratch folder named in the brief.

## Status labels

- VERIFIED: I read the page or file myself in this session.
- VERIFIED (secondary): I read it, but on Wikipedia or a news page, not a primary source.
- UNVERIFIED: a search snippet or my memory only. Do not publish without a check.
- NOT FOUND: I tried and could not find it.

How I read pages. WebFetch returns a model summary of a page. A quote marked "via fetch" comes from that summary. A quote marked "regex" comes from my own text search of a downloaded file. Quotes from commercial or proprietary pages (Henley, CARICOM, news sites, eac.int, the Swiss SEM) are paraphrased to stay within copyright limits. Kept quotes come from MIT-licensed repos, legal texts, official open-licence pages (gov.uk, Your Europe) and Wikipedia. Local copies of every download are in `$SP/downloads/r3/`. Scripts are in `$SP/scripts/`. All Python that touched downloads ran with `python3 -I`.

---

## 1. Passport Index dataset

Per the coordinator's update, the newer repo is the primary dataset. The older repo is for comparison only.

### 1.1 The two repos

**Primary: imorte/passport-index-data** (VERIFIED, GitHub API and raw files, read 2026-10-27)

- URL: https://github.com/imorte/passport-index-data
- File used: https://raw.githubusercontent.com/imorte/passport-index-data/main/passport-index-matrix-iso3.csv (370,441 bytes, SHA-256 3d461c768cff94aa5e8da34a4709cc26aaa714ab96f6074dfc87de1c01cd247f).
- Licence: MIT. The LICENSE file reads "MIT License" then "Copyright (c) 2019". It names no copyright holder (regex).
- Data date: README says "Last updated: 17 February 2026" (regex).
- History: repo created 2026-02-18. The only commit that touches the ISO3 matrix is "initial release" (2026-02-18). Later commits: "added link to historical data" and "added parser code" (both 2026-02-18) and "fix writing history data" (2026-03-01). The `history/` folder holds only `.gtkeep`.
- GitHub `updated_at` shows 2026-10-18. That is repo metadata, not new data.
- So the data is about 8 months old on 2026-10-27. Nobody has refreshed it since release.
- Source claim in the README: "Data scraped from passportindex.org".
- Files at the root: `passport-index.json` (nested JSON, ISO2 codes), `passport-index-matrix.csv` (country names), `passport-index-matrix-iso2.csv`, `passport-index-matrix-iso3.csv`, `passport-index-tidy.csv`, `passport-index-tidy-iso2.csv`, `passport-index-tidy-iso3.csv`. Also `history/`, `passport-index-parser/`, `LICENSE`, `README.md`.

**Comparison only: ilyankou/passport-index-dataset** (VERIFIED)

- URL: https://github.com/ilyankou/passport-index-dataset
- File used: https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-matrix-iso3.csv (383,407 bytes, SHA-256 91d813d35ced91d50efe0c613b79f70ed7f797eca8b2aa67742c2ceefe336b5b).
- Licence: MIT, "Copyright (c) 2019 Ilya Ilyankou" (regex).
- README: "This repo was last updated on 12 January 2025 and is now archived." (regex). The GitHub API still reports `archived: false`.
- Last data commit: "Update 12 January 2025". Last commit overall: 2026-02-18 "Update readme" (adds the archive note and the link to the newer repo).
- Files: the same six CSVs (matrix and tidy, names, ISO2, ISO3), plus `Update.ipynb`, `legacy/`, `passport.png`. No JSON.

**Licence caution.** MIT covers the repo. The data is a copy of passportindex.org content (Arton Capital). The old README argues the data is "built with publicly available information" and so free to use. I did not read passportindex.org's own terms. Treat the right to reuse the data as UNVERIFIED. Credit both the repo and passportindex.org.

### 1.2 Value legend (primary repo README, VERIFIED, regex)

| Value | Meaning in the README |
|---|---|
| `7` to `360` | Number of visa-free days (CSV only; the JSON keeps `status` and `days` apart) |
| `visa free` | "Visa-free travel where the number of days is unknown" (for example EU freedom of movement; also Seychelles registration, Dominican Republic e-ticket, Singapore and Malaysia arrival cards) |
| `visa on arrival` | "Visa issued upon arrival - effectively visa-free" |
| `eta` | "Electronic travel authorisation." Includes ESTA, Canada eTA, Australia eVisitor, Suriname eTourist card "and similar schemes" |
| `e-visa` | "Electronic visa required" |
| `visa required` | "Standard visa required before travel." Includes Cuba tourist cards and China exit-entry permits for Macau and Hong Kong |
| `no admission` | "Entry not permitted (e.g. active travel bans or conflict zones)" |
| `-1` | "Passport country equals destination country" |

Day values present in the Feb 2026 file: 7, 10, 14, 15, 21, 28, 30, 31, 42, 45, 60, 90, 120, 180, 240, 360. The value 150 is in the Jan 2025 file but not in the Feb 2026 file.

**How the legend differs from the older repo README** (VERIFIED, diff of both READMEs)

1. `eta`: the old README says "new in dataset from 12 January 2025" and names the UK ETA, UK electronic visa waivers and Ivory Coast pre-enrolment. The new README drops those names and says "similar schemes".
2. `e-visa`: the old README says "From 12 January 2025 this category excludes ETAs". The new one says only "Electronic visa required". In both files ETAs have their own `eta` value.
3. `no admission`: the old README says it "Includes rare tricky situations, such as war conflicts or previously Trump travel bans". The new one says "Entry not permitted (e.g. active travel bans or conflict zones)".
4. The old README lists two legacy values, `Hayya Entry Permit` and `covid ban`. The new README drops them. Neither value occurs in either CSV (my count of value classes).
5. The new repo adds `passport-index.json`.

**Are the passport and destination lists the same 199?** Yes (VERIFIED by script). Both files have 199 rows and 199 columns. The set of passports equals the set of destinations in each file. The two files have the same 199 codes in the same row order and column order. Each file has 39,601 cells (199 x 199).

### 1.3 Analysis of the Feb 2026 ISO3 matrix (python3 -I)

- Shape: 199 passports (rows) x 199 destinations (columns). The header is `Passport` plus 199 ISO3 codes.
- No duplicate codes. No ragged rows. No blank cells. The diagonal is `-1` for all 199 codes. `-1` never appears off the diagonal.
- Cells by value class over the whole matrix: day counts 11,050; `visa free` 1,730; `visa on arrival` 5,440; `eta` 1,099; `e-visa` 7,965; `visa required` 12,070; `no admission` 48; self `-1` 199. Total 39,601.

"No prior visa" below means day counts + `visa free` + `visa on arrival` + `eta`, as the brief defines it. E-visa is shown apart. Each row has 198 other destinations.

| Passport | Day counts | visa free | visa on arrival | eta | **No prior visa** | % of 198 | e-visa | visa required | no admission | No prior visa + e-visa | Jan 2025 file: no prior visa |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ARG | 105 | 1 | 34 | 8 | **148** | 74.7 | 29 | 21 | 0 | 177 | 151 |
| DEU | 86 | 36 | 27 | 11 | **160** | 80.8 | 24 | 14 | 0 | 184 | 165 |
| USA | 109 | 3 | 32 | 9 | **153** | 77.3 | 27 | 18 | 0 | 180 | 159 |
| GBR | 109 | 6 | 32 | 9 | **156** | 78.8 | 24 | 18 | 0 | 180 | 162 |
| BRA | 108 | 2 | 31 | 8 | **149** | 75.3 | 27 | 22 | 0 | 176 | 152 |
| IND | 23 | 3 | 25 | 4 | **55** | 27.8 | 55 | 88 | 0 | 110 | 58 |
| NGA | 17 | 9 | 14 | 1 | **41** | 20.7 | 48 | 109 | 0 | 89 | 43 |
| AFG | 4 | 0 | 16 | 2 | **22** | 11.1 | 58 | 117 | 1 | 80 | 26 |
| SGP | 124 | 5 | 26 | 8 | **163** | 82.3 | 22 | 13 | 0 | 185 | 165 |
| CHN | 41 | 1 | 32 | 3 | **77** | 38.9 | 37 | 84 | 0 | 114 | 83 |
| RUS | 74 | 5 | 27 | 8 | **114** | 57.6 | 24 | 60 | 0 | 138 | 117 |
| MEX | 95 | 1 | 31 | 9 | **136** | 68.7 | 36 | 26 | 0 | 172 | 137 |
| EGY | 17 | 2 | 27 | 2 | **48** | 24.2 | 53 | 97 | 0 | 101 | 52 |
| SYR | 6 | 1 | 17 | 2 | **26** | 13.1 | 53 | 118 | 1 | 79 | 28 |

Each row adds up to 199 with the self cell (checked). Machine-readable copies: `$SP/research/r3-pi-counts-successor.json` (Feb 2026) and `$SP/research/r3-pi-counts.json` (Jan 2025).

Top and bottom of the Feb 2026 file by "no prior visa": ARE 169; SGP 163; KOR 163; JPN 162; ESP 161; then BEL, DNK, FIN, FRA, DEU, IRL, ITA at 160 (my printout stopped at 12 rows, so other passports may tie at 160). Bottom: AFG 22; SYR 26; IRQ 29; PAK 29; SOM 32; BGD 33; YEM 33; PSE 35.

### 1.4 Quirks

- **Self cell.** `-1` on the diagonal for every code. The README confirms: "Passport country equals destination country".
- **Which 199.** The arithmetic fits 193 UN member states plus six others: Vatican (VAT), Palestine (PSE), Kosovo (XKX), Taiwan (TWN), Hong Kong (HKG), Macao (MAC). I checked the six are present. I did not check all 193 UN members one by one (UNVERIFIED for the full match).
- **Territories missing.** There is no row or column for PRI, GUM, GRL, FRO, ABW, CUW, SXM, NCL, PYF, CYM, BMU, VGB, TCA, AIA, MSR, GIB, FLK, SHN, COK, NIU, TKL, WLF or ESH. This is why Passport Index tops out at 198 destinations and Henley counts 227.
- **Kosovo** is `XKX`, a row and a column. `XKX` is a user-assigned code, not an official ISO 3166-1 code. Kosovo passport: 80 destinations with no prior visa (Feb 2026). 109 passports can enter Kosovo with no prior visa. Five `no admission` cells in its row.
- **Taiwan** is `TWN`, a row and a column. Taiwan passport: 113 destinations with no prior visa. 74 passports can enter Taiwan with no prior visa.
- **Palestine** is `PSE`, a row and a column. Palestinian passport: 35 destinations with no prior visa. 156 passports can enter with no prior visa.
- **Hong Kong and Macao** are separate rows and columns (`HKG` 147 and `MAC` 191 passports enter with no prior visa).
- **North Korea** column `PRK`: 0 passports enter with no prior visa. **Timor-Leste** `TLS`: 198 (every other passport).
- **`visa free` without days** is used for freedom-of-movement areas. So the `visa free` count for DEU (36) is probably mostly EU, EEA, Switzerland and microstates, not tourist visits (my reading, not checked cell by cell).
- **`no admission`** is rare: 48 cells in total (34 in the Jan 2025 file). It is not a safe stand-in for the US travel ban list.

### 1.5 Change between the two files (Jan 2025 vs Feb 2026)

- 2,935 of 39,601 cells differ (7.4 percent). Of these, 17 only change the day count inside the same class.
- Biggest class moves (old to new): `visa required` to `e-visa` 959; `visa on arrival` to `e-visa` 524; day count to `eta` 256; `e-visa` to `visa required` 183; `visa required` to `eta` 157; `visa free` to a day count 151.
- Whole-matrix totals: `e-visa` 6,704 to 7,965; `visa on arrival` 6,053 to 5,440; `eta` 819 to 1,099.
- For all 14 listed passports, "no prior visa" fell by 1 to 6 (table above). Mostly this is VOA entries re-labelled as e-visa. Do not read it as a real trend in travel freedom.

### 1.6 Rough comparison with Henley

- Henley counts out of 227 destinations (territories included; methodology page). Passport Index counts out of 198 other destinations. So raw totals differ by about 15 percent.
- Shares are close. Singapore: Passport Index 163 of 198 (82.3 percent) vs Henley 192 (July 2026 press release) of 226 other destinations (about 85 percent, my arithmetic). Germany: 160 (80.8 percent) vs Henley 185 (about 82 percent; Wikipedia table, date unknown). USA: 153 (77.3 percent) vs Henley 179 (about 79 percent; Wikipedia, date unknown).
- The bottom matches closely. Afghanistan: 22 in Passport Index (Feb 2026) and 22 in Henley (July 2026, press release). Syria 26 and Iraq 29 in both (Henley figures from the Wikipedia table, date unknown).
- Order at the top differs. Passport Index puts the UAE first (169). Henley puts Singapore first (192) and the UAE joint second (188).
- Rule difference. Henley counts an ETA as visa-free. It counts visa on arrival only when no approval is needed before departure. Passport Index counts every visa on arrival and every ETA in separate classes. E-visas are outside the "no prior visa" count in both.

---

## 2. Henley Passport Index

### 2.1 Latest edition found: July 2026 (VERIFIED, via fetch)

- Publisher: Henley & Partners. Release: dated London, 21 July 2026 (a Tuesday). Edition: the 20th anniversary edition. Press release URL: https://www.henleyglobal.com/newsroom/press-releases/henley-passport-index-20th-anniversary
- Listing page that shows the edition dates: https://www.henleyglobal.com/newsroom/press-releases . Newest first it showed 21 July 2026 and two releases dated 13 January 2026 (a global mobility report and a UAE release about its passport reaching 5th place). It showed no April 2026 and no October 2026 index release. The fetch covered only the first page of that listing.
- October 2026 edition: NOT FOUND on 2026-10-27. I tried the press release listing, the ranking page and a web search.

### 2.2 Top 10 and bottom five

The July 2026 press release gives only part of the table (via fetch):

| Rank | Passport | Count |
|---|---|---|
| 1 | Singapore | 192 (described as visa-free or visa-on-arrival access) |
| 2 (tied) | Japan, South Korea, United Arab Emirates | 188 |
| 4 (tied) | France and 10 other European countries (not named) | not stated |
| 6 | United Kingdom | not stated |
| 7 | Canada | not stated |
| 10 | United States | not stated |

- The release says 38 passports now share the top 10 ranks.
- Bottom: Afghanistan stays last, with access to 22 destinations. Syria and Yemen are named as the next weakest, with no counts.
- The full table is not in any Henley page I could read. The ranking page loads its table with JavaScript. The page text only offers a download of the full ranking.

**Secondary full table (VERIFIED (secondary), Wikipedia, "2026 Henley Passport Index", month not stated):** https://en.wikipedia.org/wiki/Henley_Passport_Index

| Rank | Count | Passports |
|---|---|---|
| 1 | 192 | Singapore |
| 2 | 187 | Japan, South Korea, United Arab Emirates |
| 3 | 186 | Sweden |
| 4 | 185 | Belgium, Denmark, Finland, France, Germany, Ireland, Italy, Luxembourg, Netherlands, Norway, Spain, Switzerland |
| 5 | 184 | Austria, Greece, Malta, Portugal |
| 6 | 183 | Hungary, Malaysia, Poland, United Kingdom |
| 7 | 182 | Australia, Canada, Czech Republic, Latvia, New Zealand, Slovakia, Slovenia |
| 8 | 181 | Croatia, Estonia |
| 9 | 180 | Liechtenstein, Lithuania |
| 10 | 179 | Iceland, United States |

Bottom five in the same Wikipedia table: Afghanistan 23 (rank 101), Syria 26 (100), Iraq 29 (99), Pakistan and Yemen 31 each (98, tied).

These numbers do not match the July press release (187 vs 188 for Japan, South Korea and the UAE; Afghanistan 23 vs 22). So the Wikipedia table is a different month. Henley says it updates monthly. Do not mix the two. Pick one dated source.

An older snippet list from Outlook Money and African Courier (UNVERIFIED, search result only, probably January 2026) shows Singapore 192, Japan and South Korea 188, and the UAE 5th on 184.

### 2.3 Method and data access

- Source: IATA. The July 2026 release credits IATA Timatic data (via fetch). The methodology page also names IATA but gives the wrong last word (Authority instead of Association).
- Coverage: 199 passports and 227 destinations (20th anniversary page and methodology page, via fetch). The destinations include countries, territories and micro-states. Methodology URL: https://www.henleyglobal.com/passport-index/methodology
- Scoring (methodology page, via fetch): an ETA counts as visa-free. Visa on arrival counts only when no approval is needed before departure. E-visas do not count. Traditional visas do not count.
- Update rate: the methodology page says the index is updated monthly.
- Download: NOT openly available. The ranking page offers a download of the full ranking, but the form sends the link by email and needs email verification. The footer reserves all rights. I did not submit the form (it needs a person's email address). URL: https://www.henleyglobal.com/passport-index/ranking
- Henley's own HTML has no data endpoint I could find (I looked for API and JSON links in the page source).

---

## 3. Regimes that give a right to live and work abroad

Definitions. **full** = no permit or visa needed to live and work (registration may be needed). **partial** = a right on paper, but a permit, certificate or conditions apply. Machine-readable list: `$SP/research/r3-blocs.json` (15 entries, extra fields added: `who`, `direction`, `verified`, `note`, `pop2025_wb`).

### 3.1 Summary, ranked by people covered

"People covered" = World Bank 2025 population of the member states (beneficiary states only for one-way regimes). Source: World Bank WDI, indicator SP.POP.TOTL, year 2025, last updated 2026-10-08, https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2024:2025 (VERIFIED, downloaded). World total in that file: 8,215,424,893 (2025) and 8,140,897,523 (2024).

| # | Regime (id) | Rights | Members (ISO3) | Population | Share of world |
|---|---|---|---|---|---|
| 1 | India-Nepal 1950 Treaty (india-nepal) | full | IND NPL | 1,493.5 M | 18.2% |
| 2 | EU + EEA + Switzerland (eu-eea-ch) | full | 27 EU states + ISL LIE NOR + CHE | 466.3 M | 5.7% |
| 3 | Mercosur Residence Agreement (mercosur-residence) | partial | ARG BOL BRA CHL COL ECU PRY PER URY | 407.8 M | 5.0% |
| 4 | ECOWAS (ecowas) | partial | BEN CPV CIV GMB GHA GIN GNB LBR NGA SEN SLE TGO (MLI BFA NER interim) | 382.9 M | 4.7% |
| 5 | East African Community (eac) | partial | BDI COD KEN RWA SSD TZA UGA SOM | 353.1 M | 4.3% |
| 6 | Eurasian Economic Union (eaeu) | full | ARM BLR KAZ KGZ RUS | 183.9 M | 2.2% |
| 7 | Andean Community (andean-can) | partial | BOL COL ECU PER | 118.9 M | 1.4% |
| 8 | Common Travel Area (cta-uk-ie) | full | GBR IRL (+GGY JEY IMN) | 75.1 M | 0.9% |
| 9 | GCC (gcc) | partial | BHR KWT OMN QAT SAU ARE | 63.4 M | 0.8% |
| 10 | Trans-Tasman (trans-tasman) | full | AUS NZL | 32.9 M | 0.4% |
| 11 | Nordic (nordic) | full | DNK FIN ISL NOR SWE (+FRO GRL) | 28.4 M | 0.3% |
| 12 | CARICOM CSME skilled (caricom-csme) | partial | ATG BRB BLZ DMA GRD GUY JAM KNA LCA VCT SUR TTO | 7.0 M | 0.1% |
| 13 | NZ citizens of Cook Is., Niue, Tokelau (nz-realm) | full | NZL COK NIU TKL | 5.3 M (NZL only; COK, NIU, TKL not in World Bank file) | 0.1% |
| 14 | CARICOM full free movement (caricom-full-2025) | full | BRB BLZ DMA VCT | 0.9 M | 0.0% |
| 15 | US Compacts of Free Association (cofa-us) | full | FSM MHL PLW into USA | 0.2 M | 0.0% |

Combined (overlaps removed), as a share of the 2025 world total:
- Any regime, full or partial: 99 codes, 3.46 B people, 42.1 percent. Without India-Nepal: 97 codes, 1.97 B, 23.9 percent.
- Full regimes only: 56 codes, 2.25 B, 27.4 percent. Without India-Nepal: 54 codes, 0.75 B, 9.2 percent.
- These count where people live, not who holds the passport. Partial regimes still need paperwork. Treat them as an upper bound.

### 3.2 Regime by regime

**EU + EEA + Switzerland (eu-eea-ch), full.**
- Who: citizens of the 27 EU states, Iceland, Liechtenstein, Norway and Switzerland, in any of the others.
- Basis: Directive 2004/38/EC (URL https://eur-lex.europa.eu/eli/dir/2004/38/oj/eng, NOT read: EUR-Lex returned an empty page to scripts). EEA Agreement (in force 1994) and the EU-Switzerland Free Movement Agreement (signed 1999, in force 2002): years from memory, UNVERIFIED.
- VERIFIED, Your Europe (https://europa.eu/youreurope/citizens/residence/residence-rights/index_en.htm), via regex: "right to move to any EU country to live, work, study". Stay over 3 months may need registration.
- VERIFIED, Swiss State Secretariat for Migration (https://www.sem.admin.ch/sem/en/home/themen/fza_schweiz-eu-efta.html): the free movement agreement (AFMP) lifts restrictions on EU citizens who want to live or work in Switzerland. The same page says the rules also apply to EFTA citizens.
- VERIFIED (secondary), Wikipedia "Freedom of movement for workers in the European Union": EEA citizens "have the same right of freedom of movement in the EEA as EU citizens".
- Caveats 2025-26: Swiss voters rejected the SVP "No to 10 million Switzerland" initiative on 14 June 2026, 54.79 percent no, turnout about 58.9 percent (UNVERIFIED: search snippets from iamexpat.ch, aa.com.tr, swissinfo.ch; pages not fetched). So Swiss free movement stays. Bilaterals III is not settled. UK citizens are outside the regime since Brexit. Andorra, Monaco, San Marino and the Vatican are outside it. Liechtenstein limits new residence permits (UNVERIFIED).

**Mercosur Residence Agreement (mercosur-residence), partial.**
- Who: nationals of the parties, in any other party. Temporary residence up to two years, then permanent. Rights as a national, "en particular el derecho a trabajar" (Art. 9).
- Basis: Acuerdo sobre Residencia para Nacionales de los Estados Partes del MERCOSUR, Bolivia y Chile, signed in Brasilia on 6 December 2002. Text read (VERIFIED, Argentine law text, regex): https://www.argentina.gob.ar/normativa/nacional/norma-96649/texto . Art. 1: nationals "podrán obtener una residencia legal en este último". Art. 2 defines "Estados Partes" as Mercosur member and associated states. The preamble names Argentina, Brazil, Paraguay and Uruguay as Mercosur States Parties and Bolivia and Chile as Associated States.
- Parties: nine (ARG BOL BRA CHL COL ECU PRY PER URY). VERIFIED (secondary), Wikipedia "Citizenship of the Mercosur": members Argentina, Brazil, Bolivia, Paraguay, Uruguay and associated Chile, Colombia, Ecuador, Peru. Colombia, Ecuador and Peru as later adherents: UNVERIFIED in a primary source. Venezuela, Guyana, Suriname: no evidence they apply it.
- Why partial: an application is needed. Documents: passport or ID, birth certificate, criminal record certificate (Wikipedia, secondary). Wikipedia says it grants "the right to residence and work for citizens with no requirement other than nationality".
- Caveats 2025-26: not checked. UNVERIFIED: Argentina and Chile reportedly tightened migration rules in 2025-26.
- Primary-source note: mercosur.int and the Peruvian government PDFs returned HTTP 403.

**Nordic (nordic), full.**
- Who: citizens of Denmark, Finland, Iceland, Norway and Sweden (and Faroe Islands, Greenland) in each other's territory.
- Basis (VERIFIED (secondary), Wikipedia "Nordic Passport Union", https://en.wikipedia.org/wiki/Nordic_Passport_Union): on 1 July 1954 the arrangement was widened so citizens could live and work in the countries "without a residence or work permit". Passport checks were removed by a treaty of 12 July 1957 (in force 1 May 1958). Iceland joined on 1 January 1966. Helsinki Treaty 1962: year from memory, UNVERIFIED. norden.org returned HTTP 403.
- All five are in the EEA. So the Nordic regime adds rights only for the Faroe Islands and Greenland (Wikipedia: Greenland "allows Nordic citizens to enter, settle and work without requiring a passport or permits").

**Common Travel Area, UK and Ireland (cta-uk-ie), full.**
- Who: British and Irish citizens, in each other's country and the Crown Dependencies (Jersey, Guernsey, Isle of Man).
- VERIFIED, gov.uk "Common Travel Area guidance", updated 1 January 2026: https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance . Quotes (via fetch): "move freely and reside in either jurisdiction"; "you can work in either country". Basis cited: the UK-Ireland Memorandum of Understanding of May 2019. The CTA "pre-dates both British and Irish membership of the EU".
- Not covered: family members who are not British or Irish citizens. Other nationalities stay under national rules.
- Caveat 2025-26: UK ETA from 2025, but Irish citizens do not need one (gov.uk ETA page lists "a British or Irish passport" as exempt: https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta , regex).

**Trans-Tasman, Australia and New Zealand (trans-tasman), full.**
- Who: Australian and New Zealand citizens, in the other country. Australia grants NZ citizens a Special Category visa (subclass 444) on arrival.
- Basis: Trans-Tasman Travel Arrangement of 1973. VERIFIED (secondary), Wikipedia (https://en.wikipedia.org/wiki/Trans-Tasman_Travel_Arrangement): citizens may travel "without passports or visas"; Australian citizens and permanent residents are exempt from visa and residence permit rules in New Zealand.
- Primary pages failed: Australian Home Affairs subclass 444 page returned HTTP 403 (fetch) and 404 (curl). The NZ Immigration page came back blank.
- UNVERIFIED (memory): subclass 444 holders have limited welfare access. Since 1 July 2023 NZ citizens living in Australia can apply for citizenship more easily.
- Related (nz-realm): Wikipedia "Cook Islands": "Most Cook Islanders have New Zealand citizenship". They hold NZ passports. Niue and Tokelau: UNVERIFIED. Passport Index has no row for COK, NIU or TKL.

**GCC (gcc), partial.**
- Who: citizens of Bahrain, Kuwait, Oman, Qatar, Saudi Arabia and the UAE.
- Basis (VERIFIED (secondary), Wikipedia "Gulf Cooperation Council", https://en.wikipedia.org/wiki/Gulf_Cooperation_Council): common market launched 1 January 2008. In January 2015 it widened to cover "full equality among GCC citizens to work in government and private sectors". The 2001 Economic Agreement as the legal text: from memory, UNVERIFIED. The GCC Secretariat page was a JavaScript shell I could not read.
- Why partial: the rights are on paper. Residence and work still go through national procedures (UNVERIFIED).

**ECOWAS (ecowas), partial.**
- Who: citizens of the 12 current member states: BEN CPV CIV GMB GHA GIN GNB LBR NGA SEN SLE TGO.
- Basis (VERIFIED (secondary), Wikipedia "ECOWAS", https://en.wikipedia.org/wiki/ECOWAS): the May 1979 Protocol "permits citizens to enter, reside, and establish economic activities in the territory" of member states. Protocol code A/P.1/5/79 and the 1986 and 1990 supplementary protocols: from memory, UNVERIFIED.
- Why partial: visa-free entry (phase 1) works. Residence and establishment (phases 2 and 3) are only partly applied (UNVERIFIED).
- Mali, Burkina Faso, Niger: Wikipedia says the withdrawal "took effect on 29 January 2025" (VERIFIED (secondary)). UNVERIFIED (search snippets, not fetched): ECOWAS said free movement would continue for their citizens until further notice.
- Newest news (VERIFIED (secondary)): MyJoyOnline, dated 19 October 2026, reports a ministers' meeting in Dakar. ECOWAS and the AES agreed to build a framework for cooperation. The article says it aims to largely keep visa-free movement and the flow of goods. Terms are not final. URL: https://www.myjoyonline.com/ecowas-aes-agree-to-build-cooperation-framework-in-dakar-meeting-after-split-in-2025/ . The article does not mention residence rights or ECOWAS passports.
- JSON: the three AES states are in a `members_interim` field, not in `members`.

**CARICOM CSME (caricom-csme), partial. And full free movement for four states (caricom-full-2025), full.**
- CSME skilled categories (VERIFIED (secondary), Wikipedia "CARICOM Single Market and Economy", https://en.wikipedia.org/wiki/CARICOM_Single_Market_and_Economy): "The freedom to live and work throughout the CSME is granted by" the CARICOM Skills Certificate, which replaces work permits. Categories were widened to include household domestics, nurses, teachers and some vocational workers. The single market started on 1 January 2006 (date from memory; Wikipedia mentions it for Montserrat). Haiti is "not a full participant". Member list of 12 (ATG BRB BLZ DMA GRD GUY JAM KNA LCA VCT SUR TTO): UNVERIFIED (from memory; the Wikipedia text I read did not list it).
- Full free movement from 1 October 2025 (VERIFIED, CARICOM news item, https://caricom.org/?p=47868, regex): Barbados, Belize, Dominica and St Vincent and the Grenadines grant their nationals the right to move, reside, work and stay indefinitely, with no work or residency permit (paraphrase of the CARICOM item).
- Not checked: whether more states joined between October 2025 and October 2026.

**East African Community (eac), partial.**
- Who: citizens of the partner states: BDI COD KEN RWA SSD TZA UGA SOM. VERIFIED: the names appear on https://www.eac.int/eac-partner-states (regex). Whether the Protocol applies fully to COD, SSD and SOM: UNVERIFIED.
- Basis (VERIFIED, eac.int Common Market page, via fetch, https://www.eac.int/common-market): the Common Market Protocol was signed and entered into force in 2010. The page lists free movement of persons and of labour and the rights of establishment and residence.
- Limits (via fetch): the right is not absolute (states may limit it for public policy, security or health). Public service jobs are excluded unless host law allows. The page says the 2015 target for fully opening the services schedule was not met.

**Eurasian Economic Union (eaeu), full.**
- Who: citizens of ARM BLR KAZ KGZ RUS.
- VERIFIED (secondary), Wikipedia "Eurasian Economic Union", https://en.wikipedia.org/wiki/Eurasian_Economic_Union: free movement of "labour without a work permit"; citizens can "live, work, study or retire". Treaty (signed 29 May 2014, in force 1 January 2015): dates from memory, UNVERIFIED. Wikipedia confirms Kyrgyzstan's accession took effect on 6 August 2015.
- Union State of Russia and Belarus (VERIFIED (secondary), https://en.wikipedia.org/wiki/Union_State): the right "to work and permanently settle in either country". This overlaps with the EAEU.
- Not checked: registration rules; 2025-26 changes in Russian migration law.

**Andean Community (andean-can), partial, UNVERIFIED.**
- Members: BOL COL ECU PER. From memory: Decision 545 (Andean Labour Migration Instrument, 2003) and Decision 878 (Andean Migration Statute, 2021). I did not verify either. The Wikipedia page I read has nothing useful on this. A search found nothing. All four are also in the Mercosur agreement, which is the clearer route.
- URL (home page only): https://www.comunidadandina.org/

**US Compacts of Free Association (cofa-us), full, one-way.**
- Who: citizens of the Federated States of Micronesia (FSM), the Marshall Islands (MHL) and Palau (PLW), into the USA. No equal right for US citizens.
- VERIFIED, Compact text, Title One, Article IV, Section 141(a): http://www.fsmlaw.org/compact/t01art04.htm . Quote (regex): "may enter into, lawfully engage in occupations, and establish residence as a non-immigrant". Section 141(c) says this gives no right to the residence needed for naturalization. This page covers FSM and the Marshall Islands. I did not read Palau's text.
- Legal citations (VERIFIED (secondary), Wikipedia "Compact of Free Association", https://en.wikipedia.org/wiki/Compact_of_Free_Association): Pub. L. 99-239 (1986, FSM and RMI); Pub. L. 99-658 (Palau, in effect 1994); Pub. L. 108-188 (2003 amended compact); Pub. L. 118-42 (2024 renewal, shown in the infobox only). Wikipedia says "Most citizens of the associated states may live and work in the United States".
- Caveats 2025-26: none found. The US entry bans of 2025-26 (section 4) do not name FSM, MHL or PLW.

**India-Nepal (india-nepal), full.**
- Who: Indian and Nepali citizens, in each other's country.
- VERIFIED (secondary), Wikipedia "India-Nepal relations", https://en.wikipedia.org/wiki/India%E2%80%93Nepal_relations: nationals "may live and work in either country" and cross without passports or visas.
- Basis: Treaty of Peace and Friendship, 31 July 1950, Article 7. Article text from memory, UNVERIFIED. Some government jobs are likely closed to foreigners (UNVERIFIED).
- India-Bhutan has a similar but unequal arrangement. I did not check it and left it out of the JSON.

### 3.3 Not mapped (no working right to live and work, or not checked)

- SADC Protocol on the Facilitation of Movement of Persons (2005), COMESA Protocol on free movement (2001), and the AU Free Movement Protocol (2018): from memory, these are not in force or have too few ratifications. UNVERIFIED. My Wikipedia reads and searches found nothing on them. Do not paint them.
- Quota or programme routes, not a free right: Australia-Tuvalu Falepili Union (2024), NZ Pacific Access Category, Pacific labour schemes (PALM). UNVERIFIED, memory only.
- Application routes with easier terms: CPLP mobility agreement (2021), Brazil-Portugal Porto Seguro treaty (2000). UNVERIFIED, memory only.

---

## 4. 2025-2026 changes that alter visa-free counts

**UK Electronic Travel Authorisation (ETA)**
- Non-European visa-exempt nationals: ETA needed for travel from 8 January 2025 (applications opened 27 November 2024). European visa-exempt nationals: from 2 April 2025 (applications opened 5 March 2025). Fee £10, then £16 from 9 April 2025, then £20 from 8 April 2026. Irish citizens are exempt. VERIFIED (secondary), Wikipedia "Electronic Travel Authorisation (United Kingdom)": https://en.wikipedia.org/wiki/Electronic_Travel_Authorisation_(United_Kingdom)
- Official page (VERIFIED, regex): https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta . Quote: "a British or Irish passport" is exempt.
- Effect on counts: Passport Index and Henley both class an ETA as no-prior-visa travel. With the brief's rule (visa free + VOA + eta) the UK ETA does not lower a count.

**EU Entry/Exit System (EES)**
- Became operational at all Schengen border checkpoints on 10 April 2026, and passport stamps ended (VERIFIED (secondary), Wikipedia "Entry/Exit System": https://en.wikipedia.org/wiki/Entry/Exit_System ). Quote: "became operational at all Schengen Area border checkpoints on 10 April 2026".
- The progressive start on 12 October 2025: from memory, UNVERIFIED (not in the text I read).
- Effect on counts: none. It registers biometrics and tracks the 90 in 180 days limit. The same page reports waits of up to five hours at some borders.
- Official site (https://travel-europe.europa.eu/ees_en) is a JavaScript shell. I could not read it.

**EU ETIAS**
- Status: NOT confirmed. UNVERIFIED and in conflict. Wikipedia "European Travel Information and Authorisation System" says both "scheduled to come into force in 2027" and "pushed back again to the final quarter of 2026". A Czech foreign ministry page (updated 7 March 2025) says the system should work from 2026. A commercial site (entry.com, last reviewed 2026-07-11) gives 1 November 2026 as the go-live date with a €7 fee, and cites no EU document. Wikipedia gives a €20 fee for ages 18 to 70. A search found no EU notice of a firm date.
- The official ETIAS pages gave no readable text (travel-europe.europa.eu is a JavaScript shell; the home-affairs page URL I tried returned 404). Check https://travel-europe.europa.eu/etias_en by hand before publishing a date.
- Effect on counts: ETIAS is an authorisation like an ETA. With the brief's rule it would not lower the Schengen count.

**US entry restrictions**
- Proclamation 10949, signed 4 June 2025, in force from 9 June 2025 (the date is from Wikipedia "Travel bans under the Trump administrations", https://en.wikipedia.org/wiki/Travel_bans_under_the_Trump_administrations). The text on whitehouse.gov (VERIFIED, regex) lists the full restrictions on 12 countries: Afghanistan, Burma, Chad, Republic of the Congo, Equatorial Guinea, Eritrea, Haiti, Iran, Libya, Somalia, Sudan and Yemen. It lists partial restrictions on 7: Burundi, Cuba, Laos, Sierra Leone, Togo, Turkmenistan and Venezuela. Source URL: https://www.whitehouse.gov/presidential-actions/2025/06/restricting-the-entry-of-foreign-nationals-to-protect-the-united-states-from-foreign-terrorists-and-other-national-security-and-public-safety-threats/ . Quote: "fully restrict and limit the entry of nationals of the following 12 countries".
- Expansion (VERIFIED (secondary), same Wikipedia page): the policy grew to 39 countries on 16 December 2025 (Proclamation 10998, effective 1 January 2026). I did not read the proclamation or the list of 39. An immigrant-visa processing pause took effect on 21 January 2026 (same page; country list not read).
- Visa bonds (same Wikipedia page): a bond of US$5,000 to US$15,000 for some tourist and business visa applicants, from 20 August 2025 (Malawi, Zambia). Extended to 12 more countries from 2 April 2026, 18 in total (the 12 new ones: Cambodia, Ethiopia, Georgia, Grenada, Lesotho, Mauritius, Mongolia, Mozambique, Nicaragua, Papua New Guinea, Seychelles, Tunisia).
- Effect on counts: these change what US-bound travellers from listed countries face, not what holders of US passports can reach. In Passport Index they should show as `visa required` or `no admission` on the listed row-to-USA cells. I did not check how the Feb 2026 file codes them.

**China**
- Henley's July 2026 release says UK passport holders gained visa-free access to China and Malawi, and that US citizens still need a visa for China (via fetch). So China's visa-free list is a big mover for Henley counts.
- Wikipedia "Visa policy of China" (https://en.wikipedia.org/wiki/Visa_policy_of_China) has a table cell reading "Temporary visa exemption reduction until 31 Dec 2026". I did not read the country list.
- UNVERIFIED (memory): China has widened unilateral 30-day visa-free entry to dozens of countries since 2023, with end dates set at 31 December 2026 in many cases. Check the official China National Immigration Administration notices.

**Other candidates, not checked (UNVERIFIED, memory)**
- Bulgaria and Romania joined the Schengen area fully on 1 January 2025.
- Several Asian and African destinations shortened visa-free stays or added e-visas or ETAs in 2025-26. The Passport Index files already show a net move from `visa on arrival` to `e-visa` (section 1.5).

---

## 5. Share of the world population that holds a passport

NOT FOUND. I found no direct, citable source for a global share.

- Tried: one web search for the global share (2026-10-27). It returned only country-level figures. I also read the Passport Index and Henley pages above. Neither states a global share.
- Country-level numbers in the search results (UNVERIFIED, snippets only, different years and methods): United States 42 percent in 2017 (Statista chart); United States 36 percent (Matador, from State Department counts); Canada 66 percent in 2016 and England and Wales about 76 percent (Statista); Japan about 17.5 percent at the end of 2024 (Korea Times and Arab News Japan reports).
- The common claim "about half" or "about a third" has no source I could trace. Recommendation: do not print a global share. If the site needs a line, say that no official global count exists, and show country-level figures with their own sources.

---

## Gaps and cautions

1. **Data age.** The newest Passport Index file is from 17 February 2026. Neither repo has been refreshed since. The Henley edition found is July 2026. The October 2026 Henley edition was not found.
2. **Licence.** MIT covers the repo code and layout. The underlying data comes from passportindex.org. I did not read its terms. Ask or credit and link.
3. **Two numbers for one passport.** Passport Index and Henley use different destination sets (198 vs 227) and different rules. Never mix them in one chart. Henley also changes monthly, and the press editions are quarterly.
4. **Henley's top 10 is partial.** The press release names only some ranks. The full table I have is Wikipedia's, with an unknown month and counts that differ by one from the press release.
5. **Many regime facts are secondary.** The Nordic, Trans-Tasman, GCC, ECOWAS, CARICOM CSME, EAEU and India-Nepal entries rest on Wikipedia only. The Andean entry is memory only. Treaty years marked UNVERIFIED are from memory.
6. **Blocked sources.** EUR-Lex (empty page), norden.org (403), efta.int (403), mercosur.int (403), gob.pe PDFs (403), Australian Home Affairs (403 and 404), NZ Immigration (blank), GCC Secretariat (script shell), travel-europe.europa.eu (script shell), home-affairs ETIAS page (404). A browser pass over these would close most gaps.
7. **Rights are graded.** `full` still means registration after a stay, means tests for non-workers (EU) or closed public-sector jobs (EAC, India-Nepal). `partial` means a permit or certificate is needed. Use two colours on the map.
8. **One-way regimes.** For the Compacts of Free Association the `members` list includes the USA as host. Use the `direction` field. Population "covered" counts only FSM, MHL and PLW.
9. **Population method.** "People covered" is the World Bank 2025 total of member states, not holders of the passport. Memberships overlap (Nordic inside EEA, Andean inside Mercosur, EAEU inside Union State), so do not add the rows. Use the union figures in section 3.1.
10. **World total.** The World Bank file gives 8.215 billion for 2025 and 8.141 billion for 2024. The brief's "8.3 billion" looks like a 2026 estimate. Check which year and source the site uses.
11. **Territories.** Passport Index has no row for most territories. The Cook Islands, Niue and Tokelau need handling by the NZ passport. Kosovo is `XKX`, which is not an official ISO code.
12. **Swiss vote and ECOWAS "until further notice"** come from search snippets and one news article. Confirm before publishing.
13. **US list of 39 countries** was not read. Proclamation 10998 should be read in full before any country-level claim.
14. **Fetch summaries.** WebFetch answers come from a small model. I used regex reads of downloaded pages for the key quotes where I could. Where a quote says "via fetch", treat it as a lead and re-check it.
15. **Not in the JSON.** SADC, COMESA, the AU protocol, India-Bhutan, quota schemes and CPLP. Reason: no working or checked right.

## in plain english

The Passport Index data is a copy from early 2026 and is not being updated. It lists 199 passports and 199 destinations, and it is fine for a map of visa-free travel if you credit the source and check the licence. Henley's full table is not open, so use Passport Index for numbers and quote Henley only for its headline ranks. About 15 regimes let people live and work in other countries, and about 4 in 10 people live in a country covered by at least one of them. Several of those entries still rest on Wikipedia or memory and need a check from you before they go on the site. The two biggest open questions are the start date of the EU's ETIAS and the full list of US entry bans.
