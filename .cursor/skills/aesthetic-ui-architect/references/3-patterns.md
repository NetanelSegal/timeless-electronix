# 3. Patterns & Architectural Logic

Patterns define the "Composition" of the design system.

## Key Architectural Patterns

*   **Hero Reveal Sequence**: The specific order in which elements animate onto the screen (e.g., Title -> Subtitle -> Primary CTA -> Visual Asset).
*   **Atmospheric Layouts**: How to handle empty space as an intentional design choice ("White space" is actually "Atmospheric space").
*   **Interactive Feedback Loops**: Every interaction should feel tactile and weighted, using the custom easing defined in foundations.
*   **A11y (The Architect Standard)**: High-contrast by default. ARIA labels are part of the "Technical Quality" of the system.

## Assembly Logic

Assemble components into these high-end patterns:

1.  **The "Hero Block"**: Large typography + mesh background + primary action.
2.  **The "Data Grid"**: Minimalist tables with monospace typography and staggered row entries.
3.  **The "Modal Portal"**: Centered, blurred glass surface with dramatic background dimming.

## Pattern Output Example (The Hero Block)

```html
<section class="arch-hero">
  <div class="arch-hero-content">
    <h1 class="arch-reveal-1">Infinite Systems</h1>
    <p class="arch-reveal-2">A bespoke architectural foundation.</p>
    <div class="arch-reveal-3">
       <button class="arch-btn-primary">Explore</button>
    </div>
  </div>
</section>
```

```css
.arch-hero {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* Sequence Reveal Logic */
.arch-reveal-1 { animation: reveal 1s var(--ease-expo) 0.1s forwards; opacity: 0; }
.arch-reveal-2 { animation: reveal 1s var(--ease-expo) 0.3s forwards; opacity: 0; }
.arch-reveal-3 { animation: reveal 1s var(--ease-expo) 0.5s forwards; opacity: 0; }

@keyframes reveal {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```