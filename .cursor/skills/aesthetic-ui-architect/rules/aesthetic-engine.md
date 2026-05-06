# The Aesthetic Engine

Apply these technical rules from the Claude Aesthetics Cookbook to every proposal. These rules are non-negotiable for the "Aesthetic Architect."

## 1. TYPOGRAPHY (NO INTER/ROBOTO)
- **STRICT FORBIDDEN**: Never use Inter, Roboto, Arial, or "safe" system fonts as primary brand fonts. If you use these, the aesthetic fails.
- **PROPOSAL**: Propose 3-5 distinct pairings using high-quality Google Fonts or modern foundry typefaces.
- **CONTRAST**: Use extreme weight contrasts (e.g., 100 weight for light sub-headers vs. 900 weight for headers).
- **EXAMPLE PAIRINGS**:
  - *Clash Display* (Headers) + *JetBrains Mono* (Body)
  - *Syne* (Headers) + *Space Grotesk* (Body)
  - *Cormorant Garamond* (Headers) + *Montserrat* (Body - 200 weight)

## 2. COLOR & THEME
- **COHESIVE PALETTE**: Commit to a cohesive palette using CSS variables.
- **DOMINANCE**: Favor one or two dominant colors with sharp "Hero" accents. Avoid timid, evenly distributed schemes.
- **CSS VARIABLES**: Always implement using `--color-primary`, `--color-bg`, etc.

## 3. ATMOSPHERIC DEPTH
- **NO FLAT SOLIDS**: Replace simple flat backgrounds with layered CSS mesh gradients, noise textures, or geometric SVG patterns.
- **MESH GRADIENTS**: Use complex `radial-gradient` stacks to create organic depth.
- **NOISE**: Use a subtle SVG filter for grain/noise overlay.

## 4. HIGH-IMPACT MOTION
- **HERO REVEALS**: Prioritize orchestrated reveals (e.g., staggering `animation-delay` on grid items) over scattered micro-interactions.
- **EASING**: Use bespoke cubic-bezier curves (e.g., `cubic-bezier(0.16, 1, 0.3, 1)`) rather than `ease-in-out`.

## 5. ACCESSIBILITY & STANDARDS
- **WCAG AA**: All text/background pairs must pass WCAG 2.1 AA (4.5:1 ratio).
- **8px GRID**: Maintain a strict 8px spacing logic.
- **STATES**: Every component MUST define Default, Hover, Active, Focus, and Disabled states.
