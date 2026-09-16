import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cancelSpeech } from '../../utils/speech';
import { useStudent } from '../../contexts/StudentContext';
import { activityFor, type PreschoolTopic } from './catalog';

/** Each activity has a URL; browser Back and the visible Back button share the same parent. */
export function usePreschoolActivity(topic: PreschoolTopic) {
    const [params, setParams] = useSearchParams(), location = useLocation(), navigate = useNavigate();
    const { currentStudent } = useStudent();
    const activity = activityFor(topic, params.get('activity'))?.id ?? null;
    const lastCard = useRef<{ id: string; y: number } | null>(null);
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            if (!activity && lastCard.current) {
                window.scrollTo({ top: lastCard.current.y, behavior: 'instant' });
                document.getElementById(`preschool-${topic}-${lastCard.current.id}`)?.focus({ preventScroll: true });
            } else {
                window.scrollTo({ top: 0, behavior: 'instant' });
                document.getElementById('preschool-title')?.focus({ preventScroll: true });
            }
        });
        return () => { cancelAnimationFrame(frame); cancelSpeech(); };
    }, [location.key, activity, topic]);
    const setActivity = (id: string) => {
        if (!activityFor(topic, id)) return;
        lastCard.current = { id, y: window.scrollY };
        setParams({ activity: id }, { state: { preschoolParent: location.pathname, preschoolOwner: currentStudent?.id } });
    };
    const back = () => {
        if (location.state?.preschoolParent === location.pathname && location.state?.preschoolOwner === currentStudent?.id) navigate(-1);
        else setParams({}, { replace: true });
    };
    return { activity, setActivity, back };
}
