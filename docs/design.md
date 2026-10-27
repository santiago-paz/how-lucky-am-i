# Design plan

Written before the build, then checked against the brief. The check changed the plan. The changes are at the end.

## The job

A person lands here from a shared link, usually on a phone. They have a few minutes. The page has three jobs, in this order:

1. Let them feel where they stand among 8.3 billion people.
2. Show them why: where you are born and who raised you explain most of your income.
3. Give them sources they can check, so they can trust the number.

The brief pins the direction: dark by default, emerald, cyan and violet accents, a wizard, a results dashboard, a sources section. This plan follows that and makes choices inside it.

## Tokens

Colors (dark, validated with the dataviz palette script against the panel color):

| Name | Value | Meaning |
| --- | --- | --- |
| Night | `#070A1C` | page |
| Panel | `#0E1330` | tools and charts |
| Starlight | `#EEF1FF` | text |
| Emerald | `#35D6A0` | people you are ahead of, things you have |
| Violet | `#9B8CFF` | everyone else, context |
| Cyan | `#3CC8FF` | things you can press |
| Gold | `#FFC14D` | you, and nothing else |

Chart fills use toned steps of the same hues so large areas do not glare: emerald `#1FA97C` and violet `#8A78EE` pass every color-blind check as a pair. Cyan and violet fail together under color-blind simulation, so cyan never marks a data series.

Type:

- Mona Sans (variable width and weight) for interface, numbers and headings. Width is a tool: the more exclusive the group, the narrower the figure.
- Newsreader for the paragraphs that explain things. A serif voice for the reading, a sans for the instrument.
- Tabular figures only in columns. Big numbers use proportional figures.

Layout: one long column of scenes. Text sits left on a 62-character measure. Charts break wider. No grid of equal cards; each scene has its own shape, and panels appear only where a tool needs a frame (map, lottery, share card).

## The one memorable thing

The field. About 8,200 lights, one for each million people, placed like Earth at night: clustered at cities, thin over deserts. Each light belongs to a country and has an income drawn from that country's real distribution. The same lights then sort themselves into the world income distribution, with one gold light that is you. The field is the opening image, the live progress meter, the main chart and the share card.

## Critique against the brief

What a generic answer to this brief looks like: a dark dashboard with a neon gradient headline number, identical glass cards, a radar chart, and a fade-up on every section. Where this plan drifted toward that, and what changed:

1. **Gradient hero number.** The brief asks for a giant counter. A gradient on it is the default treatment. Changed: the number is plain ink and is tied to a sweep across the field. A line moves across the lights as the counter falls, and every light behind you turns emerald. The number lands where the line stops.
2. **Neon trio everywhere.** Three bright hues used as decoration would be the same dashboard as any other. Changed: each hue has one meaning (above), gold appears only for you, and the neon is kept for small marks and glows.
3. **Card grid.** Results as eight equal cards. Changed: scenes with different compositions. The areas are one list of bars, with the same eight numbers as 3D towers above it. The ranking is a 3D pyramid with its names and head counts on the chart itself. The comparison is a dumbbell chart. The passport map is flat and full width: the doors open outward from your home, and the routes are drawn from it.
4. **Eyebrow labels, numbered sections, monospace data labels, arrows on buttons.** None used. The only numbers are the wizard steps, which are a real sequence.
5. **Everything fades in on scroll.** Changed: one orchestrated moment (the sweep) and motion that answers the person (hover, drag, spin, toggle).
6. **Hero figure in a display face.** The dataviz rules ask for the same sans as the interface. Mona Sans does both jobs; the serif stays in paragraphs.

## What the checks also required

- Every chart has a table view, keyboard focus that shows what hover shows, and values that never live only in a tooltip.
- Reduced motion: the sweep and the morph jump to their end state.
- The 3D charts are a second view of numbers that already sit in a list or a table. Hovering a tower lights its row in the list of areas, and the other way round. The pyramid carries its names and counts on the chart, and its flat steps stay for screen readers. Without WebGL the 3D charts are hidden and the flat version shows.
- The Lottie animations are small and decorative: a clover, a check, sparkles and an arrow. They play once, or loop only while they are on screen. With reduced motion they show a still picture, and the page works if the player cannot load.
- Short windows: the result card, the live panel, the money step, the passport map and the share card are checked at 1104 by 549 pixels, so nothing sits under the top bar and no globe or card is cut off.
- The share card is the one thing people post, so its spacing is fixed on one grid: 80 px at the sides, about 55 px between blocks, and type that stays readable when the card is shown 390 px wide. "Top", the figure and the percent sign stand on one baseline, and the country (only if the person turns it on) sits at the right of the name line, so it never pushes the layout down.
- The number on the headline card starts to fall the moment the report opens. The 3D code is fetched while the person answers the questions, and the camera comes in while the lights turn on, so nothing waits before the first change.
- Nothing is sent anywhere. The only network calls are for the page's own files.
