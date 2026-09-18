import { useEffect, useRef, useState } from 'react';
import { ASSETS, CROPS } from '../core/catalog';
import { catalogThumbnail, thumbnailKey, type ThumbnailSubject } from '../render/catalogThumbnails';

export function CatalogPicture(props: ThumbnailSubject) {
    const ref = useRef<HTMLSpanElement>(null), key = thumbnailKey(props);
    const [image, setImage] = useState<{ key: string; url: string } | null>(null), [failed, setFailed] = useState(false);
    const name = 'crop' in props ? CROPS[props.crop].name : ASSETS[props.asset].name;
    useEffect(() => {
        let live = true; setFailed(false);
        const load = () => void catalogThumbnail(props).then(url => { if (live) setImage({ key, url }); }, () => { if (live) setFailed(true); });
        const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { observer.disconnect(); load(); } }, { rootMargin: '160px' });
        if (ref.current) observer.observe(ref.current);
        return () => { live = false; observer.disconnect(); };
    }, [key]);
    return <span ref={ref} className="farm-catalog-picture">{image?.key === key ? <img src={image.url} alt={'crop' in props ? `${name} khi trưởng thành` : `Hình ${name}`} draggable={false}/> : <span className="farm-picture-loading">{failed ? 'Chưa tải được ảnh' : 'Đang mở mẫu…'}</span>}</span>;
}
