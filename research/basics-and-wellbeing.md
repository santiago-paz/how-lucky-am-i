# R2: Everyday basics and wellbeing statistics

Prepared on 2026-10-27 for the project "How Lucky I Am". Every row says where I read the number and how sure I am.

## How to read this file

Status labels:

- VERIFIED: I read the number in the text of the page or file named in the row.
- VERIFIED (secondary): I read it in the UN SDG Report 2026, which reuses data from the agency that owns it. I did not read the agency's own page.
- DERIVED: I computed it from published numbers. The row says how.
- UNVERIFIED: I saw it only in a search summary or I know it from memory. Do not publish it without a check.
- NOT FOUND: I could not find it. The row says what I tried.

Other notes:

- Quotes are 15 words or fewer. Where the source wording has a typographic dash, I quoted a part without it.
- I saved pages and files under `$SP/downloads/r2/<name>/` and read them with perl and pdftotext. WebSearch was used to find URLs, not as proof.
- "UN SDG Report 2026" means "The Sustainable Development Goals Report 2026" (UN DESA). PDF: https://unstats.un.org/sdgs/report/2026/The-Sustainable-Development-Goals-Report-2026.pdf. Goal pages: https://unstats.un.org/sdgs/report/2026/Goal-NN/.

## Newest editions found (checked on 2026-10-27)

| Topic | Newest edition found | Data year | Note |
| --- | --- | --- | --- |
| Water, sanitation, hygiene | JMP 2025 household report, Aug 2025 | 2024 | The JMP 2026 updates cover schools and health care facilities, not households. |
| Electricity, cooking | Tracking SDG7 2026, June 2026 | 2024 | The 2025 edition (2023 data) is out of date. |
| Internet | ITU Facts and Figures 2025, 17 Nov 2025 | 2025 | No 2026 edition was listed on ITU's page. |
| Food | SOFI 2026 | 2025 | The FAO page says "JUST RELEASED" and gives no date. |
| Health coverage | UHC Global Monitoring Report 2025, 5 Dec 2025 | 2023 and 2022 | The definition of financial hardship changed in 2025. |
| Child mortality | UN IGME Report 2025, March 2026 (date from a news summary) | 2024 | I read WHO's fact sheet of 1 May 2026. |
| Social protection | ILO World Social Protection Report 2024-26 | 2023 | I found no newer edition. |
| Informal work | ILO Employment and Social Trends 2026 | 2025 or 2026 | |
| Education | UNESCO literacy factsheet (Sept 2025); UIS out-of-school data via UN SDG Report 2026 | 2024 | |
| Displacement | UNHCR Global Trends report, 10 June 2026 | end of 2025 | UNHCR's site blocked me. |
| Peace | Global Peace Index 2026, June 2026 | 2025 | |
| Freedom | Freedom in the World 2026; V-Dem Democracy Report 2026 | 2025 | |
| Air quality | WHO fact sheet, 24 Oct 2024 | 2019 | WHO's June 2026 database update has no population share. |
| Homicide | UNODC Global Study on Homicide 2023; UNODC 2025 data via Our World in Data | 2021 and 2024 | |

## 1. Water, sanitation and hygiene

Newest edition: WHO/UNICEF Joint Monitoring Programme (JMP), "Progress on household drinking water, sanitation and hygiene 2000-2024: special focus on inequalities", August 2025 (launched 26 August 2025). WHO's fact sheets on drinking water (13 Sept 2023) and sanitation (22 March 2024) still show 2022 data. Do not use them for these figures.

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| People without safely managed drinking water | 2.1 billion (1 in 4); 106 million of them drink untreated surface water | 2024 | WHO/UNICEF JMP, "Progress on household drinking water, sanitation and hygiene 2000-2024", Aug 2025. https://washdata.org/reports/jmp-2025-wash-households | Page heading: "2.1 billion people still lack safely managed drinking water" | VERIFIED |
| People without safely managed sanitation | 3.4 billion | 2024 | Same report, WHO news release of 26 Aug 2025. https://www.who.int/news/item/26-08-2025-1-in-4-people-globally-still-lack-access-to-safe-drinking-water---who--unicef | "3.4 billion people still lack safely managed sanitation" | VERIFIED |
| People practising open defecation | 354 million | 2024 | Same WHO news release | "354 million who practice open defecation" | VERIFIED |
| People without basic handwashing (hygiene) services at home | 1.7 billion; 611 million of them have no facility at all | 2024 | Same WHO news release | "1.7 billion people still lack basic hygiene services at home" and "611 million without access to any facilities" | VERIFIED. The JMP term is "basic hygiene services". I did not check its exact definition. |
| Coverage shares | 74% safely managed water, 58% safely managed sanitation, 80% basic hygiene | 2024 | UN DESA, UN SDG Report 2026, Goal 6 page (JMP data). https://unstats.un.org/sdgs/report/2026/Goal-06/ | "By 2024, 74 per cent of the world's population had safely managed drinking water" | VERIFIED (secondary) |
| World population used by the JMP | 8.2 billion in 2024 (6.2 billion in 2000) | 2024 | JMP report page above | "the global population rose from 6.2 to 8.2 billion" | VERIFIED |
| Extra: deaths from unsafe water, sanitation and hygiene | 1.4 million a year | Not seen in my extract | WHO, "Sanitation" fact sheet, 22 March 2024. https://www.who.int/news-room/fact-sheets/detail/sanitation | "1.4 million people die each year as a result of inadequate drinking-water, sanitation and hygiene" | VERIFIED. The year of the estimate is not in my extract. |

