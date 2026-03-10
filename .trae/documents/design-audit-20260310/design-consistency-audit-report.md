# Design Consistency Audit Report

Date: 2026-03-10  
Project: trae-football-results (web client)  
Scope: Full visual consistency audit across active routes and responsive breakpoints

## 1) Method and Coverage

- Routes audited: `/`, `/login`, `/register`, `/preferences`, `/match/:id`
- Breakpoints audited: desktop (1440x900), tablet (iPad Pro 11), mobile (iPhone 13)
- Interaction states audited: default, hover, focus, auth-gated navigation, loading/error presence
- Sources used:
  - Runtime visual evidence (screenshots)
  - Implemented style system and component code
  - Tailwind theme config and global CSS

## 2) Current Style Baseline (Inferred)

No formal design system document was found in the repository. The current baseline is inferred from implementation:

- Primary brand token: `primary` green scale in Tailwind config
- Base font: `Inter`
- App shell background: light neutral (`bg-gray-50`)
- UI built primarily with Tailwind utilities and Lucide icons
- Dark mode is configured technically (`darkMode: "class"`) but not consistently applied in components

## 3) Screenshots Evidence

- Dashboard desktop: [dashboard-desktop](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/dashboard-desktop-2026-03-10T22-29-25-575Z.png)
- Dashboard tablet: [dashboard-tablet](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/dashboard-tablet-2026-03-10T22-29-36-490Z.png)
- Dashboard mobile: [dashboard-mobile](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/dashboard-mobile-2026-03-10T22-29-45-265Z.png)
- Login desktop: [login-desktop](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/login-desktop-2026-03-10T22-30-05-605Z.png)
- Login focus state: [login-focus-email](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/login-focus-email-2026-03-10T22-31-31-720Z.png)
- Login hover state: [login-hover-submit](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/login-hover-submit-2026-03-10T22-31-43-104Z.png)
- Register desktop: [register-desktop](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/register-desktop-2026-03-10T22-30-15-444Z.png)
- Preferences route (auth-gated result): [preferences-route-desktop](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/preferences-route-desktop-2026-03-10T22-30-27-949Z.png)
- Match detail route sample: [match-detail-desktop](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/match-detail-desktop-2026-03-10T22-31-10-791Z.png)

## 4) Detailed Inconsistencies

