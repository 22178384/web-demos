# web-demos

Three UI components in plain JavaScript. Modal, tabs, toast. No framework, no bundler, no npm install. I got tired of pulling in a 300 KB dependency to show a dialog.

The pain point, specifically: every "lightweight" modal library I tried either broke the focus trap, leaked a scroll lock when you nested two of them, or wanted me to learn its theming system. These are ~100 lines each and I know exactly what they do.

## Try it

Open `examples/index.html` in a browser. Double-click it, `file://` works. That's the whole setup.

```
examples/index.html        landing page + toast playground
examples/modal-demo.html   focus trap, backdrop, events
examples/tabs-demo.html    keyboard nav, selectById
```

## Why classic scripts and not ES modules

Because `file://` + `<script type="module">` gets blocked by CORS in Chrome and Firefox. I wanted the demos to work from a double-click, not from a dev server. So each file is an IIFE that attaches one name to `window`:

```
window.DemoModal, window.DemoTabs, window.DemoToast
```

If you're bundling this into a real app you'll want to wrap them yourself. That's a five-minute job and I'd rather not pick a module format for you.

## Modal

```html
<div class="modal" id="m1" hidden>
  <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="m1-title">
    <h2 id="m1-title">Title</h2>
    <button data-modal-close>Close</button>
  </div>
</div>
```

```js
var m = new DemoModal('#m1', {
  closeOnBackdrop: true,   // default
  closeOnEsc: true,        // default
  onOpen: function (modal) {},
  onClose: function (modal) {}
});

m.open();
m.close();
m.toggle();
m.destroy();
```

- Focus moves to the first focusable element on open, returns to whatever was focused before on close.
- Tab and Shift+Tab cycle within the dialog.
- `[data-modal-close]` on any element inside closes it.
- Fires `modal:open` and `modal:close`, both bubbling, `event.detail.modal`.
- Nested modals share a body scroll lock counter, so closing the inner one doesn't unlock the page.

Limitations, honestly: the focus trap doesn't look inside iframes or shadow roots, and there's no animation hook. Add your own transition on `.modal__dialog` if you want one.

## Tabs

```html
<div class="tabs" id="t1">
  <div class="tabs__list" role="tablist">
    <button role="tab" id="t1-a" aria-controls="p-a" aria-selected="true">A</button>
    <button role="tab" id="t1-b" aria-controls="p-b">B</button>
  </div>
  <div role="tabpanel" id="p-a" aria-labelledby="t1-a">...</div>
  <div role="tabpanel" id="p-b" aria-labelledby="t1-b" hidden>...</div>
</div>
```

```js
var tabs = new DemoTabs('#t1', { activate: 0 });
tabs.select(1);
tabs.selectById('t1-b');
```

- Arrow keys move between tabs, Home/End jump to the ends. Set `orientation: 'vertical'` and it listens on Up/Down instead.
- Only the active panel is un-hidden; inactive tabs get `tabindex="-1"` so Tab skips them (that's the correct ARIA pattern, and yes it feels odd the first time).
- Event: `tabs:change`, `detail` has `index`, `tab`, `panel`, `previous`.
- Missing panel for an `aria-controls` id throws at construction. Silent failures are worse.

## Toast

```js
DemoToast.show('Saved', { type: 'success' });          // 4s
DemoToast.show('Upload failed', { type: 'error', duration: 0 }); // sticky
var t = DemoToast.show('Retrying...');
t.dismiss();
DemoToast.clear();
```

- Types: `info`, `success`, `warn`, `error`. Unknown types fall back to `info`.
- `duration: 0` means it stays until dismissed.
- Hovering pauses the countdown and resumes on mouse-out.
- One shared container (`#demo-toast-container`, `.toast-stack`, bottom-right) created lazily. Pass `{ container: el }` to put it elsewhere.
- Container is `aria-live="polite"`; error toasts get `role="alert"`.

## Styling

Everything is in `styles/base.css`. Override the CSS variables in `:root` and you're done:

```css
:root { --accent: #7c3aed; --radius: 4px; }
```

There's a dark-mode block using `prefers-color-scheme`. It's not a full theme, just enough that the demos aren't blinding at night.

## Gotchas

- **Backdrop close uses `mousedown`, not `click`.** Otherwise drag-selecting text in the dialog and releasing outside closes it. Classic.
- **Don't nest the modal markup inside an ancestor with `overflow: hidden`** if you care about the backdrop covering the viewport. Keep it a direct child of `<body>`.
- **The toast close button uses `×` (U+00D7)**, not the letter x. Set `dismissible: false` if you don't want a close button at all.
- **No IE support.** Uses `CustomEvent`, `Element.animate`, `Object.assign`, `NodeList.forEach`. If that's a problem for you, we're not going to get along.

## Notes

MIT. These exist because I kept needing them. No tests, the demos are the tests. If something's broken the demo will show it.