Not opened: the JMP PDF (I found no direct PDF link in the report page's HTML) and UNICEF's JMP page https://data.unicef.org/resources/jmp-report-2025/ (not tested; another page on the same site gave HTTP 403).

## 2. Electricity and clean cooking

Newest edition: "Tracking SDG7: The Energy Progress Report 2026" (IEA, IRENA, UN Statistics Division, World Bank, WHO), released June 2026. The report's own site (trackingsdg7.esmap.org) and the IEA page gave HTTP 403. I read the full report PDF on the UN Statistics Division site and the WHO, World Bank and SEforALL pages.

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| People without electricity | 655 million (11.5 million fewer than in 2023) | 2024 | Tracking SDG7 2026, via SEforALL. https://www.seforall.org/publications/tracking-sdg7 . Also WHO joint news release, 24 June 2026. https://www.who.int/news/item/24-06-2026-655-million-people-still-living-without-electricity-underscore-urgent-need-to-deliver-on-universal-energy-access-target | "leaving 655 million still without access" | VERIFIED |
| People without clean cooking | About 2.0 billion (a quarter of people); 1.5 billion of them in rural areas | 2024 | Tracking SDG7 2026, full report PDF. https://unstats.un.org/unsd/energystats/pubs/documents/sdg_7.pdf . WHO release above says "two billion". | "Of the 2.0 billion people without access in 2024, 1.5 billion lived in rural areas." | VERIFIED |
| Share with clean cooking | 75% | 2024 | UN SDG Report 2026, Goal 7 page. https://unstats.un.org/sdgs/report/2026/Goal-07/ | "reaching 75 per cent globally in 2024" | VERIFIED (secondary) |
| Share with electricity | 92% | 2024 | Same Goal 7 page | "the global access rate remained at 92 per cent" | VERIFIED (secondary) |
| Previous edition, for comparison | 666 million without electricity; about 2.1 billion without clean cooking | 2023 | Tracking SDG7 2025, as summarised on https://www.seforall.org/publications/tracking-sdg7 | "nearly 666 million people still lacked electricity" and "around 2.1 billion people remained without access to clean cooking" | VERIFIED. Do not mix with the 2024 figures. |

## 3. Internet

Newest edition: ITU, "Measuring digital development: Facts and Figures 2025", released 17 November 2025. ITU revises past years, so the 2024 values here differ from last year's report.

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| People online | 6.0 billion (6,047.4 million), 73.6% of the world | 2025 | ITU, Facts and Figures 2025, key indicator aggregates spreadsheet (110,158 bytes). https://www.itu.int/en/ITU-D/Statistics/Documents/facts/ITU_regional_global_Key_ICT_indicator_aggregates_Nov_2025.xlsx | Sheet "By dvpmnt status and spec. reg.", row World, block "Individuals using the Internet", millions 6047.4, percentage 73.6 | VERIFIED |
| People offline | 2.2 billion | 2025 | ITU press release, 17 Nov 2025. https://www.itu.int/en/mediacentre/Pages/PR-2025-11-17-Facts-and-Figures.aspx | "2.2 billion people remain offline" | VERIFIED |
| Same, revised for 2024 | 5.8 billion online (71%); 2.3 billion offline (29%) | 2024 | Same press release, notes for editors | "5.8 billion, equivalent to 71 per cent of the world's population" | VERIFIED |
| Share offline | 26.4% | 2025 | 100 minus 73.6 from the ITU table | Computed by me | DERIVED |
| Online in least developed countries | 34% | 2025 | UN SDG Report 2026, Goal 17 page (ITU data). https://unstats.un.org/sdgs/report/2026/Goal-17/ | "Only 34 per cent of people in LDCs" | VERIFIED (secondary) |
| Men and women online | 77% of men, 71% of women | 2025 | Same Goal 17 page | "77 per cent of men were online compared with 71 per cent of women" | VERIFIED (secondary) |

ITU's landing page (https://www.itu.int/en/ITU-D/Statistics/Pages/facts/default.aspx) also says 2.2 billion people remain offline.

## 4. Food

Newest edition: FAO, IFAD, UNICEF, WFP and WHO, "The State of Food Security and Nutrition in the World 2026: Understanding and addressing the high cost of a healthy diet". I could not open the full report because FAO's repository page needs JavaScript. Rows 2 and 3 therefore come from the UN SDG Report 2026, which uses FAO's 2025 estimates.

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| People who faced hunger | 645 million | 2025 | FAO and partners, SOFI 2026 landing page. https://www.fao.org/publications/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world/en | "It is estimated that 645 million people faced hunger in 2025." | VERIFIED |
| Share undernourished | 7.8% (8.6% in 2022; 8.0% in 2015) | 2025 | UN SDG Report 2026, Goal 2 page. https://unstats.un.org/sdgs/report/2026/Goal-02/ | "645 million people (7.8 per cent of the global population) were chronically undernourished" | VERIFIED (secondary) |
| Moderate or severe food insecurity | 2.1 billion, 25.8% (86 million fewer than in 2024) | 2025 | Same Goal 2 page | "2.1 billion people (25.8 per cent of the global population)" | VERIFIED (secondary). The UN report's overview page says 2.3 billion. See the cautions. |
| People who cannot afford a healthy diet | About 2.7 billion | Not stated on the landing page | SOFI 2026 landing page, same URL as row 1 | "healthy diets are unaffordable for about 2.7 billion people worldwide" | VERIFIED for the number. The year is NOT FOUND. |

## 5. Health

Newest UHC edition: WHO and World Bank, "Tracking universal health coverage: 2025 global monitoring report", 5 December 2025. It uses a revised definition of financial hardship (SDG 3.8.2, "2025 definition"), so do not compare it with the 2023 report. I read WHO's fact sheet and technical slides, not the full report.

Newest child mortality edition: UN IGME, "Levels and Trends in Child Mortality: Report 2025", data to 2024. UNICEF's page for it (https://data.unicef.org/resources/levels-and-trends-in-child-mortality-2025/) gave HTTP 403, so I used WHO's fact sheet. The WHO text I searched does not name UN IGME.

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| People not fully covered by essential health services | 4.6 billion | 2023 | WHO, "Universal health coverage (UHC)" fact sheet, 5 Dec 2025. https://www.who.int/news-room/fact-sheets/detail/universal-health-coverage-(uhc) | "in 2023, about 4.6 billion people were not fully covered" | VERIFIED |
| People facing financial hardship from out-of-pocket health spending | 2.1 billion, 26% of the population (34% in 2000) | 2022 | Same fact sheet | "In 2022, 2.1 billion people faced financial hardship" | VERIFIED |
| Of those, living in poverty or pushed deeper into it | 1.6 billion | 2022 | Same fact sheet | "1.6 billion people living in poverty or pushed deeper into it" | VERIFIED |
| Large (catastrophic) out-of-pocket spending | 450 million | 2022 | WHO technical briefing slides for the 2025 report. https://cdn.who.int/media/docs/default-source/gho-documents/technical-briefing-2025-uhc-global-monitoring-report-presentation.pdf?sfvrsn=b17f8ff6_1 | "450 million experienced large OOP and 1.6 billion experienced impoverishing OOP" | VERIFIED. The slides say "large OOP". I did not see the budget-share threshold. |
| Under-5 deaths | 4.9 million (one every 6 seconds) | 2024 | WHO, "Child mortality (under 5 years)" fact sheet, 1 May 2026. https://www.who.int/news-room/fact-sheets/detail/children-reducing-mortality | "an estimated 4.9 million children under the age of 5 years died worldwide" | VERIFIED (WHO page) |
| Global under-5 mortality rate | 37.4 deaths per 1,000 live births | 2024 | Same fact sheet | "declined to 37.4 deaths per 1000 live births in 2024" | VERIFIED (WHO page) |
| Newborn deaths (extra) | 2.3 million, 47% of under-5 deaths | 2024 | Same fact sheet | "accounted for 2.3 million deaths, representing 47% of all under-five deaths" | VERIFIED (WHO page) |

## 6. Social protection

Newest edition: ILO, "World Social Protection Report 2024-26: Universal social protection for climate action and a just transition", 2024. I read the executive summary PDF (1,235,395 bytes): https://www.ilo.org/sites/default/files/2024-09/SOCPRO_WSPR_2024_Executive_Summary_EN_Web.pdf. The report page is https://www.ilo.org/publications/flagship-reports/world-social-protection-report-2024-26-universal-social-protection-climate (found by search, not opened).

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| Covered by at least one social protection benefit | 52.4% of the world's people (42.8% in 2015) | 2023 | ILO WSPR 2024-26, executive summary, PDF above | "(52.4 per cent) are covered by at least one social protection benefit" | VERIFIED |
| Not covered | 3.8 billion | 2023 | Same | "3.8 billion people are still entirely unprotected" | VERIFIED |
| Old-age pension | 79.6% of people above retirement age; more than 165 million get none | 2023 | Same | "79.6 per cent of people above retirement age receive a pension" | VERIFIED |
| Unemployment benefit | 16.7% of unemployed people; the text adds "157 million unemployed persons" | 2023 | Same | "16.7 per cent of unemployed people receive unemployment cash benefits" | VERIFIED. My extract cuts the 157 million sentence. I read it as the number not covered. |
| Child benefit, ages 0 to 15 (SDG 1.3.1) | 28.2% covered; 1.4 billion children miss out | 2023 | Same | "For children aged 0 to 15, 28.2 per cent of children are covered" | VERIFIED |
| Child or family cash benefit, ages 0 to 18 | 23.9% receive one; 1.8 billion children are not covered | 2023 | Same | "meaning 1.8 billion children are not covered" | VERIFIED |
| Coverage by income group (at least one benefit) | High income 85.9%, upper-middle 71.2%, lower-middle 32.4%, low income 9.7% | 2023 | Same | Summary table, row "Population covered by at least one social protection benefit" | VERIFIED |

## 7. Informal work

ILOSTAT's informality page (https://ilostat.ilo.org/topics/informality/) gave HTTP 403 to curl and WebFetch, and the Wayback Machine had no copy. I used the ILO flagship report page and the UN SDG Report 2026, which uses ILO data.

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| Workers in informal employment | 2.1 billion | 2025 or 2026 (the page does not say) | ILO, "Employment and Social Trends 2026". https://www.ilo.org/publications/flagship-reports/employment-and-social-trends-2026 | "2.1 billion workers remain in informal employment" | VERIFIED |
| Share of employed people in informal employment | 57.9% | 2025 | UN SDG Report 2026, Goal 8 page (ILO data). https://unstats.un.org/sdgs/report/2026/Goal-08/ | "accounted for 57.9 per cent of employment globally in 2025" | VERIFIED (secondary) |
| Share, as given in a search summary of the ILO report | 57.7% | Not stated | Search summary only | Not seen on any page I opened | UNVERIFIED |

## 8. Education

### 8a. Out-of-school children and adult illiteracy

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| Children and youth out of school | 273 million; 16.8% of the age group (17.4% in 2015) | 2024 | UN SDG Report 2026, Goal 4 page (UNESCO Institute for Statistics data). https://unstats.un.org/sdgs/report/2026/Goal-04/ | "273 million children and young people remain out of school" | VERIFIED (secondary). I did not open a UIS or GEM Report page. |
| Adults without basic literacy | 739 million (754 million in 2023); about two thirds are women (466 million) | 2024 | UNESCO, "Youth and adult literacy" factsheet for International Literacy Day 2025 (UIS data, Sept 2025). https://www.unesco.org/sites/default/files/medias/fichiers/2025/09/ild-2025-factsheet.pdf . Also https://www.unesco.org/en/literacy/need-know | "In 2024, 739 million adults still lacked basic literacy skills." | VERIFIED |
| Adult literacy rate (age 15+) | 88%; youth rate 93% | 2024 | UNESCO, "What you need to know about literacy". https://www.unesco.org/en/literacy/need-know | "global adult literacy rate (aged 15+) from 65% to 88%" (the span is 1975 to 2024) | VERIFIED |
| Adult illiteracy rate | 12% | 2024 | 100 minus 88 | Computed by me | DERIVED |
| Where the illiterate adults live | Sub-Saharan Africa 225 million; Central and Southern Asia 347 million (about 77% together) | 2024 | Same factsheet | "Nearly 77% lived in sub-Saharan Africa (225 million) and Central and Southern Asia (347 million)" | VERIFIED |

### 8b. Highest level of education reached, world adults aged 25 and over

Best source: the Wittgenstein Centre for Demography and Global Human Capital (IIASA, OeAW/VID, University of Vienna), Human Capital Data Explorer, version 3 (the 2023 revision, SSP2 scenario). Our World in Data cites it as "Human Capital, Wittgenstein Centre 3.2". Check the exact citation wording on https://dataexplorer.wittgensteincentre.org/ before you print it.

How I got the numbers: I downloaded the Data Explorer's batch file (URL below), read it with my own Python reader, and kept the rows named "World", both sexes, year 2020, for the 16 age groups from 25-29 to 100+. I then summed the groups. The file has 3,543,135 rows with the columns name, country_code, year, age, education, sex and epop (people, in thousands). 2020 is the model's base year. The shares are mine (DERIVED), but every input is a published WIC value. The script is `$SP/scripts/rds_wcde.py`.

| Highest level reached | Share of people aged 25+ in 2020 | People in 2020 | Share in 2015 (for context) |
| --- | --- | --- | --- |
| No education | 14.57% | 667.1 million | 16.03% |
| Incomplete primary | 6.82% | 312.1 million | 7.19% |
| Primary (completed) | 14.42% | 660.3 million | 15.31% |
| Lower secondary | 19.73% | 903.3 million | 20.04% |
| Upper secondary | 26.06% | 1,193.3 million | 24.86% |
| Post secondary (tertiary) | 18.39% | 842.1 million | 16.57% |
| All adults 25+ | 100% | 4,578.2 million | 4,217.6 million (100%) |

To match your five groups, treat "none" as No education, and decide how to show Incomplete primary (6.82%). I did not check WIC's exact category definitions.

Status: DERIVED from VERIFIED WIC data. Source file: https://wicshiny2023.iiasa.ac.at/wcde-data/wcde-v3-batch/2/epop.rds

Is a per-country CSV downloadable by URL? I tested each URL with curl on 2026-10-27.

| URL | HTTP status | Size | What it is |
| --- | --- | --- | --- |
| https://ourworldindata.org/grapher/share-of-the-population-with-no-formal-education-with-projections.csv | 200 | 203,513 bytes (text/csv) | Per-country CSV, 1950 to 2100 in 5-year steps. Wittgenstein Centre (2024), processed by Our World in Data. Only the "no formal education" share. World: 10.65% (2015), 9.75% (2020), 8.93% (2025). The column name says "Age: All", so it is not an age 25+ base. |
| https://ourworldindata.org/grapher/population-having-attained-at-least-basic-education.csv | 200 | 89,749 bytes (text/csv) | Per-country CSV, 1870 to 2040. "Share of the population with at least some formal education", ages 15+, Barro and Lee (2015) and Lee and Lee (2016). World: 85.06% (2010), 87.35% (2015), 89.19% (2020). |
| https://ourworldindata.org/grapher/share-of-the-population-with-at-least-some-secondary-education.csv | 200 | 56,472 bytes | Column "Population age 25+ with completed lower secondary education". No World row. I did not check its source. |
| https://ourworldindata.org/grapher/share-of-the-population-with-a-completed-post-secondary-education.csv | 200 | 42,000 bytes | Column "Population age 25+ with completed post-secondary education". No World row. |
| https://ourworldindata.org/grapher/share-of-the-population-with-completed-tertiary-education.csv | 200 | 80,544 bytes | Column label reads "Share of 25-64 year olds with incomplete tertiary education" (odd). Not used. |
| https://wicshiny2023.iiasa.ac.at/wcde-data/wcde-v3-batch/2/epop.rds | 200 | 8,891,344 bytes (application/octet-stream) | The full WIC data for all countries, ages, sexes and levels. It is an R .rds file, not a CSV. |
| https://github.com/guyabel/wcde-data/raw/main/wcde-v3-batch/2/epop.rds | 404 | n/a | Mirror path. I tested only the branch "main". The R package code uses "master". |
| https://shiny.wittgensteincentre.info/wcde-data/wcde-v3-batch/2/epop.rds | no reply (000) | n/a | Mirror path |

Answer: no per-country CSV with the full split by level was found. The split exists only as the .rds file. The Data Explorer website may offer a CSV download from its buttons. I did not test that because it needs a browser. The Barro-Lee dataset itself was not downloaded; only the Our World in Data version of it was.

## 9. Conflict and displacement

UNHCR's own site gave HTTP 403 to curl (pages and the PDF) and to WebFetch (main page), so I could not read the Global Trends report. I used UN News (10 June 2026) and UNHCR's public data API.

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| Forcibly displaced people, direction of change | Fell for the first time in a decade | 2025 | UN News, "Refugee numbers drop for first time in a decade, but millions remain trapped", 10 June 2026. https://news.un.org/en/story/2026/06/1167693 | "Global forced displacement has decreased for the first time in a decade" | VERIFIED |
| Forcibly displaced people, total | 117.8 million (123.2 million a year earlier) | End of 2025 | UNHCR, Global Trends report 2025. https://www.unhcr.org/global-trends and https://www.unhcr.org/sites/default/files/2026-06/global-trends-report-2025.pdf | Not seen on any page I could open | UNVERIFIED (search summary of UNHCR pages) |
| Refugees | 41.6 million (down 3%) | 2025 | UN News article above | "global refugee numbers fell by three per cent in 2025 to 41.6 million" | VERIFIED |
| Stateless people | 4,477,220 (about 4.5 million) | 2025 | UNHCR population API. https://api.unhcr.org/population/v1/population/?year=2025&limit=1 (HTTP 200, 360 bytes) | JSON field "stateless":4477220 | VERIFIED. UNHCR says the true number is higher, but I saw that only in a search summary (UNVERIFIED). |
| Other 2025 totals in the same API reply | Refugees under UNHCR mandate 28,461,306; asylum seekers 8,998,097; internally displaced 64,239,352; other people in need of international protection 7,177,473 | 2025 | Same API URL | JSON fields "refugees", "asylum_seekers", "idps", "oip" | VERIFIED as raw data. I read "oip" as other people in need of international protection (UNVERIFIED reading). Do not use 28.5 million as the refugee headline. |
| People who returned home | 14.7 million (4.4 million refugees, 10.3 million internally displaced) | 2025 | UN News article above. The API fields returned_refugees 4,362,272 and returned_idps 10,308,567 match. | "14.7 million displaced people went back to their areas or countries of origin in 2025" | VERIFIED |
| Global Peace Index 2026 headline | Peacefulness fell 0.7% in a year; 99 of 163 countries fell, 62 rose; more state-based conflicts than at any point since the Second World War | 2025 data, report June 2026 | Institute for Economics and Peace, "Global Peace Index 2026". https://www.visionofhumanity.org/wp-content/uploads/2026/06/Global-Peace-Index-2026-Report.pdf | "average level of global peacefulness deteriorated by 0.7 per cent over the past year" | VERIFIED |
| Cost of violence | US$21.8 trillion, 10.5% of global GDP, US$2,657 per person | 2025 | Same report | "equivalent to 10.5 per cent of global GDP, or US$2,657 per person" | VERIFIED |
| Share of world population exposed to conflict | Not found | n/a | ACLED. https://acleddata.com/conflict-index/ and https://acleddata.com/conflict-exposure | Neither page gives a global share | NOT FOUND |

What I tried for the exposure share: I fetched both ACLED pages and ran web searches. The Conflict Exposure page gives the definition: "estimates of the population living within 1 kilometer, 2 km, and 5 km" of an event. I saw two claims only in search summaries: "one in six people exposed to conflict in 2025" (an ACLED post copied on a job-board site) and "14% within 5 km of a conflict event or protest in 2023" (ACLED and WorldPop). Both are UNVERIFIED. I did not search UCDP.

## 10. Political freedom

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| Share of world population in Free countries | 21% | Ratings for 2025, edition 2026 | Freedom House, "Freedom in the World 2026: The Growing Shadow of Autocracy". PDF: https://freedomhouse.org/sites/default/files/2026-03/FIW2026_final_digital%20%281%29.pdf . Report page: https://freedomhouse.org/report/freedom-world/2026/growing-shadow-autocracy | Donut chart on report page 23 (PDF page 25), "The Real-World Impact of Attacks on Freedom": "21% live in Free countries" | VERIFIED (I read the chart image and the PDF text) |
| Share in Partly Free countries | 39% | Same | Same | Same chart: "39% live in Partly Free countries" | VERIFIED |
| Share in Not Free countries | 40% | Same | Same | Same chart: "40% live in Not Free countries" | VERIFIED |
| Population base for those shares | 195 countries; population data from the Population Reference Bureau 2024 World Population Data Sheet | Same | Same | Chart note under the figure | VERIFIED |
| Number of countries by status | Free 88, Partly Free 48, Not Free 59 | Same | Same PDF, status table | "FREE 88 ... PARTLY FREE 48 ... NOT FREE 59" | VERIFIED |
| Scores that fell in 2025 | For more than 40% of the world's people | 2025 | Same PDF | "The declines in 2025 affected more than 40 percent of the world's population" | VERIFIED |
| Share living in autocracies | 74% (6 billion) | End of 2025 | V-Dem Institute, University of Gothenburg, "Democracy Report 2026: Unraveling The Democratic Era?" (10th edition). https://www.v-dem.net/documents/75/V-Dem_Institute_Democracy_Report_2026_lowres.pdf | "Nearly three quarters of the world population (74%, or 6 billion) live in autocracies" | VERIFIED |
| V-Dem detail | Closed autocracies 28% (2.3 billion); electoral autocracies 46% (3.8 billion); liberal democracies 7% (0.6 billion); all democracies 26% (2.2 billion) | End of 2025 | Same PDF | "92 autocracies and 87 democracies at the end of 2025" | VERIFIED |

## 11. Air travel

Source: Stefan Gössling and Andreas Humpe (2020), "The global scale, distribution and growth of aviation: Implications for climate change", Global Environmental Change. DOI https://doi.org/10.1016/j.gloenvcha.2020.102194 . I read the open-access copy at https://pmc.ncbi.nlm.nih.gov/articles/PMC9900393/ .

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| Share of world population who flew (any flight) | 11% | 2018 | Gössling and Humpe 2020, abstract (PMC page above) | "travelling by air in 2018 was 11%, with at most 4% taking international flights" | VERIFIED |
| Share who flew abroad | At most 4% | 2018 | Same | Same quote | VERIFIED |
| Most frequent flyers | At most 1% of the world's people, who likely cause more than half of passenger-aviation CO2 | 2018 | Same | "likely accounts for more than half of the total emissions from passenger air travel" | VERIFIED |
| Ceiling on the share who could have flown, by income group | Low income 1.63% (11 million people); lower-middle 7.51% (227 million); upper-middle 24.72% (657 million); high income 100% (1,210 million); total 2,105 million. Passengers in 2018: 4,233 million. | 2018 | Same paper, Table 1 | Table 1, "Theoretical maximum share of flying population" | VERIFIED. It assumes each person makes one trip a year, so it is a ceiling and not a count. |
| Newer estimate than 2018 | Not found | n/a | n/a | n/a | NOT FOUND |

What I tried for a newer estimate: web searches (they returned low-quality pages that repeat the 2018 number) and the Semantic Scholar search API (HTTP 429, rate limited).

## 12. Air quality

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| Share of world population living where WHO air quality guideline levels are not met | 99% | 2019 | WHO, "Ambient (outdoor) air pollution" fact sheet, 24 Oct 2024. https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health | "99% of the world's population ... WHO air quality guidelines levels were not met" | VERIFIED. This is the newest WHO share I found. I did not check which guideline edition it uses. |
| Newer WHO share | Not found | 2026 | WHO Ambient Air Quality Database (update Jun 2026). https://www.who.int/publications/m/item/who-ambient-air-quality-database-(update-jun-2026) | The page describes pollutants and methods and gives no population share | NOT FOUND |
| Average fine particle level (PM2.5) | 26.1 ug/m3 in 2023 (34.4 in 2010, 25.4 in 2020) | 2023 | UN SDG Report 2026, Goal 11 page. https://unstats.un.org/sdgs/report/2026/Goal-11/ | "stalling at 26.1 ug/m3 in 2023" (units written in ASCII) | VERIFIED (secondary). The page does not say which population it weights. |

What I tried for a newer share: the WHO fact sheet, the WHO database page (June 2026) and the State of Global Air homepage (no figures in its page text).

## 13. Housing

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| People living in slums or informal settlements | 1.16 billion; 24.8% of urban residents | 2024 | UN SDG Report 2026, Goal 11 page. https://unstats.un.org/sdgs/report/2026/Goal-11/ | "the total number has surged to 1.16 billion worldwide" | VERIFIED (secondary) |
| Outlook | Could pass 1.2 billion by 2030 | 2030 | Same page | "slum population could exceed 1.2 billion by 2030" | VERIFIED (secondary) |
| UN-Habitat figure for slums and informal settlements | 1.1 billion | Not stated (plan published Oct 2025) | UN-Habitat, "Strategic Plan 2026-2029" one-pager. https://unhabitat.org/sites/default/files/2025/10/un-habitats_strategic_plan_2026-2029_one_pager.pdf | "1.1 billion people living in informal settlements and slums" | VERIFIED |
| People lacking adequate housing | 2.8 billion | Not stated | Same one-pager | "2.8 billion people worldwide are affected by different forms of housing inadequacy" | VERIFIED. The wording is "housing inadequacy", not "no home". |
| Homeless people | More than 300 million | Not stated | Same one-pager | "more than 300 million homeless people" | VERIFIED |

## 14. Violence

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| Global homicide rate | 5.1 victims per 100,000 people (5.9 in 2015) | 2024 | UN SDG Report 2026, Goal 16 page (UNODC data). https://unstats.un.org/sdgs/report/2026/Goal-16/ | "from 5.9 victims per 100,000 people in 2015 to 5.1 in 2024" | VERIFIED (secondary) |
| Homicide victims | 419,927 | 2024 | Our World in Data, "Homicides" (UN WPP 2024 and UNODC 2025 data, updated 12 June 2026). https://ourworldindata.org/grapher/homicides-unodc (CSV: https://ourworldindata.org/grapher/homicides-unodc.csv) | CSV row: World,OWID_WRL,2024,419927.47 | VERIFIED as an Our World in Data series. I did not open UNODC's own data portal. |
| Homicide rate in the same series | 5.14 per 100,000 | 2024 | Our World in Data, "Homicide rate". https://ourworldindata.org/grapher/homicide-rate-unodc | CSV row: World,OWID_WRL,2024,5.144926 | VERIFIED as an Our World in Data series |
| Latest UNODC study | About 458,000 victims; rate 5.8 per 100,000 | 2021 | UNODC, "Global Study on Homicide 2023", executive summary. https://www.unodc.org/documents/data-and-analysis/gsh/2023/GSH23_ExSum.pdf | "intentional homicides in 2021 is approximately 458,000 victims" and Fig. 1 row "World 5.8" | VERIFIED. The Our World in Data series (UNODC 2025 data) shows a lower 2021 value, 439,488 (5.53). Do not mix the two. |
| Highest regional rates | Latin America and the Caribbean 19.3; sub-Saharan Africa 11.7 (per 100,000) | 2024 | UN SDG Report 2026, Goal 16 page | "Latin America and the Caribbean recorded the highest homicide rates in 2024 at 19.3" | VERIFIED (secondary) |

## 15. Five more figures

| Figure | Value | Year | Source and URL | Seen as | Status |
| --- | --- | --- | --- | --- | --- |
| Child labour | 138 million children (about 8% of all children); 54 million in hazardous work | 2024 | ILO and UNICEF, "Child Labour: Global estimates 2024, trends and the road forward", 11 June 2025. https://www.ilo.org/resource/news/despite-progress-child-labour-still-affects-138-million-children-globally | "Nearly 138 million children were engaged in child labour in 2024" | VERIFIED. The "about 8%" comes from the UN SDG Report 2026 overview. |
| Children who got no vaccine at all (zero-dose) | 13.5 million; third dose of the DTP vaccine reached 85% of infants | 2025 | WHO, "Immunization coverage" fact sheet, 15 July 2026. https://www.who.int/news-room/fact-sheets/detail/immunization-coverage | "13.5 million children missing out on any vaccination" | VERIFIED |
| Maternal deaths | About 260,000 women (over 700 a day) | 2023 | WHO, "Maternal mortality" fact sheet, 7 April 2025. https://www.who.int/news-room/fact-sheets/detail/maternal-mortality | "About 260 000 women died during and following pregnancy and childbirth in 2023" | VERIFIED |
| Adults with a financial account | 79% have one; 21% do not | 2024 survey, Findex 2025 edition | World Bank, "The Global Findex Database 2025". https://www.worldbank.org/en/publication/globalfindex | "79% of adults globally now have an account" | VERIFIED for 79%. The 21% is DERIVED. The count of adults without an account (about 1.3 billion) is UNVERIFIED because it is not on the page. |
| Stunted children under 5 | 23.2% (26.4% in 2012); more than 150 million children | 2024 | UN SDG Report 2026, Goal 2 page and overview. https://unstats.un.org/sdgs/report/2026/Goal-02/ | "stunting in the under-5 population fell from 26.4 per cent to 23.2 per cent" | VERIFIED (secondary). I did not open the UNICEF, WHO and World Bank estimates page. |

## Gaps and cautions

Pages I could not read:

- HTTP 403 to curl: unhcr.org (pages and the PDF), ilostat.ilo.org, data.unicef.org (UN IGME page), trackingsdg7.esmap.org, the IEA Tracking SDG7 2026 page, unrefugees.org and sdg.iisd.org. WebFetch also got 403 on unhcr.org, ilostat.ilo.org and the UN IGME page.
- The FAO repository page for SOFI 2026 returned a 945-byte page that needs JavaScript. The childmortality.org page had no numbers.
- The Wayback Machine had no snapshot of the UNHCR, ILOSTAT or UNICEF IGME pages.
- Not searched or not opened: UCDP, the UIS and GEM Report pages, the Barro-Lee dataset, UNODC's own data portal, and the full SOFI 2026 and UHC 2025 reports.

Numbers to check again before you publish:

- UNHCR 117.8 million and 123.2 million are UNVERIFIED. The 41.6 million refugees figure is verified. My arithmetic from the API (28.46 + 7.18 + about 6.0 for Palestine refugees under UNRWA is about 41.6) fits it, but I did not confirm that split.
- Food insecurity: the UN SDG Report 2026 overview says 2.3 billion, but its Goal 2 page says 2.1 billion for 2025. The 2.3 billion may be an older estimate. Check the SOFI 2026 tables.
- The healthy-diet figure (2.7 billion) has no year on FAO's landing page.
- Informal work: 2.1 billion is a count, 57.9% is the share. A search summary said 57.7%. The ILO news page calls the 2.1 billion "expected", so it may be a projection.
- The education split is my sum of WIC age groups. Compare it with the Data Explorer screen before you print it.
- ACLED shares and the Findex "1.3 billion without an account" are UNVERIFIED.

Series that disagree, so do not mix them:

- JMP 2025 (2024 data) and WHO's older fact sheets (2022 data).
- Tracking SDG7: 666 million and 2.1 billion (2023 data) against 655 million and 2.0 billion (2024 data).
- UHC: the 2025 report uses a new definition of financial hardship. Do not compare it with the 2023 report.
- Homicide: 458,000 for 2021 (UNODC study) against 439,488 for 2021 (later series).
- Slums: 1.1 billion (UN-Habitat plan) against 1.16 billion (2024 data).

Population base and rounding:

- Sources use different world totals. The JMP uses 8.2 billion for 2024. The ITU figures imply about 8.2 billion for 2025. V-Dem's "6 billion is 74%" implies about 8.1 billion. Freedom House uses 2024 data from the Population Reference Bureau. Your site uses 8.3 billion.
- So show each source's own share and count. If you rescale one to 8.3 billion, the number no longer matches the citation.

Definitions that change who is counted:

- JMP uses a ladder. "Without safely managed water" includes people who have a basic service, so it does not mean "no water".
- "Hunger" (undernourishment), "moderate or severe food insecurity" and "cannot afford a healthy diet" are three overlapping measures. Do not add them.
- "Not fully covered by essential health services" comes from an index. It does not mean "no access".
- Social protection "at least one benefit" counts a person with any benefit, even a small one.
- V-Dem labels India, Pakistan and Indonesia as electoral autocracies ("among the most populous electoral autocracies"). That is why V-Dem's 74% in autocracies is much higher than Freedom House's 40% in Not Free countries. Do not compare the two.
- The WIC split uses ages 25+. OWID's no-education chart uses "Age: All". Do not put them on one chart.

Data years range from 2019 (WHO air quality) to 2025. Label each figure with its own year.

Files saved (all under `$SP/downloads/r2/`): sdg2026 (UN SDG Report 2026 PDF), sdg26_gNN (goal pages), jmp_hh and jmp_who (JMP page and WHO release), sdg7_pdf, sdg7_who, sdg7_wb, sdg7_seforall (Tracking SDG7), itu_pr and itu_xlsx (ITU), sofi (FAO page), who_uhc and who_uhc_brief (UHC), who_children, who_immun, who_mat, wspr_es (ILO), unesco_ild, unnews, unhcr_c (UNHCR API reply), gpi2026, fiw2026 (PDF and chart image pg-25.png), vdem2026, gh_pmc, who_air, unhab, unodc_exsum, owid_* (CSV files), wcde_epop (epop.rds). Scripts: `$SP/scripts/` (ctx.pl, rds_wcde.py, xlsx_dump.py, xlsx_row.py).
