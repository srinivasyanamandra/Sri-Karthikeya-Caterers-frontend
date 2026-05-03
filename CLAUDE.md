# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing site for Srikarthikeya Caterers (pure-vegetarian catering, Hyderabad). React 19 SPA built on Create React App (`react-scripts` 5). No backend currently wired up — `src/config/api.config.js` is a placeholder for a future Spring Boot API.

## Commands

```bash
npm start            # dev server at localhost:3000
npm run build        # production build → ./build
npm test             # CRA/Jest watch mode
npm test -- --watchAll=false               # single CI run
npm test -- src/App.test.js                # run a single test file
npm test -- -t "renders learn react"       # run tests matching a name
npm run lint         # eslint over src/**/*.{js,jsx}
npm run lint:fix     # eslint --fix
npm run format       # prettier --write src
npm run analyze      # source-map-explorer over the built bundle (run build first)
```

Env vars are CRA-style (`REACT_APP_*`) — see [.env.example](.env.example). Copy to `.env.local`. The only one currently consumed by code is `REACT_APP_API_URL` in [src/config/api.config.js](src/config/api.config.js).

## Architecture

### Routing is state, not URLs

There is **no react-router**. [src/App.js](src/App.js) holds `currentPage` in `useState` and renders the matching component from `PAGE_REGISTRY` (a `ROUTES → PageComponent` map). Every navigable component receives `setCurrentPage` as a prop and calls it on click; `<a href="#route">` is used purely for accessibility / right-click — handlers always `preventDefault()`. Adding a new page means: add a `ROUTES` entry in [src/constants/navigation.js](src/constants/navigation.js), add a `PRIMARY_NAV` row, create the page component under [src/pages/](src/pages/), and add one line to `PAGE_REGISTRY`.

The `<main className="page-shell" key={currentPage}>` trick remounts the page subtree on every route change — that's what drives the fade-up enter animation.

### Layered structure

```
src/
├── App.js                  # router + global chrome only
├── pages/*.jsx             # thin compositions of section components
├── components/
│   ├── layout/             # Header, Footer, PageHero, ScrollProgress
│   ├── home/               # Hero, Story, ServicesPreview, MenuPreview, etc.
│   ├── floating/           # WhatsAppFAB, FloatingCTA, BackToTop
│   └── ui/Reveal.jsx       # scroll-reveal wrapper (only shared UI primitive)
├── data/*.js               # plain JS arrays (menus, services, gallery, reviews, …)
├── constants/              # contact, navigation, whatsapp, index
├── hooks/                  # useScrolled, useScrollReveal, useScrollProgress, useCountUp, useShowAfterScroll
├── config/api.config.js    # placeholder for future backend
├── utils/                  # helpers, validation, propTypes
└── tokens.css              # design system (loaded globally)
```

Pages are deliberately thin — they import and stack section components from `components/home/` (or page-specific equivalents). Home shows *previews* (typically `data.slice(0, 3)`); dedicated pages render the full data. Don't duplicate content across both — the preview/full-page split is the design rule (see [STRUCTURE.md](STRUCTURE.md)).

### Single source of truth conventions

- **Contact info**: [src/constants/contact.js](src/constants/contact.js) — `CONTACT.brand`, `CONTACT.primaryPhone`, `CONTACT.email`, etc. Header, Footer, ContactPage, and FABs all read from here. Never hardcode phone/email/address elsewhere.
- **WhatsApp**: [src/constants/whatsapp.js](src/constants/whatsapp.js) derives the E.164 number from `CONTACT` and exports `buildWhatsAppLink(message)`.
- **Routes / nav order**: [src/constants/navigation.js](src/constants/navigation.js) (`ROUTES`, `PRIMARY_NAV`, `FOOTER_EXPLORE`).
- Note: [src/constants/index.js](src/constants/index.js) is a legacy duplicate of some of this info — prefer the per-topic files above; treat `index.js` as deprecated.

### Design system — tokens.css

[src/tokens.css](src/tokens.css) is the design system. Use the CSS variables, don't hardcode values:

- Colors: `--color-primary` (deep forest #143a26), `--color-accent` (saffron #c9882f), warm-ivory neutrals. Legacy aliases (`--primary`, `--accent`, `--bg-primary`, …) are kept for older CSS — prefer the `--color-*` names in new code.
- Type: `--font-display` (Fraunces serif) / `--font-body` (Inter) / `--font-script` (Kaushan). Fluid `clamp()` scale `--fs-display-xl` → `--fs-caption`.
- Spacing: 8pt grid, `--space-1` (0.25rem) … `--space-10` (8rem).
- Motion: hand-tuned curves (`--ease-out-expo` for arrivals, `--ease-spring-soft` for FAB bounce, etc.). The `--transition` shorthand animates only GPU-cheap props (transform/opacity/colors/shadow). **Never use `transition: all`** — there's a comment in tokens.css explicitly forbidding it because it animates layout props and jankifies the page.
- The file already handles `prefers-reduced-motion` by zeroing all duration vars — animations driven via `--duration-*` get this for free.

### Scroll-reveal pattern

Section entrance animations use `<Reveal>` from [src/components/ui/Reveal.jsx](src/components/ui/Reveal.jsx), backed by [src/hooks/useScrollReveal.js](src/hooks/useScrollReveal.js) (IntersectionObserver, honors `prefers-reduced-motion`, default `once: true`). Polymorphic via `as` prop. Use this rather than rolling per-component IO logic.

### Mobile / safe areas

The header locks `body.style.overflow` while the mobile menu is open ([Header.jsx:11-14](src/components/layout/Header.jsx#L11-L14)). `tokens.css` exposes `--safe-top/right/bottom/left` (env safe-area-inset) and a `--touch-target: 44px` floor for iOS/Android — respect both for any fixed/floating UI.

## Conventions

- Page/section components are `.jsx`; hooks, utils, data, constants are `.js`.
- ESLint extends `react-app` + `react-app/jest` with stricter rules: `eqeqeq: ["error", "always"]`, `no-var: error`, `react/jsx-no-target-blank: error`, `react/prop-types: warn`, `no-console: warn` (allows `warn`/`error`). See [.eslintrc.json](.eslintrc.json).
- Prettier: single quotes, 100-col, 2-space, `trailingComma: es5` ([.prettierrc.json](.prettierrc.json)).
- Data files in `src/data/` export plain arrays — both home previews (`.slice(...)`) and dedicated pages consume the same array; mutate carefully.
- The git status currently shows the legacy flat layout (`src/Pages.js`, `src/components/Header.js`, etc.) being deleted in favor of the `pages/` + `components/{layout,home,floating,ui}/` structure described above. New code should follow the new layout.
