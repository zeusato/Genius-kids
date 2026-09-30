import React from 'react';
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';

// ToneMappingMode.NEUTRAL của gói `postprocessing`.
const TONE_MAPPING_NEUTRAL = 8;

/**
 * Hậu kỳ tier cao: chỉ dây tóc, electron và LED (màu > 1) vượt ngưỡng bloom; mặt bàn kem dưới ngưỡng
 * nên không trắng xóa. Composer tự tắt tone mapping của renderer → ToneMapping phải đứng cuối chuỗi.
 */
export default function Effects() {
    return (
        <EffectComposer multisampling={4}>
            <Bloom mipmapBlur intensity={0.9} luminanceThreshold={1.55} luminanceSmoothing={0.25} radius={0.6} levels={7} />
            <ToneMapping mode={TONE_MAPPING_NEUTRAL} />
        </EffectComposer>
    );
}
