# giyuubin.github.io

Source for my personal site: **[giyuubin.github.io](https://giyuubin.github.io)**

Academic-style personal page, modelled on the
[ISNP Lab site](https://isnpl.github.io/).

## Stack

Plain HTML/CSS/JS. No build step, no framework, no runtime dependencies —
Google Fonts is the only external request. Hosted on GitHub Pages, so pushing
to `main` deploys.

## Structure

```
index.html              home — all sections, anchored
news/ publications/ projects/    full listings
404.html  sitemap.xml  robots.txt
assets/
  css/style.css         all styles, incl. light/dark/auto theme
  js/theme.js           theme toggle (auto -> light -> dark)
  js/nav.js             mobile menu + scroll-spy
  js/render.js          JSON -> DOM
  data/*.json           all content  (see assets/data/README.md)
  img/profile.jpg       profile photo (optional)
```

## Editing content

**Never edit the HTML to change content.** Everything lives in
`assets/data/*.json`; the HTML files are empty shells. See
[assets/data/README.md](assets/data/README.md) for the field reference.

Sections disappear automatically when their JSON is empty — the section *and*
its nav link. `publications.json` is currently `[]`, so the site shows no
Publications section at all; adding one entry brings it back with no HTML
change.

Field names mirror [HugoBlox](https://hugoblox.com) (formerly Wowchemy / Hugo
Academic) front matter, so migrating to Hugo later is a conversion script
rather than a rewrite.

## Local preview

`fetch()` is blocked on `file://`, so opening `index.html` directly shows an
empty page. Serve it instead:

```sh
python -m http.server 8000
# then open http://localhost:8000
```
