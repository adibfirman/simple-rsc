import { createRoot } from "react-dom/client";
import { createFromFetch } from "react-server-dom-webpack/client";

const rootEl = document.getElementById('root')
const root = createRoot(rootEl)

createFromFetch(fetch('/rsc')).then(comp => {
  root.render(comp)
})
