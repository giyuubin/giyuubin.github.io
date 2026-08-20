# Content data

All site content lives here as JSON. The HTML files contain no content — edit
these files and the pages update. Field names deliberately mirror
[HugoBlox](https://hugoblox.com) (formerly Wowchemy / Hugo Academic) front
matter, so this content can be migrated to Hugo later with a single conversion
script if the publication list ever outgrows a static site.

## Conditional rendering

If any of these arrays is empty, the matching section **and its navigation
link disappear from the page entirely**. Adding one entry brings both back —
no HTML edits needed. `publications.json` ships empty for exactly this reason.

---

## `profile.json`

Object. `avatar` points at `/assets/img/profile.jpg`; if that file is missing,
the site falls back to a circle with `initials` in it. `bio` is an array of
paragraphs. `social[].icon` accepts `envelope` and `github` (inline SVG — add
new icons to the `ICONS` map in `assets/js/render.js`).

## `news.json`

Array, one object per item.

| Field   | Notes                                                          |
|---------|----------------------------------------------------------------|
| `title` | Required. Limited inline HTML allowed: `<em>`, `<strong>`, `<code>`. |
| `date`  | `YYYY-MM-DD`. May be `""` — the item renders without a date.   |
| `url`   | Optional. Makes the item a link.                               |

**HTML entities do not work.** `richText()` in `render.js` escapes `&` before it
re-enables the three tags above, so `&mdash;` reaches the page as the literal
text `&mdash;`. Type the character itself — `—`, `·`, `→`. The same applies to
every other rich-text field on this page.

Sorted newest first. Undated items sink to the bottom rather than floating to
the top, so an entry with no date never claims to be the latest news.

## `publications.json`

Array, currently empty. One object per publication:

```json
{
  "title": "Lattice-based Authentication for ...",
  "authors": ["Kyubin Park", "Kisung Park"],
  "date": "2026-03-14",
  "publication": "IEEE Transactions on Information Forensics and Security",
  "publication_short": "IEEE TIFS",
  "publication_types": ["article-journal"],
  "abstract": "",
  "doi": "10.1109/TIFS.2026.xxxxxx",
  "url_pdf": "",
  "url_code": "",
  "featured": true
}
```

`publication_types` uses CSL type names: `article-journal`, `paper-conference`,
`manuscript` (preprint), `report`, `thesis`, `book`, `chapter`. The first entry
decides which group heading the publication falls under.

`"Kyubin Park"` in `authors` is bolded automatically. `featured: true` promotes
the item to the home page; everything appears on `/publications/` regardless.

## `projects.json`

| Field       | Notes                                              |
|-------------|-----------------------------------------------------|
| `title`     | Required.                                           |
| `summary`   | One or two sentences.                               |
| `note`      | Small muted line — context, e.g. coursework.        |
| `tags`      | Array of strings, rendered as pills.                |
| `url_code`  | Repository link.                                    |
| `url_project` | Optional live/demo link.                          |
| `featured`  | `true` shows it on the home page.                   |
