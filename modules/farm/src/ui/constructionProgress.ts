export function constructionProgress(job: { readyAt: number; duration: number; waitingFor?: string }, now: number) {
    const remaining = Math.max(0, job.readyAt - now);
    return { remaining, percent: job.waitingFor ? 0 : Math.round(Math.max(0, Math.min(1, 1 - remaining / Math.max(1, job.duration))) * 100) };
}
export function countdown(ms: number) {
    const total = Math.max(0, Math.ceil(ms / 1000)), days = Math.floor(total / 86400);
    const hours = Math.floor(total % 86400 / 3600), minutes = Math.floor(total % 3600 / 60), seconds = total % 60;
    return `${days ? `${days}n ` : ''}${hours || days ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
