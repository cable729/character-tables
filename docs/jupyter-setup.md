# Connecting Character Tables to local Jupyter / Sage

The hosted app (**https://cable729.github.io/character-tables/**) and `npm run dev` both talk to **Jupyter on your machine** using the same supported stack as JupyterLab: [`@jupyterlab/services`](https://jupyterlab.readthedocs.io/en/stable/api/modules/services.html) + [token auth](https://jupyter-server.readthedocs.io/en/latest/operators/security.html) + **CORS** on the Jupyter side.

There is no local-only proxy. If the browser console shows `Access-Control-Allow-Origin missing` while status is `200`, Jupyter is running but **has not been configured to allow this app’s origin**.

## One-time setup (every machine)

### 1. Jupyter CORS + XSRF (required for GitHub Pages and local dev)

Copy [jupyter_server_config_snippet.py](jupyter_server_config_snippet.py) into **`~/.jupyter/jupyter_server_config.py`** (no leading dot — not `.jupyter_server_config.py`). Or paste:

```python
# Leave allow_origin empty (if set to one URL, allow_origin_pat is ignored).
c.ServerApp.allow_origin = ''

# GitHub Pages + local npm run dev (any localhost port):
c.ServerApp.allow_origin_pat = (
    r'(https://cable729\.github\.io|http://(localhost|127\.0\.0\.1):\d+)'
)
# Required for cross-origin API calls from the browser
c.ServerApp.disable_check_xsrf = True
```

If you set `allow_origin = 'https://cable729.github.io'` **instead of** leaving it empty, Jupyter ignores `allow_origin_pat` and local dev fails with `Access-Control-Allow-Origin does not match`.

**Restart Sage / JupyterLab** (quit completely, then start again from the GUI or terminal).

| Setting | Purpose |
|---------|---------|
| `allow_origin = ''` | Must be empty so `allow_origin_pat` is used |
| `allow_origin_pat` | Regex matching **both** GitHub Pages and localhost ports |
| `disable_check_xsrf` | Browser app may POST/WebSocket cross-origin |

### 2. API token (default on most installs)

In a terminal:

```bash
jupyter server list
```

Paste the **full URL** into **Server settings** — for example:

```text
http://localhost:8888/lab/tree/YourNotebook.ipynb?token=abc123…
```

A `/lab/tree/…` URL from the address bar is fine; a line from `jupyter server list` like `http://localhost:8888/?token=…` is fine too. The app uses `http://localhost:8888/` plus the token.

The token is often **only** in that output (JupyterLab uses a cookie in the browser; Character Tables is a separate site).

## Daily use

1. Start Sage/Jupyter (GUI is fine).
2. Open **https://cable729.github.io/character-tables/** (or `npm run dev`).
3. **Server settings** → paste URL from `jupyter server list` → **Connect** → **Test Sage**.

Numeric and symbolic spot-checks (orthogonality, θ sums, degrees, etc.) run **only in the Sage kernel** — pass/fail badges stay blocked until you connect. Structural checks (trivial row/column) still run in the browser.

Sage check code lives under [`sage/lib/character_tables.sage`](../sage/lib/character_tables.sage); the app bundles it into one kernel execute per table change.

## Browser notes (GitHub Pages → localhost)

- Chrome may show a **local network** permission prompt the first time a public HTTPS site contacts `http://localhost:8888`. Allow it.
- The app always connects to **`http://localhost:8888/`** (or `127.0.0.1`) on your machine, not to a server in the cloud.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Console: `CORS header missing`, status 200 | Often **no token** on the request (Jupyter 404 without CORS headers) | Paste full URL from `jupyter server list` |
| Jupyter log: `Blocking Cross Origin` + `404 GET /api/status` | Request without token | Paste full URL; restart Jupyter after fixing config filename |
| Config file named `.jupyter_server_config.py` | Hidden file — Jupyter ignores it | Rename to `jupyter_server_config.py` (no dot) |
| `403 GET /api/status` | Missing/invalid token | `jupyter server list` → paste URL |
| Connect works in Lab but not in app | Cookie vs token | Paste token URL in app |
| No Sage kernel | Kernelspec missing | Install Sage Jupyter kernel, restart |

## Not used

- Vite dev proxy (local-only; does not help GitHub Pages)
- Cloud Sage backend
- Full Sage in the browser (experimental)

## Long-term: JupyterLab extension

A Lab extension (same origin as Jupyter) avoids CORS entirely. The standalone site + config above is the supported model until that exists.
