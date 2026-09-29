import React from 'react';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';

// ToneMappingMode.NEUTRAL của gói `postprocessing`
const TONE_MAPPING_NEUTRAL = 8;

// Hậu kỳ tier cao, chạy cả khi canvas trong suốt đè lên bảng DOM: vùng alpha 0 vẫn nhìn xuyên, quầng bloom
// (premultiplied alpha) cộng sáng lên ô DOM phía dưới — đã kiểm bằng bản thử 29/09.
// Composer tự tắt tone mapping của renderer → ToneMapping PHẢI ở cuối chuỗi (bài học Hệ Mặt Trời).
export default function Effects() {
    return (
        <EffectComposer multisampling={4}>
            <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.85} luminanceSmoothing={0.2} levels={6} />
            <ToneMapping mode={TONE_MAPPING_NEUTRAL} />
        </EffectComposer>
    );
}
