"""Local preview that behaves like GitHub Pages: /pieces serves pieces.html, a
missing page gets 404.html, and audio answers range requests, which the stream
needs to join a piece partway through. python3 tools/serve.py → localhost:8766."""
import http.server, os, re, sys

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

class Pages(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.path.split('?')[0].split('#')[0]
        local = self.translate_path(path)
        if not os.path.exists(local) and os.path.exists(local + '.html'):
            self.path = path + '.html'
        elif not os.path.exists(local):
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            body = open('404.html', 'rb').read()
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return None
        m = re.match(r'bytes=(\d*)-(\d*)$', self.headers.get('Range', ''))
        if m and os.path.isfile(local):
            size = os.path.getsize(local)
            start = int(m[1]) if m[1] else max(0, size - int(m[2]))
            end = int(m[2]) if m[1] and m[2] else size - 1
            end = min(end, size - 1)
            f = open(local, 'rb')
            f.seek(start)
            self.send_response(206)
            self.send_header('Content-Type', self.guess_type(local))
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.send_header('Content-Length', str(end - start + 1))
            self.end_headers()
            self.range_left = end - start + 1
            return f
        return super().send_head()

    def copyfile(self, source, outputfile):
        left = getattr(self, 'range_left', None)
        if left is None:
            return super().copyfile(source, outputfile)
        try:
            while left > 0:
                chunk = source.read(min(65536, left))
                if not chunk:
                    break
                outputfile.write(chunk)
                left -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass
        self.range_left = None

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
http.server.ThreadingHTTPServer(('127.0.0.1', port), Pages).serve_forever()
