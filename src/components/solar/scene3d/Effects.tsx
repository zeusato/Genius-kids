import React from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// Bloom chọn lọc cho Mặt Trời: chỉ material của Mặt Trời vượt luminance 1
// (toneMapped=false + màu HDR) nên không cần Selection pass.
// Chunk lazy — tier thấp không bao giờ tải file này.
export default function Effects() {
    return (
        <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.9} luminanceThreshold={1} levels={6} />
        </EffectComposer>
    );
}
