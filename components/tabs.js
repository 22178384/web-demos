/* tabs.js - ARIA tabs without a framework.
 *
 * Markup it expects (roles are required, they're also what it queries on):
 *
 *   <div class="tabs" id="t1">
 *     <div class="tabs__list" role="tablist">
 *       <button role="tab" id="t1-a" aria-controls="t1-panel-a" aria-selected="true">A</button>
 *       <button role="tab" id="t1-b" aria-controls="t1-panel-b">B</button>
 *     </div>
 *     <div role="tabpanel" id="t1-panel-a" aria-labelledby="t1-a">...</div>
 *     <div role="tabpanel" id="t1-panel-b" aria-labelledby="t1-b" hidden>...</div>
 *   </div>
 *
 *   new DemoTabs('#t1', { activate: 0 });
 *
 * Event: 'tabs:change' with detail { tabs, index, tab, panel, previous }
 * Keyboard: Left/Right/Home/End, and Up/Down when the tablist is vertical.
 */
(function (global) {
  'use strict';

  function resolve(target) {
    if (target instanceof Element) return target;
    var el = document.querySelector(target);
    if (!el) throw new Error('DemoTabs: no element matches ' + target);
    return el;
  }

  function Tabs(target, options) {
    this.root = resolve(target);
    this.opts = Object.assign({
      activate: 0,
      orientation: 'horizontal',
      onchange: null
    }, options || {});

    this.tablist = this.root.querySelector('[role="tablist"]');
    if (!this.tablist) throw new Error('DemoTabs: missing [role="tablist"]');

    this.tabs = Array.prototype.slice.call(this.tablist.querySelectorAll('[role="tab"]'));
    this.panels = this.tabs.map(function (tab) {
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (!panel) throw new Error('DemoTabs: tab "' + tab.id + '" points at a missing panel');
      return panel;
    });

    this.index = -1;
    this._bind();
    this.select(this.opts.activate);
  }

  Tabs.prototype._bind = function () {
    var self = this;
    this.tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { self.select(i); });
      tab.addEventListener('keydown', function (e) { self._onKeydown(e, i); });
    });
  };

  Tabs.prototype.select = function (index) {
    if (index < 0 || index >= this.tabs.length) return this;
    if (index === this.index) return this;

    var previous = this.index;
    this.tabs.forEach(function (tab, i) {
      var active = i === index;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    this.panels.forEach(function (panel, i) {
      if (i === index) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    this.index = index;
    this.root.dispatchEvent(new CustomEvent('tabs:change', {
      bubbles: true,
      detail: {
        tabs: this,
        index: index,
        tab: this.tabs[index],
        panel: this.panels[index],
        previous: previous
      }
    }));
    if (this.opts.onchange) this.opts.onchange(this.tabs[index], this.panels[index], previous);
    return this;
  };

  // Select by tab id (useful for deep links: #panel -> tab).
  Tabs.prototype.selectById = function (id) {
    for (var i = 0; i < this.tabs.length; i++) {
      if (this.tabs[i].id === id) return this.select(i);
    }
    return this;
  };

  Tabs.prototype._onKeydown = function (event, index) {
    var vertical = this.opts.orientation === 'vertical';
    var next = null;
    var last = this.tabs.length - 1;

    switch (event.key) {
      case 'ArrowRight': if (!vertical) next = index === last ? 0 : index + 1; break;
      case 'ArrowLeft': if (!vertical) next = index === 0 ? last : index - 1; break;
      case 'ArrowDown': if (vertical) next = index === last ? 0 : index + 1; break;
      case 'ArrowUp': if (vertical) next = index === 0 ? last : index - 1; break;
      case 'Home': next = 0; break;
      case 'End': next = last; break;
      default: return;
    }
    event.preventDefault();
    this.select(next);
    this.tabs[next].focus();
  };

  global.DemoTabs = Tabs;
})(window);
