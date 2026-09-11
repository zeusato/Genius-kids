import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '../contexts/StudentContext';
import { ScienceMenuScreen } from '../components/ScienceMenuScreen';
import { scienceFor, type ScienceId } from '../components/hub/catalog';

// Preserve the selected card across subject-page unmounts, scoped to each student.
const positions = new Map<string, { id: ScienceId; top: number }>();

export const ScienceMenuPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { setStudent } = useStudentActions();
    const studentId = currentStudent?.id;
    const grade = currentStudent?.grade;

    useEffect(() => {
        const saved = studentId ? positions.get(studentId) : undefined;
        if (!saved || !scienceFor(grade).some(item => item.id === saved.id)) return;
        const frame = requestAnimationFrame(() => {
            window.scrollTo({ top: saved.top, behavior: 'instant' });
            document.querySelector<HTMLButtonElement>('.hub-science [data-hub-card="' + saved.id + '"]')?.focus({ preventScroll: true });
        });
        return () => cancelAnimationFrame(frame);
    }, [studentId, grade]);

    const leave = (route: string) => {
        if (studentId) positions.delete(studentId);
        navigate(route);
    };
    const open = (id: ScienceId) => {
        const item = scienceFor(grade).find(item => item.id === id);
        if (!item) return;
        if (studentId) positions.set(studentId, { id, top: window.scrollY });
        navigate(item.route);
    };
    return <ScienceMenuScreen student={currentStudent} onSelect={open} onBack={() => leave('/mode')} onProfile={() => leave('/profile')} onShop={() => leave('/shop')} onLogout={() => { setStudent(null); leave('/'); }}/>;
};