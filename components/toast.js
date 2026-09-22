/* toast.js - transient notifications. ~90 lines, no dependencies.
 *
 *   var t = DemoToast.show('Saved', { type: 'success' });
 *   t.dismiss();                    // dismiss early
 *   DemoToast.clear();              // nuke everything
 *
 * Types: info (default), success, warn, error. Anything else falls back to info.
 *
 * Behaviour notes:
 *   - One container is created lazily and shared, positioned bottom-right.
 *     Pass { container: el } if you want it somewhere else.
 *   - duration: 0 means "sticky, close it yourself".
 *   - Pauses the timer on hover. You'd be surprised how often a toast
 *     disappears exactly as someone reaches for it.
 *   - Uses the Web Animations API when available, falls back to just showing
 *     up. No CSS keyframes to forget to copy.
 *   - There is no queue limit by default. If you spam it you'll get a column
 *     of toasts. That's on you.
 */
(function (global) {
  'use strict';

  var DEFAULT_CONTAINER_ID = 'demo-toast-container';
  var active = [];

  function getContainer(custom) {
    if (custom) return custom;
    var el = document.getElementById(DEFAULT_CONTAINER_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = DEFAULT_CONTAINER_ID;
      el.className = 'toast-stack';
      // aria-live polite so screen readers announce without stealing focus.
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'false');
      document.body.appendChild(el);
    }
    return el;
  }

  function Toast(message, options) {
    this.opts = Object.assign({
      type: 'info',
      duration: 4000,
      dismissible: true,
      container: null
    }, options || {});

    this.el = document.createElement('div');
    this.el.className = 'toast toast--' + this._type();
    this.el.setAttribute('role', this.opts.type === 'error' ? 'alert' : 'status');

    var text = document.createElement('span');
    text.className = 'toast__text';
    text.textContent = message;
    this.el.appendChild(text);

    if (this.opts.dismissible) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toast__close';
      btn.setAttribute('aria-label', 'Dismiss');
      btn.textContent = '\u00d7';
      btn.addEventListener('click', this.dismiss.bind(this));
      this.el.appendChild(btn);
    }

    this._timer = null;
    this._remaining = this.opts.duration;
    this._startedAt = 0;

    this._onEnter = this._pause.bind(this);
    this._onLeave = this._resume.bind(this);
    this.el.addEventListener('mouseenter', this._onEnter);
    this.el.addEventListener('mouseleave', this._onLeave);
  }

  Toast.prototype._type = function () {
    return ['info', 'success', 'warn', 'error'].indexOf(this.opts.type) >= 0
      ? this.opts.type : 'info';
  };

  Toast.prototype.mount = function () {
    getContainer(this.opts.container).appendChild(this.el);
    if (this.el.animate) {
      this.el.animate(
        [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 160, easing: 'ease-out' }
      );
    }
    this._resume();
    active.push(this);
    return this;
  };

  Toast.prototype._resume = function () {
    if (!this._remaining) return; // sticky
    this._startedAt = Date.now();
    var self = this;
    this._timer = setTimeout(function () { self.dismiss(); }, this._remaining);
  };

  Toast.prototype._pause = function () {
    if (!this._timer) return;
    clearTimeout(this._timer);
    this._timer = null;
    this._remaining -= (Date.now() - this._startedAt);
    if (this._remaining < 0) this._remaining = 0;
  };

  Toast.prototype.dismiss = function () {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    var self = this;
    var remove = function () {
      if (self.el.parentNode) self.el.parentNode.removeChild(self.el);
      var i = active.indexOf(self);
      if (i >= 0) active.splice(i, 1);
      self.el.dispatchEvent(new CustomEvent('toast:dismiss', { bubbles: true }));
    };
    if (this.el.animate) {
      var anim = this.el.animate(
        [{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px)' }],
        { duration: 140, easing: 'ease-in' }
      );
      anim.onfinish = remove;
      anim.oncancel = remove;
      // Belt and braces: if animations are disabled (prefers-reduced-motion
      // plus a browser that ignores onfinish), make sure it still goes away.
      setTimeout(remove, 400);
    } else {
      remove();
    }
    return this;
  };

  global.DemoToast = {
    show: function (message, options) {
      return new Toast(message, options).mount();
    },
    clear: function () {
      active.slice().forEach(function (t) { t.dismiss(); });
    },
    get active() { return active.slice(); }
  };
})(window);
