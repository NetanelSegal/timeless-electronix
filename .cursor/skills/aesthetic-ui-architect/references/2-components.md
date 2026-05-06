# 2. Bespoke Components

Each component must feel crafted, with distinct "Architect" attention to detail.

## Requirements per Component

Every component MUST include:
1.  **Anatomy**: Breakdown of its structural elements and aesthetic "Hero" feature (e.g., "This button uses a double-layered border-radius for a unique shape").
2.  **Visual States (Mandatory)**: 
    *   **Default**: The core brand state.
    *   **Hover**: High-impact state (e.g., subtle glow or shift).
    *   **Active**: Feedback on click (e.g., slight compression).
    *   **Focus**: A bespoke, non-generic focus ring (e.g., animated underscore or color shift).
    *   **Disabled**: Muted but still architecturally consistent.

## Atomic Component List
- **Architectural Buttons**: Variable-width, heavy weight, bespoke easing.
- **Glassmorphic Inputs**: Using `backdrop-filter` and SVG icons.
- **Micro-Copy Badges**: Minimalist, monospace labels.
- **Dynamic Cards**: Hover-triggered reveal of secondary information.

## Architectural Output Example

```html
<button class="arch-btn arch-btn-primary">
  <span class="arch-btn-label">Launch System</span>
  <svg class="arch-btn-icon">...</svg>
</button>
```

```css
.arch-btn {
  background: var(--surface-1);
  border: 1px solid var(--color-hero);
  color: var(--color-hero);
  padding: var(--space-2) var(--space-5);
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all var(--duration-base) var(--ease-expo);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.arch-btn:hover {
  background: var(--color-hero);
  color: var(--color-bg);
  box-shadow: 0 0 30px var(--color-hero);
}

.arch-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--color-bg), 0 0 0 6px var(--color-hero);
}
```