import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '../contexts/StudentContext';
import { CraftMenuScreen } from '../components/CraftMenuScreen';
import { CRAFT_CATALOG, type CraftId } from '../components/hub/catalog';

const positions = new Map<string, { id: CraftId; top: number }>();

export function CraftMenuPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { setStudent } = useStudentActions();
    const studentId = currentStudent?.id;

    useEffect(() => {
        const saved = studentId ? positions.get(studentId) : undefined;
        const frame = requestAnimationFrame(() => {
            window.scrollTo({ top: saved?.top ?? 0, behavior: 'instant' });
            if (saved) document.querySelector<HTMLButtonElement>(`.crafts-grid [data-hub-card="${saved.id}"]`)?.focus({ preventScroll: true });
        });
        return () => cancelAnimationFrame(frame);
    }, [studentId]);

    const leave = (route: string) => {
        if (studentId) positions.delete(studentId);
        navigate(route);
    };
    const open = (id: CraftId) => {
        const entry = CRAFT_CATALOG.find(item => item.id === id);
        if (!entry) return;
        if (studentId) positions.set(studentId, { id, top: window.scrollY });
        navigate(entry.route);
    };
    return <CraftMenuScreen student={currentStudent} onSelect={open} onBack={() => leave('/mode')} onProfile={() => leave('/profile')} onShop={() => leave('/shop')} onLogout={() => { setStudent(null); leave('/'); }}/>;
}
