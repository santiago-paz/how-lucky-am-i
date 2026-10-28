# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who open a shared link. They come from LinkedIn, WhatsApp, X and similar feeds, mostly on a phone, with about five minutes to spare. Their job is to answer five short sets of questions about their own life and see where they stand among the 8.3 billion people alive.

No other audience is confirmed yet.

## Product Purpose

How Lucky Am I? shows a person where they stand among the 8.3 billion people alive, and why. It places them in eight areas and as a whole. It uses public data from the World Bank, the UN, UBS and others.

The page makes one claim: where you were born, which passport you hold and who raised you explain more of your income than anything you did later. It lets a person see that with their own numbers.

Two outcomes count as success: a visitor sees why their place is what it is, and a visitor shares their result card. The page has no analytics and sends no requests beyond loading its own files, so neither outcome is measured today. Whether to measure them is undecided.

## Positioning

The page counts luck in eight areas, not income alone: income, wealth, freedom to move, health access, education, home and basics, safety net, and stability. Freedom to move covers the passport and the treaties that let people live and work abroad. The eight scores combine into one place. The areas have equal weight and a shared correlation of 0.6, so eight good scores make a person rarer than any one of them.

## Operating Context

A visitor answers five sets of questions: where they live and which passports they hold, work and money, home and savings, school and health, and day-to-day life and their safety net. A live panel shows their place as they answer. It holds the place back until the income is in, because the country and the passports alone say little about one person. While the country is only the browser's guess, it shows nothing and says so. On the home questions, a list left untouched is not counted as "none" until the visitor says that is right. A report then gives the overall place and the place in each area. The visitor can download a share card as an image or share it as text.

Answers live in `sessionStorage` and are gone when the tab closes. Only the language and the choice to pause motion stay between visits.

Link previews on LinkedIn, WhatsApp, Slack and X use one image of 1200 by 630 pixels. The share card is 1080 by 1350 pixels and is made for a phone feed.

## Capabilities and Constraints

- The report gives the overall place (for example "Top 11% of 8.3 billion"), the place in each of the eight areas, a comparison of home with the world, a map of the doors the passports open, a birth lottery where the visitor draws one life or many, the lives pile up as lights on an income line against the real shape of the world, and each life is set against their own, and charts of how the world changed since they were born.
- The share card shows the overall place and the eight area bars. It hides the country by default and never shows income or other answers.
- The page runs in English and Spanish. Whether every new feature must ship in both is undecided.
- A "Sources and method" section holds the full method and source list. Every chart has an (i) button that names its dataset and year.
- The questions are personal. They cover income, savings, health cover and legal status. The status question has an option, "No secure status", for people with an asylum claim or no papers.
- Terms: a person's result is their "place", and the eight parts are "areas".
- The result is a rough picture, and the page says so. Surveys mix income with consumption and miss the very rich, so top percentiles are approximate. The 2026 World Bank figures are a nowcast, and the last survey year is 2024. Wealth is modelled outside the 30 countries that UBS lists. Safety net is the least precise area. Passport counts come from one dataset and will drift.
- The site is plain static files with no framework and no runtime dependencies. The data files are committed, so any static host works.
- Licence: undecided. There is no licence file, so all rights are reserved by default. Third-party fonts, code and data keep their own terms.

## Brand Commitments

- Name: How Lucky Am I? The live address is howluckyami.app.
- Voice: plain words and short sentences, with the plain hyphen as the only dash. The English copy file states this rule at its top.
- Places: the live panel in the form, the verdict, the "where you live" card and the share card say "Ahead of X%" when the visitor, or their country's typical person, is in the lower half, and "Top X%" otherwise. The slider line on the money card follows the same rule for the income it shows (ahead of X% below the median, top X% above it). This is the rule "luck, never worth" applied to wording. The eight-areas section (list, chart, table and tips) follows it with one wording for the whole section: the list says "Ahead of 51%", and the labels on the towers show the number alone, because the bars and the scale already say "ahead of". The tips on the home-versus-world charts follow it too: in the lower half they lead with "Ahead of 51%" and name the group on the line below. Group names, such as "Top 10%" on the money card and "Top 0.1%" on the pyramid, describe parts of the world and not the visitor's place, so they keep their wording.
- The lottery: it counts lives with less money and lives with more money than the visitor's own, never better or worse people. Emerald is a life poorer than yours (behind you) and violet one richer, as on the globe. The pile keeps poorer lights left of the gold post and richer lights right of it. Its summary says in plain words how many of the lives drawn had less or more money than yours, and the real odds. With one life drawn, the sentence follows that life and not the odds. When most lives are poorer it says the visitor did not choose where they were born. When most are richer it says the same and that this says nothing about their worth. A visitor with no income of their own sees "Much more than you have" on the card and never a ratio. Past 500 lives the pile stops changing shape, so the buttons stop.
- Money: in Spanish every dollar amount reads "US$ 9,91" (the symbol, a non-breaking space, then the number), in the copy and from the number formatter, because a bare "$" is the peso in much of Latin America. English keeps "$9.91". The dollar ticks on the income skyline stay "$1, $3, $10" under a title that names dollars.
- Privacy lines: the three questions that feel most personal (legal status, income and net worth) each carry the line "Your answer stays in this tab. We never send it anywhere." under the question. The intro, the footer and the "Sources and method" section say the same in other words. If the page ever sends an answer anywhere or keeps it past the tab, all of these lines must change.
- The footer reads "Made by Santiago Paz" and links to LinkedIn and to the source code on GitHub.

## Evidence on Hand

- `research/` holds the long source notes: `income-and-wealth.md`, `basics-and-wellbeing.md`, `mobility-and-rights.md` and `treaty-blocs.json`. Each claim carries a label: VERIFIED, VERIFIED (secondary), DERIVED, UNVERIFIED or NOT FOUND.
- `data/curated/` holds the hand-checked inputs: the UBS tables and the treaty list (`blocs.json`, which has a `verified` field).
- `tests/` has tests for the model and for fuzzed input.
- `video/` holds LinkedIn promo videos in English and Spanish and link-preview images. Git ignores it and it is not deployed.
- The project has no testimonials, press coverage or usage numbers on file. Future work must not invent them.

## Product Principles

1. Luck, never worth. The page measures what people did not choose. It never says a high place is merit or a low place is failure.
2. Answers stay with the person. The page sends nothing. The share card hides the country by default and never shows income or other answers.
3. Show why as well as where. The visitor should leave knowing why their place is what it is.
4. Let the card stand alone. People post it in a phone feed, so it must read on its own and show nothing private.
5. Work without extras. Keyboard, screen readers, reduced motion and browsers without WebGL must keep working, and every chart keeps a table.

## Accessibility & Inclusion

These must keep working: keyboard use, screen readers, reduced motion, and browsers without WebGL. Every chart keeps a table version or gives its numbers as text.

When the page changes view (Start, Show my place, Start over), focus moves to the new view's heading, because the button that was pressed is gone. The report also says in one spoken line that it is ready and where the visitor stands, in the same words as the verdict card. The progress buttons keep a full name, such as "Step 2 of 5: Money", on phones where only the number shows.

Today the page follows the system setting for reduced motion and has a "Pause motion" button that stops the twinkling dots and the turning globe. Without WebGL, the 3D charts hide and the flat pyramid and bars stay. If the animation player cannot load, plain icons stay.

No named standard, such as WCAG 2.2 AA, has been chosen.
