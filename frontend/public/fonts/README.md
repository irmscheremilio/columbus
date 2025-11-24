# Columbus Fonts

## Craw Modern Font Setup

The Columbus brand uses the **Craw Modern** font for highlighting important words and headings.

### Installation Steps:

1. Download the Craw Modern font from: https://www.1001fonts.com/craw-modern-font.html
2. Extract the `OPTICrawModern.otf` file
3. Place it in this directory (`/public/fonts/`)

### Usage in Components:

```vue
<!-- For highlighting important brand words -->
<h1 class="text-4xl">
  Get <span class="brand-text">Discovered</span> by AI
</h1>

<!-- Or apply to entire heading -->
<h2 class="font-display text-brand text-3xl">
  Columbus AEO Platform
</h2>
```

### Brand Guidelines:

- **Primary Color**: `#F29901` (Brand Orange)
- **Background Color**: `#F5F5F5` (Consistent across page and cards)
- **Highlight Color**: `#FFFFFF` (White for emphasis)
- **Border Color**: `#E5E5E5` (Thin gray borders, no shadows)
- **Display Font**: Craw Modern (for important words only)
- **Body Font**: Inter (default sans-serif)

### Tailwind Classes:

- `brand-text` - Applies International font + brand color
- `text-brand` - Brand orange color
- `bg-background` - #F5F5F5 background
- `bg-background-highlight` - White background
- `card` - Standard card (no shadow, border)
- `card-highlight` - White card for emphasis
