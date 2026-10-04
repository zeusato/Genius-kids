// Kiểm bản dist thật và service worker, không dùng fixture/route DEV.
// Chạy: vite preview --host 127.0.0.1 --port 5191, rồi node scripts/study-release-check.mjs
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { connect } from './study-shots.mjs';

const base = process.env.STUDY_URL || 'http://127.0.0.1:5191/Genius-kids/';
const dir = path.resolve('docs/study-learn/release');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = await mkdtemp(path.join(tmpdir(), 'study-release-'));
const child = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--mute-audio', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let cdp;
const checks = [];
try {
    let port;
    for (let i = 0; i < 100; i++) { try { port = Number((await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; } catch { await sleep(100); } }
    if (!port) throw Error('Chromium chưa sẵn sàng');
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
    cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await cdp.call('Page.enable'); await cdp.call('Runtime.enable'); await cdp.call('Network.enable');
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1180, height: 820, deviceScaleFactor: 1, mobile: false });
    const evaluate = async expression => {
        const r = await cdp.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
    };
    const until = async (expression, seconds = 20) => {
        for (let i = 0; i < seconds * 10; i++) { if (await evaluate(expression)) return; await sleep(100); }
        throw Error('Timeout: ' + expression + '\n' + await evaluate('document.body.innerText.slice(0,1600)'));
    };
    const assert = (condition, label) => { if (!condition) throw Error(label); checks.push(label); console.log(label); };
    const click = async text => {
        await evaluate(`(() => {const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Không tìm thấy nút');b.click();})()`);
        await sleep(100);
    };
    const navigate = async route => {
        await evaluate(`history.pushState({}, '', ${JSON.stringify(new URL(route, base).pathname + new URL(route, base).search)}); dispatchEvent(new PopStateEvent('popstate'));`);
        await sleep(180);
    };
    const select = async grade => {
        await navigate('');
        await until(`[...document.querySelectorAll('h3')].some(e=>e.textContent==='QA lớp ${grade}')`);
        await evaluate(`[...document.querySelectorAll('h3')].find(e=>e.textContent==='QA lớp ${grade}').closest('button').click()`);
        await until('location.pathname.endsWith("/mode")');
    };
    const readKid = () => evaluate('JSON.parse(localStorage.getItem("math_profiles")).find(p=>p.grade===4)');
    await mkdir(dir, { recursive: true });
    const fixtures = Array.from({ length: 6 }, (_, grade) => ({ id: `release-${grade}`, name: `QA lớp ${grade}`, grade, age: grade + 6, avatarId: 0,
        currentAvatarId: 'avatar_01', currentThemeId: 'theme_classic', stars: 24, ownedAvatarIds: ['avatar_01'], ownedThemeIds: ['theme_classic'], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [],
        study: { version: 1, skills: {}, review: [], days: {}, streak: 0, prefs: { tts: false } } }));
    await cdp.call('Page.addScriptToEvaluateOnNewDocument', { source: `if(location.origin===${JSON.stringify(new URL(base).origin)} && !localStorage.getItem('math_profiles')) localStorage.setItem('math_profiles',${JSON.stringify(JSON.stringify(fixtures))});` });
    await cdp.call('Page.navigate', { url: base });
    await until('!!navigator.serviceWorker.controller', 60);
    const cached = await evaluate(`(async()=>{const keys=[];for(const name of await caches.keys())for(const r of await (await caches.open(name)).keys())keys.push(r.url);return keys;})()`);
    assert(['mn', 'g1', 'g2', 'g3', 'g4', 'g5'].every(g => cached.some(u => new RegExp('/assets/' + g + '-[^/]+\\.js').test(u))), 'Service worker tải sẵn đủ 6 quyển bài học');
    await cdp.call('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await cdp.call('Network.setCacheDisabled', { cacheDisabled: true });
    // Các quyển chưa từng mở vẫn phải tải được qua service worker khi mất mạng.
    const lessons = ['mn.ordinal', 'g1.count10', 'g2.addsub100_c', 'g3.div_1digit', 'g4.div10', 'g5.sum_diff_ratio'];
    for (let grade = 0; grade <= 5; grade++) {
        await select(grade);
        await navigate(`study/learn/${lessons[grade]}`);
        await until('!!document.querySelector(".learn-reader")');
        assert(!await evaluate('document.body.innerText.includes("BẢN NHÁP")'), `Lớp ${grade}: mở bài production offline, không nhãn nháp`);
        await evaluate(`document.querySelector('button[aria-label="Về chủ đề"]').click()`);
        await until('!!document.querySelector(".learn-topic")');
        if (grade === 0) {
            assert(!await evaluate('document.body.innerText.includes("Bài học đang soạn")'), 'Mầm non: các bài nối hoạt động không còn báo đang soạn');
            await evaluate('document.querySelector(".learn-row .learn-row-actions button").click()');
            await until('location.pathname.includes("/preschool/counting")');
            assert(true, 'Mầm non: nút Học trong dòng kỹ năng mở hoạt động có sẵn');
        } else {
            await navigate('study/rules');
            await until('!!document.querySelector(".learn-rule-link")');
            assert(!await evaluate('document.body.innerText.includes("BẢN NHÁP")'), `Lớp ${grade}: sổ tay tải và mở được offline`);
        }
    }
    await select(4);
    await navigate('study/learn/g4.div10');
    await until('!!document.querySelector(".learn-reader")');
    const before = await readKid();
    while (!await evaluate('!!document.querySelector(".learn-try")')) await click('Trang tiếp');
    // Giả lập lỗi dung lượng ngay trước giao dịch nhận sao.
    await evaluate(`window.__restoreStorage=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='math_profiles')throw new DOMException('QA quota','QuotaExceededError');return window.__restoreStorage.call(this,k,v);}`);
    const finish = async () => {
        for (let i = 0; i < 3; i++) {
            const answer = await evaluate(`(()=>{const m=document.querySelector('.study-qtext').textContent.replace(/[\\s\\u00a0]/g,'').match(/(\\d+):(\\d+)/);if(!m)throw Error('Không đọc được đề');return Number(m[1])/Number(m[2]);})()`);
            await evaluate(`(()=>{const b=[...document.querySelectorAll('.study-opt')].find(b=>Number(b.querySelector('span:last-child')?.textContent.replace(/[\\s\\u00a0]/g,''))===${answer});if(b)b.click();else{const i=document.querySelector('.study-input input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'${answer}');i.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
            await sleep(80); await click('Trả lời'); await click(i < 2 ? 'Câu tiếp' : 'Xem kết quả');
        }
    };
    await finish();
    await until('document.body.innerText.includes("Lưu lại kết quả")');
    assert((await readKid()).stars === before.stars, 'Hết dung lượng: hiện lỗi và không ghi sao ảo');
    await evaluate('Storage.prototype.setItem=window.__restoreStorage;delete window.__restoreStorage;');
    await click('Lưu lại kết quả');
    await until('document.body.innerText.includes("Em đã học xong bài")');
    const after = await readKid();
    assert(after.stars === before.stars + 1 && after.learn.lessons['g4.div10'].star === 1, 'Lưu lại kết quả offline nhận đúng 1 sao');
    assert(JSON.stringify(after.study) === JSON.stringify(before.study) && JSON.stringify(after.history) === JSON.stringify(before.history) && JSON.stringify(after.ownedImageIds) === JSON.stringify(before.ownedImageIds), 'Học bài không đổi luyện tập, lịch sử hoặc bộ sưu tập');
    await click('Thử 3 câu khác'); await finish();
    assert((await readKid()).stars === after.stars, 'Học lại trên bản production không thưởng lặp');
    await click('Sang trang Ghi nhớ'); await click('Luyện kỹ năng này');
    await until('!!document.querySelector(".study-player")');
    assert(await evaluate('document.body.innerText.includes("1/10")'), 'Production: học → luyện đúng 10 câu');
    await cdp.call('Page.reload', { ignoreCache: true });
    await until('[...document.querySelectorAll("h3")].some(e=>e.textContent==="QA lớp 4")');
    await select(4); await navigate('study/learn/g4.div10?page=remember');
    await until('!!document.querySelector(".learn-reader")');
    assert((await readKid()).learn.lessons['g4.div10'].star === 1, 'Reload offline giữ tiến độ đã lưu');
    await navigate('study/rules'); await until('!!document.querySelector(".learn-rule-link")');
    for (const width of [1180, 768, 390, 320]) {
        await cdp.call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: false });
        await sleep(250);
        assert(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'), `Sổ tay production không tràn ngang ở ${width}px`);
        const shot = await cdp.call('Page.captureScreenshot', { format: 'png' });
        await writeFile(path.join(dir, `rules-${width}.png`), Buffer.from(shot.data, 'base64'));
    }
    const exceptions = cdp.events.filter(e => e.method === 'Runtime.exceptionThrown');
    assert(exceptions.length === 0, 'Không có ngoại lệ JavaScript trong luồng production/offline');
    await writeFile(path.join(dir, 'checks.json'), JSON.stringify({ checkedOn: '2026-10-04', checks, exceptions, cachedLessonChunks: cached.filter(u => /\/assets\/(mn|g[1-5])-[^/]+\.js/.test(u)) }, null, 2));
    await rm(path.join(dir, 'failure.json'), { force: true });
} catch (error) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'failure.json'), JSON.stringify({ error: String(error), checks, events: cdp?.events.filter(e => e.method === 'Runtime.exceptionThrown') }, null, 2));
    throw error;
} finally {
    cdp?.close(); child.kill();
    const resolved = path.resolve(profile), prefix = path.resolve(tmpdir()) + path.sep + 'study-release-';
    if (!resolved.startsWith(prefix)) throw Error('Sai thư mục kiểm thử');
    await rm(resolved, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
}
