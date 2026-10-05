/** Six labelled dots under the cube: a readout of where you are and a
 *  shortcut to anywhere else. Labels collapse to dots on narrow screens. */
export function createNav(navElement, labels, onSelect) {
  navElement.replaceChildren();

  const items = labels.map((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'face-nav__item';
    button.setAttribute('aria-label', label);

    const dot = document.createElement('span');
    dot.className = 'face-nav__dot';

    const text = document.createElement('span');
    text.className = 'face-nav__label';
    text.textContent = label;

    button.append(dot, text);
    button.addEventListener('click', () => onSelect(index));
    navElement.append(button);
    return button;
  });

  return {
    setActive(index) {
      items.forEach((item, i) => {
        item.setAttribute('aria-current', String(i === index));
      });
    },
    setLabels(labels) {
      items.forEach((item, i) => {
        const label = labels[i] ?? '';
        item.setAttribute('aria-label', label);
        item.querySelector('.face-nav__label').textContent = label;
      });
    },
  };
}
