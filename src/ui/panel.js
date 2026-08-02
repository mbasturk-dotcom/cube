const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The readable half of the site.
 *
 * The detail node is *moved* out of its section and into the panel rather
 * than copied, so there is never a second version of the text in the DOM
 * to fall out of sync. It goes back where it came from on close.
 */
export function createPanel({ panel, backdrop, titleElement, bodyElement, closeButton, reducedMotion }) {
  let openDetail = null;
  let homeParent = null;
  let homeAnchor = null;
  let pending = null;
  let returnFocusTo = null;
  let hideTimer = 0;
  let onOpen = null;
  let onClose = null;

  function trapFocus(event) {
    if (event.key !== 'Tab') return;

    const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === closeButton,
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === bodyElement)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    trapFocus(event);
  }

  /**
   * Put the last detail node back in its section and hide the panel.
   *
   * This normally runs on a timer so the closing animation has something to
   * animate, but anything that needs the DOM settled — reopening, switching
   * to list mode — calls it directly. Skipping it would strip a section of
   * its content permanently.
   */
  function restorePending() {
    window.clearTimeout(hideTimer);
    hideTimer = 0;

    panel.hidden = true;
    backdrop.hidden = true;

    if (!pending) return;
    pending.parent?.insertBefore(pending.detail, pending.anchor);
    pending = null;
  }

  function open(detail, title, trigger) {
    if (openDetail) return;

    restorePending();

    openDetail = detail;
    homeParent = detail.parentNode;
    homeAnchor = detail.nextSibling;
    returnFocusTo = trigger instanceof HTMLElement ? trigger : null;

    titleElement.textContent = title;
    bodyElement.replaceChildren(detail);

    panel.hidden = false;
    backdrop.hidden = false;
    // Force a frame so the transition has something to move from.
    void panel.offsetWidth;
    panel.dataset.open = 'true';
    backdrop.dataset.open = 'true';

    document.documentElement.classList.add('panel-open');
    panel.addEventListener('keydown', onKeyDown);
    backdrop.addEventListener('click', onBackdropClick);

    closeButton.focus();
    bodyElement.scrollTop = 0;
    onOpen?.();
  }

  function close({ immediate = false } = {}) {
    if (!openDetail) {
      // Already closing — flush the outstanding restore if the caller needs
      // the DOM settled right now.
      if (immediate) restorePending();
      return;
    }

    pending = { detail: openDetail, parent: homeParent, anchor: homeAnchor };
    openDetail = null;
    homeParent = null;
    homeAnchor = null;

    delete panel.dataset.open;
    delete backdrop.dataset.open;
    document.documentElement.classList.remove('panel-open');
    panel.removeEventListener('keydown', onKeyDown);
    backdrop.removeEventListener('click', onBackdropClick);

    if (immediate || reducedMotion()) {
      restorePending();
    } else {
      hideTimer = window.setTimeout(restorePending, 440);
    }

    // Lift the background's `inert` before handing focus back to the
    // trigger, or the focus() call lands on an unfocusable element.
    onClose?.();
    returnFocusTo?.focus();
    returnFocusTo = null;
  }

  function onBackdropClick() {
    close();
  }

  closeButton.addEventListener('click', () => close());

  return {
    open,
    close,
    get isOpen() {
      return openDetail !== null;
    },
    set onOpen(fn) {
      onOpen = fn;
    },
    set onClose(fn) {
      onClose = fn;
    },
  };
}
