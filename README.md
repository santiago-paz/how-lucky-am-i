# How Lucky Am I?

A web page that shows where you stand among the 8.3 billion people alive. You answer a few questions about your life. The page then places you in eight areas, from income to freedom to travel, and as a whole. It uses public data from the World Bank, the UN, UBS and others. Your answers stay in your browser.

Where you were born, which passport you hold and who raised you explain more of your income than anything you did later. The page lets you see that with your own numbers.

Try it: https://howluckyami.app

## What you get

- An intro that draws every person alive as a dot on a world map. One dot is about one million people.
- Five short sets of questions: where you live and your passports, work and income, home and savings, school and health, and travel and the people you can lean on. A panel beside the questions shows your place after each answer.
- A report with a headline ("Top 11% of 8.3 billion"), a 3D globe that lights up the people you are ahead of, and a skyline of income steps with you marked on it. Below that: a 3D pyramid of luck with a name and a head count on every step, eight 3D towers (one per area) read against a scale, with the eight bars under them, a home-versus-world chart, a flat passport map where the doors open outward from your home and a route is drawn to each place you pick, seven basics that many people lack, a birth lottery you can spin, and charts of how the world changed since you were born.
- Small Lottie animations: a four-leaf clover on the headline card, checks that draw themselves on the basics, and sparkles around the share card.
- A share card (1080 by 1350, made for a phone feed) that you can download as an image, or share as text. By default it hides your country. It shows your overall place and the eight area bars, and never your income or your other answers.
- English and Spanish.
- A "Sources and method" section. Every chart has an (i) button that names its dataset and year.

## Run it

You need Python 3 to serve the files. You need Node 20 or newer only for the tests and the data scripts.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. The site has no runtime dependencies and no build step to view. The data files and the 3D bundle are committed, so it also works on any static host.

Open the page through the server, not as a `file://` link. Some browsers refuse to load fonts from `file://`.

## How the numbers work

Each area turns your answers into a percentile: the share of people alive who are behind you, counting half of any tie. The eight percentiles are turned into normal scores, added, and rescaled. The areas have equal weight and a shared correlation of 0.6, so eight good scores make you rarer than any one of them.

| Area | Main sources |
| --- | --- |
| Income | World Bank Poverty and Inequality Platform: 100 income lines for each of about 218 economies, in 2021 international dollars, with a 2026 nowcast. Your money is converted with the PPP rate and price history of your country. For Argentina the page uses the national statistics office's own price index. |
| Wealth | UBS Global Wealth Report. Mean and median wealth for 30 countries are used directly. Other countries are modelled and tuned to the UBS world pyramid. |
| Freedom to move | Passport Index data (February 2026), plus treaties that give a right to live and work abroad. |
| Health access | WHO service coverage index, mixed with your own cover. |
| Education | Adult schooling by level from UNESCO via the World Bank, filled in with UNDP years of schooling. |
| Home and basics | WHO and UNICEF water and sanitation, energy access, clean cooking, ITU internet use, FAO food insecurity, UN-Habitat slums. |
| Safety net | ILO social protection, World Bank Findex, Gallup. This is the least precise area. |
| Stability | World Bank governance indicators, with a penalty for an insecure legal status. |

The in-app "Sources and method" section has the full text and the full source list. The notes in `research/` give the page, table or API field for each number, and flag the items that were not verified.

## Rebuild the data

The committed files in `assets/js/data/` come from a small pipeline. You only need it to refresh the numbers.

```bash
npm run fetch        # download raw data into data-raw/ (needs the network, not committed)
npm run build:data   # world.js and passports.js
npm run build:map    # map.js and globe.js
npm run build:3d     # globe3d.js, the three.js bundle (the globe and the 3D charts)
npm run build:lottie # the Lottie files in assets/lottie/
npm test             # 15 tests
```

`npm run build` runs the data, map and 3D steps in order. The Lottie files are plain JSON made by `scripts/make-lottie.mjs`, so you only run that step when you change an animation. Curated inputs that no API serves are in `data/curated/`: the UBS tables and the treaty list.

## Put it online

