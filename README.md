# Cube

A one-page portfolio built around a rotating 3D cube. Each of the six faces is a
section of the CV; the cube is also the navigation.

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run check` | Verifies the cube's rotation and snap maths |

## Editing the content

Everything you will want to change lives in **`index.html`**. Each face is one
`<section class="face">` with two parts:

- `.face__inner` — the summary shown on the cube itself. Keep it short: a
  heading, a line or two, a few bullets. It has to stay readable at about
  200px square on a phone.
- `.face__detail` — the long version, shown when someone opens the section.
  Leave it out and the face simply has no "Read more" button (as with Contact).

The section order in the file is the navigation order. Changing it means also
reordering `FACE_TABLE` in `src/cube/orientation.js`, which maps sections onto
faces.

## How it works

The six sections are authored as ordinary HTML. On load they are *moved* — not
copied — into a `CSS3DRenderer` scene and arranged into a cube, so there is only
ever one copy of the text in the DOM: it stays selectable, linkable, indexable
and readable by a screen reader.

A second WebGL layer shares the same camera and draws the soft contact shadow.
It loads separately, after the cube is already interactive, because three's
`WebGLRenderer` is most of the bundle and the shadow is decoration. Without it
(no WebGL, slow connection, blocked chunk) everything else still works.

If JavaScript never runs at all, the page stays what it already was: a plain,
readable, vertically scrolling CV. The **View as list** toggle in the header
shows the same thing on purpose.

### The cube always comes to rest upright

Dragging tumbles the cube freely, but on release it settles onto one of exactly
six orientations — the six faces, each the right way up. A cube has 24 aligned
orientations; the other 18 leave the text on its side or upside down, which is
fine for a puzzle and useless for a CV. `npm run check` asserts this holds from
any starting rotation.

### Controls

| Input | Action |
| --- | --- |
| Drag / swipe | Turn the cube; it settles on release |
| Tap the front face | Open that section's detail |
| `←` `→` `↑` `↓` | Turn a quarter step |
| `1`–`6`, `Home` | Jump to a section |
| `Esc` | Close the detail panel |

## Layout

The camera sits one projection-height from the cube, so one world unit is one
CSS pixel and the faces can be typeset with ordinary container queries rather
than being scaled by the projection. The face size is derived from the cube's
*corner-on* footprint — the widest it ever gets mid-drag — so it cannot overflow
a narrow screen while being turned. See `src/cube/layout.js`.
