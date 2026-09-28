import React from 'react';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { COMPOSER_MSAA } from './params';

// ToneMappingMode.NEUTRAL của gói `postprocessing` — phụ thuộc gián tiếp nên không import enum
const TONE_MAPPING_NEUTRAL = 8;

// Hậu kỳ tier cao (chunk lazy — tier thấp không bao giờ tải):
//  - Bloom: chỉ vật liệu có emissive vượt ngưỡng (ATP, ribôxôm, vi ống, mép cửa sổ) mới toả sáng
//  - Vignette: dồn ánh nhìn vào giữa như nhìn qua thị kính
//  - ToneMapping Neutral: EffectComposer tự tắt tone mapping của renderer → PHẢI có ở cuối chuỗi
//    (bài học solar/Effects.tsx), Neutral giữ đúng màu sách giáo khoa của bào quan.
// KHÔNG dùng N8AO: shader AO có vòng lặp mẫu, ANGLE/D3D11 unroll rồi biên dịch mất ~2 s MỖI pass
// ngay trong vòng render (đo trên Iris Xe: 5 frame đứng hình 2 s lúc mới vào) — độ sâu đã có sương
// mù, viền fresnel và vỏ trong như thạch lo.
// multisampling=4 vì composer không dùng MSAA của canvas.
export default function Effects() {
    return (
        <EffectComposer multisampling={COMPOSER_MSAA}>
            <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.82} luminanceSmoothing={0.22} levels={6} />
            <Vignette offset={0.3} darkness={0.58} />
            <ToneMapping mode={TONE_MAPPING_NEUTRAL} />
        </EffectComposer>
    );
}
