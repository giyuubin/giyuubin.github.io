# Images

`profile.jpg` — the hero portrait, referenced by `avatar` in
`assets/data/profile.json`.

It is displayed at 160px (128px on mobile) and cropped to a circle by
`border-radius: 50%`, so the subject should sit inside the inscribed circle;
the corners are never visible. Keep it square and around **480×480** — that is
3× the display size, which covers high-DPI screens without shipping a photo
far larger than anything the page can show.

To replace it, drop in a new square image and re-optimise:

```sh
npx sharp-cli -i original.png -o profile.jpg \
  resize 480 480 --fit cover -- flatten --background '#ffffff' -- \
  jpeg --quality 86 --mozjpeg
```

The current file went 1080×1080 PNG (573 KB) → 480×480 JPEG (25 KB) this way.

If this file is missing the hero falls back to a circle showing the `initials`
from `assets/data/profile.json`, so a broken image never appears.
