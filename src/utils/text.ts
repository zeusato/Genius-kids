/** Bỏ dấu tiếng Việt (đ → d), chữ thường, gộp khoảng trắng — dùng cho tìm kiếm. */
export function normalizeVi(s: string): string {
    return s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase()
        .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