The site is plain files, so any static host works. It is live at https://howluckyami.app. For Vercel, this repo has a small script. It uploads only `index.html` and `assets/` (not the notes, scripts, tests or raw data).

```bash
vercel link --yes --project how-lucky-am-i   # once, to tie this folder to a Vercel project
npm run deploy                               # a production deploy
npm run deploy -- --preview                  # a preview deploy
npm run deploy -- --stage-only               # only build .deploy/, to look at what would go up
```

`vercel.json` holds the headers (long caching for the fonts, and two safe defaults for every file).

## Link preview

When the link is shared (LinkedIn, WhatsApp, Slack, X), the picture comes from `assets/og/og-image.jpg`, 1200 by 630 pixels. It is drawn by `scripts/og-card.html` from the same map of people the site uses. To make it again: run `npm run dev`, open http://localhost:5173/scripts/og-card.html in a 1200 by 630 window at a device pixel ratio of 2, save a screenshot, and shrink it to 1200 by 630 as a JPEG (`ffmpeg -i shot.png -vf scale=1200:630 -q:v 2 assets/og/og-image.jpg`). The full web addresses in the `og:` tags and the canonical link of `index.html` must be the address that serves the page. Today that is `www.howluckyami.app`, because the bare domain `howluckyami.app` sends visitors on to it. The share card and the shared text carry the bare domain (`SITE` in `assets/js/share.js`), and `homepage` in `package.json` has it too. LinkedIn keeps a copy of each link for a while: to see a change at once, paste the link into https://www.linkedin.com/post-inspector/.

## Project layout

```
index.html            the page
assets/css/           tokens, base, components, scenes, results
assets/js/            the app, one file per job (model, wizard, results, share, and so on)
assets/js/data/       generated data
assets/js/vendor/     the lottie-web player, with its licence
assets/lottie/        the Lottie animations
assets/src/           source of the 3D bundle (the globe, and the pyramid and tower charts)
assets/fonts/         Mona Sans and Newsreader, with their licences
scripts/              fetch, build and deploy scripts, and the link preview card
data/curated/         hand-checked inputs
research/             research notes with sources
docs/design.md        the design plan
tests/                model and fuzz tests
```

## Limits

This is a rough picture. It measures luck, which means things you did not choose. It does not measure effort, talent or worth, and it leaves out love, friends and meaning, which no survey counts well.

- Surveys mix income with consumption and miss the very rich, so the top percentiles are approximate.
- The 2026 World Bank figures are a nowcast. The last survey year is 2024.
- Wealth is modelled, not measured, outside the 30 countries UBS lists.
- Safety net and stability use country averages plus adjustments made for this project.
- Passport counts come from one dataset and will drift. Henley counts 227 places and reports higher numbers.
- Some entries in the treaty list rest on secondary sources. The `verified` field in `data/curated/blocs.json` shows which.

## Privacy

Everything runs in the browser. The page sends no request with your answers. Answers live in `sessionStorage`, so they are gone when you close the tab. Only your language and your choice to pause motion are kept between visits.

## Accessibility

The site works with a keyboard and a screen reader. The pyramid, the eight bars, the comparison, the passport map and the time charts each have a table version, and the other sections give their numbers as text. The "Pause motion" button stops the twinkling dots and the turning globe, and the site follows your system setting for reduced motion. With motion paused, the Lottie animations show a still picture. If your browser has no WebGL, the 3D charts are hidden and the flat pyramid and the bars stay. If the Lottie player cannot load, the page keeps its plain icons.

## Licences

The project has no licence file yet, so by default all rights are reserved: people can read the code but not reuse it. Add a licence file if you want to allow reuse.

Third-party material keeps its own terms:

- Mona Sans and Newsreader: SIL Open Font License (files in `assets/fonts/`).
- three.js: MIT.
- lottie-web (light SVG build): MIT. The licence is in `assets/js/vendor/LICENSE-lottie-web.md`.
- Passport matrix from `imorte/passport-index-data`: MIT.
- Coastlines and places from Natural Earth: public domain.
- Data from the World Bank, WHO, UNDP, UN, ILO, ITU, FAO and others: each under its own terms. Check them before you reuse the data files.
