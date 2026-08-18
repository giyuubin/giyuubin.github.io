/* Navigation: off-canvas mobile menu + scroll-spy.
 *
 * Both behaviours are ported from the previous version of this site, where
 * they were tuned against real bugs. Read the comments before simplifying. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
   * Mobile menu
   * ------------------------------------------------------------------ */
  function initMenu() {
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    var backdrop = document.getElementById('navBackdrop');
    var themeToggle = document.getElementById('themeToggle');
    if (!toggle || !links || !backdrop) return;

    var scrollY = 0;

    function focusables() {
      return [toggle]
        .concat(Array.prototype.slice.call(links.querySelectorAll('a')))
        .concat([themeToggle])
        .filter(Boolean);
    }

    function lockScroll() {
      scrollY = window.scrollY;
      var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + 'px';
      }
    }

    function unlockScroll() {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.paddingRight = '';
      // html has a global scroll-behavior: smooth, which would otherwise
      // animate this restore from the top down to scrollY. Force it instant so
      // closing the menu leaves you exactly where you were, with no visible
      // scrolling.
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
    }

    function open() {
      links.classList.add('is-open');
      backdrop.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      lockScroll();
      var firstLink = links.querySelector('a');
      // preventScroll for the same reason unlockScroll forces behavior:
      // 'instant' — html has a global scroll-behavior: smooth, and .nav is
      // sticky rather than fixed, so letting focus() scroll its target into
      // view animates the page away from where the reader left it. Nothing here
      // needs scrolling to anyway: the panel is position: fixed.
      if (firstLink) firstLink.focus({ preventScroll: true });
    }

    function close(returnFocus) {
      if (!links.classList.contains('is-open')) return;
      links.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      unlockScroll();
      // Must not scroll: this runs immediately after unlockScroll has put the
      // reader back where they were, and a scroll-into-view here would animate
      // them straight back off it.
      if (returnFocus) toggle.focus({ preventScroll: true });
    }

    toggle.addEventListener('click', function () {
      if (links.classList.contains('is-open')) close(true);
      else open();
    });

    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close(false);
    });

    backdrop.addEventListener('click', function () {
      close(true);
    });

    document.addEventListener('keydown', function (e) {
      if (!links.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        close(true);
        return;
      }

      if (e.key === 'Tab') {
        var items = focusables();
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Matches the max-width: 720px breakpoint in style.css.
    var desktopMq = window.matchMedia('(min-width: 721px)');
    var handleDesktopChange = function (e) {
      if (e.matches && links.classList.contains('is-open')) close(false);
    };
    if (desktopMq.addEventListener) {
      desktopMq.addEventListener('change', handleDesktopChange);
    } else {
      desktopMq.addListener(handleDesktopChange);
    }
  }

  /* ------------------------------------------------------------------
   * Nav shadow on scroll
   * ------------------------------------------------------------------ */
  function initNavShadow() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var update = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 4);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ------------------------------------------------------------------
   * Scroll-spy
   *
   * Exposed as window.initScrollSpy() because render.js adds and removes
   * whole sections (an empty publications.json deletes that section and its
   * nav link), so the section list is only final after rendering. Safe to
   * call more than once — it detaches the previous listener first.
   * ------------------------------------------------------------------ */
  var detachSpy = null;

  function initScrollSpy() {
    if (detachSpy) {
      detachSpy();
      detachSpy = null;
    }

    var navLinkByHash = {};
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
      navLinkByHash[a.getAttribute('href').slice(1)] = a;
    });

    var navLinkList = Object.keys(navLinkByHash).map(function (k) {
      return navLinkByHash[k];
    });
    var sections = Object.keys(navLinkByHash)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);

    if (!sections.length) return;

    var ticking = false;
    var suppressUntil = 0;

    function setActive(link) {
      navLinkList.forEach(function (a) {
        a.classList.remove('is-active');
        a.removeAttribute('aria-current');
      });
      if (link) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');
      }
    }

    var onLinkClick = function () {
      setActive(this);
      suppressUntil = Date.now() + 1000;
    };
    navLinkList.forEach(function (a) {
      a.addEventListener('click', onLinkClick);
    });

    // Trailing sections can be short enough that their anchor targets clamp to
    // the same max scroll position and never individually reach a fixed "top of
    // viewport" reference line, so a naive top-based check would stay stuck on
    // an earlier section forever. Track whichever section's midpoint is closest
    // to the viewport's vertical centre instead — that adapts to short sections
    // — and once the page cannot scroll any further, treat the last section as
    // current. A direct nav click wins over scroll detection for a moment.
    var updateActive = function () {
      ticking = false;
      if (Date.now() < suppressUntil) return;

      var maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      var atBottom = window.scrollY >= maxScroll - 2;
      if (atBottom) {
        // A trailing section is usually short and sits hard against the end of
        // the document, so at maximum scroll its midpoint is stuck below the
        // viewport centre and the midpoint rule below can never pick it — the
        // last nav item would be unreachable at every scroll position. Being at
        // the bottom is the only chance it gets, so take it.
        //
        // The guard is still needed: on a page barely taller than the viewport,
        // "at bottom" happens while an early section still fills the screen, and
        // forcing the last link active there is wrong. That is a property of how
        // much scroll room exists, so test that directly. The previous check
        // (last section's top above innerHeight / 2) tested viewport height
        // instead, and could not pass above a 612px-tall viewport — i.e. never
        // on a desktop browser.
        var lastSection = sections[sections.length - 1];
        if (maxScroll >= window.innerHeight / 2) {
          setActive(navLinkByHash[lastSection.id]);
          return;
        }
      }

      var viewportCenter = window.innerHeight / 2;
      var currentSection = sections[0];
      var bestDistance = Infinity;
      sections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        var distance = Math.abs((rect.top + rect.bottom) / 2 - viewportCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          currentSection = section;
        }
      });
      setActive(navLinkByHash[currentSection.id]);
    };

    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateActive);
      }
    };

    updateActive();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    detachSpy = function () {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      navLinkList.forEach(function (a) {
        a.removeEventListener('click', onLinkClick);
      });
    };
  }

  window.initScrollSpy = initScrollSpy;

  function init() {
    initMenu();
    initNavShadow();
    // Pages with static anchors (no JS rendering) still get a spy pass here;
    // render.js calls it again once dynamic sections settle.
    initScrollSpy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
