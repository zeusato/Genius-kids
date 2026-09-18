import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '../../src/contexts/StudentContext';
import FarmApp from '../../modules/farm/src/FarmApp';
import { profileFarmDatabase } from '../../modules/farm/src/adapters/profile';
import './entry.css';

export default function FarmEntry() {
    const { currentStudent, students } = useStudent();
    const { selectStudent } = useStudentActions();
    const [returningProfile] = useState(() => {
        try { return sessionStorage.getItem('lang-mam-host-profile'); } catch { return null; }
    });
    const navigate = useNavigate(), location = useLocation();
    useEffect(() => {
        if (currentStudent) {
            try { sessionStorage.setItem('lang-mam-host-profile', currentStudent.id); } catch { /* Play still works without session storage. */ }
        } else if (students.some(student => student.id === returningProfile)) selectStudent(returningProfile!);
    }, [currentStudent?.id, students, returningProfile, selectStudent]);
    useEffect(() => {
        const title = document.title, overflow = document.body.style.overflow;
        document.title = 'Làng Mầm · Nông trại của mình';
        document.body.style.overflow = 'hidden';
        return () => { document.title = title; document.body.style.overflow = overflow; };
    }, []);
    // Keep the route while profiles load; a generic auth redirect would discard OAuth codes.
    if (!currentStudent) return <main className="farm-root farm-host-welcome">
        <img src={`${import.meta.env.BASE_URL}hub/art/farm.webp`} alt="Nông trại giữa vườn rau, cối xay gió và hồ nước"/>
        <section><small>NÔNG TRẠI CỦA RIÊNG MÌNH</small><h1>Chào mừng về Làng Mầm</h1><p>Chọn hồ sơ để mở khu vườn của mình.</p>
            {students.map(student => <button key={student.id} onClick={() => selectStudent(student.id)}>{student.name}</button>)}
            <button onClick={() => navigate('/')}>{students.length ? 'Về trang chủ' : 'Tạo hồ sơ để bắt đầu'}</button>
        </section>
    </main>;
    const exit = () => location.state?.fromGames ? navigate(-1) : navigate('/game', { replace: true });
    return <FarmApp key={currentStudent.id} guestDatabaseName={profileFarmDatabase(currentStudent.id)} onExit={exit}/>;
}
