# Cobbee Assets Organization

This document outlines the asset structure for the Cobbee project, including locations for logos, favicons, and fonts.

## Directory Structure

```
code (1)/
├── app/
│   ├── favicon.ico          # Main favicon (16x16, 32x32) - TO BE ADDED
│   ├── icon.png             # App icon for PWA/mobile (512x512) - TO BE ADDED
│   └── apple-icon.png       # Apple touch icon (180x180) - TO BE ADDED
│
├── public/
│   ├── logo/
│   │   ├── cobbee-logo.svg       # Primary logo (scalable vector) - TO BE ADDED
│   │   ├── cobbee-logo.png       # Primary logo (raster, 1024x1024) - TO BE ADDED
│   │   ├── cobbee-logo-white.svg # White version for dark backgrounds - TO BE ADDED
│   │   ├── cobbee-icon.svg       # Icon only (coffee cup) - TO BE ADDED
│   │   └── cobbee-icon.png       # Icon only (512x512) - TO BE ADDED
│   │
│   ├── avatars/              # User avatars (EXISTING)
│   └── covers/               # Cover images (EXISTING)
│
└── styles/
    └── fonts/                # Custom fonts directory - TO BE ADDED IF NEEDED
```

## Asset Specifications

### Logos

**Primary Logo** (`public/logo/cobbee-logo.svg`)
- Format: SVG (vector)
- Contains: Coffee cup icon + "Cobbee" wordmark
- Colors: #0000FF (blue), #CCFF00 (lime), Black
- Usage: Headers, landing page, marketing materials

**Logo Variants Needed**:
1. Full logo with wordmark (horizontal)
2. Icon only (coffee cup)
3. White/light version for dark backgrounds
4. Monochrome version (black)

### Favicons

Following Next.js 13+ App Router conventions:

**`app/favicon.ico`**
- Format: ICO
- Sizes: 16x16, 32x32
- Contains: Cobbee coffee cup icon
- Usage: Browser tabs, bookmarks

**`app/icon.png`**
- Format: PNG
- Size: 512x512
- Usage: PWA app icon, Android

**`app/apple-icon.png`**
- Format: PNG
- Size: 180x180
- Usage: iOS home screen, Safari

### Fonts

Currently using Google Fonts via Next.js:
- **Geist**: Primary UI font (sans-serif)
- **Geist Mono**: Monospace font for code/wallet addresses

**Custom Fonts** (if needed):
- Location: `styles/fonts/`
- Format: WOFF2, WOFF, TTF
- Declaration: In `app/layout.tsx` or global CSS

## Brand Colors

```css
/* Neo-brutalist color palette */
--primary-blue: #0000FF;
--primary-lime: #CCFF00;
--accent-orange: #FF6B35;
--primary-black: #000000;
--primary-white: #FFFFFF;

/* Borders and shadows */
border: 4px solid black;
shadow: 8px 8px 0px 0px rgba(0,0,0,1);
```

## Design System Elements

### Coffee Cup Icon
The primary icon is a coffee cup that appears throughout the application:
- Used from `lucide-react` package: `<Coffee />` component
- Color variations: white, black, lime (#CCFF00)
- Contexts: Logo, navigation, stats, buttons

### Typography
- **Headings**: font-black (900 weight)
- **Body**: font-bold (700 weight)
- **Labels**: font-bold (700 weight)

## Current Logo Usage

The logo is currently implemented using:
```tsx
<div className="bg-[#0000FF] rounded-full p-2 border-4 border-black">
  <Coffee className="w-6 h-6 text-white" />
</div>
<span className="text-xl font-black">Cobbee</span>
```

This pattern appears in:
- [components/landing-header.tsx](components/landing-header.tsx)
- [app/login/page.tsx](app/login/page.tsx)
- [app/signup/page.tsx](app/signup/page.tsx)
- [app/dashboard/page.tsx](app/dashboard/page.tsx)
- [app/discover/page.tsx](app/discover/page.tsx)

## Next Steps

To complete the asset setup:

1. **Create Logo Files**:
   - Design SVG logo with coffee cup + "Cobbee" wordmark
   - Export variants (full, icon-only, white version)
   - Place in `public/logo/` directory

2. **Create Favicons**:
   - Generate favicon.ico (16x16, 32x32)
   - Generate icon.png (512x512)
   - Generate apple-icon.png (180x180)
   - Place in `app/` directory

3. **Update References** (if using static files):
   - Replace `<Coffee />` component with `<Image />` in key locations
   - Update imports to use new logo files

4. **Add Font Files** (if custom fonts needed):
   - Create `styles/fonts/` directory
   - Add font files (.woff2, .woff)
   - Declare in CSS or layout

## Tools for Asset Creation

- **Logo Design**: Figma, Adobe Illustrator, Inkscape
- **Favicon Generation**: favicon.io, realfavicongenerator.net
- **Image Optimization**: squoosh.app, tinypng.com
- **Font Conversion**: transfonter.org, fontsquirrel.com

## Notes

- Next.js 13+ automatically serves `app/favicon.ico` at `/favicon.ico`
- SVG logos are preferred for scalability
- All borders should be 4px solid black (neo-brutalist style)
- Maintain high contrast for accessibility
