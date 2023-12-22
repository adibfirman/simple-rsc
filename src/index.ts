import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { build as esbuild } from "esbuild";
import { fileURLToPath } from "node:url";
import { createElement } from 'react';
import { serveStatic } from "@hono/node-server/serve-static";
import * as ReactServerDOM from "react-server-dom-webpack/server.browser";

const app = new Hono()

app.get('/build/*', serveStatic({ root: './src' }))

app.get('/', c => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/build/_client.js"></script>
    </body>
    </html>
  `)
})

app.get('/rsc', async () => {
  // @ts-expect-error
  const mainApp = await import('./build/index.js')
  const stream = ReactServerDOM.renderToReadableStream(createElement(mainApp.default))

  return new Response(stream)
}) 

async function build() {
  await esbuild({
    bundle: true,
    format: 'esm',
    logLevel: 'error',
    entryPoints: [resolveApp('./index.tsx')],
    outdir: resolveBuild(),
    // skip external package from NPM
    packages: "external",
  })

  await esbuild({
    bundle: true,
    format: 'esm',
    logLevel: 'error',
    entryPoints: [resolveApp('./_client.tsx')],
    outdir: resolveBuild(),
    splitting: true,
    plugins: []
  })
}

function resolveApp(path = '') {
  const appDir = new URL('./app/', import.meta.url)
  return fileURLToPath(new URL(path, appDir))
}

function resolveBuild(path = '') {
  const buildDir = new URL('./build/', import.meta.url)
  return fileURLToPath(new URL(path, buildDir))
}

serve(app, async info => {
  await build();
  console.log('Listening on', info.port)
})
