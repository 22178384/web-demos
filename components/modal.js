// 一个极简弹窗组件（原生 JS，无依赖）
export function openModal(title, body) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal"><h3>${title}</h3><p>${body}</p></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
