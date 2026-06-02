/** Copy into ~/.jupyter/jupyter_server_config.py (no leading dot). Restart Sage/Jupyter. */
export const JUPYTER_SERVER_CONFIG_SNIPPET = `# ~/.jupyter/jupyter_server_config.py — restart Sage/Jupyter after saving.

# Leave allow_origin empty (if set to one URL, allow_origin_pat is ignored).
c.ServerApp.allow_origin = ''

# GitHub Pages + local npm run dev (any localhost port):
c.ServerApp.allow_origin_pat = (
    r'(https://cable729\\.github\\.io|http://(localhost|127\\.0\\.0\\.1):\\d+)'
)
# Required for cross-origin API calls from the browser
c.ServerApp.disable_check_xsrf = True
`

/** Example of what to paste in Server settings (from \`jupyter server list\`). */
export const JUPYTER_URL_PASTE_EXAMPLE =
  'http://localhost:8888/lab/tree/YourNotebook.ipynb?token=…'

export const JUPYTER_URL_PASTE_HELP =
  'Paste the full line from `jupyter server list`, or your JupyterLab address bar (must include http:// and ?token=…).'
