// Mầm non: "Học bài" mở các hoạt động Mầm non có sẵn (docs/study-learn-plan.md mục 2.5).
export interface PreschoolLink { topic: 'counting' | 'colors'; activity: string }

export const MN_ACTIVITIES: Record<string, PreschoolLink[]> = {
    'mn.count': [{ topic: 'counting', activity: 'learn' }, { topic: 'counting', activity: 'count' }],
    'mn.numeral': [{ topic: 'counting', activity: 'learn' }, { topic: 'counting', activity: 'pick' }],
    'mn.more_less': [{ topic: 'counting', activity: 'compare' }],
    'mn.size': [{ topic: 'counting', activity: 'compare' }],
    'mn.combine': [{ topic: 'counting', activity: 'add' }],
    'mn.shapes2d': [{ topic: 'colors', activity: 'shapes' }],
    'mn.colors': [{ topic: 'colors', activity: 'learn' }, { topic: 'colors', activity: 'pick' }],
};

export const preschoolHref = (l: PreschoolLink) => `/preschool/${l.topic}?activity=${l.activity}`;
