# R1: Global income and wealth anchors, and birth-lottery research

Prepared on 2026-10-27 for "How Lucky I Am". Newest editions found: PIP September 2026, WIR 2026, UBS Global Wealth Report 2026, Findex 2025 (survey year 2024), UN WPP 2024.

Scratch root (SP): `$SP` (a temporary folder that is not part of this repository)
Raw downloads: `$SP/downloads/r1/<name>/out`. Extracted PDF text: `$SP/work/*.txt`. Helper scripts: `$SP/scripts/`.

## Labels used

- VERIFIED: I read the number myself in the primary file or live API response.
- DERIVED: I computed it from verified numbers. The method is shown.
- UNVERIFIED: seen only in a search snippet, in a fetch-tool summary, on a secondary site, or from memory.
- NOT FOUND: I tried and found nothing. The attempts are listed.

Quote rule: I give the table, figure, page or API field where each number sits, and no quotes beyond titles. Fetch-tool summaries are noted as such.

---

## 1. World Bank Poverty and Inequality Platform (PIP), latest update

### 1.1 Which update is the latest

- Newest data version on the live API: `20260922_2021_01_02_PROD` (September 2026 update, 2021 PPP). Older ones on the same list: 20260324, 20250930, 20250401 (each with a 2021 and a 2017 PPP build). VERIFIED. Seen at https://api.worldbank.org/pip/v1/versions?format=json and https://api.worldbank.org/pip/v1/pip-info?format=json (server time 2026-10-27).
- Blog for this release: World Bank Data Blog, "September 2026 Global Poverty Update from the World Bank: One in ten worldwide live in extreme poverty", 22 Sep 2026. https://blogs.worldbank.org/en/opendata/september-2026-global-poverty-update-from-the-world-bank--one-in (read through the fetch tool; the headline numbers match the API).
- Update note: PIP Data Updates, entry 20260922, "Semi-annual update". https://worldbank.github.io/PIP_data_updates/dataupdates.html (fetch-tool summary).
- All API numbers below came from `https://api.worldbank.org/pip/v1/pip-grp?country=WLD&year=all&povline=<line>&group_by=wb&format=json` with no version given, which returns the newest version. The 2024 values equal the blog's 10.1% and 824.3 million, which confirms the version.

### 1.2 Poverty lines (2021 PPP dollars per person per day)

| Line | Value | Replaces (2017 PPP) | Publisher, title, date | URL | Where seen |
|---|---|---|---|---|---|
| Extreme poverty (international line) | $3.00 | $2.15 | World Bank Data Blog, "The World Bank's new global poverty lines in 2021 prices", 9 Jun 2025 (Baah, Foster, Jolliffe, Lakner, Lara Ibarra) | https://blogs.worldbank.org/en/opendata/the-world-bank-s-new-global-poverty-lines-in-2021-prices | Table of old and new lines (fetch-tool summary) |
| Lower-middle-income line | $4.20 | $3.65 | same | same | same table |
| Upper-middle-income line | $8.30 | $6.85 | same | same | same table |
| High-income line | NOT FOUND | n/a | The blog text I read gives no high-income line. | n/a | Tried: that blog, one web search. |

- Basis of the lines (same blog): 2021 PPPs from the International Comparison Program (released 2024); 1,747 national poverty lines in 163 countries. Fetch-tool summary.
- UNVERIFIED: I once queried the API at $24.50 as a guess from memory of a high-income line. The result (76.81% below it in 2024) has no verified official link. Do not use it as a line.

### 1.3 World poverty headcounts (VERIFIED, live API, version 20260922, 2021 PPP)

Field names: `headcount` (share), `pop_in_poverty` (people), `reporting_pop` (population base), `estimate_type` (`actual` or `nowcast`).

| Line ($/day) | 2024 share (actual) | 2024 people | 2025 share (nowcast) | 2025 people | 2026 share (nowcast) | 2026 people |
|---|---|---|---|---|---|---|
| 3.00 | 10.12% | 824,298,368 | 9.95% | 816,938,142 | 9.79% | 810,946,777 |
| 4.20 | 18.21% | 1,482,791,630 | 17.59% | 1,444,293,400 | 17.10% | 1,415,619,978 |
| 8.30 | 46.16% | 3,758,107,865 | 45.23% | 3,713,899,866 | 44.41% | 3,677,434,598 |

