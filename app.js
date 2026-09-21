// 简单计数器逻辑
let count = 0;
const el = document.getElementById("count");
const btn = document.getElementById("btn");
btn.addEventListener("click", () => {
  count += 1;
  el.textContent = String(count);
});
