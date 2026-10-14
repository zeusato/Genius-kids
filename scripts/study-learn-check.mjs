// Nghiệm thu luồng thật bằng context/route thật, hồ sơ Chromium tạm biệt lập.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { connect } from './study-shots.mjs';

const pause = ms => new Promise(r => setTimeout(r, ms));
const dir = path.resolve('docs/study-learn');
const profile = await mkdtemp(path.join(tmpdir(), 'study-learn-check-'));
const child = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--mute-audio', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let cdp;
const checks = [];
try {
    let port;
    for (let i = 0; i < 100; i++) { try { port = Number((await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; } catch { await pause(100); } }
    if (!port) throw new Error('Chromium chưa sẵn sàng');
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
    cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await cdp.call('Page.enable'); await cdp.call('Runtime.enable'); await cdp.call('Log.enable');
    const evalJS = async expression => {
        const r = await cdp.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
    };
    const until = async expression => { for (let i = 0; i < 120; i++) { if (await evalJS(expression)) return; await pause(100); } throw new Error('Timeout: ' + expression + '\n' + await evalJS('document.body.innerText.slice(0,1800)')); };
    const click = async text => {
        await evalJS(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!b) throw Error('Không có nút: ' + ${JSON.stringify(text)}); b.click(); })()`);
        await pause(100);
    };
    const getProfile = () => evalJS('JSON.parse(localStorage.getItem("math_profiles"))[0]');
    const assert = (condition, label) => { if (!condition) throw new Error(label); checks.push(label); console.log(label); };
    await cdp.call('Page.navigate', { url: 'http://127.0.0.1:5190/Genius-kids/study-preview.html?case=integration' });
    await until('!!document.querySelector(".learn-reader")');
    const before = await getProfile();
    // Mở mọi trang trước Em thử qua nút điều hướng thật.
    while (!await evalJS('!!document.querySelector(".learn-try")')) await click('Trang tiếp');
    const finishTry = async (withHint = false) => {
        for (let i = 0; i < 3; i++) {
            await until('!!document.querySelector(".learn-try .study-qtext")');
            const answer = await evalJS(`(() => { const t=document.querySelector('.study-qtext').textContent.replace(/[\\s\\u00a0]/g,''); const m=t.match(/(\\d+):(\\d+)/); if(!m) throw Error('Không đọc được phép chia: '+t); return Number(m[1])/Number(m[2]); })()`);
            const select = async wrong => {
                await evalJS(`(() => {
                    const opts=[...document.querySelectorAll('.study-opt')];
                    const b=opts.find(b => {const value=Number(b.querySelector('span:last-child')?.textContent.replace(/[\\s\\u00a0]/g,'')); return ${wrong ? 'value !==' : 'value ==='} ${answer};});
                    if(b) b.click(); else {
                        const input=document.querySelector('.study-input input'); if(!input) throw Error('Không thấy đáp án');
                        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(${wrong ? answer + 1 : answer})); input.dispatchEvent(new Event('input',{bubbles:true}));
                    }
                })()`);
                await pause(80); await click('Trả lời');
            };
            if (withHint && i === 0) { await select(true); await until('!!document.querySelector(".study-feedback")'); }
            await select(false);
            await until(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()===${JSON.stringify(i < 2 ? 'Câu tiếp' : 'Xem kết quả')})`);
            await click(i < 2 ? 'Câu tiếp' : 'Xem kết quả');
        }
    };
    await finishTry(true);
    await until('document.body.innerText.includes("Em đã học xong bài")');
    const after = await getProfile();
    assert(after.learn.lessons['g4.div10'].star === 1, 'Hoàn thành bài qua giao diện và ghi sao');
    assert(after.stars === before.stars + 1, 'Nhận đúng 1 sao');
    assert(JSON.stringify(after.study) === JSON.stringify(before.study), 'Không đổi tiến độ luyện, lịch ôn, chuỗi ngày');
    assert(JSON.stringify(after.history) === JSON.stringify(before.history), 'Không thêm lịch sử kiểm tra');
    assert(JSON.stringify(after.ownedImageIds) === JSON.stringify(before.ownedImageIds), 'Không quay gacha');
    await click('Thử 3 câu khác'); await finishTry();
    assert((await getProfile()).stars === after.stars, 'Học lại không thưởng thêm sao');
    await click('Sang trang Ghi nhớ'); await click('Luyện kỹ năng này');
    await until('!!document.querySelector(".study-player")');
    assert((await evalJS('document.body.innerText')).includes('1/10'), 'Học → luyện mở phiên 10 câu');
    await cdp.call('Page.reload');
    await until('!!document.querySelector(".learn-reader")');
    assert((await getProfile()).learn.lessons['g4.div10'].star === 1, 'Tải lại vẫn giữ tiến độ và sao');
    const beforeSwitch = await getProfile();
    await click('Kiểm tra đổi hồ sơ');
    await until('document.querySelector("[data-owner-check]").dataset.ownerCheck === "rejected"');
    assert(JSON.stringify((await getProfile()).learn) === JSON.stringify(beforeSwitch.learn), 'Đổi hồ sơ chặn callback lưu cũ và cleanup của bài cũ');

    // Tìm không dấu, lọc Nâng cao, in và nối sổ tay về bài học.
    await cdp.call('Page.navigate', { url: 'http://127.0.0.1:5190/Genius-kids/study-preview.html?case=rules' });
    await until('!!document.querySelector(".learn-rules .learn-rule")');
    await evalJS(`(() => {const input=document.querySelector('input[type=search]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'chu vi');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await until('document.querySelectorAll(".learn-rules-group").length === 1');
    assert((await evalJS('document.querySelector(".learn-rules-group").textContent')).includes('Chu vi'), 'Tìm sổ tay bằng tiếng Việt không dấu');
    await evalJS('document.querySelector(".learn-rule-link").click()');
    await until('!!document.querySelector(".learn-reader")');
    assert(true, 'Mở đúng bài học từ sổ tay');
    const errors = cdp.events.filter(e => e.method === 'Runtime.exceptionThrown' || e.method === 'Log.entryAdded' && e.params.entry.level === 'error');
    assert(errors.length === 0, 'Không có lỗi console trong luồng tích hợp');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'integration-checks.json'), JSON.stringify({ checks, errors }, null, 2));
    await rm(path.join(dir, 'integration-failure.json'), { force: true });
} catch (error) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'integration-failure.json'), JSON.stringify({ error: String(error), checks, events: cdp?.events.filter(e => e.method === 'Runtime.exceptionThrown') }, null, 2));
    throw error;
} finally {
    cdp?.close(); child.kill();
    const resolved = path.resolve(profile), prefix = path.resolve(tmpdir()) + path.sep + 'study-learn-check-';
    if (!resolved.startsWith(prefix)) throw Error('Sai thư mục hồ sơ tạm');
    await rm(resolved, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
}
