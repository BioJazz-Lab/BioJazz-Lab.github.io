# BioJazz Lab website

Source for **https://biojazz-lab.github.io**, the website of the BioJazz Lab
(Department of Biology, Baylor University).

It is a static site built with [Zola](https://www.getzola.org) 0.23 or later,
using a design adapted from the
[researchlab](https://codeberg.org/plaublin/researchlab) theme, and published
by GitHub Pages. Every push to `main` rebuilds and redeploys the site
automatically (about 1 minute).

---

## Where things live

| What you want to change | Where |
|---|---|
| Home page text, headline, tagline | `content/_index.md` |
| Research areas (one file per area) | `content/research/*.md` |
| Lab members (one file per person) | `content/members/*.md` |
| Publications | `content/publications/feng.bib` (BibTeX) |
| News items (one file per item) | `content/news/YYYY-MM-DD-title.md` |
| Join Us / Contact pages | `content/join.md`, `content/contact.md` |
| Menu, colours, e-mail, social links | `config.toml` |
| Images | `static/img/…` (people photos in `static/img/people/`) |
| Page layouts (rarely needed) | `templates/` |

Placeholder text that still needs your input is marked **TODO**, either in a
yellow box on the page or in a comment in the file. To list all of them, run
`grep -rn TODO content config.toml`.

## Common tasks

**Add a news item.** Create `content/news/2026-11-15-new-grant.md`:

```markdown
+++
title = "Lab receives NIH grant"
date = 2026-11-15
+++

Short description, with [links](https://example.org) if needed.
```

The three newest items appear on the home page automatically.

**Add a lab member.** Copy `docs/new-member-template.md` to
`content/members/<lastname>.md`, fill it in, and add a photo at
`static/img/people/<lastname>.jpg` (square crop, about 600 × 600 px). When a
position is filled, delete the matching `content/members/open-*.md` placeholder.
To link the new member's name in the publication list, add them to
`content/publications/members_mapping.json`, for example
`"smith": ["Jane Smith"]`.

**Add a publication.** Paste the BibTeX entry into
`content/publications/feng.bib` and add a `labels = {Topic A, Topic B}` line.
Then run `python3 scripts/bib2json.py` to update `bib.json`. GitHub Actions
also runs this before every build, so a commit that changes only the `.bib`
file still updates the site.

**Add a research area.** Copy one of the files in `content/research/`, then
change `title`, `description`, `weight` (its position in the order) and
`image`.

## Preview locally

```bash
brew install zola        # one time (macOS); needs Zola 0.23 or newer
zola serve               # then open http://127.0.0.1:1111
```

> **Zola version:** the templates use Tera 2 syntax, so you need
> **Zola 0.23 or newer**. Older versions (0.22 and earlier) can't build the site.
> The deploy workflow pins the version in `.github/workflows/deploy.yml`
> (`ZOLA_VERSION`). To upgrade Zola later, change that number, then run
> `zola check` locally to make sure everything still builds.

## Publish

```bash
git add -A
git commit -m "Describe your change"
git push
```

Watch progress in the repository's **Actions** tab.

### One-time GitHub setup

1. Create the GitHub organization **BioJazz-Lab** and, inside it, a public
   repository named **biojazz-lab.github.io**.
2. In this folder, run:
   ```bash
   git init -b main
   git add -A
   git commit -m "Initial lab website"
   git remote add origin https://github.com/BioJazz-Lab/biojazz-lab.github.io.git
   git push -u origin main
   ```
3. On GitHub, open the repository's **Settings → Pages → Build and deployment**
   and set **Source** to **GitHub Actions**.
4. After the first workflow run finishes, the site is live at
   https://biojazz-lab.github.io.

## How it's put together

- `templates/` holds every page layout, written in Tera 2 syntax for
  Zola 0.23+. Shared pieces (header, footer, scroll-to-top button) are in
  `templates/partials/`.
- `templates/components/list_publications.html` is a **component**, the
  Zola 0.23 replacement for shortcodes. It's called from Markdown like this:
  `{{<list_publications member="feng" />}}` or
  `{{<list_publications show_filters={true} />}}`.
- **Curly braces in Markdown:** content files are now processed as templates,
  so if a page ever needs to show literal `{{ }}` or `{% %}` text, wrap that
  text in `{% raw %} … {% endraw %}`.
- `scripts/bib2json.py` converts the BibTeX file into `bib.json` for the
  publication list. It needs only Python 3.
- `static/` holds the CSS (Tailwind, typography and `css/site.css`), JavaScript,
  icons and images.
- Styles use Baylor green (#154734) and gold (#FFB81C).
- The layout and publication list are adapted from the researchlab theme by
  Pierre-Louis Aublin, Dimitrios Giakatos and Jean-François Baffier, under the
  MIT licence; see `docs/researchlab-theme-LICENSE`. The theme is no longer
  loaded as a Zola theme, so the old `themes/researchlab/` folder is unused
  and can be deleted.
