function createElement(tagName, attrs, styles) {
  const el = document.createElement(tagName);
  if (attrs) {
    for (const key in attrs) {
      if (Object.hasOwnProperty.call(attrs, key)) {
        el[key] = attrs[key];
      }
    }
  }
  if (styles) {
    for (const key in styles) {
      if (Object.hasOwnProperty.call(styles, key)) {
        el.style[key] = styles[key];
      }
    }
  }
  return el;
}

class Tab {
  constructor(id, name, color, isActive, isHidden) {
    this.id = id;
    this.name = name;
    this.color = color;

    this.el = createElement('div', {className: 'goog-menuitem'});
    if (isActive) {
      this.el.classList.add('goog-option-selected');
    }
    if (isHidden) {
      this.el.classList.add('docs-sheet-all-sheet-menu-item-hidden');
    }

    this.el.innerHTML =
      `<div class="goog-menuitem-content">${this.name}</div>` + 
      `<button value="${this.id}" style="display:none"></button>`;

    this.el.addEventListener('mouseenter', () => {
      this.el.classList.add("goog-menuitem-highlight");
    }, {passive: true});
    this.el.addEventListener('mouseleave', () => {
      this.el.classList.remove("goog-menuitem-highlight");
    }, {passive: true});
    this.el.addEventListener('click', () => {
      this.el.querySelector('button').click();
    }, {passive: true});
  }

  static from(tabEl) {
    const tabName = tabEl.querySelector('.docs-sheet-tab-name');
    const tabColor = tabEl.querySelector('.docs-sheet-tab-color');

    return new Tab(
      tabEl.id,
      tabName && tabName.textContent,
      tabColor && tabColor.style.background,
      tabEl.classList.contains('docs-sheet-active-tab'),
      tabEl.style.display === 'none'
    );
  }

  showTabColor() {
    this.el.querySelector('.goog-menuitem-content')
      .insertAdjacentHTML(
        'afterbegin',
        `<div class="docs-sheet-all-sheet-menu-item-swatch" style="background:${this.color}"></div>`
      );
  }

  show() {
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }

  open() {
    document.getElementById(this.id).dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true}));
  }
}

class TabSearchDialog {
  constructor() {
    this.tabMap = new Map();

    this.el = createElement(
      'dialog', {className: 'goog-menu goog-menu-vertical'},
      {
        left: '50%',
        top: '50%',
        transform: 'translate3d(-50%, -50%, 0)'
      }
    );
    if (typeof this.el.showModal !== "function") {
      throw new Error('The <dialog> API is not supported by this browser');
    }
    this.el.addEventListener('close', () => {
      if (this.el.returnValue && this.tabMap.has(this.el.returnValue)) {
        this.tabMap.get(this.el.returnValue).open();
      }
      if (this.input) {
        this.input.value = '';
      }
    });

    this.input = createElement(
      'input', {type: 'search', className: 'goog-menuitem', spellcheck: false},
      {
        width: '100%',
        zIndex: 1,
        position: 'sticky',
        top: '-6px',
        marginTop: '-6px',
        paddingLeft: '0.25em',
        paddingRight: '0.25em',
      }
    )
    let t;
    this.input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        this.filterTab(this.input.value);
      }, 250);
    },{passive: true})
    this.el.appendChild(this.input);

    this.form = createElement('form', {method: 'dialog'});
    this.el.appendChild(this.form);

    document.body.appendChild(this.el);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F5') {
        this.toggleDialog();
      }
    }, {passive: true});
  }

  filterTab(text) {
    const lowerText = text.trim().toLowerCase();
    for (const tab of this.tabMap.values()) {
      if (!lowerText || tab.name.toLowerCase().includes(lowerText)) {
        tab.show();
      } else {
        tab.hide();
      }
    }
  }

  toggleDialog() {
    if (this.el.open) {
      this.el.close();
      this.el.style.width = 'fit-content';
      this.el.style.height = 'fit-content';
    } else {
      this.init();
      this.el.showModal();
      const rect = this.el.getBoundingClientRect();
      this.el.style.width = `${rect.width}px`;
      this.el.style.height = this.tabMap.size > 11 ? `30em` : `${rect.height}px`;
    }
  }

  init() {
    for (const tab of this.tabMap.values()) {
      tab.el.remove();
    }
    this.tabMap.clear();

    let showTabColor = false;
    const fragment = new DocumentFragment();
    document.querySelectorAll('.docs-sheet-tab').forEach(sheetTab => {
      const tab = Tab.from(sheetTab);
      this.tabMap.set(tab.id, tab);
      fragment.appendChild(tab.el);
      if (tab.color && tab.color !== 'transparent') {
        showTabColor = true;
      }
    });
    if (showTabColor) {
      for (const tab of this.tabMap.values()) {
        tab.showTabColor();
      }
    }
    this.form.appendChild(fragment);
  }
}

new TabSearchDialog();