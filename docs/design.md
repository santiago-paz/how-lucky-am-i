# Design plan

Written before the build, then checked against the brief. The check changed the plan. The changes are at the end.

## The job

A person lands here from a shared link, usually on a phone. They have a few minutes. The page has three jobs, in this order:

1. Let them feel where they stand among 8.2 billion people.
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
3. **Card grid.** Results as eight equal cards. Changed: scenes with different compositions. The areas are one list of bars. The comparison is a dumbbell chart. The map is full width.
4. **Eyebrow labels, numbered sections, monospace data labels, arrows on buttons.** None used. The only numbers are the wizard steps, which are a real sequence.
5. **Everything fades in on scroll.** Changed: one orchestrated moment (the sweep) and motion that answers the person (hover, drag, spin, toggle).
6. **Hero figure in a display face.** The dataviz rules ask for the same sans as the interface. Mona Sans does both jobs; the serif stays in paragraphs.

## What the checks also required

- Every chart has a table view, keyboard focus that shows what hover shows, and values that never live only in a tooltip.
- Reduced motion: the sweep and the morph jump to their end state.
- Nothing is sent anywhere. The only network calls are for the page's own files.
