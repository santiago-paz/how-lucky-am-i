# Research notes

These notes were written while the site was built, on 2026-10-27. They record where each number comes from, with the page, table or API field. The site's "Sources and method" section is the short version. These files are the long one.

| File | What it covers |
| --- | --- |
| `income-and-wealth.md` | World Bank PIP, World Inequality Lab, UBS wealth report, Findex, UN population, and the research on birth-lottery effects |
| `basics-and-wellbeing.md` | Water, sanitation, power, cooking, internet, food, housing, health cover, schooling, work and social protection |
| `mobility-and-rights.md` | Passport Index and Henley counts, and the treaties that give a right to live and work abroad |
| `treaty-blocs.json` | The full treaty list the site's `data/curated/blocs.json` was made from. It has one more entry, the Andean Community, which the site leaves out because it was not checked and the four members are covered by the Mercosur residence agreement |

## How to read the labels

Every claim carries one of these labels.

- VERIFIED: the author read the number in the primary file or a live API response.
- VERIFIED (secondary): read on Wikipedia or a news page, not at the primary source.
- DERIVED: computed from verified numbers, with the method shown.
- UNVERIFIED: seen only in a search snippet, a fetch-tool summary or from memory. Check it before you rely on it.
- NOT FOUND: the author looked and found nothing. The attempts are listed.

## Things to know

- The notes mention a folder called `$SP`. That was a temporary folder used during the research. It is not in this repository, so those paths lead nowhere.
- Some entries in the treaty list rest on secondary sources. They are marked in `mobility-and-rights.md` and in the `verified` field of `treaty-blocs.json`.
- Figures change. The World Bank, Passport Index and UBS publish new editions every year or twice a year.
