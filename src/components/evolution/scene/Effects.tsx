import React from 'react';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';

// ToneMappingMode.NEUTRAL của gói `postprocessing`
const TONE_MAPPING_NEUTRAL = 8;

// Hậu kỳ tier cao (chunk lazy): Bloom cho nhựa sống, ngọn, mặt trước thời gian; Vignette; ToneMapping Neutral
// PHẢI ở cuối vì EffectComposer tắt tone mapping của renderer. Không N8AO, không DOF (bài học Tế bào).
export default function Effects() {
    return (
        <EffectComposer multisampling={4}>
            <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.62} luminanceSmoothing={0.25} levels={6} />
            <Vignette offset={0.32} darkness={0.62} />
            <ToneMapping mode={TONE_MAPPING_NEUTRAL} />
        </EffectComposer>
    );
}
