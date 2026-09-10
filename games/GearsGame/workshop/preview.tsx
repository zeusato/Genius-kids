import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { StudentProfile } from '../../../types';
import Workshop from './Workshop';
import { completeWorkshop } from './progress';
const initial:StudentProfile={id:'gears-preview',name:'Minh Anh',grade:3,age:9,avatarId:0,currentAvatarId:'avatar_01',currentThemeId:'default',stars:0,ownedAvatarIds:[],ownedThemeIds:[],ownedImageIds:[],history:[],gameHistory:[],shopDailyPhotos:[],achievements:[]};
function Preview(){const [student,setStudent]=useState(initial),ref=useRef(student);ref.current=student;return <Workshop preview student={student} complete={(_id,record,seconds)=>{const result=completeWorkshop(ref.current,record,seconds);if(result.ok){ref.current=result.profile;setStudent(result.profile);}return result;}} onBack={()=>{location.href='/Genius-kids/';}}/>;}
if(import.meta.env.DEV)createRoot(document.getElementById('root')!).render(<Preview/>);
