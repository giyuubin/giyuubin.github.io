# giyuubin.github.io

Source for my personal site: **[giyuubin.github.io](https://giyuubin.github.io)**

## Stack

Plain HTML/CSS/JS, no build step. Hosted on GitHub Pages.

## Structure

- `index.html` — page markup
- `assets/css/style.css` — styles, incl. dark/light/auto theme via `data-theme`

The Research and Contact sections are fetched at runtime from the README of
[giyuubin/giyuubin](https://github.com/giyuubin/giyuubin) (my GitHub profile repo), so that
content is authored in one place. If the fetch fails or JS is disabled, a short static
fallback is shown instead.
