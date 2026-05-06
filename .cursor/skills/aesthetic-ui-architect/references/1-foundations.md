# 1. Architectural Foundations

Foundations are the DNA of the brand. For the Aesthetic Architect, these must be expressive and sophisticated, not just functional.

## Key Areas to Define

*   **Aesthetic Principles**: (e.g., "Atmospheric Noir," "Cyber-Brutalist," "Minimalist Ethereal").
*   **Typography (The Anti-Generic Rule)**:
    *   **Prohibited**: Inter, Roboto, Helvetica, Arial, system-ui.
    *   **Requirements**: High-contrast pairings. Extreme weights (100 vs 900). 
    *   **Scale**: Use a non-standard, dramatic typographic scale (e.g., Golden Ratio or Augmented Fourth).
*   **Atmospheric Colors**:
    *   **Primary/Accent**: Single, high-vibrancy "Hero" colors.
    *   **Backgrounds**: Never flat hex codes. Use mesh gradients or subtle grain overlays.
    *   **Semantic**: Success/Error colors must be integrated into the brand palette, not just standard green/red.
*   **Structural Grid & Spacing**:
    *   **The 8px Logic**: Strict adherence, but allow for "intentional asymmetry."
    *   **Layout**: Define container behavior for high-end wide-screen experiences.
*   **Atmospheric Depth (z-axis)**:
    *   **Shadows**: Layered, soft shadows (umbra/penumbra/antumbra) or "Neon Glow" styles.
    *   **Glassmorphism**: Use `backdrop-filter: blur()` for sophisticated layering.
*   **Motion & Easing**:
    *   **Bespoke Easing**: Custom cubic-bezier curves (e.g., `cubic-bezier(0.16, 1, 0.3, 1)`).
    *   **Reveal Patterns**: Orchestrated stagger delays for all page entries.

## Architectural CSS Template

When generating foundations, use this structure:

```css
:root {
  /* Foundations - Anti-Generic Scales */
  --font-heading: 'Clash Display', sans-serif;
  --font-body: 'JetBrains Mono', monospace;
  
  /* Atmospheric Colors */
  --color-bg: #0a0a0a;
  --color-hero: #ff3e00;
  --color-text: #f5f5f5;
  --color-muted: #666666;
  
  /* Depth & Surface */
  --surface-1: rgba(255, 255, 255, 0.03);
  --shadow-premium: 0 20px 40px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.3);
  
  /* Motion Constants */
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-slow: 600ms;
  --duration-base: 300ms;
  
  /* Spacing */
  --space-unit: 8px;
  --space-xl: calc(var(--space-unit) * 10); /* 80px */
}

/* Base High-End Styles */
body {
  background: var(--color-bg);
  background-image: 
    radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
    radial-gradient(at 50% 0%, hsla(225,39%,30%,0.1) 0, transparent 50%);
  color: var(--color-text);
  line-height: 1.6;
}
```