# REPLAN production logo files

## Canonical files

| File | Size | Intended use |
| --- | ---: | --- |
| `png/replan-wordmark.png` | 1500×350 | Headers, landing pages, documents, wide placements |
| `png/replan-mark.png` | 1254×1254 | High-resolution compact mark and export master |
| `png/replan-mark-512.png` | 512×512 | App icon, PWA icon, social profile |
| `png/replan-mark-256.png` | 256×256 | Product navigation and medium UI placements |
| `png/replan-mark-64.png` | 64×64 | Sidebar, compact UI, high-density favicon source |
| `png/replan-mark-32.png` | 32×32 | Small favicon and browser UI |

All PNGs are RGBA files with transparent backgrounds.

## Web paths

Runtime copies are stored in `apps/web/public/brand/` and are available from Next.js as:

```text
/brand/replan-wordmark.png
/brand/replan-mark.png
/brand/replan-mark-512.png
/brand/replan-mark-256.png
/brand/replan-mark-64.png
/brand/replan-mark-32.png
```

Example:

```tsx
import Image from "next/image";

<Image
  src="/brand/replan-wordmark.png"
  alt="REPLAN"
  width={300}
  height={70}
  priority
/>
```

## Usage rules

- Use the wordmark when horizontal space is available.
- Use the compact mark for app icons, favicons, sidebars, and square avatars.
- Keep clear space around the logo equal to at least half the height of the `R` stem.
- Do not add a colon, recolor the cobalt accent, stretch the asset, or place effects behind it.
- On dark backgrounds, verify contrast before release; the approved navy artwork is primarily intended for light surfaces.

## Source preservation

- `source/replan-wordmark-concept.png` preserves the selected concept sheet.
- `source/replan-mark-master.png` preserves the generated compact-mark master.
- Product code should reference `png/` or `/public/brand/`, not `source/`.
