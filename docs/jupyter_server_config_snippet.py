# Copy into ~/.jupyter/jupyter_server_config.py (no leading dot).
# Restart Sage / JupyterLab after saving.

# Leave allow_origin empty (if set to one URL, allow_origin_pat is ignored).
c.ServerApp.allow_origin = ''

# GitHub Pages + local npm run dev (any localhost port):
c.ServerApp.allow_origin_pat = (
    r'(https://cable729\.github\.io|http://(localhost|127\.0\.0\.1):\d+)'
)
# Required for cross-origin API calls from the browser
c.ServerApp.disable_check_xsrf = True
