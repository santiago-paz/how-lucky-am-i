/* The source catalog. Every chart points at entries here through its (i) button, and the
   "Sources and method" section lists them all. Names and years are exact; "uses" says what we take
   from the source. Status: "checked" means we read the number on the primary page or API;
   "secondary" means we read it through a summary or a copy; "rough" means the source is old or indirect. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;

  const S = {
    pip: {
      name: 'Poverty and Inequality Platform (PIP)', by: 'World Bank', when: 'September 2026 update (version 20260922), 2026 nowcast, 2021 PPP',
      url: 'https://pip.worldbank.org', status: 'checked',
      en: 'The share of each country, and of the world, living below each daily income line. This is the curve behind every income percentile here.',
      es: 'La proporción de cada país, y del mundo, que vive por debajo de cada línea de ingreso diario. Es la curva detrás de cada percentil de ingresos.',
    },
    pipLines: {
      name: 'The World Bank\'s new global poverty lines in 2021 prices', by: 'World Bank Data Blog', when: '9 June 2025',
      url: 'https://blogs.worldbank.org/en/opendata/the-world-bank-s-new-global-poverty-lines-in-2021-prices', status: 'secondary',
      en: 'The $3.00, $4.20 and $8.30 lines a day (2021 PPP dollars).', es: 'Las líneas de US$\u00A03,00, 4,20 y 8,30 por día (dólares PPA de 2021).',
    },
    gwwc: {
      name: 'How Rich Am I? (percentiles from PIP via Our World in Data)', by: 'Giving What We Can', when: '2025 page, 2024 data',
      url: 'https://www.givingwhatwecan.org/how-rich-am-i', status: 'checked',
      en: 'A cross-check. Its top 1% starts at $162.6 a day; ours, from the same PIP data, starts near $165 a day.',
      es: 'Una comprobación cruzada. Su 1% más alto empieza en US$\u00A0162,6 al día; el nuestro, con los mismos datos de PIP, cerca de US$\u00A0165 al día.',
    },
    wir: {
      name: 'World Inequality Report 2026', by: 'World Inequality Lab (WID.world)', when: '2026, data for 2025',
      url: 'https://wir2026.wid.world/', status: 'checked',
      en: 'Who holds the world\'s income and wealth: the top 10% earn 53% of income and own 75% of wealth; the bottom half earn 8% and own 2%. It uses a different yardstick (income per adult, before most taxes, 2025 PPP), so we only use it for these shares.',
      es: 'Quién tiene el ingreso y la riqueza del mundo: el 10% más alto gana el 53% del ingreso y posee el 75% de la riqueza; la mitad más pobre gana el 8% y posee el 2%. Usa otra vara (ingreso por adulto, antes de casi todos los impuestos, PPA 2025), así que solo la usamos para estas proporciones.',
    },
    ubs: {
      name: 'Global Wealth Report 2026', by: 'UBS', when: '30 June 2026, data for end of 2025',
      url: 'https://www.ubs.com/global/en/wealth-management/insights/global-wealth-report.html', status: 'checked',
      en: 'The wealth pyramid (page 23) and mean and median wealth per adult for 30 countries (page 14). Other countries are estimated; see the method.',
      es: 'La pirámide de riqueza (pág. 23) y la riqueza media y mediana por adulto de 30 países (pág. 14). Los demás países se estiman; mira el método.',
    },
    ubs2022: {
      name: 'Global Wealth Databook 2023 (via Wikipedia, "List of countries by wealth per adult")', by: 'UBS', when: 'end of 2022',
      url: 'https://en.wikipedia.org/wiki/List_of_countries_by_wealth_per_adult', status: 'rough',
      en: 'The last mean and median values we found for Argentina, Brazil, India and Nigeria. Old and read through a copy.',
      es: 'Los últimos valores de media y mediana que encontramos para Argentina, Brasil, India y Nigeria. Antiguos y leídos a través de una copia.',
    },
    findex: {
      name: 'The Global Findex Database 2025', by: 'World Bank', when: 'survey year 2024 (2021 where 2024 is missing)',
      url: 'https://www.worldbank.org/en/publication/globalfindex', status: 'checked',
      en: 'The share of adults in each country who could come up with emergency funds within 30 days. Used for the savings part of the safety net.',
      es: 'La proporción de adultos de cada país que podría conseguir fondos de emergencia en 30 días. Se usa para la parte de ahorros de la red de seguridad.',
    },
    wdi: {
      name: 'World Development Indicators', by: 'World Bank', when: 'updated 8 October 2026',
      url: 'https://databank.worldbank.org/source/world-development-indicators', status: 'checked',
      en: 'Population, prices, purchasing-power rates, life expectancy, child mortality, water, sanitation, electricity, clean cooking, internet use, schooling and more, by country.',
      es: 'Población, precios, tasas de paridad de poder adquisitivo, esperanza de vida, mortalidad infantil, agua, saneamiento, electricidad, cocina limpia, uso de internet, escolaridad y más, por país.',
    },
    wgi: {
      name: 'Worldwide Governance Indicators', by: 'World Bank', when: 'updated 25 September 2026',
      url: 'https://www.worldbank.org/en/publication/worldwide-governance-indicators', status: 'checked',
      en: 'Political stability, rule of law and voice and accountability, each scored 0 to 100. Averaged for the stability area.',
      es: 'Estabilidad política, estado de derecho y voz y rendición de cuentas, cada uno de 0 a 100. Se promedian para el área de estabilidad.',
    },
    uhc: {
      name: 'UHC service coverage index (SDG 3.8.1)', by: 'WHO Global Health Observatory', when: '2023',
      url: 'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/uhc-index-of-service-coverage', status: 'checked',
      en: 'How well each country covers essential health services, from 0 to 100. The base of the health area.',
      es: 'Qué tan bien cada país cubre los servicios de salud esenciales, de 0 a 100. Es la base del área de salud.',
    },
    hdr: {
      name: 'Human Development Report 2025, composite indices', by: 'UNDP', when: '2025, data for 2023',
      url: 'https://hdr.undp.org/data-center/documentation-and-downloads', status: 'checked',
      en: 'Mean years of schooling, used to fill gaps in school attainment for countries with no survey.',
      es: 'Años promedio de escolaridad, usados para completar los niveles de estudio de países sin encuesta.',
    },
    edstats: {
      name: 'Educational attainment of adults 25+ (WDI series SE.*.CUAT)', by: 'World Bank, from UNESCO Institute for Statistics', when: 'latest year per country',
      url: 'https://data.worldbank.org/indicator/SE.SEC.CUAT.UP.ZS', status: 'checked',
      en: 'The share of adults in each country who finished primary, secondary and each level of tertiary school.',
      es: 'La proporción de adultos de cada país que terminó la primaria, la secundaria y cada nivel terciario.',
    },
    wic: {
      name: 'Wittgenstein Centre Data Explorer', by: 'Wittgenstein Centre (IIASA, OeAW, University of Vienna)', when: '2020',
      url: 'https://dataexplorer.wittgensteincentre.org/wcde-v3/', status: 'secondary',
      en: 'A cross-check. For 2020 it puts 21% of adults 25+ below completed primary school and 18% in tertiary. Our model gives 21% and 20%.',
      es: 'Una comprobación cruzada. Para 2020 pone al 21% de los adultos de 25 años o más por debajo de la primaria completa y al 18% en estudios terciarios. Nuestro modelo da 21% y 20%.',
    },
    passport: {
      name: 'Passport Index data (Passport Index Dataset)', by: 'imorte/passport-index-data on GitHub, from Passport Index', when: 'last updated 17 February 2026',
      url: 'https://github.com/imorte/passport-index-data', status: 'checked',
      en: 'Visa rules for 199 passports and 198 destinations. Visa free, visa on arrival and eTA count as open; e-visa counts as paperwork. MIT licence on the repository; the underlying data comes from passportindex.org.',
      es: 'Reglas de visa de 199 pasaportes y 198 destinos. Sin visa, visa a la llegada y eTA cuentan como abierto; la e-visa cuenta como trámite. Licencia MIT del repositorio; los datos de fondo vienen de passportindex.org.',
    },
    henley: {
      name: 'Henley Passport Index', by: 'Henley & Partners (IATA data)', when: 'July 2026 edition',
      url: 'https://www.henleyglobal.com/passport-index', status: 'secondary',
      en: 'Context only. Henley counts 227 destinations (territories too), so its totals are higher than ours. Singapore leads with 192.',
      es: 'Solo contexto. Henley cuenta 227 destinos (con territorios), así que sus totales son mayores que los nuestros. Singapur lidera con 192.',
    },
    blocs: {
      name: 'Rights to live and work abroad: treaty list', by: 'This project, from treaty texts and official pages (see research notes)', when: 'October 2026',
      url: 'https://europa.eu/youreurope/citizens/residence/residence-rights/index_en.htm', status: 'rough',
      en: 'EU, EEA and Switzerland; Mercosur residence agreement; Nordic union; UK-Ireland; Australia-New Zealand; GCC; ECOWAS; CARICOM; East African Community; Eurasian Economic Union; US compacts; India-Nepal. Several rest on secondary sources; each is marked in the research notes.',
      es: 'UE, EEE y Suiza; acuerdo de residencia del Mercosur; unión nórdica; Reino Unido e Irlanda; Australia y Nueva Zelanda; CCG; CEDEAO; CARICOM; Comunidad de África Oriental; Unión Económica Euroasiática; pactos con EE. UU.; India y Nepal. Varios se apoyan en fuentes secundarias; cada uno está marcado en las notas de investigación.',
    },
    ilo: {
      name: 'World Social Protection Report 2024-26', by: 'International Labour Organization', when: '2024, data for 2023',
      url: 'https://www.ilo.org/publications/flagship-reports/world-social-protection-report-2024-26', status: 'secondary',
      en: '52.4% of people worldwide have at least one social protection benefit (3.8 billion do not). By income group: high 85.9%, upper-middle 71.2%, lower-middle 32.4%, low 9.7%. Informal work: 2.1 billion workers, 57.9% (2025).',
      es: 'El 52,4% de la población mundial tiene al menos un beneficio de protección social (3.800 millones no). Por grupo de ingreso: alto 85,9%, medio-alto 71,2%, medio-bajo 32,4%, bajo 9,7%. Trabajo informal: 2.100 millones de personas, 57,9% (2025).',
    },
    gallup: {
      name: 'Gallup World Poll: "relatives or friends you can count on"', by: 'Gallup, as summarised by Helliwell et al. (2018), Oishi and Diener (2014)', when: '2006 and 2007 data',
      url: 'https://worlddatabaseofhappiness.eur.nl/correlational-findings/22371', status: 'rough',
      en: 'National averages of about 0.81 to 0.85 say yes. Old, and averages of countries rather than of people. We use 0.82 for every country.',
      es: 'Los promedios nacionales rondan 0,81 a 0,85 de respuestas afirmativas. Antiguo, y promedio de países, no de personas. Usamos 0,82 para todos los países.',
    },
    jmp: {
      name: 'Progress on household drinking water, sanitation and hygiene 2000-2024', by: 'WHO and UNICEF Joint Monitoring Programme', when: 'August 2025',
      url: 'https://washdata.org', status: 'checked',
      en: '2.1 billion people lack safely managed drinking water; 3.4 billion lack safely managed sanitation; 1.7 billion lack basic hygiene at home; 354 million practise open defecation.',
      es: '2.100 millones de personas no tienen agua potable gestionada de forma segura; 3.400 millones no tienen saneamiento gestionado de forma segura; 1.700 millones no tienen higiene básica en casa; 354 millones defecan al aire libre.',
    },
    sdg7: {
      name: 'Tracking SDG7: The Energy Progress Report 2026', by: 'IEA, IRENA, UN Statistics Division, World Bank, WHO', when: '2026, data for 2024',
      url: 'https://trackingsdg7.esmap.org/', status: 'secondary',
      en: '655 million people have no electricity; about 2.0 billion have no clean cooking.',
      es: '655 millones de personas no tienen electricidad; unos 2.000 millones no tienen cocina limpia.',
    },
    itu: {
      name: 'Facts and Figures 2025', by: 'International Telecommunication Union', when: '2025',
      url: 'https://www.itu.int/en/ITU-D/Statistics/Pages/facts/default.aspx', status: 'secondary',
      en: '6.0 billion people are online (73.6%); 2.2 billion are not.', es: '6.000 millones de personas están en línea (73,6%); 2.200 millones no.',
    },
    fao: {
      name: 'The State of Food Security and Nutrition in the World 2026', by: 'FAO, IFAD, UNICEF, WFP, WHO', when: '2026, data for 2025',
      url: 'https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world', status: 'secondary',
      en: '645 million people go hungry (7.8%). Moderate or severe food insecurity affects 2.1 billion (25.8%, via the UN SDG Report 2026).',
      es: '645 millones de personas pasan hambre (7,8%). La inseguridad alimentaria moderada o grave afecta a 2.100 millones (25,8%, según el Informe ODS de la ONU 2026).',
    },
    uhcgmr: {
      name: 'Tracking Universal Health Coverage: Global Monitoring Report', by: 'WHO and World Bank', when: '2023 and later',
      url: 'https://www.who.int/publications/i/item/9789240080379', status: 'secondary',
      en: '4.6 billion people are not fully covered by essential health services (2023). 2.1 billion face financial hardship from health costs (2022).',
      es: '4.600 millones de personas no están plenamente cubiertas por servicios de salud esenciales (2023). 2.100 millones sufren dificultades económicas por gastos de salud (2022).',
    },
    unesco: {
      name: 'Out-of-school children, youth and literacy', by: 'UNESCO Institute for Statistics', when: '2024',
      url: 'https://www.unesco.org/en/literacy/need-know', status: 'secondary',
      en: '273 million children and young people are out of school; 739 million adults cannot read (88% literacy).',
      es: '273 millones de niños y jóvenes están fuera de la escuela; 739 millones de adultos no saben leer (88% de alfabetización).',
    },
    unhabitat: {
      name: 'Housing and slums', by: 'UN-Habitat and the UN SDG Report 2026', when: '2024',
      url: 'https://unstats.un.org/sdgs/report/2026/', status: 'secondary',
      en: '1.16 billion people live in slums or informal settlements; about 2.8 billion lack adequate housing.',
      es: '1.160 millones de personas viven en barrios precarios o asentamientos informales; cerca de 2.800 millones no tienen una vivienda adecuada.',
    },
    freedom: {
      name: 'Freedom in the World 2026', by: 'Freedom House', when: '2026',
      url: 'https://freedomhouse.org/report/freedom-world', status: 'secondary',
      en: '21% of the world lives in Free countries, 39% in Partly Free and 40% in Not Free.', es: 'El 21% del mundo vive en países Libres, el 39% en Parcialmente Libres y el 40% en No Libres.',
    },
    gossling: {
      name: 'The global scale, distribution and growth of aviation', by: 'Gössling and Humpe, Global Environmental Change', when: '2020, data for 2018',
      url: 'https://doi.org/10.1016/j.gloenvcha.2020.102194', status: 'secondary',
      en: 'About 11% of the world\'s people flew in 2018, and about 4% flew abroad. We use 11% as the share who can afford to travel.',
      es: 'Cerca del 11% de la población mundial voló en 2018, y cerca del 4% voló al extranjero. Usamos el 11% como la proporción que puede costearse viajar.',
    },
    wpp: {
      name: 'World Population Prospects 2024', by: 'United Nations, Population Division', when: '2024',
      url: 'https://population.un.org/wpp/', status: 'checked',
      en: 'World population: 8.23 billion in mid-2025 and 8.30 billion in mid-2026. Median age 31.1. Life expectancy at birth 73.8 years.',
      es: 'Población mundial: 8.230 millones a mediados de 2025 y 8.300 millones a mediados de 2026. Edad mediana 31,1. Esperanza de vida al nacer 73,8 años.',
    },
    prb: {
      name: 'How Many People Have Ever Lived on Earth?', by: 'Population Reference Bureau', when: '15 November 2022',
      url: 'https://www.prb.org/articles/how-many-people-have-ever-lived-on-earth/', status: 'secondary',
      en: 'About 117 billion people have ever been born. About 7% are alive today.', es: 'Han nacido unos 117.000 millones de personas. Hoy vive cerca del 7%.',
    },
    milanovic: {
      name: 'Global Inequality of Opportunity: How Much of Our Income Is Determined by Where We Live?', by: 'Branko Milanovic, Review of Economics and Statistics 97(2)', when: '2015',
      url: 'https://hdl.handle.net/10986/21484', status: 'checked',
      en: 'The country you live in, and where you sit in its income ranking, explain about two thirds of the differences in income between people worldwide (R-squared 66 to 73 percent). The between-country share of global inequality was 70% in 2008 and 81% in 1988.',
      es: 'El país en que vives, y tu lugar en su escala de ingresos, explican cerca de dos tercios de las diferencias de ingreso entre las personas del mundo (R cuadrado de 66 a 73 por ciento). La parte entre países de la desigualdad global fue 70% en 2008 y 81% en 1988.',
    },
    clemens: {
      name: 'The Place Premium: Wage Differences for Identical Workers across the U.S. Border', by: 'Clemens, Montenegro and Pritchett, CGD Working Paper 148', when: '2008 (published in 2019 in the Review of Economics and Statistics)',
      url: 'https://www.cgdev.org/sites/default/files/16352_file_CMP_place_premium_148.pdf', status: 'checked',
      en: 'Wage multiples for an identical worker who moves to the US: Nigeria 14.9, Haiti 10.3, India 6.3, Philippines 3.8, Brazil 3.8, Argentina 2.5, Mexico 2.5. Figures are from the 2008 working paper; the published version may differ.',
      es: 'Múltiplos salariales para un trabajador idéntico que se muda a EE. UU.: Nigeria 14,9, Haití 10,3, India 6,3, Filipinas 3,8, Brasil 3,8, Argentina 2,5, México 2,5. Las cifras son del documento de trabajo de 2008; la versión publicada puede diferir.',
    },
    indec: {
      name: 'Consumer price index, national level (series 148.3_INIVELNAL_DICI_M_26)', by: 'INDEC via Datos Argentina', when: 'to August 2026',
      url: 'https://datos.gob.ar/', status: 'checked',
      en: 'Argentina\'s own prices: 25.0 times the 2021 average by August 2026, up 33.5% in twelve months.',
      es: 'Los precios de Argentina: 25,0 veces el promedio de 2021 en agosto de 2026, con un alza de 33,5% en doce meses.',
    },
    fx: {
      name: 'Open exchange rates', by: 'ExchangeRate-API', when: '27 October 2026',
      url: 'https://www.exchangerate-api.com', status: 'checked',
      en: 'Today\'s market exchange rates, a snapshot taken when the data was built.', es: 'Tipos de cambio de mercado de hoy, una foto tomada al armar los datos.',
    },
    geo: {
      name: 'Country names, codes and currencies; map shapes and cities', by: 'mledoze/countries (ODbL); Natural Earth via world-atlas (public domain)', when: '2025',
      url: 'https://github.com/mledoze/countries', status: 'checked',
      en: 'Names in English and Spanish, ISO codes, currencies, country outlines and the cities used to place the dots.',
      es: 'Nombres en inglés y español, códigos ISO, monedas, contornos de países y las ciudades usadas para ubicar los puntos.',
    },
    three: {
      name: 'three.js', by: 'mrdoob and contributors (MIT)', when: 'r186',
      url: 'https://threejs.org', status: 'checked',
      en: 'The 3D globe and skyline.', es: 'El globo 3D y el skyline.',
    },
  };
  HLIA.SOURCES = S;
})(window);
