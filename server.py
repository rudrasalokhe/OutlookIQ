import http.server
import socketserver
import sys

PORT = 3000

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

class ThreadingServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

try:
    with ThreadingServer(("", PORT), NoCacheHTTPRequestHandler) as httpd:
        print(f"Serving OutlookIQ with NO-CACHE headers at http://localhost:{PORT}")
        sys.stdout.flush()
        httpd.serve_forever()
except Exception as e:
    print(f"Error starting server on port {PORT}: {e}")
    sys.stdout.flush()
