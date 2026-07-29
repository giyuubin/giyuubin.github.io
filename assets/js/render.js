/* Content rendering.
 *
 * Every page is an empty shell; all content comes from /assets/data/*.json.
 * The important rule: if a collection is empty, its <section> AND its nav link
 * are removed from the document entirely. Adding one entry to the JSON brings
 * both back, in the right place, with no HTML edit. That is why
 * publications.json can ship as [].
 *
 * Note: fetch() does not work over file://. Preview with a local server,
 * e.g. `python -m http.server`. */
(function () {
  'use strict';

  var DATA = '/assets/data/';
  var ME = 'Kyubin Park';

  var ICONS = {
    envelope:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6.5 9 6.5 9-6.5"/></svg>',
    github:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.2c-3.34.73-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .5z"/></svg>'
  };

  var PUB_TYPE_LABEL = {
    'article-journal': 'Journal Articles',
    'paper-conference': 'Conference Papers',
    manuscript: 'Preprints',
    report: 'Technical Reports',
    thesis: 'Theses',
    book: 'Books',
    chapter: 'Book Chapters'
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------------------------------------------------------------- utils */

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Content is authored by the site owner, but escaping first and then
  // re-enabling a fixed set of inline tags keeps a stray "<" in a paper title
  // from breaking the page.
  function richText(value) {
    return escapeHtml(value).replace(
      /&lt;(\/?)(em|strong|code)&gt;/g,
      '<$1$2>'
    );
  }

  function attr(value) {
    return escapeHtml(value);
  }

  function fetchJSON(name) {
    return fetch(DATA + name)
      .then(function (res) {
        if (!res.ok) throw new Error(name + ': HTTP ' + res.status);
        return res.json();
      })
      .catch(function (err) {
        console.error('Failed to load ' + name, err);
        return null;
      });
  }

  // "2026-03-01" -> "Mar 2026". Empty string is a legitimate value: the item
  // renders without a date.
  function formatDate(iso) {
    if (!iso) return '';
    var m = /^(\d{4})-(\d{2})/.exec(iso);
    if (!m) return iso;
    return MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1];
  }

  // Newest first. Undated entries go last rather than first: we do not know
  // when they happened, and putting them on top would assert they are the most
  // recent thing that has happened.
  function byDateDesc(a, b) {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  }

  function el(id) {
    return document.getElementById(id);
  }

  /* Remove a section and the nav link that points at it. */
  function dropSection(id) {
    var section = el(id);
    if (section && section.parentNode) section.parentNode.removeChild(section);
    var link = document.querySelector('.nav-links a[href="#' + id + '"]');
    if (link && link.parentNode) link.parentNode.removeChild(link);
  }

  /* ---------------------------------------------------------------- pieces */

  function renderHero(profile) {
    var host = el('hero');
    if (!host || !profile) return;

    var orgs = (profile.organizations || [])
      .map(function (o) {
        return o.url
          ? '<a href="' + attr(o.url) + '">' + escapeHtml(o.name) + '</a>'
          : escapeHtml(o.name);
      })
      .join(' &middot; ');

    var social = (profile.social || [])
      .filter(function (s) {
        return s.link && ICONS[s.icon];
      })
      .map(function (s) {
        var external = s.link.indexOf('http') === 0;
        return (
          '<a href="' + attr(s.link) + '" aria-label="' + attr(s.label) + '"' +
          (external ? ' target="_blank" rel="noopener"' : '') + '>' +
          ICONS[s.icon] +
          '</a>'
        );
      })
      .join('');

    var initials = escapeHtml(profile.initials || '');

    host.innerHTML =
      '<div class="hero-avatar">' +
      '<div class="hero-avatar-initials">' + initials + '</div>' +
      '</div>' +
      '<div class="hero-body">' +
      '<h1 class="hero-name">' + escapeHtml(profile.name) + '</h1>' +
      '<p class="hero-role">' + escapeHtml(profile.role) + '</p>' +
      (orgs ? '<p class="hero-orgs">' + orgs + '</p>' : '') +
      (social ? '<div class="hero-social">' + social + '</div>' : '') +
      '</div>';

    // The photo is optional, so the initials render first and are only
    // replaced once an image has actually decoded. Doing it this way round —
    // rather than rendering <img> and listening for 'error' — means there is
    // no broken-image state to flash, and no race where the request fails
    // before the error listener is attached.
    if (!profile.avatar) return;
    var slot = host.querySelector('.hero-avatar');
    var probe = new Image();
    probe.onload = function () {
      probe.alt = profile.name || '';
      probe.width = 160;
      probe.height = 160;
      slot.innerHTML = '';
      slot.appendChild(probe);
    };
    probe.src = profile.avatar;
  }

  function renderAbout(profile) {
    if (!profile) return;

    var bio = el('about-bio');
    if (bio) {
      var paragraphs = Array.isArray(profile.bio)
        ? profile.bio
        : [profile.bio];
      bio.innerHTML = paragraphs
        .filter(Boolean)
        .map(function (p) {
          return '<p>' + richText(p) + '</p>';
        })
        .join('');
    }

    var interests = el('interests');
    if (interests) {
      interests.innerHTML = (profile.interests || [])
        .map(function (i) {
          return '<li>' + escapeHtml(i) + '</li>';
        })
        .join('');
    }

    var education = el('education');
    if (education) {
      education.innerHTML = (profile.education || [])
        .map(function (e) {
          return (
            '<div class="education-item">' +
            '<div class="education-course">' + escapeHtml(e.course) + '</div>' +
            '<div class="education-meta">' + escapeHtml(e.institution) +
            (e.year ? ', ' + escapeHtml(e.year) : '') +
            '</div></div>'
          );
        })
        .join('');
    }
  }

  function newsItemHTML(item) {
    var text = richText(item.title);
    if (item.url) {
      var external = item.url.indexOf('http') === 0;
      text =
        '<a href="' + attr(item.url) + '"' +
        (external ? ' target="_blank" rel="noopener"' : '') + '>' +
        text + '</a>';
    }
    return (
      '<li class="news-item">' +
      '<div class="news-date">' + escapeHtml(formatDate(item.date)) + '</div>' +
      '<div class="news-text">' + text + '</div>' +
      '</li>'
    );
  }

  function renderNews(news, host, limit) {
    if (!host) return;
    var items = news.slice().sort(byDateDesc);
    if (limit) items = items.slice(0, limit);

    var undated = items.filter(function (n) {
      return !n.date;
    }).length;
    if (undated) {
      console.warn(
        undated + ' news item(s) have no date. Fill in "date" in ' +
        'assets/data/news.json to place them on the timeline.'
      );
    }

    host.innerHTML = items.map(newsItemHTML).join('');
  }

  function publicationHTML(pub) {
    var authors = (pub.authors || [])
      .map(function (a) {
        return a === ME
          ? '<span class="is-me">' + escapeHtml(a) + '</span>'
          : escapeHtml(a);
      })
      .join(', ');

    var venue = pub.publication || pub.publication_short || '';
    var year = (pub.date || '').slice(0, 4);

    var links = [];
    if (pub.url_pdf) links.push(['PDF', pub.url_pdf]);
    if (pub.doi) links.push(['DOI', 'https://doi.org/' + pub.doi]);
    if (pub.url_code) links.push(['Code', pub.url_code]);

    var title = escapeHtml(pub.title);
    if (pub.url_pdf || pub.doi) {
      var primary = pub.url_pdf || 'https://doi.org/' + pub.doi;
      title =
        '<a href="' + attr(primary) + '" target="_blank" rel="noopener">' +
        title + '</a>';
    }

    return (
      '<li class="pub-item">' +
      '<div class="pub-title">' + title + '</div>' +
      (authors ? '<div class="pub-authors">' + authors + '</div>' : '') +
      (venue
        ? '<div class="pub-venue"><em>' + escapeHtml(venue) + '</em>' +
          (year ? ', ' + year : '') + '</div>'
        : '') +
      (links.length
        ? '<div class="pub-links">' +
          links
            .map(function (l) {
              return (
                '<a class="pub-link" href="' + attr(l[1]) +
                '" target="_blank" rel="noopener">' + l[0] + '</a>'
              );
            })
            .join('') +
          '</div>'
        : '') +
      '</li>'
    );
  }

  /* groupBy: "year" on the full listing, "none" (flat) on the home page. */
  function renderPublications(pubs, host, groupBy) {
    if (!host) return;
    var items = pubs.slice().sort(byDateDesc);

    if (groupBy !== 'year') {
      host.innerHTML =
        '<ul class="pub-list">' + items.map(publicationHTML).join('') + '</ul>';
      return;
    }

    var order = [];
    var groups = {};
    items.forEach(function (p) {
      var year = (p.date || '').slice(0, 4) || 'Unpublished';
      if (!groups[year]) {
        groups[year] = [];
        order.push(year);
      }
      groups[year].push(p);
    });

    host.innerHTML = order
      .map(function (year) {
        return (
          '<div class="pub-group">' +
          '<h3 class="pub-group-title">' + escapeHtml(year) + '</h3>' +
          '<ul class="pub-list">' +
          groups[year].map(publicationHTML).join('') +
          '</ul></div>'
        );
      })
      .join('');
  }

  function projectHTML(project) {
    var tags = (project.tags || [])
      .map(function (t) {
        return '<span class="tag">' + escapeHtml(t) + '</span>';
      })
      .join('');

    var links = [];
    if (project.url_code) links.push(['Code &rarr;', project.url_code]);
    if (project.url_project) links.push(['Project &rarr;', project.url_project]);

    var title = escapeHtml(project.title);
    var primary = project.url_code || project.url_project;
    if (primary) {
      title =
        '<a href="' + attr(primary) + '" target="_blank" rel="noopener">' +
        title + '</a>';
    }

    return (
      '<article class="card">' +
      '<h3 class="card-title">' + title + '</h3>' +
      (project.note
        ? '<div class="card-note">' + escapeHtml(project.note) + '</div>'
        : '') +
      (project.summary
        ? '<p class="card-summary">' + richText(project.summary) + '</p>'
        : '') +
      '<div class="card-footer">' +
      (tags ? '<div class="tags">' + tags + '</div>' : '') +
      (links.length
        ? '<div class="card-links">' +
          links
            .map(function (l) {
              return (
                '<a href="' + attr(l[1]) + '" target="_blank" rel="noopener">' +
                l[0] + '</a>'
              );
            })
            .join('') +
          '</div>'
        : '') +
      '</div></article>'
    );
  }

  function renderProjects(projects, host) {
    if (!host) return;
    host.innerHTML = projects.map(projectHTML).join('');
  }

  function renderContact(profile) {
    var host = el('contact-list');
    if (!host || !profile) return;

    var rows = [];
    if (profile.email) {
      rows.push([
        'Email',
        '<a href="mailto:' + attr(profile.email) + '">' +
          escapeHtml(profile.email) + '</a>'
      ]);
    }
    var org = (profile.organizations || [])[0];
    if (org) {
      rows.push([
        'Lab',
        org.url
          ? '<a href="' + attr(org.url) + '" target="_blank" rel="noopener">' +
            escapeHtml(org.name) + '</a>'
          : escapeHtml(org.name)
      ]);
    }

    host.innerHTML = rows
      .map(function (r) {
        return (
          '<li><span class="contact-label">' + r[0] + '</span>' +
          '<span>' + r[1] + '</span></li>'
        );
      })
      .join('');
  }

  function renderFooterYear(profile) {
    var host = el('footer-line');
    if (!host) return;
    host.innerHTML =
      '&copy; ' + new Date().getFullYear() + ' ' +
      escapeHtml((profile && profile.name) || 'Kyubin Park');
  }

  /* ----------------------------------------------------------------- pages */

  function renderHome() {
    return Promise.all([
      fetchJSON('profile.json'),
      fetchJSON('news.json'),
      fetchJSON('publications.json'),
      fetchJSON('projects.json')
    ]).then(function (results) {
      var profile = results[0];
      var news = results[1] || [];
      var pubs = results[2] || [];
      var projects = results[3] || [];

      renderHero(profile);
      renderAbout(profile);
      renderContact(profile);
      renderFooterYear(profile);

      if (news.length) {
        renderNews(news, el('news-list'), 5);
        if (news.length <= 5) {
          var moreNews = el('news-more');
          if (moreNews) moreNews.style.display = 'none';
        }
      } else {
        dropSection('news');
      }

      var featuredPubs = pubs.filter(function (p) {
        return p.featured !== false;
      });
      if (featuredPubs.length) {
        renderPublications(featuredPubs.slice(0, 5), el('publications-list'), 'none');
        if (pubs.length <= 5) {
          var morePubs = el('publications-more');
          if (morePubs) morePubs.style.display = 'none';
        }
      } else {
        dropSection('publications');
      }

      var featuredProjects = projects.filter(function (p) {
        return p.featured !== false;
      });
      if (featuredProjects.length) {
        renderProjects(featuredProjects, el('projects-list'));
        if (projects.length <= featuredProjects.length) {
          var moreProjects = el('projects-more');
          if (moreProjects) moreProjects.style.display = 'none';
        }
      } else {
        dropSection('projects');
      }
    });
  }

  function renderListPage(collection) {
    var host = el('page-list');
    var empty = el('page-empty');

    return Promise.all([
      fetchJSON('profile.json'),
      fetchJSON(collection + '.json')
    ]).then(function (results) {
      renderFooterYear(results[0]);
      var items = results[1] || [];

      if (!items.length) {
        if (host) host.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';

      if (collection === 'news') renderNews(items, host, 0);
      else if (collection === 'publications')
        renderPublications(items, host, 'year');
      else if (collection === 'projects') renderProjects(items, host);
    });
  }

  function start() {
    var collection = document.body.getAttribute('data-collection');
    var job = collection ? renderListPage(collection) : renderHome();

    job
      .catch(function (err) {
        console.error('Rendering failed', err);
      })
      .then(function () {
        // Sections may have been removed above, so the scroll-spy has to be
        // (re)built against the final DOM.
        if (typeof window.initScrollSpy === 'function') window.initScrollSpy();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
