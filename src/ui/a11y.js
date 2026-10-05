/**
 * Only the face you are looking at should exist as far as the keyboard and
 * screen readers are concerned. The other five stay on screen — and must
 * stay hittable, because a drag can start on any of them — so they are
 * hidden from assistive tech and taken out of the tab order without `inert`,
 * which would also make the browser skip them during hit testing.
 */
export function createFaceA11y(sections, liveRegion) {
  let announced = -1;

  function setReachable(section, inactive) {
    section.inert = false;
    section.setAttribute('aria-hidden', String(inactive));
    section.querySelectorAll('a, button').forEach((el) => {
      el.tabIndex = inactive ? -1 : 0;
    });
  }

  return {
    setActive(index) {
      sections.forEach((section, i) => setReachable(section, i !== index));

      if (index !== announced) {
        announced = index;
        liveRegion.textContent = sections[index].dataset.label ?? '';
      }
    },

    /** List mode: every section is real content again. */
    reset() {
      announced = -1;
      sections.forEach((section) => {
        section.inert = false;
        section.removeAttribute('aria-hidden');
        section.querySelectorAll('a, button').forEach((el) => {
          el.tabIndex = 0;
        });
      });
      liveRegion.textContent = '';
    },
  };
}