- PIP population base: 2024 = 8,141,808,945; 2025 = 8,210,628,561; 2026 = 8,280,214,874.
- Latest observed year is 2024. 2025 and 2026 are model-based nowcasts that use the June 2026 Global Economic Prospects (blog, fetch-tool summary).
- Blog headline: 10.1% (824.3 million) in 2024 and 9.8% in 2026. Previous vintage (March 2026): about 10.4% (846.8 million). The September revision is mostly South Asia (blog, fetch-tool summary).
- More years at $3.00: 2023 = 10.47% (844,681,277); 2022 = 10.87% (868,816,345); 2021 = 11.32% (896,437,984); 2020 = 11.41% (896,253,063).
- More 2024 points on the curve: $5.00 = 24.56%; $6.00 = 32.49%; $7.00 = 39.23%; $9.00 = 49.19%; $10.00 = 52.87%.
- Old line for continuity (2017 PPP, $2.15): 7.63% = 621,174,943 people in 2024; 7.54% = 619,210,486 in the 2025 nowcast.

### 1.4 World mean and median

| Item | Value | Year | Status | Where seen |
|---|---|---|---|---|
| Mean | $21.61 per person per day (2021 PPP) | 2024 (actual) | VERIFIED value; unit is my reading, because the API field `mean` has no label | `pip-grp` field `mean` |
| Mean | $21.95 and $22.28 | 2025 and 2026 nowcasts | same | same |
| Median | about $9.2 per person per day (2021 PPP), about $3,360 a year | 2024 | DERIVED | I interpolated the headcount curve: 49.19% at $9.00, 50.36% at $9.30, so 50% falls at about $9.21. |
| Median cross-check | $9.2 (P50 threshold) | 2024 | VERIFIED in a second file | `pip_global_percentiles.csv`, built by Our World in Data from PIP for the Giving What We Can calculator (see 4d). |

- PIP does not print a world median in the `pip-grp` output. NOT FOUND as a published figure.

### 1.5 Welfare measure and coverage

- Coverage: more than 2,500 welfare distributions across 172 economies; four economy-years added; one older survey estimate revised (PIP Data Updates, entry 20260922; fetch-tool summary).
- Welfare measure (per capita household income or consumption): NOT FOUND in the three pages I read. From memory, PIP uses per capita household consumption where available and income elsewhere. UNVERIFIED. The June 2025 lines blog credits better measurement of household consumption for part of the line changes.

---

## 2. World Inequality Report 2026 (WIR 2026)

WIR 2026 exists, so I did not fall back to WIR 2022.

- Publisher and title: World Inequality Lab, "World Inequality Report 2026".
- Full report PDF: https://wir2026.wid.world/www-site/uploads/2026/09/World_Inequality_Report_2026.pdf (HTTP 200, 20,023,953 bytes, 208 pages; PDF metadata date 2026-09-17).
- Executive summary PDF: https://wir2026.wid.world/www-site/uploads/2025/11/WIR26_Executive_Summary_English.pdf (HTTP 200, 1,151,358 bytes, 22 pages; metadata date 2025-11-25).
- Chapter 1 page: https://wir2026.wid.world/insight/global-economic-inequity/. Data: https://wir2026.wid.world/download/. Method: https://wir2026.wid.world/methodology/.
- The release date is not printed on the pages I read. The dates above are file metadata.

### 2.1 Global shares, year 2025

Where seen: Figure 1.3, page 38 of the full-report PDF ("Income and wealth shares are distributed very unequally", with a "more detail on the top 10%" panel). VERIFIED. The same bars appear in the first figure of the executive summary.

| Group | Share of global income | Share of global wealth |
|---|---|---|
| Bottom 50% | 8% | 2% |
| Middle 40% | 38% | 23% |
| Top 10% | 53% | 75% |
| of which next 9% (P90-99) | 33% | 38% |
| of which top 1% | 20% | 37% |

- The figure note says the shares are at 2025 PPP, and that income is measured after pensions and unemployment benefits are received and before other taxes and transfers. Source line: Arias-Osorio et al. (2025) and the WIR methodology page.
- Groups of adults (Figure 1.2, page 37): bottom 50% = 2.8 billion; middle 40% = 2.2 billion; top 10% = 556 million; top 1% = 56 million. VERIFIED. The adult population behind these is therefore about 5.6 billion.
- Text on page 36 says the top 1% earns 2.5 times the income of the whole bottom half (20 divided by 8, consistent).
- Rounding: the income shares add to 99%.

### 2.2 Thresholds and averages (per adult, per year)

Where seen: Chapter 1 text on pages 37 to 39, which discusses Figure 1.4 (income) and the wealth table. VERIFIED as printed; the unit caveat is below.

