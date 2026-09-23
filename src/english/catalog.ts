import type { Level } from '../data/english/schema';
export const LEVELS: Level[] = ['K','A1','A2','A3','B1','B2','B3','B4','C1','C2','C3'];
export const LEVEL_STORIES: Record<Level,string> = {
  K:'Chữ cái và những từ đầu tiên', A1:'Hello! Mình là ai?', A2:'Danh từ và mạo từ',
  A3:'Miêu tả và sở hữu', B1:'Thói quen mỗi ngày', B2:'Điều đang diễn ra',
  B3:'Chuyện đã qua', B4:'Dự định ngày mai', C1:'Cùng đặt câu hỏi',
  C2:'Nối ý và chỉ vị trí', C3:'Đọc hiểu và viết lại',
};
export const LEVEL_NAMES: Record<Level,string> = {
  K:'Chữ cái & từ vựng đầu tiên', A1:'Đại từ nhân xưng & động từ to be', A2:'Danh từ & mạo từ',
  A3:'Tính từ & sở hữu', B1:'Thì hiện tại đơn', B2:'Thì hiện tại tiếp diễn',
  B3:'Thì quá khứ đơn', B4:'Thì tương lai & ôn tập 4 thì', C1:'Câu hỏi Wh-',
  C2:'Giới từ & liên từ', C3:'Đọc hiểu & viết lại câu',
};
export const LEVEL_OUTLINES: Record<Level,string> = {
  K:'ABC · số đếm · màu sắc · lời chào', A1:'I / you / he / she · am / is / are · this / that',
  A2:'Số ít, số nhiều · a / an / the · there is / are', A3:'Miêu tả · my / your / his / her · sở hữu cách',
  B1:'Thói quen · V-s/es · do / does', B2:'Hành động đang diễn ra · am / is / are + V-ing',
  B3:'Chuyện đã qua · was / were · V-ed · did', B4:'Will · be going to · phân biệt các thì',
  C1:'What / where / when / who / why / how', C2:'Vị trí, thời gian · and / but / because / so',
  C3:'Tìm ý và chi tiết · trả lời ngắn · biến đổi câu',
};
export const requiredSkills: Record<Level,string[]> = {
  K:[], A1:['be-affirmative','be-negative','be-question','be-short-answer','demonstratives'],
  A2:['a-an','plural-regular-s','plural-es-ies','plural-irregular','there-is-are','the-determiners'],
  A3:['adj-predicate','adj-attributive','possessive-determiner','possessive-case','whose-question'],
  B1:['third-person-s','first-second-person','negative-don-doesnt','question-do-does','adverbs-frequency'],
  B2:['affirmative','negative','yes-no-question','present-simple-continuous-contrast'],
  B3:['was-were','was-were-question','was-were-short-answer','regular-ed','irregular-past','did-support-negative','did-question'],
  B4:['will-affirmative','will-negative','will-question','be-going-to','review-present-simple','review-present-continuous','review-past-simple','review-future'],
  C1:['what','where','when','who','why','how','how-old','how-many','how-much','which','whose'],
  C2:['preposition-place','preposition-time','preposition-direction','conjunction-and','conjunction-but','conjunction-or','conjunction-so','conjunction-because'],
  C3:['reading-mcq','reading-tf','reading-short','affirm-neg','neg-affirm','statement-question','contraction','synonym','word-order'],
};
export const skillId = (s: string) => s === 'adj-predicative' ? 'adj-predicate' : s;
export const isLevel = (s: string | null | undefined): s is Level => LEVELS.includes(s as Level);
export const SKILL_TITLES:Record<string,string> = {
 'vocab-meaning':'Ghép nghĩa','vocab-spelling':'Xếp chữ và đánh vần','vocab-picture':'Ghép từ với hình','vocab-listen':'Nghe và chọn từ',letters:'Chữ cái',phrases:'Cụm từ giao tiếp',
 'be-affirmative':'Câu khẳng định','be-negative':'Câu phủ định','be-question':'Câu hỏi','be-short-answer':'Trả lời ngắn',demonstratives:'This, that, these, those',
 'a-an':'A và an','plural-regular-s':'Số nhiều thêm -s','plural-es-ies':'Số nhiều -es / -ies','plural-irregular':'Số nhiều bất quy tắc','there-is-are':'There is / There are','the-determiners':'The và từ hạn định',
 'adj-predicate':'Tính từ sau be','adj-attributive':'Tính từ trước danh từ','possessive-determiner':'Từ hạn định sở hữu','possessive-case':'Sở hữu cách','whose-question':'Hỏi với whose',
 'third-person-s':'Ngôi thứ ba số ít','first-second-person':'I, you, we, they','negative-don-doesnt':"Don't / Doesn't",'question-do-does':'Câu hỏi do / does','adverbs-frequency':'Trạng từ tần suất',
 affirmative:'Câu khẳng định',negative:'Câu phủ định','yes-no-question':'Câu hỏi có / không','present-simple-continuous-contrast':'Hiện tại đơn và tiếp diễn',
 'was-were':'Was / Were','was-were-question':'Câu hỏi was / were','was-were-short-answer':'Trả lời ngắn với was / were','regular-ed':'Quá khứ thêm -ed','irregular-past':'Quá khứ bất quy tắc','did-support-negative':"Phủ định với didn't",'did-question':'Câu hỏi với did',
 'will-affirmative':'Khẳng định với will','will-negative':'Phủ định với will','will-question':'Câu hỏi với will','be-going-to':'Dự định với going to','review-present-simple':'Ôn hiện tại đơn','review-present-continuous':'Ôn hiện tại tiếp diễn','review-past-simple':'Ôn quá khứ đơn','review-future':'Ôn tương lai',
 'preposition-place':'Giới từ vị trí','preposition-time':'Giới từ thời gian','preposition-direction':'Giới từ hướng',
 'conjunction-and':'Nối với and','conjunction-but':'Nối với but','conjunction-or':'Nối với or','conjunction-so':'Nối với so','conjunction-because':'Nối với because',
 'reading-mcq':'Đọc và chọn đáp án','reading-tf':'Đọc và nhận định','reading-short':'Đọc và trả lời ngắn','affirm-neg':'Khẳng định → phủ định','neg-affirm':'Phủ định → khẳng định','statement-question':'Chuyển thành câu hỏi',contraction:'Dạng viết tắt',synonym:'Viết lại cùng nghĩa','word-order':'Sắp xếp lại câu',
};
export const skillTitle=(s:string)=>SKILL_TITLES[s] || s.replaceAll('-',' ');
