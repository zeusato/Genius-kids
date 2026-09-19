import * as T from 'three';

const camera = new T.PerspectiveCamera();
camera.position.set(240, 270, 300); camera.lookAt(0, 0, 0);
export const spriteRotation = camera.quaternion.clone();
export const spriteUp = new T.Vector3(0, 1, 0).applyQuaternion(spriteRotation);
export const spriteRight = new T.Vector3(1, 0, 0).applyQuaternion(spriteRotation);

export function buildingSpritePose(w: number, d: number, aspect: number, alpha: { coverage: number; bottom: number; rootX: number }) {
    const width = (Math.abs(spriteRight.x) * w + Math.abs(spriteRight.z) * d) / alpha.coverage;
    const height = width * aspect;
    // Anchor the visible foot to the actual front corner on the ground. Projecting
    // this corner onto the camera plane loses depth and puts the foot below soil.
    const position = new T.Vector3(w / 2, 0, d / 2)
        .addScaledVector(spriteUp, height * (.5 - alpha.bottom))
        .addScaledVector(spriteRight, width * (.5 - alpha.rootX));
    return { width, height, position };
}
