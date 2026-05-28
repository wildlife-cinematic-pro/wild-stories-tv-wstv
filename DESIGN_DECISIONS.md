# Wild Stories TV - Design Decisions

## Strategy

The rebuilt site positions Wild Stories TV as a premium Facebook-first wildlife entertainment brand. The page now leads visitors toward two actions: follow the Facebook Page and join the Wild Crew Messenger Channel.

## What Changed

- Rebuilt `index.html` as a single clean static page with internal CSS and a small scroll-header script.
- Kept the uploaded `assets/` folder as the only image source. No missing or external images were introduced.
- Removed remote Google Fonts for faster local preview and more reliable offline opening.
- Replaced CSS-only story imagery with real `<img>` elements where accessibility and path validation matter.
- Tightened all language around "cinematic wildlife-inspired storytelling," "wildlife entertainment," and "nature appreciation."
- Removed unsupported authenticity language. The site does not claim real footage, live footage, caught-on-camera proof, news coverage, or documentary archive status.
- Built a stronger mobile-first header with visible brand text, Wild Crew subtitle, and a compact Facebook follow CTA.
- Reworked the hero into a full-bleed cinematic first screen with high-contrast overlays and a clear follow CTA.
- Preserved the requested section flow: header, hero, about, featured stories, story pillars, Wild Crew, gallery, contact, and footer.
- Added a subtle footer/privacy note mentioning AI-assisted production tools only in the footer.

## Visual Direction

- Background: deep forest black with restrained warm and moss accents.
- CTA color: amber/gold to feel warm, cinematic, and action-oriented.
- Text: cream headlines and muted warm body copy for readability over a dark wildlife palette.
- Typography: system serif stack for cinematic headings and system sans-serif stack for fast, readable body text.
- Cards: 8px radius, stable aspect ratios, and strong image crops to keep the interface polished without feeling soft or generic.

## Conversion Decisions

- The hero prioritizes "Follow Wild Stories TV" as the primary CTA.
- Featured story cards link to the Facebook Page for now, so exact Reel URLs can be added later without changing the layout.
- Wild Crew gets its own section with the Messenger Channel as the primary action.
- Contact links are direct email, Facebook, and Messenger links. No backend-dependent form was added.

## Content Safety Decisions

- Copy avoids documentary, live, news, archive, or real-footage claims.
- The About section explicitly frames the brand as entertainment inspired by the natural world.
- The footer privacy note is transparent about production workflows without making AI the public-facing brand hook.

## Performance Decisions

- No React, no build step, no iframe embeds, no analytics scripts, and no external font downloads.
- Hero image is preloaded and marked high priority.
- Gallery and supporting images use `loading="lazy"` and `decoding="async"`.
- CSS is internal so the site works by opening `index.html` locally with `assets/` beside it.
