import { createRoot } from 'react-dom/client';
import { createFromFetch } from 'react-server-dom-webpack/client';

window.__webpack_require__ = async (id) => {
  return import(id);
};

const rootEl = document.getElementById('root');
const root = createRoot(rootEl);

createFromFetch(fetch('/rsc')).then((comp) => {
  root.render(comp);
});
