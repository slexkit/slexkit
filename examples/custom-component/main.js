const log = document.getElementById("log");
class DemoCounter extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const shadow = this.attachShadow({ mode: "open" });
    const button = document.createElement("button");
    let value = Number(this.getAttribute("value") || 0);
    const render = () => { button.textContent = `Count: ${value}`; };
    button.addEventListener("click", () => { value += 1; render(); this.dispatchEvent(new Event("change", { bubbles: true })); });
    shadow.append(button); render();
    log.textContent = "demo-counter connected";
  }
}
customElements.define("demo-counter", DemoCounter);

const app = document.getElementById("app");
async function mountExample() {
  app.replaceChildren(document.createElement("demo-counter"));
  app.firstElementChild.setAttribute("value", "2");
}
document.getElementById("dispose").addEventListener("click", () => { app.replaceChildren(); log.textContent = "custom element disconnected"; });
document.getElementById("remount").addEventListener("click", mountExample);
await mountExample();