| ID | Severity | Category | Inconsistency | Evidence | Recommendation |
|---|---|---|---|---|---|
| D-01 | High | Colors | Brand color system is fragmented: primary green exists, but black/blue/purple are used as competing accents in equivalent UI roles. | [tailwind.config.js:L15-L28](file:///Users/leonardo/projects/trae-football-results/tailwind.config.js#L15-L28), [Dashboard.tsx:L304-L307](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Dashboard.tsx#L304-L307), [UpcomingMatches.tsx:L102-L109](file:///Users/leonardo/projects/trae-football-results/client/src/components/UpcomingMatches.tsx#L102-L109), [match-detail-desktop](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/match-detail-desktop-2026-03-10T22-31-10-791Z.png) | Define semantic color tokens (`surface`, `text`, `accent`, `success`, `danger`) and map each component state to tokens. Remove ad-hoc accent mixes in equivalent patterns. |
| D-02 | High | Interaction / Theming | Dark mode infrastructure exists but most components are hard-coded for light theme only. | [tailwind.config.js:L4](file:///Users/leonardo/projects/trae-football-results/tailwind.config.js#L4), [Layout.tsx:L11](file:///Users/leonardo/projects/trae-football-results/client/src/components/Layout.tsx#L11), [dashboard-desktop](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/dashboard-desktop-2026-03-10T22-29-25-575Z.png) | Introduce dark variants for global surfaces/text first, then component-by-component parity using shared semantic tokens. |
| D-03 | Medium | Typography | Type scale is inconsistent in adjacent modules (`text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[15px]`, `text-7xl`), reducing hierarchy predictability. | [MatchCard.tsx:L125-L130](file:///Users/leonardo/projects/trae-football-results/client/src/components/MatchCard.tsx#L125-L130), [UpcomingMatches.tsx:L112-L145](file:///Users/leonardo/projects/trae-football-results/client/src/components/UpcomingMatches.tsx#L112-L145), [MatchDetail.tsx:L155-L159](file:///Users/leonardo/projects/trae-football-results/client/src/pages/MatchDetail.tsx#L155-L159) | Standardize to a tiered scale (caption/body/subtitle/title/display) and avoid arbitrary pixel classes except rare badges. |
| D-04 | Medium | Spacing / Alignment | Sticky offset and header height are misaligned (`h-14` header vs `top-[70px]` sticky selector), creating inconsistent vertical rhythm. | [Header.tsx:L15](file:///Users/leonardo/projects/trae-football-results/client/src/components/Header.tsx#L15), [Dashboard.tsx:L279](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Dashboard.tsx#L279), [dashboard-desktop](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/dashboard-desktop-2026-03-10T22-29-25-575Z.png) | Replace magic numbers with a shared layout constant and align sticky top to actual header stack height. |
| D-05 | Medium | Borders / Radius | Similar components use multiple corner systems (`rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`) without role-based rules. | [Dashboard.tsx:L272-L273](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Dashboard.tsx#L272-L273), [Login.tsx:L82-L83](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Login.tsx#L82-L83), [Preferences.tsx:L116-L117](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Preferences.tsx#L116-L117), [login-desktop](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/login-desktop-2026-03-10T22-30-05-605Z.png) | Define radius tokens by component role (button/input/card/chip/avatar) and enforce via reusable primitives. |
| D-06 | Medium | Shadows | Shadow intensity varies widely for equivalent elevation levels (`shadow-sm`, `shadow-lg`, `shadow-xl`, custom shadows). | [CookieConsent.tsx:L32](file:///Users/leonardo/projects/trae-football-results/client/src/components/CookieConsent.tsx#L32), [Preferences.tsx:L116](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Preferences.tsx#L116), [MatchDetail.tsx:L147-L170](file:///Users/leonardo/projects/trae-football-results/client/src/pages/MatchDetail.tsx#L147-L170) | Define elevation levels (e1/e2/e3) and map all cards, modals, and banners to those levels only. |
| D-07 | High | Interaction Patterns | Clickable containers implemented as `div` lack semantic button/link behavior and consistent focus visibility. | [Dashboard.tsx:L299-L303](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Dashboard.tsx#L299-L303), [UpcomingMatches.tsx:L99-L103](file:///Users/leonardo/projects/trae-football-results/client/src/components/UpcomingMatches.tsx#L99-L103), [MatchCard.tsx:L72-L75](file:///Users/leonardo/projects/trae-football-results/client/src/components/MatchCard.tsx#L72-L75) | Refactor interactive containers to `button`/`a` with keyboard and visible focus states; centralize interaction styles in reusable classes. |
| D-08 | Medium | Focus / Hover Consistency | Focus treatment is present in auth forms but inconsistent in dashboard controls and card interactions. | [Login.tsx:L56-L57](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Login.tsx#L56-L57), [Dashboard.tsx:L285-L350](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Dashboard.tsx#L285-L350), [login-focus-email](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/login-focus-email-2026-03-10T22-31-31-720Z.png), [login-hover-submit](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/login-hover-submit-2026-03-10T22-31-43-104Z.png) | Create a unified focus ring style and apply to all actionable controls, including pseudo-buttons and segmented selectors. |
| D-09 | Medium | Iconography | Icon language is mixed (Lucide, custom badge glyphs, and emoji icons for events/states), causing style drift. | [Header.tsx:L4](file:///Users/leonardo/projects/trae-football-results/client/src/components/Header.tsx#L4), [MatchDetail.tsx:L215-L216](file:///Users/leonardo/projects/trae-football-results/client/src/pages/MatchDetail.tsx#L215-L216), [MatchDetail.tsx:L247-L250](file:///Users/leonardo/projects/trae-football-results/client/src/pages/MatchDetail.tsx#L247-L250) | Use one icon system for all functional icons; reserve emojis only for optional decorative contexts. |
| D-10 | Medium | Copy / Localization | Hardcoded Spanish UI strings appear in core dashboard and card components despite i18n architecture. | [Dashboard.tsx:L391-L397](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Dashboard.tsx#L391-L397), [MatchCard.tsx:L192](file:///Users/leonardo/projects/trae-football-results/client/src/components/MatchCard.tsx#L192) | Move all visible strings to translation dictionaries and enforce no hardcoded literals in components. |
| D-11 | Low | Empty/Error Patterns | Error and empty states use multiple visual recipes (left border alert, full card warning, minimal empty text) without consistency. | [Login.tsx:L42-L44](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Login.tsx#L42-L44), [Dashboard.tsx:L428-L436](file:///Users/leonardo/projects/trae-football-results/client/src/pages/Dashboard.tsx#L428-L436), [MatchDetail.tsx:L75-L83](file:///Users/leonardo/projects/trae-football-results/client/src/pages/MatchDetail.tsx#L75-L83) | Define standardized state components: `InlineError`, `SectionEmpty`, `PageError` with stable spacing, colors, and icon usage. |
| D-12 | Low | Cross-device Layout | Upcoming cards rely on fixed min-width and horizontal scrolling; behavior is valid but visually inconsistent with vertical rhythm of the dashboard on smaller screens. | [UpcomingMatches.tsx:L70-L73](file:///Users/leonardo/projects/trae-football-results/client/src/components/UpcomingMatches.tsx#L70-L73), [dashboard-mobile](file:///Users/leonardo/projects/trae-football-results/.trae/documents/design-audit-20260310/screenshots/dashboard-mobile-2026-03-10T22-29-45-265Z.png) | Align mobile rhythm with section spacing tokens and add visible section affordance indicating horizontal scroll interaction. |

## 5) Priority Fix Plan

1. P0: Interaction semantics + focus consistency (D-07, D-08)  
2. P0: Color token normalization and brand hierarchy (D-01)  
3. P1: Typography and spacing harmonization (D-03, D-04)  
4. P1: Radius and elevation scale normalization (D-05, D-06)  
5. P1: Iconography and localization consistency (D-09, D-10)  
6. P2: State component standardization and mobile rhythm refinements (D-11, D-12)

## 6) System-Level Recommendations

- Create a lightweight design spec in-repo: token tables, component primitives, interaction states
- Introduce reusable UI primitives (`Button`, `Card`, `Badge`, `Input`, `Alert`) to eliminate ad-hoc utility drift
- Add visual QA checklist to PR template (colors, spacing, type, states, responsive)
- Add screenshot-based regression checks for key routes at desktop/tablet/mobile

## 7) Audit Limitations

- Match-detail and preferences route content can vary depending on API/auth state; inconsistencies reported are based on rendered structure and implementation patterns, not specific live match content.
- Browser console contained 500 responses during route checks; this may affect content completeness but not the visual consistency issues identified above.
