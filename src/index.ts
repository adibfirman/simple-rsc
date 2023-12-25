import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { build as esbuild } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
import * as ReactServerDOM from 'react-server-dom-webpack/server.browser';
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'es-module-lexer';
import { relative } from 'node:path';

const app = new Hono();
const clientComponents = {};

app.get('/build/*', serveStatic({ root: './src' }));

app.get('/', (c) => {
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
  `);
});

app.get('/rsc', async () => {
  // @ts-expect-error
  const mainApp = await import('./build/index.js');
  const mainPage = createElement(mainApp.default);
  const stream = ReactServerDOM.renderToReadableStream(
    mainPage,
    clientComponents,
  );

  return new Response(stream);
});

async function build() {
  const clientEntryPoints = new Set();

  await esbuild({
    bundle: true,
    format: 'esm',
    logLevel: 'error',
    entryPoints: [resolveApp('./index.tsx')],
    outdir: resolveBuild(),
    // skip external package from NPM
    packages: 'external',
    plugins: [
      {
        name: 'resolve-client-imports',
        setup(build) {
          build.onResolve(
            { filter: /\.tsx$/ }, // read the index.tsx
            async ({ path: relativePath }) => {
              const path = resolveApp(relativePath);
              const contents = await readFile(path, 'utf-8');

              if (contents.startsWith("'use client'")) {
                clientEntryPoints.add(path);
                return {
                  external: true,
                  path: relativePath.replace(/\.tsx$/, '.js'),
                };
              }
            },
          );
        },
      },
    ],
  });

  const { outputFiles } = await esbuild({
    bundle: true,
    format: 'esm',
    logLevel: 'error',
    entryPoints: [resolveApp('./_client.tsx'), ...clientEntryPoints],
    outdir: resolveBuild(),
    splitting: true,
    plugins: [],
    write: false,
  });

  outputFiles.forEach(async (file) => {
    const [, exports] = parse(file.text);
    let newContents = file.text;

    for (const exp of exports) {
      const key = file.path + exp.n;

      clientComponents[key] = {
        id: `/build/${relative(resolveBuild(), file.path)}`,
        name: exp.n,
        chunks: [],
        async: true,
      };

      newContents += `
${exp.ln}.$$typeof = Symbol.for('react.client.reference');
${exp.ln}.$$id = ${JSON.stringify(key)};
      `;
    }

    await writeFile(file.path, newContents);
  });
}

function resolveApp(path = '') {
  const appDir = new URL('./app/', import.meta.url);
  return fileURLToPath(new URL(path, appDir));
}

function resolveBuild(path = '') {
  const buildDir = new URL('./build/', import.meta.url);
  return fileURLToPath(new URL(path, buildDir));
}

serve(app, async (info) => {
  await build();
  console.log('Listening on', info.port);
});
