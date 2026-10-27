"""Local test server. Retell credentials never leave the server."""
import json
import subprocess
import os
import time
import threading
import urllib.request
import urllib.error
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parent
AGENT_ID = os.environ.get('RETELL_AGENT_ID', 'agent_71e55befe1d7f8c935338a625d')
lock = threading.Lock()
last_call = 0
PUBLIC_FILES = {'/': 'index.html', '/index.html': 'index.html', '/style.css': 'style.css', '/reference.css': 'public/reference.css', '/app.js': 'app.js', '/chat.js': 'chat.js', '/voice.bundle.js': 'dist/voice.bundle.js'}

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass  # Never log credentials or upstream bodies.

    def reply(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/api/voice/status':
            return self.reply(200, {'configured': bool(os.environ.get('RETELL_API_KEY'))})
        name = PUBLIC_FILES.get(path)
        if path.startswith('/images/'):
            candidate = (ROOT / 'public' / path.lstrip('/')).resolve()
            if candidate.is_relative_to(ROOT / 'public' / 'images') and candidate.is_file():
                name = str(candidate.relative_to(ROOT))
        if not name:
            return self.reply(404, {'error': 'Not found'})
        self.path = '/' + name
        return super().do_GET()

    def do_HEAD(self):
        if self.path.split('?')[0] not in PUBLIC_FILES:
            return self.reply(404, {'error': 'Not found'})
        super().do_HEAD()

    def do_POST(self):
        global last_call
        if self.path == '/api/chat':
            try:
                size = int(self.headers.get('Content-Length', '0'))
                if size <= 0 or size > 16384:
                    return self.reply(400, {'error': 'Invalid chat request size.'})
                body = json.loads(self.rfile.read(size))
                result = subprocess.run(
                    ['node', '--use-env-proxy', str(ROOT / 'local-chat.mjs')],
                    input=json.dumps({'method': 'POST', 'headers': {k.lower(): v for k, v in self.headers.items()}, 'body': body}),
                    capture_output=True, text=True, timeout=30, cwd=ROOT)
                if result.returncode:
                    return self.reply(502, {'error': 'Chat is temporarily unavailable.'})
                response = json.loads(result.stdout)
                return self.reply(response['code'], response['data'])
            except (ValueError, OSError, subprocess.TimeoutExpired):
                return self.reply(502, {'error': 'Unable to process this chat request.'})
        if self.path != '/api/voice/call':
            return self.reply(404, {'error': 'Not found'})
        # Require a same-origin browser request; this is a private test endpoint.
        if self.headers.get('X-Receptionist-Request') != '1' or self.headers.get('Sec-Fetch-Site') not in (None, 'same-origin'):
            return self.reply(403, {'error': 'Please start the call from this website.'})
        key = os.environ.get('RETELL_API_KEY')
        if not key:
            return self.reply(503, {'error': 'Retell credentials are not available on the server.'})
        with lock:
            if time.monotonic() - last_call < 30:
                return self.reply(429, {'error': 'Please wait 30 seconds before starting another call.'})
            last_call = time.monotonic()
        request = urllib.request.Request('https://api.retellai.com/v3/create-web-call',
            data=json.dumps({'agent_id': AGENT_ID, 'retell_llm_dynamic_variables': {'website_browser_call': 'true'}}).encode(),
            headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}, method='POST')
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                data = json.load(response)
            token = data.get('access_token')
            if not token:
                return self.reply(502, {'error': 'Retell did not return a browser-call token.'})
            return self.reply(200, {k: data[k] for k in ('access_token', 'call_id', 'transport', 'url', 'ice_servers') if k in data})
        except urllib.error.HTTPError as error:
            return self.reply(502, {'error': f'Retell could not create the call (HTTP {error.code}).'})
        except (OSError, ValueError):
            return self.reply(502, {'error': 'Unable to reach Retell. Please try again shortly.'})

if __name__ == '__main__':
    os.chdir(ROOT)
    ThreadingHTTPServer(('0.0.0.0', int(os.environ.get('PORT', '3000'))), Handler).serve_forever()