| Item | Income per adult per year | Wealth (net worth) per adult |
|---|---|---|
| Bottom 50% average | $5,100 ($425 a month) | $6,500 |
| Top 10% average | $159,300 ($13,275 a month) | about $1 million |
| Top 10% entry threshold | $65,500 ($5,460 a month) | $265,600 |
| Top 1% entry threshold | $250,300 ($21,860 a month) | NOT FOUND in the text I read |
| Entry threshold above the bottom 50% (about the median) | not stated | $29,200 (the sentence is cut by the page layout; I read it as the amount needed to leave the bottom 50%) |
| Top 1% average | NOT FOUND (not stated in the text) | NOT FOUND |

- Page 37 also says half of the world's adults live on less than $500 a month, and the top 10% earns 31 times as much as the bottom 50% (per person).
- Basis: per adult (the text talks about adults and "income per adult"); pre-tax and post-pension income as in 2.1; PPP-based (the shares say 2025 PPP). Currency: the thresholds are printed with "$". The page text does not say "PPP dollars" next to those amounts, so I read them as PPP dollars. UNVERIFIED reading.
- Other figures in the report use 2025 PPP euros: world income per person about 14,000 euros in 2025 (Figure 1.1, page 36). Regions: North America and Oceania about 3,800 euros a month, Europe about 2,900 euros a month (Chapter 2 text).
- Do not mix these per-adult national-income numbers with PIP per-person survey numbers (section 1) without labels. The concepts differ (see Gaps).

---

## 3. UBS Global Wealth Report 2026 (data year 2025)

- Publisher and title: UBS, "Global Wealth Report 2026", 17th edition, published 30 Jun 2026 (press release date). PDF: 46 pages, metadata date 2026-07-02.
- Report landing page: https://www.ubs.com/global/en/wealth-management/insights/global-wealth-report.html
- PDF path: https://www.ubs.com/content/dam/assets/wm/static/gwr/global-wealth-report-en-2026.pdf
- Press release: https://www.ubs.com/jp/ja/about/newsdisplay-ndp/en-20260630-gwr-2026.html
- Download note: curl got HTTP 403 for the PDF (HTTP 403, 472 bytes of HTML) on both the page link and the DAM path. The fetch tool could read the DAM path and kept a copy (3,894,886 bytes). I extracted text from that copy with pdftotext. Local file: `$SP/downloads/r1/ubs_gwr2026_via_webfetch/out`.

### 3.1 Wealth pyramid, end of 2025

Where seen: page 23, "The global wealth pyramid 2025". VERIFIED. The base is UBS's sample of 56 markets, not every country.

| Band (USD net worth) | Adults | Share of sample adults | Wealth held | Share of sample wealth |
|---|---|---|---|---|
| Above 1 million | 58 million | 1.5% | USD 250.59 trillion | 48.4% |
| 100,000 to 1 million | 588 million | 15.3% | USD 200.72 trillion | 38.8% |
| 10,000 to 100,000 | 1.58 billion | 41.1% | USD 63.16 trillion | 12.2% |
| Below 10,000 | 1.62 billion | 42.1% | USD 3.22 trillion | 0.6% |

- DERIVED: the band counts add to about 3.85 billion adults and the wealth to about USD 517.7 trillion. That is the 56-market sample (UBS says 56 markets and over 92% of world wealth; fetch-tool summary of the press release). It is below the roughly 5.6 billion adults in the world (WIR, section 2).
- Inconsistency to watch: the press release says the below-10,000 share fell from almost 75% in 2000 to just over 41% in 2025. The pyramid chart shows 42.1% below 10,000 and 41.1% for 10,000 to 100,000. A sentence in the report text says the 10,000 to 100,000 band is almost equal to the lowest band, at just over 41%. Use the chart values and flag the mismatch.
- Text on page 6 and page 23: the lowest band keeps shrinking, and UBS says the pyramid shape could flip before the end of the decade.

### 3.2 Global mean, median and millionaires

| Item | Value | Status | Where seen |
|---|---|---|---|
| Global median wealth per adult | NOT FOUND | NOT FOUND | I searched the report text and the press release. Neither prints it. |
| Global mean wealth per adult | NOT FOUND as a printed figure | n/a | same |
| Mean of the 56-market sample | about USD 134,600 per adult (517.69 trillion divided by 3.846 billion adults) | DERIVED, my own calculation from 3.1; rounding in the band counts makes it approximate | page 23 |
| USD millionaires in the sample | about 57.5 million (text); 58 million adults above USD 1 million (pyramid) | VERIFIED | text beside the millionaire table (pages 21 to 22); page 23 |
| New millionaires in 2025 | nearly 1 million; count up 1.5% in 2025; US more than 440,000 | VERIFIED in press release (fetch-tool summary) | press release |
| Global personal wealth growth 2025 | +10.8% in USD | VERIFIED in press release (fetch-tool summary) | press release |
| Regional average wealth per adult | about USD 43,000 (Latin America) to over USD 664,000 (North America) | VERIFIED | page 14 text |

