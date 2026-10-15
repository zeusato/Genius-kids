import * as THREE from 'three';
import { random } from '../engine/document';

// Uneven slip and worn arcs give a rotationally symmetric wheel visible landmarks.
export function wheelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!, rnd = random(5128);
  ctx.fillStyle = '#c7b89c';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = i % 2 ? '#fff8df12' : '#66574610';
    ctx.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 3, 1 + rnd() * 3);
  }
  for (let i = 0; i < 38; i++) {
    const radius = 35 + rnd() * 215, start = rnd() * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(256, 256, radius, start, start + .25 + rnd() * 2.8);
    ctx.strokeStyle = i % 3 ? '#78695335' : '#fff3d759';
    ctx.lineWidth = i % 3 ? .7 + rnd() : 2 + rnd() * 5;
    ctx.stroke();
  }
  for (let i = 0; i < 14; i++) {
    const angle = rnd() * Math.PI * 2, radius = 155 + rnd() * 85;
    ctx.beginPath();
    ctx.ellipse(256 + Math.cos(angle) * radius, 256 + Math.sin(angle) * radius, 2 + rnd() * 7, 1 + rnd() * 3, angle, 0, Math.PI * 2);
    ctx.fillStyle = '#ede0c476';
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Seamless variations travel with the clay; the studio lights stay fixed.
export function claySurface() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!, pixels = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const angle = x / 256 * Math.PI * 2;
    const smear = Math.sin(angle * 3 + y * .025) * Math.cos(angle - y * .013);
    const rings = Math.sin(y * .68 + Math.sin(angle * 2) * .65);
    const value = 233 + smear * 14 + rings * 5;
    pixels.data.set([value, value, value, 255], (y * 256 + x) * 4);
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}
