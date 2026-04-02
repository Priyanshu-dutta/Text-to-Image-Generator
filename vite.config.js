import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { pathToFileURL } from 'url'

// Custom plugin to run Vercel serverless functions during local Vite dev
const vercelLocalDevPlugin = (env) => ({
  name: 'vercel-local-dev',
  configureServer(server) {
    server.middlewares.use('/api/generate', async (req, res) => {
      try {
        // Ensure process.env uses loaded variables
        process.env = { ...process.env, ...env };

        // Read body dynamically
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        await new Promise(resolve => req.on('end', resolve));

        if (body) {
          try { req.body = JSON.parse(body); } catch (e) { req.body = body; }
        }

        // Polyfill Vercel response properties
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };
        res.send = (data) => res.end(data);

        // Dynamically import the API route module using absolute file path
        const apiPath = path.resolve(process.cwd(), 'api/generate.js');
        const apiFileUrl = pathToFileURL(apiPath).href + '?t=' + Date.now();
        const { default: handler } = await import(apiFileUrl);
        await handler(req, res);
      } catch (err) {
        console.error("Local Dev Server Error:", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), vercelLocalDevPlugin(env)],
    server: {}
  };
})