Millionaires by market (thousands of USD millionaires, page 22): United States 23,627; Mainland China 5,305; Japan 2,902; Germany 2,648; United Kingdom 2,428; France 2,388; Australia 1,634; South Korea 1,317; Netherlands 1,294; Italy 1,235; Spain 1,077; Switzerland 944; India 944; Taiwan 772; Hong Kong SAR 628; Belgium 556; Sweden 507; Russia 447; Brazil 386; Saudi Arabia 348; Mexico 333. Argentina and Nigeria are not in this list.

### 3.3 Mean and median wealth per adult by country, 2025 (USD, as printed)

Where seen: page 14, "Wealth per adult: the top 30". VERIFIED. This is the only per-country mean and median table in the report. The report prints two separate top-30 lists, so a country can appear in one list and not the other.

Your seven countries:

| Country | Mean (USD) | Median (USD) | Note |
|---|---|---|---|
| Germany | 346,613 (rank 14) | 53,485 (rank 30) | in both lists |
| United States | 696,277 (rank 2) | 68,998 (rank 28) | in both lists |
| Japan | 211,846 (rank 24) | 135,745 (rank 10) | in both lists |
| Argentina | not printed | not printed | outside both top-30 lists |
| Brazil | not printed | not printed | outside both lists (386,000 millionaires, page 22) |
| India | not printed | not printed | outside both lists (944,000 millionaires, page 22) |
| Nigeria | not printed | not printed | outside both lists |

Top 30 by mean wealth per adult (USD): Switzerland 910,382; United States 696,277; Luxembourg 654,732; Hong Kong SAR 648,267; Australia 616,306; Singapore 527,217; Denmark 523,344; New Zealand 449,852; Norway 425,391; Netherlands 415,287; Belgium 407,920; Sweden 406,406; Canada 399,886; Germany 346,613; France 341,359; Taiwan 332,533; Ireland 314,167; Israel 312,108; South Korea 311,260; Spain 306,412; United Kingdom 292,808; Austria 279,989; Italy 279,439; Japan 211,846; Finland 209,135; Portugal 195,761; Qatar 188,505; Malta 163,655; United Arab Emirates 157,612; Greece 143,343.

Top 30 by median wealth per adult (USD): Luxembourg 394,005; Belgium 277,166; Australia 210,783; New Zealand 206,617; Denmark 203,771; Hong Kong SAR 187,968; Canada 147,811; Switzerland 145,555; Norway 140,003; Japan 135,745; Italy 131,001; Netherlands 127,407; United Kingdom 125,335; France 121,898; Malta 114,033; Taiwan 113,137; Spain 111,575; South Korea 101,739; Ireland 98,413; Singapore 96,434; Qatar 95,499; Finland 89,695; Sweden 84,039; Israel 83,843; Slovenia 81,366; Portugal 76,978; Austria 71,378; United States 68,998; Greece 59,162; Germany 53,485.

### 3.4 Global Wealth Databook

- Databook 2026: NOT FOUND. What I tried: (a) the landing page above, read with the fetch tool, shows only the report PDF; (b) the report PDF text has no mention of a databook (0 matches); (c) six guessed file paths under `/content/dam/assets/wm/static/gwr/` (2026 and 2025, xlsx and pdf) all returned HTTP 403 to curl, which proves nothing about whether they exist; (d) one web search found no link.
- Wikipedia says UBS no longer publishes lists that cover nearly all countries (fetch-tool summary, secondary).
- Fallback, UNVERIFIED and older: Wikipedia, "List of countries by wealth per adult", https://en.wikipedia.org/wiki/List_of_countries_by_wealth_per_adult, table of the UBS Global Wealth Databook 2023 (end-2022 data, about 160 countries). The fetch tool read only the first 100,000 of 142,454 characters. Values in USD, shares of adults by band:

| Country (end-2022) | Mean | Median | Below 10k | 10k to 100k | 100k to 1m | Above 1m |
|---|---|---|---|---|---|---|
| Argentina | 13,323 | 4,354 | 76.5% | 22.1% | 1.4% | 0.1% |
| Brazil | 29,452 | 5,702 | 66.0% | 29.6% | 4.1% | 0.3% |
| Germany | 256,179 | 66,735 | 10.0% | 46.1% | 40.0% | 3.9% |
| India | 16,500 | 3,755 | 73.8% | 24.0% | 2.1% | 0.1% |
| Japan | 216,078 | 103,681 | 11.6% | 38.4% | 47.4% | 2.6% |
| Nigeria | 6,879 | 1,507 | 91.2% | 8.0% | 0.8% | 0.0% |
| United States | 551,347 | 107,739 | 17.5% | 30.3% | 43.2% | 9.0% |

