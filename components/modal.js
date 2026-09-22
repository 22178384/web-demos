/* modal.js - a small accessible modal dialog. No framework, no build step.
 *
 * Usage:
 *   <div class="modal" id="m1" hidden>
 *     <div class="modal__dialog" role="dialog" aria-modal="true"
 *          aria-labelledby="m1-title">
 *       <h2 id="m1-title">Title</h2>
 *       <button data-modal-close>Close</button>
 *     </div>
 *   </div>
 *
 *   const m = new DemoModal('#m1');
 *   m.open();
 *
 * Events (both bubble, both have .detail.modal):
 *   'modal:open', 'modal:close'
 *
 * Notes / limitations, so you don't expect more than this does:
 *   - Focus trap cycles Tab within the dialog. It does not handle iframes or
 *     shadow DOM. Good enough for a normal dialog.
 *   - I deliberately don't move the dialog in the DOM. Keep it a sibling of
 *     your content, not nested inside something with overflow:hidden.
 *   - Closing on backdrop click is opt-out via { closeOnBackdrop: false }.
 */
(function (global) {
  'use strict';

  var FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  var openCount = 0; // used to lock body scroll while any modal is open

  function resolve(target) {
    if (target instanceof Element) return target;
    var el = document.querySelector(target);
    if (!el) throw new Error('DemoModal: no element matches ' + target);
    return el;
  }

  function Modal(target, options) {
    this.root = resolve(target);
    this.opts = Object.assign({
      closeOnBackdrop: true,
      closeOnEsc: true,
      onOpen: null,
      onClose: null
    }, options || {});

    this.dialog = this.root.querySelector('.modal__dialog') || this.root;
    this.isOpen = false;
    this._lastFocused = null;
    this._onKeydown = this._handleKeydown.bind(this);
    this._onClick = this._handleClick.bind(this);

    // Wire up any [data-modal-close] buttons inside the dialog.
    var closers = this.root.querySelectorAll('[data-modal-close]');
    for (var i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', this.close.bind(this));
    }
  }

  Modal.prototype.open = function () {
    if (this.isOpen) return this;
    this._lastFocused = document.activeElement;
    this.root.hidden = false;
    this.isOpen = true;

    document.addEventListener('keydown', this._onKeydown, true);
    if (this.opts.closeOnBackdrop) {
      this.root.addEventListener('mousedown', this._onClick);
    }

    openCount += 1;
    document.body.classList.add('has-modal');

    var first = this.dialog.querySelector(FOCUSABLE);
    (first || this.dialog).focus();

    this._emit('modal:open');
    if (this.opts.onOpen) this.opts.onOpen(this);
    return this;
  };

  Modal.prototype.close = function () {
    if (!this.isOpen) return this;
    this.root.hidden = true;
    this.isOpen = false;

    document.removeEventListener('keydown', this._onKeydown, true);
    this.root.removeEventListener('mousedown', this._onClick);

    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) document.body.classList.remove('has-modal');

    if (this._lastFocused && this._lastFocused.focus) {
      this._lastFocused.focus();
    }

    this._emit('modal:close');
    if (this.opts.onClose) this.opts.onClose(this);
    return this;
  };

  Modal.prototype.toggle = function () {
    return this.isOpen ? this.close() : this.open();
  };

  Modal.prototype.destroy = function () {
    this.close();
    this.root.removeEventListener('mousedown', this._onClick);
  };

  Modal.prototype._emit = function (name) {
    this.root.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      detail: { modal: this }
    }));
  };

  Modal.prototype._handleClick = function (event) {
    // mousedown on the backdrop, not the dialog, closes. Using mousedown
    // instead of click avoids closing when you drag-select text and release
    // outside the dialog.
    if (event.target === this.root) this.close();
  };

  Modal.prototype._handleKeydown = function (event) {
    if (this.opts.closeOnEsc && event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;

    var nodes = this.dialog.querySelectorAll(FOCUSABLE);
    var focusable = Array.prototype.filter.call(nodes, function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  global.DemoModal = Modal;
})(window);
