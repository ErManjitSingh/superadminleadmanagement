#!/usr/bin/env python3
"""Dev CORS proxy: Flutter web (localhost) -> Explore My Bharat API."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import sys

UPSTREAM = "https://crm.exploremybharat.info"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8091


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        origin = self.headers.get("Origin", "*")
        self.send_header("Access-Control-Allow-Origin", origin or "*")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header(
            "Access-Control-Allow-Headers",
            self.headers.get(
                "Access-Control-Request-Headers",
                "Content-Type, Authorization, x-tenant-subdomain",
            ),
        )
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        self.send_header("Vary", "Origin")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _proxy(self):
        url = UPSTREAM + self.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None
        headers = {}
        for key in ("Content-Type", "Authorization", "x-tenant-subdomain", "Accept"):
            val = self.headers.get(key)
            if val:
                headers[key] = val
        headers["User-Agent"] = "EmbFlutterDevProxy/1.0"
        req = Request(url, data=body, headers=headers, method=self.command)
        try:
            with urlopen(req, timeout=60) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self._cors()
                ctype = resp.headers.get("Content-Type")
                if ctype:
                    self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            self._cors()
            ctype = e.headers.get("Content-Type") if e.headers else None
            if ctype:
                self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except URLError as e:
            msg = str(e).encode()
            self.send_response(502)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(msg) + 20))
            self.end_headers()
            self.wfile.write(b'{"message":"' + msg.replace(b'"', b"'") + b'"}')

    def do_GET(self):
        self._proxy()

    def do_POST(self):
        self._proxy()

    def do_PUT(self):
        self._proxy()

    def do_PATCH(self):
        self._proxy()

    def do_DELETE(self):
        self._proxy()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"CORS proxy http://127.0.0.1:{PORT} -> {UPSTREAM}", flush=True)
    server.serve_forever()
