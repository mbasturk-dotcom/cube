/**
 * Only the face you are looking at should exist as far as the keyboard and
 * screen readers are concerned. The other five are still in the DOM (and
 * still partly on screen), so they get `inert` — which takes them out of
 * the tab order and the accessibility tree in one go.
 */
export function createFaceA11y(sections, liveRegion) {
  let announced = -1;

  return {
    setActive(index) {
      sections.forEach((section, i) => {
        const inactive = i !== index;
        section.inert = inactive;
        section.setAttribute('aria-hidden', String(inactive));
      });

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
      });
      liveRegion.textContent = '';
    },
  };
}
