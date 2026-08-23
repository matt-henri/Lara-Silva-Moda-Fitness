---
name: Essence Aura
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5d5f5b'
  on-secondary: '#ffffff'
  secondary-container: '#e0e0db'
  on-secondary-container: '#62635f'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1c16'
  on-tertiary-container: '#84847c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e3e3de'
  secondary-fixed-dim: '#c6c7c2'
  on-secondary-fixed: '#1a1c19'
  on-secondary-fixed-variant: '#454744'
  tertiary-fixed: '#e3e3d9'
  tertiary-fixed-dim: '#c7c7bd'
  on-tertiary-fixed: '#1b1c16'
  on-tertiary-fixed-variant: '#464740'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: 0.05em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.15em
  price-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

The design system is anchored in **Minimalism** with a **Corporate/Modern** finish, tailored for a high-end female fitness audience. The brand personality is serene, disciplined, and aspirational. It aims to evoke a sense of "quiet luxury"—where the quality of the garment is mirrored by the clarity and spaciousness of the digital environment.

The visual narrative relies heavily on generous whitespace (editorial breathing room) and a "less is more" philosophy. By removing unnecessary UI clutter, the product photography becomes the primary storyteller. The tone is professional yet inviting, positioning the brand as a premium lifestyle choice rather than just a sportswear retailer.

## Colors

This design system utilizes a sophisticated, desaturated palette to maintain a high-fashion editorial feel. 

- **Primary (#1A1A1A):** A "Soft Black" used for typography, primary buttons, and structural lines. It provides high contrast without the harshness of pure black.
- **Secondary (#F5F5F0):** "Alabaster" serves as the primary background for sections and card containers, softening the overall UI.
- **Tertiary (#D1D1C7):** "Muted Pebble" used for borders, inactive states, and subtle dividers.
- **Neutral (#FFFFFF):** Pure white is reserved for high-impact whitespace and hero section backgrounds to maximize the "clean" aesthetic.

Color is used sparingly; functional alerts (success/error) should use muted, desaturated versions of green and red to avoid breaking the luxury tone.

## Typography

The typography strategy pairs two modern sans-serifs to achieve a balance of authority and elegance. **Hanken Grotesk** is used for headlines to provide a sharp, contemporary edge. **Manrope** handles body text and labels, offering superior legibility and a refined, technical feel.

Editorial headers (Display levels) should use tight letter-spacing for a modern look, while small labels and navigational elements should use increased letter-spacing in uppercase to evoke a boutique fashion aesthetic. Hierarchy is established through weight and whitespace rather than excessive color variation.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop, centered within a 1440px container. 

- **Grid:** A 12-column system is used for product listings, typically spanning 3 columns per item (4-up) or 4 columns (3-up) to allow for large-scale imagery.
- **Section Gaps:** To maintain the "luxury" feel, vertical spacing between major homepage sections is intentionally large (120px+). 
- **Mobile:** Transition to a 2-column grid for product lists and a single column for hero content. Margins are reduced to 20px, but vertical breathing room is preserved to prevent a "cramped" e-commerce feel.

## Elevation & Depth

This design system avoids heavy shadows, favoring a **Flat/Layered** approach. Depth is communicated through:

- **Tonal Tiers:** Using the Alabaster (#F5F5F0) background against White (#FFFFFF) cards to create a natural sense of stacking.
- **Low-Contrast Outlines:** Buttons and input fields use a 1px border in Muted Pebble (#D1D1C7) instead of shadows.
- **Image Overlays:** For hero banners, use a subtle 10-20% black gradient overlay to ensure white text remains legible over photography.
- **Focus States:** High-contrast 2px Primary Black borders are used to indicate active selection or focus, maintaining a crisp, architectural feel.

## Shapes

The shape language is **Sharp (0)**. 

To reinforce the premium and architectural nature of the brand, all buttons, input fields, and product cards utilize 90-degree angles. This rejection of rounded corners differentiates the brand from more "casual" or "friendly" fitness competitors, leaning instead into a high-end, editorial aesthetic. 

The only exception is for circular functional elements like color-swatch pickers or icon-only buttons (e.g., "Add to Wishlist" heart).

## Components

### Buttons
- **Primary:** Solid Black (#1A1A1A) background, White text, uppercase, no border radius.
- **Secondary:** Transparent background, 1px Black border, Black text.
- **Hover States:** Secondary buttons fill with Black; Primary buttons reduce opacity to 90%.

### Input Fields
- Underlined style or full-border sharp rectangles.
- Labels are positioned above the field in `label-caps`.
- Placeholder text uses Muted Pebble (#D1D1C7).

### Product Cards
- No borders or shadows.
- Image aspect ratio should be a consistent 4:5 (portrait).
- Product titles in `body-md` (bold), prices in `price-lg`.
- Quick-add functionality appears on hover as a bottom-aligned bar.

### Chips & Badges
- Used for "New Arrival" or "Sold Out."
- Small, rectangular tags with Primary Black background and white text, placed in the top-left corner of product images.

### Navigation
- Top-aligned, centered logo.
- Minimalist icons (thin stroke, 1.5px) for Search, Profile, and Cart.
- Hover links should trigger a simple 1px underline animation.