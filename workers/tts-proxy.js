/**
 * Cloudflare Worker — proxy đọc Google Translate TTS cho Genius Kids.
 *
 * Vì sao cần: GitHub Pages là hosting tĩnh, không chạy được proxy server-side.
 * Gọi thẳng translate.google.com/translate_tts từ trình duyệt sẽ bị Google chặn 403.
 * Worker này đứng giữa — nhận đúng query string như proxy dev (/api/tts trong
 * vite.config.ts), fetch Google với User-Agent giả lập trình duyệt, rồi trả audio/mpeg.
 *
 * CÁCH TRIỂN KHAI (dashboard):
 *   1. dash.cloudflare.com → Workers & Pages → Create → Create Worker.
 *   2. Đặt tên (vd "genius-tts") → Deploy (lấy bản mẫu).
 *   3. Edit code → xoá hết → dán toàn bộ file này → Deploy.
 *   4. Copy URL Worker (vd https://genius-tts.<account>.workers.dev).
 *   5. GitHub repo → Settings → Secrets and variables → Actions → tab "Variables"
 *      → New repository variable: name = VITE_TTS_PROXY, value = URL Worker ở bước 4.
 *   6. Chạy lại deploy (push lên main hoặc Actions → Run workflow).
 *
 * Lưu ý: translate_tts là endpoint không chính thức; gọi từ IP datacenter có thể bị
 * Google rate-limit. App đã có fallback (MP3 / giọng thiết bị) nếu Worker lỗi.
 */

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export default {
  async fetch(request) {
    // Audio element chỉ gọi bằng GET.
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const incoming = new URL(request.url);
    const qs = incoming.search; // giữ nguyên encoding: '?ie=UTF-8&q=...&tl=vi&client=tw-ob'
    if (!qs) {
      return new Response('Missing query string', { status: 400 });
    }

    const googleUrl = `https://translate.google.com/translate_tts${qs}`;

    let upstream;
    try {
      upstream = await fetch(googleUrl, {
        headers: {
          'User-Agent': BROWSER_UA,
          'Referer': 'https://translate.google.com/',
        },
      });
    } catch (e) {
      return new Response('Upstream fetch failed', { status: 502 });
    }

    if (!upstream.ok) {
      return new Response('Upstream error: ' + upstream.status, { status: upstream.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Access-Control-Allow-Origin', '*'); // an toàn cho mọi cách gọi
    return new Response(upstream.body, { status: 200, headers });
  },
};
