// Chụp bộ nghiệm thu bằng Chromium headless riêng, không đụng hồ sơ trình duyệt thật.
// Chạy Vite port 5190 trước, rồi: node scripts/study-shots.mjs
// CHROME_PATH=/path/to/chrome STUDY_URL=http://127.0.0.1:5190/Genius-kids/
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const scenarios = ['home-new', 'home-progress', 'g1-home', 'mn-home', 'choice', 'compare', 'input', 'order', 'multi', 'mn', 'result', 'report', 'print'];
export const viewports = [{ width: 1180, height: 820 }, { width: 768, height: 1024 }, { width: 390, height: 844 }];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs/study-wow/shots');
const base = process.env.STUDY_URL || 'http://127.0.0.1:5190/Genius-kids/';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function connect(url) {
    const socket = new WebSocket(url), pending = new Map(), events = [];
    let next = 0;
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    socket.onmessage = event => {
        const message = JSON.parse(event.data);
        if (message.id) { const request = pending.get(message.id); pending.delete(message.id); if (!request) return; clearTimeout(request.timer); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result); }
        else events.push(message);
    };
    socket.onclose = () => { for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error('Chromium đã đóng')); } pending.clear(); };
    const call = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++next;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
        pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
    return { call, events, close: () => socket.close() };
}

async function run() {
    const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => p && existsSync(p));
    if (!chrome) throw new Error('Không tìm thấy Chromium; đặt CHROME_PATH.');
    await fetch(new URL('study-preview.html', base)).then(r => { if (!r.ok) throw new Error('Vite chưa sẵn sàng trên STUDY_URL'); });
    await mkdir(out, { recursive: true });
    const profile = await mkdtemp(path.join(tmpdir(), 'study-shots-'));
    const child = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--hide-scrollbars', '--mute-audio', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
    let cdp;
    try {
        let port;
        for (let i = 0; i < 100; i++) { try { port = Number((await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; } catch { await sleep(100); } }
        if (!port) throw new Error('Chromium không mở cổng kiểm thử');
        const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
        let target = targets.find(t => t.type === 'page');
        cdp = await connect(target.webSocketDebuggerUrl);
        await cdp.call('Page.enable'); await cdp.call('Runtime.enable'); await cdp.call('Log.enable');
        const evaluate = async expression => {
            const r = await cdp.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
            if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
            return r.result.value;
        };
        const ready = async () => {
            for (let i = 0; i < 100; i++) { if (await evaluate('!!document.querySelector(".study-home,.study-player,.study-result,.study-print")')) { await evaluate('document.fonts.ready.then(() => true)'); await sleep(180); return; } await sleep(100); }
            throw new Error('Màn Ôn Luyện không hiển thị: ' + JSON.stringify(await evaluate('({url:location.href,body:document.body.innerText.slice(0,500)})')));
        };
        const capture = async name => {
            await evaluate('Promise.all([...document.images].map(i => i.decode().catch(() => {})))');
            // Chụp trạng thái cuối, không chụp giữa hiệu ứng hiện lời giải / rung khi sai.
            await sleep(300);
            const data = await cdp.call('Page.captureScreenshot', { format: 'png' });
            await writeFile(path.join(out, name + '.png'), Buffer.from(data.data, 'base64'));
        };
        const measurements = [], allEvents = [];
        for (const [vi, size] of viewports.entries()) {
            if (vi > 0) {
                // Vite có hàng trăm ES module. Đóng renderer cũ sau mỗi cỡ màn hình
                // để Chromium không tích luỹ hàng nghìn request qua 39 lần điều hướng.
                allEvents.push(...cdp.events);
                const next = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
                cdp.close();
                await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
                target = next;
                cdp = await connect(target.webSocketDebuggerUrl);
                await cdp.call('Page.enable'); await cdp.call('Runtime.enable'); await cdp.call('Log.enable');
            }
            await cdp.call('Emulation.setDeviceMetricsOverride', { ...size, deviceScaleFactor: 1, mobile: false });
            for (const scenario of scenarios) {
                console.log(`${size.width}px: ${scenario}`);
                await cdp.call('Page.navigate', { url: new URL(`study-preview.html?case=${scenario}`, base).href });
                // Chờ đúng trang mới, tránh đọc DOM của màn trước khi điều hướng hoàn tất.
                for (let i = 0; i < 100; i++) { if (await evaluate(`location.search === ${JSON.stringify('?case=' + scenario)} && document.readyState === 'complete'`)) break; await sleep(100); }
                await ready();
                const measure = await evaluate('({ viewport: innerWidth, content: document.documentElement.scrollWidth })');
                measurements.push({ scenario, width: size.width, ...measure });
                if (measure.content > measure.viewport + 1) throw new Error(`Cuộn ngang: ${scenario}, ${size.width}px`);
                await capture(`${scenario}-${size.width}`);
                if (scenario === 'choice') {
                    await evaluate('document.querySelectorAll(".study-opt")[0].click()');
                    await evaluate('document.querySelector(".study-actions .study-btn").click()');
                    await capture(`retry-${size.width}`);
                    await evaluate('document.querySelectorAll(".study-opt")[2].click()');
                    await evaluate('document.querySelector(".study-actions .study-btn").click()');
                    await capture(`solution-${size.width}`);
                }
                if (scenario === 'print' && size.width === 1180) {
                    const pdf = await cdp.call('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
                    await writeFile(path.join(out, 'worksheet.pdf'), Buffer.from(pdf.data, 'base64'));
                }
            }
        }
        const errors = [...allEvents, ...cdp.events].filter(e => e.method === 'Runtime.exceptionThrown' || e.method === 'Log.entryAdded' && e.params.entry.level === 'error');
        await writeFile(path.join(out, 'checks.json'), JSON.stringify({ measurements, errors }, null, 2));
        if (errors.length) throw new Error(`Có ${errors.length} lỗi trình duyệt; xem checks.json`);
        await rm(path.join(out, 'failure.json'), { force: true });
        console.log(`Đã lưu bộ ảnh và PDF: ${out}`);
    } catch (error) {
        if (cdp) await writeFile(path.join(out, 'failure.json'), JSON.stringify({ error: String(error), events: cdp.events.filter(e => e.method === 'Runtime.exceptionThrown' || e.method === 'Log.entryAdded') }, null, 2));
        throw error;
    } finally {
        cdp?.close(); child.kill();
        const resolved = path.resolve(profile), prefix = path.resolve(tmpdir()) + path.sep + 'study-shots-';
        if (!resolved.startsWith(prefix)) throw new Error('Không xoá thư mục ngoài hồ sơ kiểm thử');
        // Chromium có thể còn giữ lock trong lúc thoát. Chỉ xoá đúng thư mục do lượt này tạo.
        await rm(resolved, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
    }
}
if (process.argv.includes('--list')) console.log(JSON.stringify({ scenarios, viewports }, null, 2));
else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run().catch(error => { console.error(error); process.exitCode = 1; });
