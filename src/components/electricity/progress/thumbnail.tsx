import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CircuitDocument } from './notebook';
import { CircuitThumbnail } from '../ui/CircuitThumbnail';
/** Thumbnails are disposable cache; failing to encode never loses a circuit. */
export async function makeThumbnail(doc: CircuitDocument): Promise<Blob> {
    const svg = renderToStaticMarkup(<CircuitThumbnail circuit={doc.circuit} title={doc.title}/>).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url; });
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 160;
        canvas.getContext('2d')!.drawImage(img, 0, 7, 256, 146);
        return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('thumbnail unavailable')), 'image/webp', .75));
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
