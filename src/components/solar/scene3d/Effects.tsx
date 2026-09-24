import React from 'react';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';

// ToneMappingMode.NEUTRAL của gói `postprocessing` (6.39) — gói đó chỉ là phụ thuộc gián tiếp
// nên không import trực tiếp enum
const TONE_MAPPING_NEUTRAL = 8;

// Bloom chọn lọc cho Mặt Trời: chỉ material của Mặt Trời/nhật hoa vượt luminance 1 (màu HDR)
// nên không cần Selection pass. Chunk lazy — tier thấp không bao giờ tải file này.
//
// LƯU Ý: EffectComposer tự đặt gl.toneMapping = NoToneMapping khi mount → PHẢI thêm <ToneMapping>
// cuối chuỗi, nếu không tier cao render KHÔNG có tone mapping (lệch màu với tier thấp, lõi Mặt
// Trời cháy trắng gắt). Dùng Khronos PBR Neutral cho CẢ hai tier (tier thấp đặt ở Scene3D.onCreated):
// giữ đúng màu texture hành tinh (quan trọng khi app cố ý dùng màu thật NASA), chỉ nén vùng rất sáng.
// multisampling=4: composer không dùng MSAA của canvas — thiếu dòng này là răng cưa trên màn dpr 1
// (máy bàn, máy chiếu lớp học).
export default function Effects() {
    return (
        <EffectComposer multisampling={4}>
            <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1} levels={6} />
            <ToneMapping mode={TONE_MAPPING_NEUTRAL} />
        </EffectComposer>
    );
}