- The bands in each row add to 100% (internal check passed). The 2022 and 2025 figures are not comparable (Germany's median is 66,735 in 2022 and 53,485 in 2025). Treat the 2022 table as a lead to the original Databook 2023, not as a citable source.

---

## 4. Birth-lottery research

### 4a. Milanovic (2015)

- Citation: Branko Milanovic, "Global Inequality of Opportunity: How Much of Our Income Is Determined by Where We Live?", Review of Economics and Statistics 97(2): 452-460, 2015. DOI 10.1162/rest_a_00432. Page: https://ideas.repec.org/a/tpr/restat/v97y2015i2p452-460.html. Open copy: World Bank Open Knowledge Repository, https://hdl.handle.net/10986/21484 (file `rest_a_00432.pdf`, 1,998,215 bytes; text extracted locally).
- Data: household per capita income in $PPP, in 1%-groups within each country; 118 countries and 6,142 million people (92% of the world) in 2008; benchmark years 1988, 1993, 1998, 2002, 2005, 2008. Table 3 and the data note.

| Finding | Value | Where seen |
|---|---|---|
| Country of residence plus the income distribution within the country (two circumstances) explain | more than one-half of the variability in income | Abstract (also in the OpenAlex record) |
| Same two circumstances, headline | about 2/3 of the variability of individual percentile incomes | Section 3 text, a sentence that sums up the two circumstances |
| Country dummies in place of GDP per capita and Gini | R-squared of 66 to 73 percent | Conclusion of section 3 (about page 30 of the PDF) |
| Lower bound across all specifications | at least around one-half | Same conclusion |
| Share of people living outside their country of birth | under 3% (so birth country is fixed for about 97% of people) | Introduction |
| Between-country share of global inter-personal inequality (Theil(0)) | 81% (1988), 76% (1993), 74% (1998), 74% (2002), 74% (2005), 70% (2008) | Table 3, row 4 (about page 29 of the PDF) |
| Between-country Gini | 62.4, 62.1, 61.7, 63.0, 61.5, 59.8 for the same years | Table 3, row 1 |
| Location premium vs DR Congo | more than 350% for the US, more than 160% for Brazil, 32% for Yemen | Section 4 text |

- What parental income class adds: NOT FOUND as a separate "adds X points" figure. In this paper the second circumstance is the person's position in the home-country distribution, which the thought experiment links to parental class. I found no sentence that quantifies the parental-class increment on its own. The paper's own numbers are the ones in the table above. I did not check which regression column each phrase refers to.
- Note for the site: the 2/3 and 66 to 73 percent figures are shares of variance of log percentile incomes across country-percentile cells. They are not "the share of your income caused by your country". Say it that way.

### 4b. Shorrocks and Wan (2005), and the cross-check

- Citation: Anthony Shorrocks and Guanghua Wan, "Spatial decomposition of inequality", Journal of Economic Geography 5(1): 59-81, 2005. DOI 10.1093/jnlecg/lbh054. Working-paper copy read: UNU-WIDER Discussion Paper 2004/01, https://www.wider.unu.edu/sites/default/files/dp2004-001.pdf (68,967 characters of text).
- Result: this paper does NOT give a world-level between-country share. It decomposes inequality inside countries by region. Example, Table 1A: Canada, 9 provinces, 1991 to 1997, between-province share of GE(0) is 1.5% to 1.9%. NOT FOUND as a cross-check on the global country share. The OpenAlex abstract says it reviews decomposition methods for the impact of spatial location on income inequality, with evidence from many countries. The journal PDF at academic.oup.com returned HTTP 403.
- Cross-check I can offer from verified material: Milanovic's Theil(0) decomposition (table in 4a) gives a between-country share of 70% in 2008 and 81% in 1988. That is a different statistic from the R-squared in his regressions, and it lands in the same range (about two-thirds to four-fifths).
- Not retrieved, suggested next: Lakner and Milanovic (2016) World Bank Economic Review; Bourguignon and Morrisson (2002) American Economic Review; World Bank Poverty and Shared Prosperity 2016 and 2020 decompositions.

### 4c. Clemens, Montenegro and Pritchett, "The Place Premium"

- Published version: Michael Clemens, Claudio Montenegro and Lant Pritchett, "The Place Premium: Bounding the Price Equivalent of Migration Barriers", Review of Economics and Statistics, 2019 (101(2): 201-213 from memory, UNVERIFIED). DOI 10.1162/rest_a_00776. The OpenAlex abstract (VERIFIED) says: nationally representative microdata on US immigrant workers and workers in 42 home countries; the average price equivalent of migration barriers for low-skill men is greater than $13,700 per worker per year; natural and policy barriers may each cost the world trillions of dollars a year.
- The journal PDF returned HTTP 403 (MIT Press, to curl and to the fetch tool). I could not read the published tables.
- Per-country multiples below come from the earlier working paper: Center for Global Development Working Paper 148, "The Place Premium: Wage Differences for Identical Workers across the U.S. Border", July 2008, revised December 2008. https://www.cgdev.org/sites/default/files/16352_file_CMP_place_premium_148.pdf (HTTP 200, 571,884 bytes, 70 pages). Do not cite these as the 2019 paper's numbers.
- Where seen: Table 1, "Estimates of wage ratios for observably identical workers", column 6 (the sort column), page 14 of the PDF. Column 6 is the predicted ratio of the wage of a US-resident, 35-year-old, urban male born in the country with 9 years of home-country schooling to the PPP-adjusted wage of an observably identical worker at home. Wage data: over 2 million formal-sector wage earners in 43 countries including the US.

| Home country | US wage as a multiple of home wage (Table 1, col. 6) | Confidence interval (level not shown in the extract) |
|---|---|---|
| Yemen | 15.45 | 5.58 to 42.79 |
| Nigeria | 14.85 | 10.28 to 21.46 |
| Egypt | 11.92 | 7.43 to 19.12 |
| Haiti | 10.31 | 7.79 to 13.67 |
| Cambodia | 7.45 | 4.66 to 11.91 |
| Ghana | 7.12 | 1.27 to 40.04 |
| Indonesia | 6.72 | 3.39 to 13.32 |
| Pakistan | 6.57 | 4.88 to 8.85 |
| Vietnam | 6.49 | 5.56 to 7.56 |
| India | 6.25 | 5.28 to 7.39 |
| Bangladesh | 4.60 | 2.96 to 7.14 |
| Philippines | 3.82 | 3.36 to 4.35 |
| Peru | 3.79 | 2.96 to 4.85 |
| Brazil | 3.76 | 2.88 to 4.92 |
| Guatemala | 2.94 | 2.39 to 3.61 |
| Argentina | 2.54 | 1.60 to 4.04 |
| Mexico | 2.53 | 2.42 to 2.65 |
| Dominican Republic | 1.99 | 1.66 to 2.39 |
| Median of the 42 countries | 4.11 | |
| Mean of the 42 countries | 5.11 | |

- The same paper corrects for selection of movers. Text on page 7 of the PDF: after correction the multiples are still very large, for example 3.5 for the Philippines and 7.8 for Haiti, and the corrected multiple would exceed 3 in 20 of 42 countries and exceed 2 in all but four, even under the strongest selection assumption it tests.
- Use the table as "equivalent worker, same job traits, moves to the US", from a 2008 working paper. The published 2019 numbers may differ.

### 4d. Giving What We Can, "How Rich Am I?"

- Page: https://www.givingwhatwecan.org/how-rich-am-i (HTTP 200, 966,810 bytes of HTML; the page says it was last updated in 2025). I read the methodology text inside the page data.
- Method as stated on the page:
  - Data source: World Bank Poverty and Inequality Platform, income percentiles prepared by Our World in Data, for the latest year available (2024).
  - PPP: all incomes converted to 2021 international dollars, adjusted for inflation and cost of living; PPP factors from the World Bank (indicator PA.NUS.PRVT.PP); CPI from World Development Indicators (FP.CPI.TOTL).
  - Credits: original code by Sam Deere, based on work by Jacob Hilton; an earlier version used percentiles by Phil Trammell and Rob Wiblin.
  - Caveat on the page: the figures are best guesses, and other attempts give broadly similar results.
- Equivalence scale: NOT FOUND. The page text, the data and the public code folder do not state a household equivalence scale. The PIP percentiles are per person (my reading; see the welfare-measure note in 1.5). I did not read the calculator's front-end code. UNVERIFIED how it treats household size.
- Public files behind the calculator: https://github.com/owid/notebooks/tree/main/PabloArriagada/global_distribution_giving_what_we_can (files `pip_global_percentiles.csv`, `wdi_ppp.csv`, `calculation.py`; last updated October 2025; uses the OWID PIP build dated 2025-10-09, which is older than the September 2026 PIP version in section 1).
- Global income thresholds, DERIVED from `pip_global_percentiles.csv` (row country = World, year = 2024; column `thr`). The file has no unit label. The unit is dollars per person per day in 2021 international dollars. I checked it two ways: P10 = 2.94 sits just under the $3.00 line, and PIP shows 10.1% below $3.00; P50 = 9.2 matches my PIP median (section 1.4).

| Percentile | Threshold, $ per person per day | Per year (x 365) |
|---|---|---|
| 10 | 2.94 | 1,073 |
| 25 | 4.96 | 1,810 |
| 50 (median) | 9.2 | 3,358 |
| 75 | 22.3 | 8,140 |
| 90 (top 10% starts here) | 54.1 | 19,747 |
| 95 | 82.4 | 30,076 |
| 99 (top 1% starts here) | 162.6 | 59,349 |

- Whether the calculator page quotes "top 1%" and "top 10%" thresholds in words: NOT FOUND in the static page. The table above is what its data file implies.
- Cross-check against WIR 2026 (section 2.2): WIR top 10% threshold is $65,500 per adult per year; the PIP file gives about $19,700 per person per year. The difference is expected. WIR uses national income per adult at 2025 PPP, PIP uses survey income or consumption per person at 2021 PPP. Never put the two on one scale.

---

## 5. World Bank Global Findex 2025 (survey year 2024)

- Publisher and title: World Bank, "The Global Findex Database 2025". Page: https://www.worldbank.org/en/publication/globalfindex (read through the fetch tool). The report page (https://www.worldbank.org/en/publication/globalfindex/Report) returned HTTP 403 to curl and to the fetch tool.
- Numbers below are from the World Bank Data API, source 28 "Global Findex database" (https://api.worldbank.org/v2/sources, https://api.worldbank.org/v2/country/WLD;HIC;LMY/indicator/<code>?format=json&mrnev=1). VERIFIED, queried 2026-10-27. "Developing economies" is the Findex term for low- and middle-income economies (aggregate LMY).

| Measure (adults 15+) | Group | Value | Year | API indicator code |
|---|---|---|---|---|
| Has an account | World | 78.74% | 2024 | `account.t.d` |
| Has an account | High income | 94.91% | 2024 | `account.t.d` |
| Has an account | Developing (low and middle income) | 75.45% | 2024 | `account.t.d` |
| Could come up with emergency funds in 30 days: possible (any difficulty) | Developing | 90.54% | 2024 | `fin24aP` |
| Possible and not difficult at all | Developing | 26.23% | 2024 | `fin24aND` |
| Possible and somewhat difficult | Developing | 30.19% | 2024 | `fin24aSD` |
| Possible and not difficult or somewhat difficult (the "reliable" headline measure) | Developing | 56.42% | 2024 | `fin24aSD_ND` |
| Not possible | Developing | 7.14% | 2024 | `fin24aN` |
| Saved at a financial institution or with mobile money, past year | Developing | 39.66% | 2024 | `fin17a.17a1.d` |
| Saved at a bank or similar institution | Developing | 35.70% | 2024 | `fin17a` |
| Saved with mobile money | Developing | 9.10% | 2024 | `fin17b` |
| Saved with a savings club or a person outside the family | Developing | 17.11% | 2024 | `fin17c` |

- The Findex page (fetch-tool summary) agrees: 79% of adults worldwide have an account; 40% of adults in developing economies saved in a financial account in 2024; 56% of adults could reliably access extra money in an emergency. The page names no group for the 56%, and the API shows 56.42% for developing economies.
- High-income and world values for emergency funds and for saving: NOT FOUND. The API returned values only for the low and middle income aggregate on these indicators. Tried: the three-group API query, the report page (403).
- "Saved any money in the past year" including cash and other informal ways: NOT FOUND. Codes `fin16`, `fin24` and `fin24.d` returned no data.
- Wording watch: "possible" at 90.5% includes people who say it would be very difficult. The 56% figure is the stricter one. Use the label that matches the question you ask your visitor.

---

## 6. Population anchors

### 6.1 UN World Population Prospects 2024

- Publisher and title: United Nations, Department of Economic and Social Affairs, Population Division, "World Population Prospects 2024" (28th revision). Data file: `WPP2024_Demographic_Indicators_Medium.csv.gz`, https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz (HTTP 200, 16,557,272 bytes). VERIFIED. Read with `python3 -I`. Rows: Location = World, Variant = Medium. Population columns are in thousands.

| Year | Population on 1 July | Population on 1 January | Median age (years) | Life expectancy at birth, both sexes (years) | Male | Female |
|---|---|---|---|---|---|---|
| 2024 | 8,161,972.572 thousand | 8,126,964.296 thousand | 30.62 | 73.32 | 70.71 | 76.02 |
| 2025 | 8,231,613.070 thousand (8.23 billion) | 8,196,980.849 thousand | 30.86 | 73.52 | 70.91 | 76.21 |
| 2026 | 8,300,678.396 thousand (8.30 billion) | 8,266,245.291 thousand | 31.10 | 73.77 | 71.18 | 76.44 |

- Columns used: `TPopulation1July`, `TPopulation1Jan`, `MedianAgePop`, `LEx`, `LExMale`, `LExFemale`.
- The "about 8.3 billion people alive" in your brief matches the 1 July 2026 value.
- WPP 2026: no evidence it exists. One web search returned only WPP 2024 pages, and my guessed 2026 file path returned HTTP 404. This does not prove there is no 2026 edition. Check https://population.un.org/wpp/ before launch.

### 6.2 Population Reference Bureau, people ever born

- Publisher and title: Population Reference Bureau, "How Many People Have Ever Lived on Earth?", published 15 Nov 2022. https://www.prb.org/articles/how-many-people-have-ever-lived-on-earth/ (fetch-tool summary; no later update date shown).
- People ever born: about 117 billion (Table 2: 117,020,448,575), to mid-2022.
- Share alive: 6.8% in 2022 (population used 7,963,000,000, Table 2), which the article rounds to nearly 7%.
- The article says the estimate is part science and part art, and that no demographic data exist for more than 99% of human history.
- DERIVED, mine, not PRB's: 8.30 billion (WPP, July 2026) divided by 117.0 billion is about 7.1%. This is an upper bound, because births after 2022 raise the total. Say "about 7%".

---

## Gaps and cautions

Not found or not verified:
- PIP high-income poverty line (NOT FOUND); PIP welfare-measure statement (NOT FOUND, memory only); PIP world median (not published in the output I read; derived).
- WIR 2026: top 1% average income and wealth threshold (not in the text I read); the unit label of the "$" amounts (PPP reading is unverified); release date.
- UBS: global median and mean wealth per adult (not printed); the Databook (not found); per-country figures for Argentina, Brazil, India, Nigeria in 2025 (not printed). The 2022 fallback table is secondary and old.
- Milanovic: the separate effect of parental income class (no figure found); regression column mapping for each R-squared phrase not checked.
- Shorrocks and Wan: not a world-level result, so it is not the cross-check you asked for.
- Clemens et al.: the 2019 journal tables (HTTP 403). The multiples above are from the 2008 working paper.
- GWWC: equivalence scale (not found).
- Findex: high-income and world values for emergency funds and saving; any-method saving; the full report page (HTTP 403).
- WPP 2026 edition: not found, not ruled out.
- Next PIP update date: a search snippet said about 21 March 2027. UNVERIFIED.

Cautions when you put these on the site:
- Different populations. PIP counts about 8.14 billion people in 2024 (its own base). WPP says 8.16 billion on 1 July 2024 and 8.23 billion on 1 July 2025. WIR counts about 5.6 billion adults. The UBS pyramid counts about 3.85 billion adults in 56 markets. Shares from one source do not transfer to another source's headcount.
- Different yardsticks. PIP: survey income or consumption per person, 2021 PPP, per day. WIR: pre-tax, post-pension national income per adult, 2025 PPP, per year. UBS: net worth per adult in nominal US dollars. Findex: survey answers. Label each number with its yardstick.
- Nowcast. PIP 2025 and 2026 are model estimates built on a June 2026 growth forecast. The last survey-based year is 2024. March 2026 and September 2026 give different 2024 numbers (846.8 million versus 824.3 million), so pin the version in your citation.
- Inconsistency inside UBS (below 10,000 is 42.1% on the chart, "just over 41%" in the press release and one sentence). Cite the chart with the page number.
- "Explained by country" means explained variance in log percentile incomes (Milanovic) or between-country share of Theil(0) (his Table 3). Do not write that country "causes" 70% of a person's income.
- The WIR and PIP thresholds are far apart on purpose. Do not average them or use one to check the other.
- Fetch-tool summaries can drop or garble details. Rows marked "fetch-tool summary" were not read in the original file. Re-read them in the source before launch.
- Search results were unreliable for two papers. The Clemens search returned unrelated pages twice. I found that paper through OpenAlex and the CGD site instead.

Files and tools:
- Untrusted files were saved in separate directories under `$SP/downloads/r1/`. Every Python run that read them used `python3 -I`. PDFs were converted with `pdftotext`. Nothing downloaded was executed. Nothing was written outside the scratch folder.
- openpyxl is not installed here, and no xlsx file was obtained, so no xlsx was opened.
- Some servers refused curl with HTTP 403: UBS (PDF), MIT Press, Oxford Academic, World Bank Findex report page. The fetch tool could read the UBS PDF but not the other three.
- I used about 42 tool calls, over the soft limit of 35, because several downloads were blocked and needed a second route.
