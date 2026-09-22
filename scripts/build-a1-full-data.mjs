import { applyContentReviewV4 } from './english-content-review-v4.mjs';
import { applyReviewedOrder } from './english-reviewed-order.mjs';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('src/data/english');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// ==========================================================================
// 1. VOCABULARY (105 words with General American IPA and distinct emojis)
// ==========================================================================
const rawVocab = [
  // Pronouns
  { en: "I", vi: "tôi, mình, con", pos: "pronoun", ipa: "/aɪ/", exampleEn: "I am a student.", exampleVi: "Tôi là một học sinh.", image: "🙋", tags: ["pronoun"] },
  { en: "you", vi: "bạn, các bạn", pos: "pronoun", ipa: "/juː/", exampleEn: "You are kind.", exampleVi: "Bạn thật tốt bụng.", image: "👉", tags: ["pronoun"] },
  { en: "he", vi: "anh ấy, cậu ấy, chú ấy", pos: "pronoun", ipa: "/hiː/", exampleEn: "He is my brother.", exampleVi: "Cậu ấy là em trai tôi.", image: "👦", tags: ["pronoun"] },
  { en: "she", vi: "cô ấy, chị ấy, bà ấy", pos: "pronoun", ipa: "/ʃiː/", exampleEn: "She is a doctor.", exampleVi: "Cô ấy là một bác sĩ.", image: "👧", tags: ["pronoun"] },
  { en: "it", vi: "nó (con vật, đồ vật)", pos: "pronoun", ipa: "/ɪt/", exampleEn: "It is cute.", exampleVi: "Nó thật dễ thương.", image: "📦", tags: ["pronoun"] },
  { en: "we", vi: "chúng tôi, chúng ta", pos: "pronoun", ipa: "/wiː/", exampleEn: "We are ready.", exampleVi: "Chúng tôi đã sẵn sàng.", image: "👨‍👩‍👧", tags: ["pronoun"] },
  { en: "they", vi: "họ, chúng nó", pos: "pronoun", ipa: "/ðeɪ/", exampleEn: "They are doctors.", exampleVi: "Họ là những bác sĩ.", image: "👥", tags: ["pronoun"] },

  // Demonstratives
  { en: "this", vi: "đây, cái này", pos: "pronoun", ipa: "/ðɪs/", exampleEn: "This is my pen.", exampleVi: "Đây là chiếc bút của tôi.", image: "👇", tags: ["demonstrative"] },
  { en: "that", vi: "kia, cái kia", pos: "pronoun", ipa: "/ðæt/", exampleEn: "That is my school.", exampleVi: "Kia là trường học của tôi.", image: "👉", tags: ["demonstrative"] },
  { en: "these", vi: "những cái này", pos: "pronoun", ipa: "/ðiːz/", exampleEn: "These are my books.", exampleVi: "Đây là những cuốn sách của tôi.", image: "📚", tags: ["demonstrative"] },
  { en: "those", vi: "những cái kia", pos: "pronoun", ipa: "/ðoʊz/", exampleEn: "Those are big dogs.", exampleVi: "Kia là những con chó to.", image: "🐕", tags: ["demonstrative"] },

  // Professions (General American IPA)
  { en: "teacher", vi: "giáo viên", pos: "noun", ipa: "/ˈtiː.tʃɚ/", forms: { plural: "teachers" }, exampleEn: "She is a teacher.", exampleVi: "Cô ấy là một giáo viên.", image: "🧑‍🏫", tags: ["profession"] },
  { en: "student", vi: "học sinh", pos: "noun", ipa: "/ˈstuː.dənt/", forms: { plural: "students" }, exampleEn: "I am a student.", exampleVi: "Tôi là một học sinh.", image: "🧑‍🎓", tags: ["profession"] },
  { en: "pupil", vi: "học sinh nhỏ", pos: "noun", ipa: "/ˈpjuː.pəl/", forms: { plural: "pupils" }, exampleEn: "He is a good pupil.", exampleVi: "Cậu ấy là một học sinh ngoan.", image: "🧒", tags: ["profession"] },
  { en: "doctor", vi: "bác sĩ", pos: "noun", ipa: "/ˈdɑːk.tɚ/", forms: { plural: "doctors" }, exampleEn: "My father is a doctor.", exampleVi: "Bố tôi là bác sĩ.", image: "👨‍⚕️", tags: ["profession"] },
  { en: "nurse", vi: "y tá", pos: "noun", ipa: "/nɝːs/", forms: { plural: "nurses" }, exampleEn: "She is a kind nurse.", exampleVi: "Cô ấy là một y tá tốt bụng.", image: "👩‍⚕️", tags: ["profession"] },
  { en: "engineer", vi: "kỹ sư", pos: "noun", ipa: "/ˌen.dʒəˈnɪr/", forms: { plural: "engineers" }, exampleEn: "He is an engineer.", exampleVi: "Anh ấy là một kỹ sư.", image: "👷", tags: ["profession"] },
  { en: "singer", vi: "ca sĩ", pos: "noun", ipa: "/ˈsɪŋ.ɚ/", forms: { plural: "singers" }, exampleEn: "She is a famous singer.", exampleVi: "Cô ấy là một ca sĩ nổi tiếng.", image: "🎤", tags: ["profession"] },
  { en: "dancer", vi: "vũ công", pos: "noun", ipa: "/ˈdæn.sɚ/", forms: { plural: "dancers" }, exampleEn: "They are dancers.", exampleVi: "Họ là những vũ công.", image: "💃", tags: ["profession"] },
  { en: "farmer", vi: "nông dân", pos: "noun", ipa: "/ˈfɑːr.mɚ/", forms: { plural: "farmers" }, exampleEn: "My grandfather is a farmer.", exampleVi: "Ông tôi là nông dân.", image: "🧑‍🌾", tags: ["profession"] },
  { en: "driver", vi: "tài xế", pos: "noun", ipa: "/ˈdraɪ.vɚ/", forms: { plural: "drivers" }, exampleEn: "He is a bus driver.", exampleVi: "Bác ấy là tài xế xe buýt.", image: "🚌", tags: ["profession"] },
  { en: "pilot", vi: "phi công", pos: "noun", ipa: "/ˈpaɪ.lət/", forms: { plural: "pilots" }, exampleEn: "My uncle is a pilot.", exampleVi: "Chú tôi là phi công.", image: "👨‍✈️", tags: ["profession"] },
  { en: "police officer", vi: "cảnh sát", pos: "noun", ipa: "/pəˈliːs ˌɑː.fɪ.sɚ/", forms: { plural: "police officers" }, exampleEn: "He is a police officer.", exampleVi: "Anh ấy là cảnh sát.", image: "👮", tags: ["profession"] },
  { en: "firefighter", vi: "lính cứu hỏa", pos: "noun", ipa: "/ˈfaɪrˌfaɪ.t̬ɚ/", forms: { plural: "firefighters" }, exampleEn: "They are firefighters.", exampleVi: "Họ là lính cứu hỏa.", image: "🧑‍🚒", tags: ["profession"] },
  { en: "chef", vi: "đầu bếp", pos: "noun", ipa: "/ʃef/", forms: { plural: "chefs" }, exampleEn: "She is a great chef.", exampleVi: "Cô ấy là một đầu bếp giỏi.", image: "🧑‍🍳", tags: ["profession"] },
  { en: "artist", vi: "họa sĩ", pos: "noun", ipa: "/ˈɑːr.t̬ɪst/", forms: { plural: "artists" }, exampleEn: "He is an artist.", exampleVi: "Anh ấy là một họa sĩ.", image: "🎨", tags: ["profession"] },
  { en: "worker", vi: "công nhân", pos: "noun", ipa: "/ˈwɝː.kɚ/", forms: { plural: "workers" }, exampleEn: "They are workers.", exampleVi: "Họ là công nhân.", image: "🏭", tags: ["profession"] },
  { en: "dentist", vi: "nha sĩ", pos: "noun", ipa: "/ˈden.t̬ɪst/", forms: { plural: "dentists" }, exampleEn: "She is a dentist.", exampleVi: "Cô ấy là nha sĩ.", image: "🦷", tags: ["profession"] },
  { en: "vet", vi: "bác sĩ thú y", pos: "noun", ipa: "/vet/", forms: { plural: "vets" }, exampleEn: "He is a vet.", exampleVi: "Chú ấy là bác sĩ thú y.", image: "🐕‍🦺", tags: ["profession"] },
  { en: "baker", vi: "thợ làm bánh", pos: "noun", ipa: "/ˈbeɪ.kɚ/", forms: { plural: "bakers" }, exampleEn: "My aunt is a baker.", exampleVi: "Dì tôi là một thợ làm bánh.", image: "🥖", tags: ["profession"] },
  { en: "cook", vi: "người nấu ăn", pos: "noun", ipa: "/kʊk/", forms: { plural: "cooks" }, exampleEn: "He is a good cook.", exampleVi: "Cậu ấy là một người nấu ăn giỏi.", image: "🍳", tags: ["profession"] },

  // Emotions & States
  { en: "happy", vi: "vui vẻ, hạnh phúc", pos: "adjective", ipa: "/ˈhæp.i/", exampleEn: "I am happy today.", exampleVi: "Hôm nay tôi rất vui.", image: "😊", tags: ["emotion"] },
  { en: "sad", vi: "buồn bã", pos: "adjective", ipa: "/sæd/", exampleEn: "She is not sad.", exampleVi: "Cô ấy không buồn.", image: "😢", tags: ["emotion"] },
  { en: "angry", vi: "tức giận", pos: "adjective", ipa: "/ˈæŋ.ɡri/", exampleEn: "He is angry.", exampleVi: "Cậu ấy đang tức giận.", image: "😠", tags: ["emotion"] },
  { en: "tired", vi: "mệt mỏi", pos: "adjective", ipa: "/ˈtaɪ.ɚd/", exampleEn: "We are tired now.", exampleVi: "Bây giờ chúng tôi đang mệt.", image: "🥱", tags: ["emotion"] },
  { en: "hungry", vi: "đói bụng", pos: "adjective", ipa: "/ˈhʌŋ.ɡri/", exampleEn: "Are you hungry?", exampleVi: "Bạn có đói không?", image: "🍔", tags: ["emotion"] },
  { en: "thirsty", vi: "khát nước", pos: "adjective", ipa: "/ˈθɝː.sti/", exampleEn: "I am thirsty.", exampleVi: "Tôi khát nước.", image: "🥤", tags: ["emotion"] },
  { en: "scared", vi: "sợ hãi", pos: "adjective", ipa: "/skerd/", exampleEn: "The cat is scared.", exampleVi: "Chú mèo đang sợ hãi.", image: "😨", tags: ["emotion"] },
  { en: "excited", vi: "hào hứng", pos: "adjective", ipa: "/ɪkˈsaɪ.t̬ɪd/", exampleEn: "They are excited.", exampleVi: "Họ đang rất hào hứng.", image: "🤩", tags: ["emotion"] },
  { en: "sleepy", vi: "buồn ngủ", pos: "adjective", ipa: "/ˈsliː.pi/", exampleEn: "The baby is sleepy.", exampleVi: "Em bé đang buồn ngủ.", image: "😴", tags: ["emotion"] },
  { en: "bored", vi: "chán nản", pos: "adjective", ipa: "/bɔːrd/", exampleEn: "He is bored.", exampleVi: "Cậu ấy thấy chán.", image: "😐", tags: ["emotion"] },
  { en: "surprised", vi: "ngạc nhiên", pos: "adjective", ipa: "/sɚˈpraɪzd/", exampleEn: "We are surprised.", exampleVi: "Chúng tôi rất ngạc nhiên.", image: "😲", tags: ["emotion"] },
  { en: "proud", vi: "tự hào", pos: "adjective", ipa: "/praʊd/", exampleEn: "My parents are proud.", exampleVi: "Bố mẹ tôi rất tự hào.", image: "🥰", tags: ["emotion"] },
  { en: "fine", vi: "khỏe, ổn", pos: "adjective", ipa: "/faɪn/", exampleEn: "I am fine.", exampleVi: "Tôi khỏe.", image: "👌", tags: ["emotion"] },
  { en: "great", vi: "tuyệt vời", pos: "adjective", ipa: "/ɡreɪt/", exampleEn: "Everything is great.", exampleVi: "Mọi thứ đều tuyệt vời.", image: "🌟", tags: ["emotion"] },
  { en: "calm", vi: "bình tĩnh", pos: "adjective", ipa: "/kɑːm/", exampleEn: "He is calm.", exampleVi: "Cậu ấy rất bình tĩnh.", image: "😌", tags: ["emotion"] },
  { en: "well", vi: "khỏe mạnh", pos: "adjective", ipa: "/wel/", exampleEn: "She is well today.", exampleVi: "Hôm nay cô ấy khỏe.", image: "💪", tags: ["emotion"] },

  // Appearance & Physical Traits
  { en: "tall", vi: "cao lớn", pos: "adjective", ipa: "/tɑːl/", exampleEn: "He is tall.", exampleVi: "Cậu ấy cao.", image: "🦒", tags: ["appearance"] },
  { en: "short", vi: "thấp, lùn", pos: "adjective", ipa: "/ʃɔːrt/", exampleEn: "He isn't short.", exampleVi: "Cậu ấy không thấp.", image: "📏", tags: ["appearance"] },
  { en: "big", vi: "to lớn", pos: "adjective", ipa: "/bɪɡ/", exampleEn: "The dog is big.", exampleVi: "Con chó to lớn.", image: "🐘", tags: ["appearance"] },
  { en: "small", vi: "nhỏ bé", pos: "adjective", ipa: "/smɑːl/", exampleEn: "It is small.", exampleVi: "Nó nhỏ bé.", image: "🐁", tags: ["appearance"] },
  { en: "strong", vi: "khỏe mạnh", pos: "adjective", ipa: "/strɑːŋ/", exampleEn: "They are strong.", exampleVi: "Họ rất khỏe mạnh.", image: "🦾", tags: ["appearance"] },
  { en: "weak", vi: "yếu ớt", pos: "adjective", ipa: "/wiːk/", exampleEn: "I am not weak.", exampleVi: "Tôi không yếu.", image: "🩹", tags: ["appearance"] },
  { en: "fat", vi: "béo tròn", pos: "adjective", ipa: "/fæt/", exampleEn: "The pig is fat.", exampleVi: "Chú lợn béo tròn.", image: "🐷", tags: ["appearance"] },
  { en: "thin", vi: "gầy, ốm", pos: "adjective", ipa: "/θɪn/", exampleEn: "The boy is thin.", exampleVi: "Cậu bé gầy.", image: "🧍", tags: ["appearance"] },
  { en: "young", vi: "trẻ tuổi", pos: "adjective", ipa: "/jʌŋ/", exampleEn: "They are young.", exampleVi: "Họ còn trẻ.", image: "🧒", tags: ["appearance"] },
  { en: "old", vi: "già, cao tuổi", pos: "adjective", ipa: "/oʊld/", exampleEn: "My grandfather is old.", exampleVi: "Ông tôi đã cao tuổi.", image: "👴", tags: ["appearance"] },
  { en: "beautiful", vi: "xinh đẹp", pos: "adjective", ipa: "/ˈbjuː.t̬ə.fəl/", exampleEn: "She is beautiful.", exampleVi: "Cô ấy xinh đẹp.", image: "🌸", tags: ["appearance"] },
  { en: "pretty", vi: "xinh xắn", pos: "adjective", ipa: "/ˈprɪt̬.i/", exampleEn: "The girl is pretty.", exampleVi: "Cô bé xinh xắn.", image: "🌺", tags: ["appearance"] },
  { en: "handsome", vi: "đẹp trai", pos: "adjective", ipa: "/ˈhæn.səm/", exampleEn: "He is handsome.", exampleVi: "Cậu ấy đẹp trai.", image: "🤴", tags: ["appearance"] },
  { en: "cute", vi: "dễ thương", pos: "adjective", ipa: "/kjuːt/", exampleEn: "The cat is cute.", exampleVi: "Chú mèo rất dễ thương.", image: "🐱", tags: ["appearance"] },
  { en: "clean", vi: "sạch sẽ", pos: "adjective", ipa: "/kliːn/", exampleEn: "The room is clean.", exampleVi: "Căn phòng sạch sẽ.", image: "✨", tags: ["appearance"] },
  { en: "dirty", vi: "bẩn thỉu", pos: "adjective", ipa: "/ˈdɝː.t̬i/", exampleEn: "The shoes are dirty.", exampleVi: "Đôi giày bị bẩn.", image: "👟", tags: ["appearance"] },

  // Character Traits
  { en: "kind", vi: "tốt bụng, hiền từ", pos: "adjective", ipa: "/kaɪnd/", exampleEn: "My teacher is kind.", exampleVi: "Cô giáo của tôi rất tốt bụng.", image: "❤️", tags: ["character"] },
  { en: "nice", vi: "dễ thương, tốt tính", pos: "adjective", ipa: "/naɪs/", exampleEn: "You are very nice.", exampleVi: "Bạn rất tốt tính.", image: "😇", tags: ["character"] },
  { en: "smart", vi: "thông minh", pos: "adjective", ipa: "/smɑːrt/", exampleEn: "She is very smart.", exampleVi: "Cô bé rất thông minh.", image: "💡", tags: ["character"] },
  { en: "clever", vi: "khôn ngoan, lanh lợi", pos: "adjective", ipa: "/ˈklev.ɚ/", exampleEn: "He is clever.", exampleVi: "Cậu ấy lanh lợi.", image: "🦊", tags: ["character"] },
  { en: "funny", vi: "hài hước", pos: "adjective", ipa: "/ˈfʌn.i/", exampleEn: "The clown is funny.", exampleVi: "Chú hề rất hài hước.", image: "🤡", tags: ["character"] },
  { en: "brave", vi: "dũng cảm", pos: "adjective", ipa: "/breɪv/", exampleEn: "The boy is brave.", exampleVi: "Cậu bé dũng cảm.", image: "🦁", tags: ["character"] },
  { en: "polite", vi: "lễ phép, lịch sự", pos: "adjective", ipa: "/pəˈlaɪt/", exampleEn: "We are polite pupils.", exampleVi: "Chúng tôi là những học sinh lễ phép.", image: "🤝", tags: ["character"] },
  { en: "quiet", vi: "yên lặng", pos: "adjective", ipa: "/ˈkwaɪ.ət/", exampleEn: "The class is quiet.", exampleVi: "Cả lớp đang yên lặng.", image: "🤫", tags: ["character"] },
  { en: "busy", vi: "bận rộn", pos: "adjective", ipa: "/ˈbɪz.i/", exampleEn: "My father is busy.", exampleVi: "Bố tôi đang bận.", image: "💼", tags: ["character"] },
  { en: "ready", vi: "sẵn sàng", pos: "adjective", ipa: "/ˈred.i/", exampleEn: "We are ready.", exampleVi: "Chúng tôi đã sẵn sàng.", image: "🏁", tags: ["character"] },

  // Classroom & Objects
  { en: "book", vi: "quyển sách", pos: "noun", ipa: "/bʊk/", forms: { plural: "books" }, exampleEn: "This is a new book.", exampleVi: "Đây là một cuốn sách mới.", image: "📖", tags: ["school"] },
  { en: "notebook", vi: "vở ghi chép", pos: "noun", ipa: "/ˈnoʊt.bʊk/", forms: { plural: "notebooks" }, exampleEn: "It is my notebook.", exampleVi: "Nó là cuốn vở của tôi.", image: "📓", tags: ["school"] },
  { en: "pen", vi: "bút mực", pos: "noun", ipa: "/pen/", forms: { plural: "pens" }, exampleEn: "This is my pen.", exampleVi: "Đây là chiếc bút của tôi.", image: "🖊️", tags: ["school"] },
  { en: "pencil", vi: "bút chì", pos: "noun", ipa: "/ˈpen.səl/", forms: { plural: "pencils" }, exampleEn: "The pencil is yellow.", exampleVi: "Chiếc bút chì màu vàng.", image: "✏️", tags: ["school"] },
  { en: "ruler", vi: "thước kẻ", pos: "noun", ipa: "/ˈruː.lɚ/", forms: { plural: "rulers" }, exampleEn: "The ruler is long.", exampleVi: "Chiếc thước kẻ dài.", image: "📏", tags: ["school"] },
  { en: "eraser", vi: "cục tẩy", pos: "noun", ipa: "/ɪˈreɪ.sɚ/", forms: { plural: "erasers" }, exampleEn: "This is an eraser.", exampleVi: "Đây là một cục tẩy.", image: "🧼", tags: ["school"] },
  { en: "bag", vi: "cặp sách, túi", pos: "noun", ipa: "/bæɡ/", forms: { plural: "bags" }, exampleEn: "My bag is blue.", exampleVi: "Cặp sách của tôi màu xanh dương.", image: "🎒", tags: ["school"] },
  { en: "desk", vi: "bàn học", pos: "noun", ipa: "/desk/", forms: { plural: "desks" }, exampleEn: "That is a big desk.", exampleVi: "Kia là một cái bàn học to.", tags: ["school"] },
  { en: "chair", vi: "cái ghế", pos: "noun", ipa: "/tʃer/", forms: { plural: "chairs" }, exampleEn: "The chair is brown.", exampleVi: "Cái ghế màu nâu.", image: "🪑", tags: ["school"] },
  { en: "board", vi: "bảng lớp", pos: "noun", ipa: "/bɔːrd/", forms: { plural: "boards" }, exampleEn: "The board is green.", exampleVi: "Cái bảng màu xanh lá.", image: "📋", tags: ["school"] },
  { en: "classroom", vi: "phòng học", pos: "noun", ipa: "/ˈklæs.ruːm/", forms: { plural: "classrooms" }, exampleEn: "Our classroom is bright.", exampleVi: "Lớp học của chúng tôi sáng sủa.", image: "👩‍🏫", tags: ["school"] },
  { en: "school", vi: "trường học", pos: "noun", ipa: "/skuːl/", forms: { plural: "schools" }, exampleEn: "This is my school.", exampleVi: "Đây là trường của tôi.", image: "🏫", tags: ["school"] },
  { en: "door", vi: "cửa ra vào", pos: "noun", ipa: "/dɔːr/", forms: { plural: "doors" }, exampleEn: "The door is open.", exampleVi: "Cửa đang mở.", image: "🚪", tags: ["house"] },
  { en: "window", vi: "cửa sổ", pos: "noun", ipa: "/ˈwɪn.doʊ/", forms: { plural: "windows" }, exampleEn: "The window is small.", exampleVi: "Cửa sổ thì nhỏ.", image: "🪟", tags: ["house"] },
  { en: "clock", vi: "đồng hồ", pos: "noun", ipa: "/klɑːk/", forms: { plural: "clocks" }, exampleEn: "The clock is round.", exampleVi: "Đồng hồ có hình tròn.", image: "⏰", tags: ["house"] },
  { en: "room", vi: "căn phòng", pos: "noun", ipa: "/ruːm/", forms: { plural: "rooms" }, exampleEn: "The room is warm.", exampleVi: "Căn phòng ấm áp.", image: "🏠", tags: ["house"] },

  // Family Members
  { en: "family", vi: "gia đình", pos: "noun", ipa: "/ˈfæm.əl.i/", forms: { plural: "families" }, exampleEn: "We are a happy family.", exampleVi: "Chúng tôi là một gia đình hạnh phúc.", image: "👨‍👩‍👧‍👦", tags: ["family"] },
  { en: "father", vi: "bố, cha", pos: "noun", ipa: "/ˈfɑː.ðɚ/", forms: { plural: "fathers" }, exampleEn: "He is my father.", exampleVi: "Ông ấy là bố của tôi.", image: "👨", tags: ["family"] },
  { en: "mother", vi: "mẹ", pos: "noun", ipa: "/ˈmʌð.ɚ/", forms: { plural: "mothers" }, exampleEn: "She is my mother.", exampleVi: "Bà ấy là mẹ của tôi.", image: "👩", tags: ["family"] },
  { en: "brother", vi: "anh/em trai", pos: "noun", ipa: "/ˈbrʌð.ɚ/", forms: { plural: "brothers" }, exampleEn: "He is my brother.", exampleVi: "Cậu ấy là em trai tôi.", image: "👦", tags: ["family"] },
  { en: "sister", vi: "chị/em gái", pos: "noun", ipa: "/ˈsɪs.tɚ/", forms: { plural: "sisters" }, exampleEn: "This is my sister.", exampleVi: "Đây là chị gái của tôi.", image: "👧", tags: ["family"] },
  { en: "baby", vi: "em bé", pos: "noun", ipa: "/ˈbeɪ.bi/", forms: { plural: "babies" }, exampleEn: "The baby is cute.", exampleVi: "Em bé thật dễ thương.", image: "👶", tags: ["family"] },
  { en: "grandfather", vi: "ông nội/ngoại", pos: "noun", ipa: "/ˈɡrænˌfɑː.ðɚ/", forms: { plural: "grandfathers" }, exampleEn: "My grandfather is kind.", exampleVi: "Ông tôi rất hiền từ.", image: "👴", tags: ["family"] },
  { en: "grandmother", vi: "bà nội/ngoại", pos: "noun", ipa: "/ˈɡrænˌmʌð.ɚ/", forms: { plural: "grandmothers" }, exampleEn: "She is my grandmother.", exampleVi: "Bà ấy là bà của tôi.", image: "👵", tags: ["family"] },
  { en: "friend", vi: "người bạn", pos: "noun", ipa: "/frend/", forms: { plural: "friends" }, exampleEn: "They are good friends.", exampleVi: "Họ là những người bạn tốt.", image: "🤝", tags: ["family"] },
  { en: "classmate", vi: "bạn cùng lớp", pos: "noun", ipa: "/ˈklæs.meɪt/", forms: { plural: "classmates" }, exampleEn: "Nam is my classmate.", exampleVi: "Nam là bạn cùng lớp của tôi.", image: "🧑‍🤝‍🧑", tags: ["family"] },

  // Weather & Conditions
  { en: "hot", vi: "nóng bức", pos: "adjective", ipa: "/hɑːt/", exampleEn: "It is hot today.", exampleVi: "Hôm nay trời nóng.", image: "☀️", tags: ["weather"] },
  { en: "cold", vi: "lạnh giá", pos: "adjective", ipa: "/koʊld/", exampleEn: "It is cold outside.", exampleVi: "Bên ngoài trời lạnh.", image: "❄️", tags: ["weather"] },
  { en: "warm", vi: "ấm áp", pos: "adjective", ipa: "/wɔːrm/", exampleEn: "The weather is warm.", exampleVi: "Thời tiết ấm áp.", image: "🌤️", tags: ["weather"] },
  { en: "cool", vi: "mát mẻ", pos: "adjective", ipa: "/kuːl/", exampleEn: "It is cool today.", exampleVi: "Hôm nay trời mát mẻ.", image: "🍃", tags: ["weather"] },
  { en: "sunny", vi: "nắng rực rỡ", pos: "adjective", ipa: "/ˈsʌn.i/", exampleEn: "It is sunny now.", exampleVi: "Bây giờ trời có nắng.", image: "🌞", tags: ["weather"] },
  { en: "rainy", vi: "có mưa", pos: "adjective", ipa: "/ˈreɪ.ni/", exampleEn: "It is rainy.", exampleVi: "Trời đang mưa.", image: "🌧️", tags: ["weather"] },

  // Colors
  { en: "red", vi: "màu đỏ", pos: "adjective", ipa: "/red/", exampleEn: "My bag is red.", exampleVi: "Cặp của tôi màu đỏ.", image: "🔴", tags: ["color"] },
  { en: "blue", vi: "màu xanh dương", pos: "adjective", ipa: "/bluː/", exampleEn: "The sky is blue.", exampleVi: "Bầu trời màu xanh dương.", image: "🔵", tags: ["color"] },
  { en: "green", vi: "màu xanh lá", pos: "adjective", ipa: "/ɡriːn/", exampleEn: "The board is green.", exampleVi: "Cái bảng màu xanh lá.", image: "🟢", tags: ["color"] },
  { en: "yellow", vi: "màu vàng", pos: "adjective", ipa: "/ˈjel.oʊ/", exampleEn: "The pencil is yellow.", exampleVi: "Bút chì màu vàng.", image: "🟡", tags: ["color"] },
  { en: "white", vi: "màu trắng", pos: "adjective", ipa: "/waɪt/", exampleEn: "The cat is white.", exampleVi: "Chú mèo màu trắng.", image: "⚪", tags: ["color"] },
  { en: "black", vi: "màu đen", pos: "adjective", ipa: "/blæk/", exampleEn: "The dog is black.", exampleVi: "Chú chó màu đen.", image: "⚫", tags: ["color"] },
  { en: "pink", vi: "màu hồng", pos: "adjective", ipa: "/pɪŋk/", exampleEn: "Her pen is pink.", exampleVi: "Bút của cô bé màu hồng.", image: "🌸", tags: ["color"] },
  { en: "brown", vi: "màu nâu", pos: "adjective", ipa: "/braʊn/", exampleEn: "The chair is brown.", exampleVi: "Cái ghế màu nâu.", image: "🟤", tags: ["color"] },

  // Nationalities
  { en: "Vietnamese", vi: "(thuộc) Việt Nam, người Việt Nam", pos: "adjective", ipa: "/ˌvjet.nəˈmiːz/", exampleEn: "I am Vietnamese.", exampleVi: "Tôi là người Việt Nam.", image: "🇻🇳", tags: ["nationality"] },
  { en: "American", vi: "(thuộc) Mỹ, người Mỹ", pos: "adjective", ipa: "/əˈmer.ɪ.kən/", exampleEn: "He is American.", exampleVi: "Anh ấy là người Mỹ.", image: "🇺🇸", tags: ["nationality"] },
  { en: "English", vi: "(thuộc) Anh, người Anh", pos: "adjective", ipa: "/ˈɪŋ.ɡlɪʃ/", exampleEn: "She is English.", exampleVi: "Cô ấy là người Anh.", image: "🇬🇧", tags: ["nationality"] },
  { en: "Japanese", vi: "(thuộc) Nhật Bản, người Nhật Bản", pos: "adjective", ipa: "/ˌdʒæp.əˈniːz/", exampleEn: "They are Japanese.", exampleVi: "Họ là người Nhật Bản.", image: "🇯🇵", tags: ["nationality"] },
  { en: "Korean", vi: "(thuộc) Hàn Quốc, người Hàn Quốc", pos: "adjective", ipa: "/kəˈriː.ən/", exampleEn: "My friend is Korean.", exampleVi: "Bạn tôi là người Hàn Quốc.", image: "🇰🇷", tags: ["nationality"] }
];

const formattedVocab = rawVocab.map((v, idx) => {
  const numStr = String(idx + 1).padStart(4, '0');
  return {
    id: `A1-v-${numStr}`,
    level: "A1",
    topic: "to-be-pronouns",
    en: v.en,
    vi: v.vi,
    pos: v.pos,
    ipa: v.ipa,
    ...(v.forms ? { forms: v.forms } : {}),
    exampleEn: v.exampleEn,
    exampleVi: v.exampleVi,
    image: v.image,
    tags: v.tags,
    source: "seed"
  };
});

fs.writeFileSync(
  path.join(outDir, 'A1.vocab.json'),
  JSON.stringify(formattedVocab, null, 2),
  'utf-8'
);
console.log(`✅ Generated A1.vocab.json with ${formattedVocab.length} words (target ≥ 100).`);

// Helper function to reconstruct English sentence from tokens
function reconstructEn(tokens) {
  let res = '';
  for (let i = 0; i < tokens.length; i++) {
    const text = tokens[i].text;
    if (i === 0) {
      res += text;
    } else if (['.', ',', '?', '!', ':', ';'].includes(text)) {
      res += text;
    } else {
      res += ' ' + text;
    }
  }
  return res;
}

// Token helper
function tok(text, pos, role, lemma, feature) {
  const t = { text, pos, role };
  if (lemma) t.lemma = lemma;
  if (feature) t.feature = feature;
  return t;
}

const punctDot = tok('.', 'punct', 'punct');
const punctQ = tok('?', 'punct', 'punct');
const punctComma = tok(',', 'punct', 'punct');

// ==========================================================================
// 2. SENTENCES BUILDER (Exact 200 sentences: 45 aff, 45 neg, 45 q, 20 sa, 45 dem)
// ==========================================================================

const sentences = [];

// Helper to add sentence and assert reconstruction
function addSentence(grammarPoint, en, vi, diff, tags, tokens, roleSpans, exerciseTypes, blank, orderAlternatives) {
  const reconstructed = reconstructEn(tokens);
  if (en !== reconstructed) {
    throw new Error(`Reconstruction mismatch:\nen: "${en}"\nreconstructed: "${reconstructed}"`);
  }

  const s = {
    grammarPoint,
    en,
    vi,
    tokens,
    roleSpans,
    exerciseTypes,
    blanks: [
      {
        tokenIndex: blank.idx,
        answer: blank.ans,
        ...(blank.alt ? { alt: blank.alt } : {}),
        promptVi: blank.promptVi,
        hint: blank.hint
      }
    ],
    difficulty: diff,
    tags,
    source: 'seed'
  };
  if (orderAlternatives) {
    s.orderAlternatives = orderAlternatives;
  }
  sentences.push(s);
}

// --------------------------------------------------------------------------
// GROUP 1: be-affirmative (45 sentences)
// --------------------------------------------------------------------------
// 1-10: Pronoun + be + adjective / emotion / state (diff 1: 8, diff 2: 2)
addSentence('be-affirmative', 'I am happy.', 'Tôi vui vẻ.', 1, ['affirmative', 'emotion'],
  [tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('happy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'am', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · I'});

addSentence('be-affirmative', 'You are kind.', 'Bạn thật tốt bụng.', 1, ['affirmative', 'character'],
  [tok('You','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('kind','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · you'});

addSentence('be-affirmative', 'He is tall.', 'Cậu ấy cao lớn.', 1, ['affirmative', 'appearance'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('tall','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · he'});

addSentence('be-affirmative', 'She is pretty.', 'Cô bé xinh xắn.', 1, ['affirmative', 'appearance'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('pretty','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · she'});

addSentence('be-affirmative', 'It is cute.', 'Nó thật dễ thương.', 1, ['affirmative', 'appearance'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('cute','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · it'});

addSentence('be-affirmative', 'We are ready.', 'Chúng tôi đã sẵn sàng.', 1, ['affirmative', 'character'],
  [tok('We','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('ready','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · we'});

addSentence('be-affirmative', 'They are strong.', 'Họ rất khỏe mạnh.', 1, ['affirmative', 'appearance'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('strong','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · they'});

addSentence('be-affirmative', 'I am thirsty.', 'Tôi khát nước.', 1, ['affirmative', 'emotion'],
  [tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('thirsty','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'am', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · I'});

addSentence('be-affirmative', 'He is very clever.', 'Cậu ấy rất lanh lợi.', 2, ['affirmative', 'character'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('clever','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · he'});

addSentence('be-affirmative', 'She is very smart.', 'Cô bé rất thông minh.', 2, ['affirmative', 'character'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('smart','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · she'});

// 11-20: Pronoun + be + profession / nationality (diff 1: 5, diff 2: 5)
addSentence('be-affirmative', 'I am a student.', 'Tôi là một học sinh.', 1, ['affirmative', 'profession'],
  [tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('a','article','det'), tok('student','noun','complement','student','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'am', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · I'});

addSentence('be-affirmative', 'She is a teacher.', 'Cô ấy là một giáo viên.', 1, ['affirmative', 'profession'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('teacher','noun','complement','teacher','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · she'});

addSentence('be-affirmative', 'He is a doctor.', 'Anh ấy là một bác sĩ.', 1, ['affirmative', 'profession'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('doctor','noun','complement','doctor','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · he'});

addSentence('be-affirmative', 'We are pupils.', 'Chúng tôi là những học sinh nhỏ.', 1, ['affirmative', 'profession'],
  [tok('We','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('pupils','noun','complement','pupil','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · we'});

addSentence('be-affirmative', 'They are doctors.', 'Họ là những bác sĩ.', 1, ['affirmative', 'profession'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('doctors','noun','complement','doctor','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Hoàn thành câu khẳng định với to be.', hint:'to be · they'});

addSentence('be-affirmative', 'He is an engineer.', 'Anh ấy là một kỹ sư.', 2, ['affirmative', 'profession'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('engineer','noun','complement','engineer','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · he'});

addSentence('be-affirmative', 'She is a famous singer.', 'Cô ấy là một ca sĩ nổi tiếng.', 2, ['affirmative', 'profession'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('famous','adjective','modifier'), tok('singer','noun','complement','singer','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · she'});

addSentence('be-affirmative', 'I am Vietnamese.', 'Tôi là người Việt Nam.', 1, ['affirmative', 'nationality'],
  [tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('Vietnamese','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'am', promptVi:'Hoàn thành câu với to be.', hint:'to be · I'});

addSentence('be-affirmative', 'They are Japanese.', 'Họ là người Nhật Bản.', 2, ['affirmative', 'nationality'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('Japanese','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Hoàn thành câu với to be.', hint:'to be · they'});

addSentence('be-affirmative', 'He is American.', 'Anh ấy là người Mỹ.', 2, ['affirmative', 'nationality'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('American','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · he'});

// 21-30: Age & Simple Nouns as Subjects (diff 1: 4, diff 2: 6)
addSentence('be-affirmative', 'I am eight years old.', 'Tôi tám tuổi.', 2, ['affirmative', 'age'],
  [tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('eight','numeral','det'), tok('years','noun','modifier','year','pl'), tok('old','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'am', promptVi:'Hoàn thành câu nói tuổi với to be.', hint:'to be · I'});

addSentence('be-affirmative', 'She is ten years old.', 'Cô bé mười tuổi.', 2, ['affirmative', 'age'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('ten','numeral','det'), tok('years','noun','modifier','year','pl'), tok('old','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu nói tuổi với to be.', hint:'to be · she'});

addSentence('be-affirmative', 'He is seven.', 'Cậu ấy bảy tuổi.', 1, ['affirmative', 'age'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('seven','numeral','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu nói tuổi.', hint:'to be · he'});

addSentence('be-affirmative', 'The clock is round.', 'Chiếc đồng hồ có hình tròn.', 1, ['affirmative'],
  [tok('The','article','det'), tok('clock','noun','subject','clock','sg'), tok('is','verb','verb','be','present-3sg'), tok('round','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · the clock'});

addSentence('be-affirmative', 'The door is open.', 'Cửa đang mở.', 1, ['affirmative'],
  [tok('The','article','det'), tok('door','noun','subject','door','sg'), tok('is','verb','verb','be','present-3sg'), tok('open','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · the door'});

addSentence('be-affirmative', 'The window is clean.', 'Cửa sổ thì sạch sẽ.', 1, ['affirmative'],
  [tok('The','article','det'), tok('window','noun','subject','window','sg'), tok('is','verb','verb','be','present-3sg'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · the window'});

addSentence('be-affirmative', 'My father is a doctor.', 'Bố tôi là bác sĩ.', 2, ['affirmative', 'family', 'profession'],
  [tok('My','determiner','det'), tok('father','noun','subject','father','sg'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('doctor','noun','complement','doctor','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · my father'});

addSentence('be-affirmative', 'My mother is very kind.', 'Mẹ tôi rất tốt bụng.', 2, ['affirmative', 'family', 'character'],
  [tok('My','determiner','det'), tok('mother','noun','subject','mother','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('kind','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · my mother'});

addSentence('be-affirmative', 'My friends are friendly.', 'Bạn bè của tôi rất thân thiện.', 2, ['affirmative', 'family', 'character'],
  [tok('My','determiner','det'), tok('friends','noun','subject','friend','pl'), tok('are','verb','verb','be','present-other'), tok('friendly','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'are', promptVi:'Hoàn thành câu với to be.', hint:'to be · my friends'});

addSentence('be-affirmative', 'Our classroom is bright.', 'Lớp học của chúng tôi rất sáng.', 2, ['affirmative', 'school'],
  [tok('Our','determiner','det'), tok('classroom','noun','subject','classroom','sg'), tok('is','verb','verb','be','present-3sg'), tok('bright','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · our classroom'});

// 31-45: Difficulty 2 & 3 rich sentences (diff 2: 5, diff 3: 10)
addSentence('be-affirmative', 'The weather is warm today.', 'Hôm nay thời tiết ấm áp.', 2, ['affirmative', 'weather'],
  [tok('The','article','det'), tok('weather','noun','subject','weather','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('warm','adjective','complement'), tok('today','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · the weather'},
  ['Today the weather is warm.']);

addSentence('be-affirmative', 'I am happy today.', 'Hôm nay tôi rất vui.', 2, ['affirmative', 'emotion'],
  [tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('happy','adjective','complement'), tok('today','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'am', promptVi:'Hoàn thành câu với to be.', hint:'to be · I'},
  ['Today I am happy.']);

addSentence('be-affirmative', 'We are excited now.', 'Bây giờ chúng tôi rất hào hứng.', 2, ['affirmative', 'emotion'],
  [tok('We','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('excited','adjective','complement'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Hoàn thành câu với to be.', hint:'to be · we'},
  ['Now we are excited.']);

addSentence('be-affirmative', 'Nam is a good pupil.', 'Nam là một học sinh ngoan.', 2, ['affirmative', 'profession'],
  [tok('Nam','noun','subject','Nam','sg'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('good','adjective','modifier'), tok('pupil','noun','complement','pupil','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · Nam'});

addSentence('be-affirmative', 'Mai is very polite.', 'Mai rất lễ phép.', 2, ['affirmative', 'character'],
  [tok('Mai','noun','subject','Mai','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('polite','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu với to be.', hint:'to be · Mai'});

// Diff 3 items (10 sentences for be-affirmative)
addSentence('be-affirmative', 'The tall young doctor is from Vietnam.', 'Người bác sĩ trẻ cao ráo đến từ Việt Nam.', 3, ['affirmative', 'profession'],
  [tok('The','article','det'), tok('tall','adjective','modifier'), tok('young','adjective','modifier'), tok('doctor','noun','subject','doctor','sg'), tok('is','verb','verb','be','present-3sg'), tok('from','preposition','prep'), tok('Vietnam','noun','prep-object','Vietnam','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'is', promptVi:'Điền to be phù hợp với chủ ngữ.', hint:'to be · người số ít'});

addSentence('be-affirmative', 'Our new English teacher is extremely kind.', 'Giáo viên tiếng Anh mới của chúng tôi cực kỳ tốt bụng.', 3, ['affirmative', 'character'],
  [tok('Our','determiner','det'), tok('new','adjective','modifier'), tok('English','adjective','modifier'), tok('teacher','noun','subject','teacher','sg'), tok('is','verb','verb','be','present-3sg'), tok('extremely','adverb','modifier'), tok('kind','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'is', promptVi:'Điền to be phù hợp với chủ ngữ.', hint:'to be · số ít'});

addSentence('be-affirmative', 'The cute little puppy is very playful.', 'Chú cún con nhỏ nhắn dễ thương rất tinh nghịch.', 3, ['affirmative', 'appearance'],
  [tok('The','article','det'), tok('cute','adjective','modifier'), tok('little','adjective','modifier'), tok('puppy','noun','subject','puppy','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('playful','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'is', promptVi:'Điền to be phù hợp với chủ ngữ.', hint:'to be · số ít'});

addSentence('be-affirmative', 'Those three tall pupils are very polite.', 'Ba bạn học sinh cao ráo kia rất lễ phép.', 3, ['affirmative', 'character'],
  [tok('Those','determiner','det'), tok('three','numeral','det'), tok('tall','adjective','modifier'), tok('pupils','noun','subject','pupil','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('polite','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'are', promptVi:'Điền to be phù hợp với danh từ số nhiều.', hint:'to be · số nhiều'});

addSentence('be-affirmative', 'My older brother is a talented artist.', 'Anh trai tôi là một họa sĩ tài năng.', 3, ['affirmative', 'profession'],
  [tok('My','determiner','det'), tok('older','adjective','modifier'), tok('brother','noun','subject','brother','sg'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('talented','adjective','modifier'), tok('artist','noun','complement','artist','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'is', promptVi:'Điền to be phù hợp.', hint:'to be · my brother'});

addSentence('be-affirmative', 'The big brown dogs are very friendly.', 'Những chú chó to màu nâu rất thân thiện.', 3, ['affirmative', 'character'],
  [tok('The','article','det'), tok('big','adjective','modifier'), tok('brown','adjective','modifier'), tok('dogs','noun','subject','dog','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('friendly','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'are', promptVi:'Điền to be cho chủ ngữ số nhiều.', hint:'to be · the dogs'});

addSentence('be-affirmative', 'The quiet library room is very cool.', 'Phòng thư viện yên tĩnh thì rất mát mẻ.', 3, ['affirmative'],
  [tok('The','article','det'), tok('quiet','adjective','modifier'), tok('library','noun','modifier','library','sg'), tok('room','noun','subject','room','sg'), tok('is','verb','verb','be','present-3sg'), tok('very','adverb','modifier'), tok('cool','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'is', promptVi:'Điền to be phù hợp.', hint:'to be · the room'});

addSentence('be-affirmative', 'Her two little sisters are cute pupils.', 'Hai em gái nhỏ của cô ấy là những học sinh đáng yêu.', 3, ['affirmative', 'family'],
  [tok('Her','determiner','det'), tok('two','numeral','det'), tok('little','adjective','modifier'), tok('sisters','noun','subject','sister','pl'), tok('are','verb','verb','be','present-other'), tok('cute','adjective','modifier'), tok('pupils','noun','complement','pupil','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'are', promptVi:'Điền to be cho chủ ngữ số nhiều.', hint:'to be · sisters'});

addSentence('be-affirmative', 'His grandfather is a retired police officer.', 'Ông của cậu ấy là một cảnh sát đã nghỉ hưu.', 3, ['affirmative', 'profession'],
  [tok('His','determiner','det'), tok('grandfather','noun','subject','grandfather','sg'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('retired','adjective','modifier'), tok('police','noun','modifier','police','uncountable'), tok('officer','noun','complement','officer','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'is', promptVi:'Điền to be phù hợp.', hint:'to be · his grandfather'});

addSentence('be-affirmative', 'All the students are in the classroom.', 'Tất cả các bạn học sinh đều ở trong lớp học.', 3, ['affirmative', 'school'],
  [tok('All','determiner','det'), tok('the','article','det'), tok('students','noun','subject','student','pl'), tok('are','verb','verb','be','present-other'), tok('in','preposition','prep'), tok('the','article','det'), tok('classroom','noun','prep-object','classroom','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'are', promptVi:'Điền to be cho chủ ngữ số nhiều.', hint:'to be · the students'});

console.log(`Current count: ${sentences.length} sentences (target: 45 be-affirmative).`);

// --------------------------------------------------------------------------
// GROUP 2: be-negative (45 sentences)
// --------------------------------------------------------------------------
// 46-55: Pronoun + be + not / isn't / aren't + adjective (diff 1: 5, diff 2: 5)
addSentence('be-negative', 'I am not sad.', 'Tôi không buồn.', 1, ['negative', 'emotion'],
  [tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('not','adverb','adverbial'), tok('sad','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'am', promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · I'});

addSentence('be-negative', 'He isn\'t short.', 'Cậu ấy không thấp.', 1, ['negative', 'appearance'],
  [tok('He','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('short','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · he'});

addSentence('be-negative', 'She isn\'t sad.', 'Cô ấy không buồn.', 1, ['negative', 'emotion'],
  [tok('She','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('sad','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · she'});

addSentence('be-negative', 'It isn\'t cold.', 'Trời không lạnh.', 1, ['negative', 'weather'],
  [tok('It','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('cold','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · it'});

addSentence('be-negative', 'You aren\'t late.', 'Bạn không bị muộn.', 1, ['negative'],
  [tok('You','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('late','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · you'});

addSentence('be-negative', 'We aren\'t tired.', 'Chúng tôi không mệt.', 2, ['negative', 'emotion'],
  [tok('We','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('tired','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · we'});

addSentence('be-negative', 'They aren\'t angry.', 'Họ không giận dữ.', 2, ['negative', 'emotion'],
  [tok('They','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('angry','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · they'});

addSentence('be-negative', 'I am not weak.', 'Tôi không hề yếu ớt.', 2, ['negative', 'appearance'],
  [tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('not','adverb','adverbial'), tok('weak','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'am', promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · I'});

addSentence('be-negative', 'He is not hungry.', 'Cậu ấy không đói bụng.', 2, ['negative', 'emotion'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('not','adverb','adverbial'), tok('hungry','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be · he'});

addSentence('be-negative', 'She is not scared.', 'Cô ấy không sợ hãi.', 2, ['negative', 'emotion'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('not','adverb','adverbial'), tok('scared','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be · she'});

// 56-65: Negative with professions / nouns (diff 1: 4, diff 2: 6)
addSentence('be-negative', 'I am not a doctor.', 'Tôi không phải là bác sĩ.', 1, ['negative', 'profession'],
  [tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('not','adverb','adverbial'), tok('a','article','det'), tok('doctor','noun','complement','doctor','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'am', promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · I'});

addSentence('be-negative', 'She isn\'t a student.', 'Cô ấy không phải là học sinh.', 1, ['negative', 'profession'],
  [tok('She','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('a','article','det'), tok('student','noun','complement','student','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · she'});

addSentence('be-negative', 'He isn\'t a pilot.', 'Chú ấy không phải là phi công.', 1, ['negative', 'profession'],
  [tok('He','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('a','article','det'), tok('pilot','noun','complement','pilot','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · he'});

addSentence('be-negative', 'They aren\'t teachers.', 'Họ không phải là giáo viên.', 1, ['negative', 'profession'],
  [tok('They','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('teachers','noun','complement','teacher','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · they'});

addSentence('be-negative', 'We aren\'t dancers.', 'Chúng tôi không phải là vũ công.', 2, ['negative', 'profession'],
  [tok('We','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('dancers','noun','complement','dancer','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · we'});

addSentence('be-negative', 'You aren\'t a nurse.', 'Bạn không phải là y tá.', 2, ['negative', 'profession'],
  [tok('You','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('a','article','det'), tok('nurse','noun','complement','nurse','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · you'});

addSentence('be-negative', 'It is not a cat.', 'Nó không phải là một con mèo.', 2, ['negative'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('not','adverb','adverbial'), tok('a','article','det'), tok('cat','noun','complement','cat','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be · it'});

addSentence('be-negative', 'He is not an artist.', 'Anh ấy không phải là một họa sĩ.', 2, ['negative', 'profession'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('not','adverb','adverbial'), tok('an','article','det'), tok('artist','noun','complement','artist','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be · he'});

addSentence('be-negative', 'They are not farmers.', 'Họ không phải là những người nông dân.', 2, ['negative', 'profession'],
  [tok('They','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('not','adverb','adverbial'), tok('farmers','noun','complement','farmer','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be · they'});

addSentence('be-negative', 'We are not workers.', 'Chúng tôi không phải là công nhân.', 2, ['negative', 'profession'],
  [tok('We','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('not','adverb','adverbial'), tok('workers','noun','complement','worker','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be · we'});

// 66-75: Negative with movable adverbials & noun subjects (diff 2: 5, diff 3: 5)
addSentence('be-negative', 'She isn\'t angry today.', 'Hôm nay cô ấy không tức giận.', 2, ['negative', 'emotion'],
  [tok('She','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('angry','adjective','complement'), tok('today','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · she'},
  ['Today she isn\'t angry.']);

addSentence('be-negative', 'They aren\'t hungry now.', 'Bây giờ họ không đói.', 2, ['negative', 'emotion'],
  [tok('They','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('hungry','adjective','complement'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · they'},
  ['Now they aren\'t hungry.']);

addSentence('be-negative', 'My brother isn\'t tall.', 'Em trai tôi không cao.', 2, ['negative', 'family', 'appearance'],
  [tok('My','determiner','det'), tok('brother','noun','subject','brother','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('tall','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · my brother'});

addSentence('be-negative', 'My dog isn\'t dangerous.', 'Con chó của tôi không nguy hiểm.', 2, ['negative'],
  [tok('My','determiner','det'), tok('dog','noun','subject','dog','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('dangerous','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · my dog'});

addSentence('be-negative', 'The classroom isn\'t dark.', 'Phòng học không bị tối.', 2, ['negative', 'school'],
  [tok('The','article','det'), tok('classroom','noun','subject','classroom','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('dark','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định với to be.', hint:'to be phủ định · the classroom'});

// Diff 3 items (15 sentences for be-negative)
addSentence('be-negative', 'The new student isn\'t very confident today.', 'Bạn học sinh mới hôm nay không tự tin lắm.', 3, ['negative', 'character'],
  [tok('The','article','det'), tok('new','adjective','modifier'), tok('student','noun','subject','student','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('very','adverb','modifier'), tok('confident','adjective','complement'), tok('today','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định cho chủ ngữ số ít.', hint:'to be phủ định · the new student'},
  ['Today the new student isn\'t very confident.']);

addSentence('be-negative', 'Those young workers aren\'t tired after work.', 'Những người công nhân trẻ tuổi kia không hề mệt sau giờ làm.', 3, ['negative', 'profession'],
  [tok('Those','determiner','det'), tok('young','adjective','modifier'), tok('workers','noun','subject','worker','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('tired','adjective','complement'), tok('after','preposition','prep'), tok('work','noun','prep-object','work','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'aren\'t', alt:['are not'], promptVi:'Hoàn thành câu phủ định cho chủ ngữ số nhiều.', hint:'to be phủ định · workers'},
  ['After work those young workers aren\'t tired.']);

addSentence('be-negative', 'The little white puppy isn\'t scared of dogs.', 'Chú cún con nhỏ màu trắng không hề sợ những con chó khác.', 3, ['negative', 'appearance'],
  [tok('The','article','det'), tok('little','adjective','modifier'), tok('white','adjective','modifier'), tok('puppy','noun','subject','puppy','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('scared','adjective','complement'), tok('of','preposition','prep'), tok('dogs','noun','prep-object','dog','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định.', hint:'to be phủ định · puppy'});

addSentence('be-negative', 'Her kind grandmother isn\'t at home right now.', 'Người bà tốt bụng của cô ấy hiện giờ không có ở nhà.', 3, ['negative', 'family'],
  [tok('Her','determiner','det'), tok('kind','adjective','modifier'), tok('grandmother','noun','subject','grandmother','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('at','preposition','prep'), tok('home','noun','prep-object','home','sg'), tok('right','adverb','modifier'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6, 7]}],
  ['pos','fill','order','roles'], {idx:3, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định cho chủ ngữ số ít.', hint:'to be phủ định · her grandmother'},
  ['Right now her kind grandmother isn\'t at home.']);

addSentence('be-negative', 'Our friendly classmates aren\'t noisy in the room.', 'Những người bạn cùng lớp thân thiện không ồn ào trong phòng.', 3, ['negative', 'character'],
  [tok('Our','determiner','det'), tok('friendly','adjective','modifier'), tok('classmates','noun','subject','classmate','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('noisy','adjective','complement'), tok('in','preposition','prep'), tok('the','article','det'), tok('room','noun','prep-object','room','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:3, ans:'aren\'t', alt:['are not'], promptVi:'Điền to be phủ định cho chủ ngữ số nhiều.', hint:'to be phủ định · classmates'});

addSentence('be-negative', 'The old wooden desk isn\'t very clean.', 'Chiếc bàn học cũ bằng gỗ không được sạch cho lắm.', 3, ['negative', 'school'],
  [tok('The','article','det'), tok('old','adjective','modifier'), tok('wooden','adjective','modifier'), tok('desk','noun','subject','desk','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('very','adverb','modifier'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định cho số ít.', hint:'to be phủ định · desk'});

addSentence('be-negative', 'The tall firefighter isn\'t afraid of fire.', 'Người lính cứu hỏa cao lớn không hề sợ lửa.', 3, ['negative', 'profession'],
  [tok('The','article','det'), tok('tall','adjective','modifier'), tok('firefighter','noun','subject','firefighter','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('afraid','adjective','complement'), tok('of','preposition','prep'), tok('fire','noun','prep-object','fire','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định.', hint:'to be phủ định · firefighter'});

addSentence('be-negative', 'Those dirty shoes aren\'t in the box.', 'Những đôi giày bẩn kia không có ở trong hộp.', 3, ['negative', 'appearance'],
  [tok('Those','determiner','det'), tok('dirty','adjective','modifier'), tok('shoes','noun','subject','shoe','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('in','preposition','prep'), tok('the','article','det'), tok('box','noun','prep-object','box','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'aren\'t', alt:['are not'], promptVi:'Điền to be phủ định cho danh từ số nhiều.', hint:'to be phủ định · shoes'});

addSentence('be-negative', 'My little brother is not sleepy tonight.', 'Em trai nhỏ của tôi tối nay không hề buồn ngủ.', 3, ['negative', 'emotion'],
  [tok('My','determiner','det'), tok('little','adjective','modifier'), tok('brother','noun','subject','brother','sg'), tok('is','verb','verb','be','present-3sg'), tok('not','adverb','adverbial'), tok('sleepy','adjective','complement'), tok('tonight','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'is', promptVi:'Hoàn thành câu phủ định cho my brother.', hint:'to be · my brother'},
  ['Tonight my little brother is not sleepy.']);

addSentence('be-negative', 'The bright green board isn\'t dirty now.', 'Chiếc bảng màu xanh lá tươi bây giờ không bị bẩn.', 3, ['negative', 'school'],
  [tok('The','article','det'), tok('bright','adjective','modifier'), tok('green','adjective','modifier'), tok('board','noun','subject','board','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('dirty','adjective','complement'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:4, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định.', hint:'to be phủ định · the board'},
  ['Now the bright green board isn\'t dirty.']);

addSentence('be-negative', 'The baby isn\'t sleepy.', 'Em bé không buồn ngủ.', 1, ['negative', 'emotion'],
  [tok('The','article','det'), tok('baby','noun','subject','baby','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('sleepy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định cho em bé.', hint:'to be phủ định · the baby'});

addSentence('be-negative', 'Our teacher isn\'t busy.', 'Thầy giáo của chúng tôi không bận.', 1, ['negative', 'character'],
  [tok('Our','determiner','det'), tok('teacher','noun','subject','teacher','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('busy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định cho our teacher.', hint:'to be phủ định · our teacher'});

addSentence('be-negative', 'My friend isn\'t sad.', 'Bạn tôi không buồn.', 1, ['negative', 'emotion'],
  [tok('My','determiner','det'), tok('friend','noun','subject','friend','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('sad','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định cho my friend.', hint:'to be phủ định · my friend'});

addSentence('be-negative', 'The cat isn\'t hungry.', 'Con mèo không bị đói.', 1, ['negative', 'emotion'],
  [tok('The','article','det'), tok('cat','noun','subject','cat','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('hungry','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định cho the cat.', hint:'to be phủ định · the cat'});

addSentence('be-negative', 'The water isn\'t cold.', 'Nước không bị lạnh.', 1, ['negative'],
  [tok('The','article','det'), tok('water','noun','subject','water','uncountable'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('cold','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định cho the water.', hint:'to be phủ định · the water'});

addSentence('be-negative', 'The dogs aren\'t noisy.', 'Những con chó không ồn ào.', 1, ['negative'],
  [tok('The','article','det'), tok('dogs','noun','subject','dog','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('noisy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'aren\'t', alt:['are not'], promptVi:'Điền to be phủ định cho the dogs.', hint:'to be phủ định · the dogs'});

addSentence('be-negative', 'We aren\'t angry.', 'Chúng tôi không tức giận.', 1, ['negative', 'emotion'],
  [tok('We','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('angry','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Điền to be phủ định cho we.', hint:'to be phủ định · we'});

addSentence('be-negative', 'They aren\'t tired.', 'Họ không bị mệt.', 1, ['negative', 'emotion'],
  [tok('They','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('tired','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Điền to be phủ định cho they.', hint:'to be phủ định · they'});

addSentence('be-negative', 'The tea isn\'t hot.', 'Trà không nóng.', 1, ['negative'],
  [tok('The','article','det'), tok('tea','noun','subject','tea','uncountable'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('hot','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định cho the tea.', hint:'to be phủ định · the tea'});

addSentence('be-negative', 'The clock isn\'t slow.', 'Đồng hồ không bị chậm.', 1, ['negative'],
  [tok('The','article','det'), tok('clock','noun','subject','clock','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('slow','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định cho the clock.', hint:'to be phủ định · the clock'});

console.log(`Current count: ${sentences.length} sentences (target: 90 be-affirmative + be-negative).`);

// --------------------------------------------------------------------------
// GROUP 3: be-question (45 sentences)
// --------------------------------------------------------------------------
// 91-105: Am/Is/Are + Pronoun + Adjective/Noun (diff 1: 8, diff 2: 7)
addSentence('be-question', 'Are you ready?', 'Bạn đã sẵn sàng chưa?', 1, ['question'],
  [tok('Are','verb','verb','be','present-other'), tok('you','pronoun','subject'), tok('ready','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi Yes/No với to be.', hint:'to be đảo hỏi · you'});

addSentence('be-question', 'Is he tall?', 'Cậu ấy có cao không?', 1, ['question', 'appearance'],
  [tok('Is','verb','verb','be','present-3sg'), tok('he','pronoun','subject'), tok('tall','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi Yes/No với to be.', hint:'to be đảo hỏi · he'});

addSentence('be-question', 'Is she pretty?', 'Cô bé có xinh xắn không?', 1, ['question', 'appearance'],
  [tok('Is','verb','verb','be','present-3sg'), tok('she','pronoun','subject'), tok('pretty','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi Yes/No với to be.', hint:'to be đảo hỏi · she'});

addSentence('be-question', 'Is it cold outside?', 'Bên ngoài trời có lạnh không?', 1, ['question', 'weather'],
  [tok('Is','verb','verb','be','present-3sg'), tok('it','pronoun','subject'), tok('cold','adjective','complement'), tok('outside','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi Yes/No với to be.', hint:'to be đảo hỏi · it'});

addSentence('be-question', 'Are they students?', 'Họ có phải là học sinh không?', 1, ['question', 'profession'],
  [tok('Are','verb','verb','be','present-other'), tok('they','pronoun','subject'), tok('students','noun','complement','student','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi Yes/No với to be.', hint:'to be đảo hỏi · they'});

addSentence('be-question', 'Are we late?', 'Chúng mình có bị muộn không?', 1, ['question'],
  [tok('Are','verb','verb','be','present-other'), tok('we','pronoun','subject'), tok('late','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi Yes/No với to be.', hint:'to be đảo hỏi · we'});

addSentence('be-question', 'Am I late?', 'Mình có bị muộn không?', 1, ['question'],
  [tok('Am','verb','verb','be','present-1sg'), tok('I','pronoun','subject'), tok('late','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Am', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · I'});

addSentence('be-question', 'Are you hungry?', 'Bạn có đói không?', 1, ['question', 'emotion'],
  [tok('Are','verb','verb','be','present-other'), tok('you','pronoun','subject'), tok('hungry','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · you'});

addSentence('be-question', 'Is he your brother?', 'Cậu ấy có phải là em trai bạn không?', 2, ['question', 'family'],
  [tok('Is','verb','verb','be','present-3sg'), tok('he','pronoun','subject'), tok('your','determiner','det'), tok('brother','noun','complement','brother','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · he'});

addSentence('be-question', 'Is she a nurse?', 'Cô ấy có phải là y tá không?', 2, ['question', 'profession'],
  [tok('Is','verb','verb','be','present-3sg'), tok('she','pronoun','subject'), tok('a','article','det'), tok('nurse','noun','complement','nurse','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · she'});

addSentence('be-question', 'Are they friendly?', 'Họ có thân thiện không?', 2, ['question', 'character'],
  [tok('Are','verb','verb','be','present-other'), tok('they','pronoun','subject'), tok('friendly','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · they'});

addSentence('be-question', 'Is he a doctor?', 'Anh ấy có phải là bác sĩ không?', 2, ['question', 'profession'],
  [tok('Is','verb','verb','be','present-3sg'), tok('he','pronoun','subject'), tok('a','article','det'), tok('doctor','noun','complement','doctor','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · he'});

addSentence('be-question', 'Are you a pupil?', 'Bạn có phải là một học sinh nhỏ không?', 2, ['question', 'profession'],
  [tok('Are','verb','verb','be','present-other'), tok('you','pronoun','subject'), tok('a','article','det'), tok('pupil','noun','complement','pupil','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · you'});

addSentence('be-question', 'Is it sunny today?', 'Hôm nay trời có nắng không?', 2, ['question', 'weather'],
  [tok('Is','verb','verb','be','present-3sg'), tok('it','pronoun','subject'), tok('sunny','adjective','complement'), tok('today','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · it'});

addSentence('be-question', 'Are they tired now?', 'Bây giờ họ có mệt không?', 2, ['question', 'emotion'],
  [tok('Are','verb','verb','be','present-other'), tok('they','pronoun','subject'), tok('tired','adjective','complement'), tok('now','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · they'});

// 106-120: Yes/No questions with To Be & Pronoun / Noun Subjects (diff 1: 5, diff 2: 10)
addSentence('be-question', 'Is he your friend?', 'Cậu ấy có phải là bạn của bạn không?', 1, ['question', 'family'],
  [tok('Is','verb','verb','be','present-3sg'), tok('he','pronoun','subject'), tok('your','determiner','det'), tok('friend','noun','complement','friend','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · he'});

addSentence('be-question', 'Is she your sister?', 'Cô ấy có phải là em gái của bạn không?', 1, ['question', 'family'],
  [tok('Is','verb','verb','be','present-3sg'), tok('she','pronoun','subject'), tok('your','determiner','det'), tok('sister','noun','complement','sister','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · she'});

addSentence('be-question', 'Are they your classmates?', 'Họ có phải là bạn cùng lớp của bạn không?', 1, ['question', 'family'],
  [tok('Are','verb','verb','be','present-other'), tok('they','pronoun','subject'), tok('your','determiner','det'), tok('classmates','noun','complement','classmate','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · they'});

addSentence('be-question', 'Are you fine today?', 'Hôm nay bạn có khỏe không?', 1, ['question', 'emotion'],
  [tok('Are','verb','verb','be','present-other'), tok('you','pronoun','subject'), tok('fine','adjective','complement'), tok('today','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2]}, {clauseId:'c1', role:'adverbial', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi thăm sức khỏe với to be.', hint:'to be đảo hỏi · you'});

addSentence('be-question', 'Are you eight years old?', 'Bạn có phải tám tuổi không?', 1, ['question', 'age'],
  [tok('Are','verb','verb','be','present-other'), tok('you','pronoun','subject'), tok('eight','numeral','det'), tok('years','noun','modifier','year','pl'), tok('old','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi tuổi với to be.', hint:'to be đảo hỏi · you'});

addSentence('be-question', 'Is he ten years old?', 'Cậu ấy có phải mười tuổi không?', 2, ['question', 'age'],
  [tok('Is','verb','verb','be','present-3sg'), tok('he','pronoun','subject'), tok('ten','numeral','det'), tok('years','noun','modifier','year','pl'), tok('old','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi tuổi với to be.', hint:'to be đảo hỏi · he'});

addSentence('be-question', 'Is she nine years old?', 'Cô bé có phải chín tuổi không?', 2, ['question', 'age'],
  [tok('Is','verb','verb','be','present-3sg'), tok('she','pronoun','subject'), tok('nine','numeral','det'), tok('years','noun','modifier','year','pl'), tok('old','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi tuổi với to be.', hint:'to be đảo hỏi · she'});

addSentence('be-question', 'Is your father a teacher?', 'Bố bạn có phải là giáo viên không?', 2, ['question', 'family', 'profession'],
  [tok('Is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('father','noun','subject','father','sg'), tok('a','article','det'), tok('teacher','noun','complement','teacher','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · your father'});

addSentence('be-question', 'Is your mother a nurse?', 'Mẹ bạn có phải là y tá không?', 2, ['question', 'family', 'profession'],
  [tok('Is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('mother','noun','subject','mother','sg'), tok('a','article','det'), tok('nurse','noun','complement','nurse','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · your mother'});

addSentence('be-question', 'Are the cats sleepy?', 'Những chú mèo có đang buồn ngủ không?', 2, ['question', 'emotion'],
  [tok('Are','verb','verb','be','present-other'), tok('the','article','det'), tok('cats','noun','subject','cat','pl'), tok('sleepy','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi cho danh từ số nhiều.', hint:'to be đảo hỏi · the cats'});

addSentence('be-question', 'Is the room clean?', 'Căn phòng có sạch sẽ không?', 2, ['question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('room','noun','subject','room','sg'), tok('clean','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · the room'});

addSentence('be-question', 'Are your friends polite?', 'Bạn bè của bạn có lễ phép không?', 2, ['question', 'character'],
  [tok('Are','verb','verb','be','present-other'), tok('your','determiner','det'), tok('friends','noun','subject','friend','pl'), tok('polite','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi cho số nhiều.', hint:'to be đảo hỏi · your friends'});

addSentence('be-question', 'Is Nam at school now?', 'Bây giờ Nam có ở trường không?', 2, ['question', 'school'],
  [tok('Is','verb','verb','be','present-3sg'), tok('Nam','noun','subject','Nam','sg'), tok('at','preposition','prep'), tok('school','noun','prep-object','school','sg'), tok('now','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · Nam'});

addSentence('be-question', 'Are Mai and Lan in the room?', 'Mai và Lan có ở trong phòng không?', 2, ['question'],
  [tok('Are','verb','verb','be','present-other'), tok('Mai','noun','subject','Mai','sg'), tok('and','conjunction','conj'), tok('Lan','noun','subject','Lan','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('room','noun','prep-object','room','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi cho hai người.', hint:'to be đảo hỏi · hai người'});

addSentence('be-question', 'Is the water hot?', 'Nước có nóng không?', 2, ['question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('water','noun','subject','water','uncountable'), tok('hot','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi cho danh từ không đếm được.', hint:'to be đảo hỏi · the water'});

// 121-135: Difficulty 3 Questions (15 sentences)
addSentence('be-question', 'Is the new English teacher very kind?', 'Thầy giáo tiếng Anh mới có rất tốt bụng không?', 3, ['question', 'character'],
  [tok('Is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('new','adjective','modifier'), tok('English','adjective','modifier'), tok('teacher','noun','subject','teacher','sg'), tok('very','adverb','modifier'), tok('kind','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi cho chủ ngữ số ít.', hint:'to be đảo hỏi · the teacher'});

addSentence('be-question', 'Are those two big brown dogs dangerous?', 'Hai con chó to màu nâu kia có nguy hiểm không?', 3, ['question'],
  [tok('Are','verb','verb','be','present-other'), tok('those','determiner','det'), tok('two','numeral','det'), tok('big','adjective','modifier'), tok('brown','adjective','modifier'), tok('dogs','noun','subject','dog','pl'), tok('dangerous','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4, 5]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi cho chủ ngữ số nhiều.', hint:'to be đảo hỏi · dogs'});

addSentence('be-question', 'Is her older brother a famous artist?', 'Anh trai của cô ấy có phải là một họa sĩ nổi tiếng không?', 3, ['question', 'profession'],
  [tok('Is','verb','verb','be','present-3sg'), tok('her','determiner','det'), tok('older','adjective','modifier'), tok('brother','noun','subject','brother','sg'), tok('a','article','det'), tok('famous','adjective','modifier'), tok('artist','noun','complement','artist','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi cho chủ ngữ số ít.', hint:'to be đảo hỏi · brother'});

addSentence('be-question', 'Are all the young pupils ready for class?', 'Tất cả các em học sinh nhỏ đã sẵn sàng vào lớp chưa?', 3, ['question'],
  [tok('Are','verb','verb','be','present-other'), tok('all','determiner','det'), tok('the','article','det'), tok('young','adjective','modifier'), tok('pupils','noun','subject','pupil','pl'), tok('ready','adjective','complement'), tok('for','preposition','prep'), tok('class','noun','prep-object','class','uncountable'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi cho chủ ngữ số nhiều.', hint:'to be đảo hỏi · pupils'});

addSentence('be-question', 'Is the little white kitten in the box?', 'Chú mèo con màu trắng nhỏ có ở trong hộp không?', 3, ['question', 'appearance'],
  [tok('Is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('little','adjective','modifier'), tok('white','adjective','modifier'), tok('kitten','noun','subject','kitten','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('box','noun','prep-object','box','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Điền to be đảo hỏi.', hint:'to be đảo hỏi · kitten'});

addSentence('be-question', 'Are your polite classmates in the quiet room?', 'Những người bạn cùng lớp lễ phép có ở trong phòng yên tĩnh không?', 3, ['question', 'character'],
  [tok('Are','verb','verb','be','present-other'), tok('your','determiner','det'), tok('polite','adjective','modifier'), tok('classmates','noun','subject','classmate','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('quiet','adjective','modifier'), tok('room','noun','prep-object','room','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Điền to be đảo hỏi số nhiều.', hint:'to be đảo hỏi · classmates'});

addSentence('be-question', 'Is that tall police officer very brave?', 'Người cảnh sát cao lớn kia có rất dũng cảm không?', 3, ['question', 'character'],
  [tok('Is','verb','verb','be','present-3sg'), tok('that','determiner','det'), tok('tall','adjective','modifier'), tok('police','noun','modifier','police','uncountable'), tok('officer','noun','subject','officer','sg'), tok('very','adverb','modifier'), tok('brave','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Điền to be đảo hỏi số ít.', hint:'to be đảo hỏi · officer'});

addSentence('be-question', 'Are these new yellow pencils on the desk?', 'Những chiếc bút chì mới màu vàng này có ở trên bàn không?', 3, ['question', 'school'],
  [tok('Are','verb','verb','be','present-other'), tok('these','determiner','det'), tok('new','adjective','modifier'), tok('yellow','adjective','modifier'), tok('pencils','noun','subject','pencil','pl'), tok('on','preposition','prep'), tok('the','article','det'), tok('desk','noun','prep-object','desk','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Điền to be đảo hỏi số nhiều.', hint:'to be đảo hỏi · pencils'});

addSentence('be-question', 'Is your grandfather a retired bus driver?', 'Ông của bạn có phải là một tài xế xe buýt đã nghỉ hưu không?', 3, ['question', 'profession'],
  [tok('Is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('grandfather','noun','subject','grandfather','sg'), tok('a','article','det'), tok('retired','adjective','modifier'), tok('bus','noun','modifier','bus','sg'), tok('driver','noun','complement','driver','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Điền to be đảo hỏi số ít.', hint:'to be đảo hỏi · grandfather'});

addSentence('be-question', 'Are those busy firefighters ready now?', 'Những người lính cứu hỏa bận rộn kia bây giờ đã sẵn sàng chưa?', 3, ['question', 'profession'],
  [tok('Are','verb','verb','be','present-other'), tok('those','determiner','det'), tok('busy','adjective','modifier'), tok('firefighters','noun','subject','firefighter','pl'), tok('ready','adjective','complement'), tok('now','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Điền to be đảo hỏi số nhiều.', hint:'to be đảo hỏi · firefighters'});

addSentence('be-question', 'Is the baby sleepy?', 'Em bé có đang buồn ngủ không?', 1, ['question', 'emotion'],
  [tok('Is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('baby','noun','subject','baby','sg'), tok('sleepy','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · the baby'});

addSentence('be-question', 'Is your friend tall?', 'Bạn của bạn có cao không?', 1, ['question', 'appearance'],
  [tok('Is','verb','verb','be','present-3sg'), tok('your','determiner','det'), tok('friend','noun','subject','friend','sg'), tok('tall','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · your friend'});

addSentence('be-question', 'Are the dogs hungry?', 'Những con chó có đói không?', 1, ['question', 'emotion'],
  [tok('Are','verb','verb','be','present-other'), tok('the','article','det'), tok('dogs','noun','subject','dog','pl'), tok('hungry','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi cho danh từ số nhiều.', hint:'to be đảo hỏi · the dogs'});

addSentence('be-question', 'Is our teacher kind?', 'Cô giáo của chúng mình có hiền không?', 1, ['question', 'character'],
  [tok('Is','verb','verb','be','present-3sg'), tok('our','determiner','det'), tok('teacher','noun','subject','teacher','sg'), tok('kind','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · our teacher'});

addSentence('be-question', 'Is the tea hot?', 'Trà có nóng không?', 1, ['question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('the','article','det'), tok('tea','noun','subject','tea','uncountable'), tok('hot','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với to be.', hint:'to be đảo hỏi · the tea'});

console.log(`Current count: ${sentences.length} sentences (target: 135).`);

// --------------------------------------------------------------------------
// GROUP 4: be-short-answer (20 sentences)
// --------------------------------------------------------------------------
// Note: en MUST be "Yes, I am.", NO space before punctuation!
// exerciseTypes ONLY ["fill", "order"] (NO roles!).
// promptVi must give full Q&A context!
addSentence('be-short-answer', 'Yes, I am.', 'Vâng, tôi sẵn sàng.', 1, ['short-answer'],
  [tok('Yes','interjection','modifier'), punctComma, tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), punctDot],
  [], ['fill','order'], {idx:3, ans:'am', promptVi:'Trả lời ngắn khẳng định cho câu hỏi: "Are you ready?"', hint:'to be · I'});

addSentence('be-short-answer', 'No, I am not.', 'Không, tôi chưa sẵn sàng.', 1, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('I','pronoun','subject'), tok('am','verb','verb','be','present-1sg'), tok('not','adverb','adverbial'), punctDot],
  [], ['fill','order'], {idx:3, ans:'am', promptVi:'Trả lời ngắn phủ định cho câu hỏi: "Are you ready?"', hint:'to be · I'});

addSentence('be-short-answer', 'Yes, he is.', 'Vâng, cậu ấy cao.', 1, ['short-answer'],
  [tok('Yes','interjection','modifier'), punctComma, tok('he','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), punctDot],
  [], ['fill','order'], {idx:3, ans:'is', promptVi:'Trả lời ngắn khẳng định cho câu hỏi: "Is he tall?"', hint:'to be · he'});

addSentence('be-short-answer', 'No, he isn\'t.', 'Không, cậu ấy không cao.', 1, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('he','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), punctDot],
  [], ['fill','order'], {idx:3, ans:'isn\'t', alt:['is not'], promptVi:'Trả lời ngắn phủ định cho câu hỏi: "Is he tall?"', hint:'to be phủ định · he'});

addSentence('be-short-answer', 'Yes, she is.', 'Vâng, cô ấy là bác sĩ.', 1, ['short-answer'],
  [tok('Yes','interjection','modifier'), punctComma, tok('she','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), punctDot],
  [], ['fill','order'], {idx:3, ans:'is', promptVi:'Trả lời ngắn khẳng định cho câu hỏi: "Is she a doctor?"', hint:'to be · she'});

addSentence('be-short-answer', 'No, she isn\'t.', 'Không, cô ấy không phải là bác sĩ.', 1, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('she','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), punctDot],
  [], ['fill','order'], {idx:3, ans:'isn\'t', alt:['is not'], promptVi:'Trả lời ngắn phủ định cho câu hỏi: "Is she a doctor?"', hint:'to be phủ định · she'});

addSentence('be-short-answer', 'Yes, it is.', 'Vâng, trời lạnh.', 1, ['short-answer'],
  [tok('Yes','interjection','modifier'), punctComma, tok('it','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), punctDot],
  [], ['fill','order'], {idx:3, ans:'is', promptVi:'Trả lời ngắn khẳng định cho câu hỏi: "Is it cold?"', hint:'to be · it'});

addSentence('be-short-answer', 'No, it isn\'t.', 'Không, trời không lạnh.', 1, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('it','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), punctDot],
  [], ['fill','order'], {idx:3, ans:'isn\'t', alt:['is not'], promptVi:'Trả lời ngắn phủ định cho câu hỏi: "Is it cold?"', hint:'to be phủ định · it'});

addSentence('be-short-answer', 'Yes, we are.', 'Vâng, chúng tôi là học sinh.', 1, ['short-answer'],
  [tok('Yes','interjection','modifier'), punctComma, tok('we','pronoun','subject'), tok('are','verb','verb','be','present-other'), punctDot],
  [], ['fill','order'], {idx:3, ans:'are', promptVi:'Trả lời ngắn khẳng định cho câu hỏi: "Are you students?"', hint:'to be · we'});

addSentence('be-short-answer', 'No, we aren\'t.', 'Không, chúng tôi không phải là học sinh.', 1, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('we','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), punctDot],
  [], ['fill','order'], {idx:3, ans:'aren\'t', alt:['are not'], promptVi:'Trả lời ngắn phủ định cho câu hỏi: "Are you students?"', hint:'to be phủ định · we'});

addSentence('be-short-answer', 'Yes, they are.', 'Vâng, họ đói bụng.', 2, ['short-answer'],
  [tok('Yes','interjection','modifier'), punctComma, tok('they','pronoun','subject'), tok('are','verb','verb','be','present-other'), punctDot],
  [], ['fill','order'], {idx:3, ans:'are', promptVi:'Trả lời ngắn khẳng định cho câu hỏi: "Are they hungry?"', hint:'to be · they'});

addSentence('be-short-answer', 'No, they aren\'t.', 'Không, họ không đói.', 2, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('they','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), punctDot],
  [], ['fill','order'], {idx:3, ans:'aren\'t', alt:['are not'], promptVi:'Trả lời ngắn phủ định cho câu hỏi: "Are they hungry?"', hint:'to be phủ định · they'});

addSentence('be-short-answer', 'Yes, you are.', 'Vâng, bạn đúng rồi.', 2, ['short-answer'],
  [tok('Yes','interjection','modifier'), punctComma, tok('you','pronoun','subject'), tok('are','verb','verb','be','present-other'), punctDot],
  [], ['fill','order'], {idx:3, ans:'are', promptVi:'Trả lời ngắn khẳng định cho câu hỏi: "Am I right?"', hint:'to be · you'});

addSentence('be-short-answer', 'No, you aren\'t.', 'Không, bạn không bị muộn.', 2, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('you','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), punctDot],
  [], ['fill','order'], {idx:3, ans:'aren\'t', alt:['are not'], promptVi:'Trả lời ngắn phủ định cho câu hỏi: "Am I late?"', hint:'to be phủ định · you'});

addSentence('be-short-answer', 'No, he is not.', 'Không, cậu ấy không mệt.', 2, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('he','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('not','adverb','adverbial'), punctDot],
  [], ['fill','order'], {idx:3, ans:'is', promptVi:'Đáp lời phủ định (không rút gọn) cho câu hỏi: "Is he tired?"', hint:'to be · he'});

addSentence('be-short-answer', 'No, she is not.', 'Không, cô ấy không tức giận.', 2, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('she','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('not','adverb','adverbial'), punctDot],
  [], ['fill','order'], {idx:3, ans:'is', promptVi:'Đáp lời phủ định (không rút gọn) cho câu hỏi: "Is she angry?"', hint:'to be · she'});

addSentence('be-short-answer', 'No, it is not.', 'Không, trời không lạnh.', 2, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('it','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('not','adverb','adverbial'), punctDot],
  [], ['fill','order'], {idx:3, ans:'is', promptVi:'Đáp lời phủ định (không rút gọn) cho câu hỏi: "Is it cold?"', hint:'to be · it'});

addSentence('be-short-answer', 'No, we are not.', 'Không, chúng tôi không đói.', 2, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('we','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('not','adverb','adverbial'), punctDot],
  [], ['fill','order'], {idx:3, ans:'are', promptVi:'Đáp lời phủ định (không rút gọn) cho câu hỏi: "Are you hungry?"', hint:'to be · we'});

addSentence('be-short-answer', 'No, they are not.', 'Không, họ không bị muộn.', 2, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('they','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('not','adverb','adverbial'), punctDot],
  [], ['fill','order'], {idx:3, ans:'are', promptVi:'Đáp lời phủ định (không rút gọn) cho câu hỏi: "Are they late?"', hint:'to be · they'});

addSentence('be-short-answer', 'No, you are not.', 'Không, bạn không sai.', 2, ['short-answer'],
  [tok('No','interjection','modifier'), punctComma, tok('you','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('not','adverb','adverbial'), punctDot],
  [], ['fill','order'], {idx:3, ans:'are', promptVi:'Đáp lời phủ định (không rút gọn) cho câu hỏi: "Am I wrong?"', hint:'to be · you'});

console.log(`Current count: ${sentences.length} sentences (target: 155).`);

// --------------------------------------------------------------------------
// GROUP 5: demonstratives (45 sentences)
// --------------------------------------------------------------------------
// 156-170: This / That / These / Those basic (diff 1: 10, diff 2: 5)
// 156: Blank on 'This' (near, singular)
addSentence('demonstratives', 'This is my pen.', 'Đây là chiếc bút của tôi.', 1, ['demonstrative', 'school'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('my','determiner','det'), tok('pen','noun','complement','pen','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'This', promptVi:'Điền từ chỉ một người/vật ở GẦN người nói (số ít).', hint:'từ chỉ định gần (số ít)'});

// 157: Blank on 'That' (far, singular)
addSentence('demonstratives', 'That is my school.', 'Kia là trường học của tôi.', 1, ['demonstrative', 'school'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('my','determiner','det'), tok('school','noun','complement','school','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'That', promptVi:'Điền từ chỉ một người/vật ở XA người nói (số ít).', hint:'từ chỉ định xa (số ít)'});

// 158: Blank on 'These' (near, plural)
addSentence('demonstratives', 'These are my books.', 'Đây là những cuốn sách của tôi.', 1, ['demonstrative', 'school'],
  [tok('These','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('my','determiner','det'), tok('books','noun','complement','book','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'These', promptVi:'Điền từ chỉ nhiều người/vật ở GẦN người nói (số nhiều).', hint:'từ chỉ định gần (số nhiều)'});

// 159: Blank on 'Those' (far, plural)
addSentence('demonstratives', 'Those are big dogs.', 'Kia là những con chó to.', 1, ['demonstrative'],
  [tok('Those','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('big','adjective','modifier'), tok('dogs','noun','complement','dog','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Those', promptVi:'Điền từ chỉ nhiều người/vật ở XA người nói (số nhiều).', hint:'từ chỉ định xa (số nhiều)'});

// 160: Blank on 'is'
addSentence('demonstratives', 'This is a new ruler.', 'Đây là một chiếc thước kẻ mới.', 1, ['demonstrative', 'school'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('new','adjective','modifier'), tok('ruler','noun','complement','ruler','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền to be phù hợp với This.', hint:'to be · this'});

// 161: Blank on 'is'
addSentence('demonstratives', 'That is a big desk.', 'Kia là một cái bàn học to.', 1, ['demonstrative', 'school'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('big','adjective','modifier'), tok('desk','noun','complement','desk','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền to be phù hợp với That.', hint:'to be · that'});

// 162: Blank on 'These' (near, plural)
addSentence('demonstratives', 'These are yellow pencils.', 'Đây là những chiếc bút chì màu vàng.', 1, ['demonstrative', 'school'],
  [tok('These','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('yellow','adjective','modifier'), tok('pencils','noun','complement','pencil','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'These', promptVi:'Điền từ chỉ nhiều vật ở GẦN người nói (số nhiều).', hint:'từ chỉ định gần (số nhiều)'});

// 163: Blank on 'Those' (far, plural)
addSentence('demonstratives', 'Those are green trees.', 'Kia là những cái cây màu xanh lá.', 1, ['demonstrative'],
  [tok('Those','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok('green','adjective','modifier'), tok('trees','noun','complement','tree','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Those', promptVi:'Điền từ chỉ nhiều vật ở XA người nói (số nhiều).', hint:'từ chỉ định xa (số nhiều)'});

// 164: Blank on 'This' (near, singular)
addSentence('demonstratives', 'This is an eraser.', 'Đây là một cục tẩy.', 1, ['demonstrative', 'school'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('eraser','noun','complement','eraser','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'This', promptVi:'Điền từ chỉ một vật ở GẦN người nói (số ít).', hint:'từ chỉ định gần (số ít)'});

// 165: Blank on 'That' (far, singular)
addSentence('demonstratives', 'That is an apple.', 'Kia là một quả táo.', 1, ['demonstrative'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('apple','noun','complement','apple','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'That', promptVi:'Điền từ chỉ một vật ở XA người nói (số ít).', hint:'từ chỉ định xa (số ít)'});

// 166: Blank on 'This' (near, singular)
addSentence('demonstratives', 'This pencil is red.', 'Chiếc bút chì này màu đỏ.', 2, ['demonstrative', 'school', 'color'],
  [tok('This','determiner','det'), tok('pencil','noun','subject','pencil','sg'), tok('is','verb','verb','be','present-3sg'), tok('red','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'This', promptVi:'Điền từ chỉ một vật ở GẦN người nói (số ít).', hint:'từ chỉ định gần (số ít)'});

// 167: Blank on 'That' (far, singular)
addSentence('demonstratives', 'That chair is brown.', 'Chiếc ghế kia màu nâu.', 2, ['demonstrative', 'school', 'color'],
  [tok('That','determiner','det'), tok('chair','noun','subject','chair','sg'), tok('is','verb','verb','be','present-3sg'), tok('brown','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'That', promptVi:'Điền từ chỉ một vật ở XA người nói (số ít).', hint:'từ chỉ định xa (số ít)'});

// 168: Blank on 'These' (near, plural)
addSentence('demonstratives', 'These books are interesting.', 'Những cuốn sách này rất thú vị.', 2, ['demonstrative', 'school'],
  [tok('These','determiner','det'), tok('books','noun','subject','book','pl'), tok('are','verb','verb','be','present-other'), tok('interesting','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'These', promptVi:'Điền từ chỉ nhiều vật ở GẦN người nói (số nhiều).', hint:'từ chỉ định gần (số nhiều)'});

// 169: Blank on 'Those' (far, plural)
addSentence('demonstratives', 'Those dogs are noisy.', 'Những con chó kia rất ồn ào.', 2, ['demonstrative'],
  [tok('Those','determiner','det'), tok('dogs','noun','subject','dog','pl'), tok('are','verb','verb','be','present-other'), tok('noisy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Those', promptVi:'Điền từ chỉ nhiều con vật ở XA người nói (số nhiều).', hint:'từ chỉ định xa (số nhiều)'});

// 170: Blank on 'is'
addSentence('demonstratives', 'This room is clean.', 'Căn phòng này sạch sẽ.', 2, ['demonstrative'],
  [tok('This','determiner','det'), tok('room','noun','subject','room','sg'), tok('is','verb','verb','be','present-3sg'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'is', promptVi:'Điền to be phù hợp.', hint:'to be · this room'});

// 171-185: Negative & Questions with Demonstratives (diff 2: 15)
// 171: Blank on 'This' (near, singular)
addSentence('demonstratives', 'This isn\'t my book.', 'Đây không phải cuốn sách của tôi.', 2, ['demonstrative', 'negative', 'school'],
  [tok('This','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('my','determiner','det'), tok('book','noun','complement','book','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'This', promptVi:'Điền từ chỉ một vật ở GẦN người nói (số ít).', hint:'từ chỉ định gần (số ít)'});

// 172: Blank on 'That' (far, singular)
addSentence('demonstratives', 'That isn\'t my cat.', 'Kia không phải con mèo của tôi.', 2, ['demonstrative', 'negative'],
  [tok('That','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('my','determiner','det'), tok('cat','noun','complement','cat','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'That', promptVi:'Điền từ chỉ một con vật ở XA người nói (số ít).', hint:'từ chỉ định xa (số ít)'});

// 173: Blank on 'These' (near, plural)
addSentence('demonstratives', 'These aren\'t your pens.', 'Đây không phải bút của bạn.', 2, ['demonstrative', 'negative', 'school'],
  [tok('These','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('your','determiner','det'), tok('pens','noun','complement','pen','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'These', promptVi:'Điền từ chỉ nhiều vật ở GẦN người nói (số nhiều).', hint:'từ chỉ định gần (số nhiều)'});

// 174: Blank on 'Those' (far, plural)
addSentence('demonstratives', 'Those aren\'t my bags.', 'Kia không phải cặp sách của tôi.', 2, ['demonstrative', 'negative', 'school'],
  [tok('Those','pronoun','subject'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('my','determiner','det'), tok('bags','noun','complement','bag','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Those', promptVi:'Điền từ chỉ nhiều vật ở XA người nói (số nhiều).', hint:'từ chỉ định xa (số nhiều)'});

// 175: Blank on 'isn\'t'
addSentence('demonstratives', 'This boy isn\'t tall.', 'Cậu bé này không cao.', 2, ['demonstrative', 'negative', 'appearance'],
  [tok('This','determiner','det'), tok('boy','noun','subject','boy','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('tall','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'isn\'t', alt:['is not'], promptVi:'Hoàn thành câu phủ định cho this boy.', hint:'to be phủ định · this boy'});

// 176: Blank on 'aren\'t'
addSentence('demonstratives', 'These apples aren\'t red.', 'Những quả táo này không đỏ.', 2, ['demonstrative', 'negative'],
  [tok('These','determiner','det'), tok('apples','noun','subject','apple','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('red','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'aren\'t', alt:['are not'], promptVi:'Hoàn thành câu phủ định cho these apples.', hint:'to be phủ định · these apples'});

// 177: Blank on 'this' (near, singular)
addSentence('demonstratives', 'Is this your bag?', 'Đây có phải cặp sách của bạn không?', 2, ['demonstrative', 'question', 'school'],
  [tok('Is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), tok('your','determiner','det'), tok('bag','noun','complement','bag','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'this', promptVi:'Điền từ chỉ một vật ở GẦN người nói trong câu hỏi (số ít).', hint:'từ chỉ định gần (số ít)'});

// 178: Blank on 'that' (far, singular)
addSentence('demonstratives', 'Is that your sister?', 'Kia có phải chị gái của bạn không?', 2, ['demonstrative', 'question', 'family'],
  [tok('Is','verb','verb','be','present-3sg'), tok('that','pronoun','subject'), tok('your','determiner','det'), tok('sister','noun','complement','sister','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'that', promptVi:'Điền từ chỉ một người ở XA người nói trong câu hỏi (số ít).', hint:'từ chỉ định xa (số ít)'});

// 179: Blank on 'these' (near, plural)
addSentence('demonstratives', 'Are these your pens?', 'Đây có phải những chiếc bút của bạn không?', 2, ['demonstrative', 'question', 'school'],
  [tok('Are','verb','verb','be','present-other'), tok('these','pronoun','subject'), tok('your','determiner','det'), tok('pens','noun','complement','pen','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'these', promptVi:'Điền từ chỉ nhiều vật ở GẦN người nói trong câu hỏi (số nhiều).', hint:'từ chỉ định gần (số nhiều)'});

// 180: Blank on 'those' (far, plural)
addSentence('demonstratives', 'Are those dogs big?', 'Những con chó kia có to không?', 2, ['demonstrative', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('those','determiner','det'), tok('dogs','noun','subject','dog','pl'), tok('big','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'those', promptVi:'Điền từ chỉ nhiều con vật ở XA người nói (số nhiều).', hint:'từ chỉ định xa (số nhiều)'});

// 181: Replaced Wh-question with pure A1 Yes/No question with demonstratives
addSentence('demonstratives', 'Is this your pencil?', 'Đây có phải chiếc bút chì của bạn không?', 2, ['demonstrative', 'question', 'school'],
  [tok('Is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), tok('your','determiner','det'), tok('pencil','noun','complement','pencil','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với This.', hint:'to be đảo hỏi · this'});

// 182: Replaced Wh-question with pure A1 Yes/No question with demonstratives
addSentence('demonstratives', 'Is that a big school?', 'Kia có phải là một ngôi trường to không?', 2, ['demonstrative', 'question', 'school'],
  [tok('Is','verb','verb','be','present-3sg'), tok('that','pronoun','subject'), tok('a','article','det'), tok('big','adjective','modifier'), tok('school','noun','complement','school','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với That.', hint:'to be đảo hỏi · that'});

// 183: Replaced Wh-question with pure A1 Yes/No question with demonstratives
addSentence('demonstratives', 'Are these new books?', 'Đây có phải là những cuốn sách mới không?', 2, ['demonstrative', 'question', 'school'],
  [tok('Are','verb','verb','be','present-other'), tok('these','pronoun','subject'), tok('new','adjective','modifier'), tok('books','noun','complement','book','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi với These.', hint:'to be đảo hỏi · these'});

// 184: Replaced Wh-question with pure A1 Yes/No question with demonstratives
addSentence('demonstratives', 'Are those big desks?', 'Kia có phải là những chiếc bàn học to không?', 2, ['demonstrative', 'question', 'school'],
  [tok('Are','verb','verb','be','present-other'), tok('those','pronoun','subject'), tok('big','adjective','modifier'), tok('desks','noun','complement','desk','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi với Those.', hint:'to be đảo hỏi · those'});

// 185: Blank on 'this' (near, singular)
addSentence('demonstratives', 'Is this your new notebook?', 'Đây có phải cuốn vở mới của bạn không?', 2, ['demonstrative', 'question', 'school'],
  [tok('Is','verb','verb','be','present-3sg'), tok('this','pronoun','subject'), tok('your','determiner','det'), tok('new','adjective','modifier'), tok('notebook','noun','complement','notebook','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'this', promptVi:'Điền từ chỉ một vật ở GẦN người nói trong câu hỏi (số ít).', hint:'từ chỉ định gần (số ít)'});

// 186-200: Difficulty 3 Demonstratives (15 sentences)
// 186: Blank on 'This' (near, singular)
addSentence('demonstratives', 'This big green notebook is on my desk.', 'Cuốn vở to màu xanh lá này đang ở trên bàn tôi.', 3, ['demonstrative', 'school'],
  [tok('This','determiner','det'), tok('big','adjective','modifier'), tok('green','adjective','modifier'), tok('notebook','noun','subject','notebook','sg'), tok('is','verb','verb','be','present-3sg'), tok('on','preposition','prep'), tok('my','determiner','det'), tok('desk','noun','prep-object','desk','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'This', promptVi:'Điền từ chỉ một vật ở GẦN người nói (số ít).', hint:'từ chỉ định gần (số ít)'});

// 187: Blank on 'That' (far, singular)
addSentence('demonstratives', 'That tall young man is our new teacher.', 'Người đàn ông trẻ cao ráo kia là thầy giáo mới của chúng tôi.', 3, ['demonstrative', 'profession'],
  [tok('That','determiner','det'), tok('tall','adjective','modifier'), tok('young','adjective','modifier'), tok('man','noun','subject','man','sg'), tok('is','verb','verb','be','present-3sg'), tok('our','determiner','det'), tok('new','adjective','modifier'), tok('teacher','noun','complement','teacher','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'That', promptVi:'Điền từ chỉ một người ở XA người nói (số ít).', hint:'từ chỉ định xa (số ít)'});

// 188: Blank on 'These' (near, plural)
addSentence('demonstratives', 'These two cute puppies are very playful now.', 'Hai chú cún con đáng yêu này bây giờ rất tinh nghịch.', 3, ['demonstrative', 'appearance'],
  [tok('These','determiner','det'), tok('two','numeral','det'), tok('cute','adjective','modifier'), tok('puppies','noun','subject','puppy','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('playful','adjective','complement'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}, {clauseId:'c1', role:'adverbial', tokenIndices:[7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'These', promptVi:'Điền từ chỉ nhiều con vật ở GẦN người nói (số nhiều).', hint:'từ chỉ định gần (số nhiều)'},
  ['Now these two cute puppies are very playful.']);

// 189: Blank on 'Those' (far, plural) + missing orderAlternative
addSentence('demonstratives', 'Those five noisy dogs aren\'t outside right now.', 'Năm con chó ồn ào kia hiện giờ không có ở bên ngoài.', 3, ['demonstrative', 'negative'],
  [tok('Those','determiner','det'), tok('five','numeral','det'), tok('noisy','adjective','modifier'), tok('dogs','noun','subject','dog','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('outside','adverb','complement'), tok('right','adverb','modifier'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Those', promptVi:'Điền từ chỉ nhiều con vật ở XA người nói (số nhiều).', hint:'từ chỉ định xa (số nhiều)'},
  ['Right now those five noisy dogs aren\'t outside.']);

// 190: Blank on 'Are'
addSentence('demonstratives', 'Are these three long rulers for our classroom?', 'Ba chiếc thước kẻ dài này có phải cho lớp học của chúng mình không?', 3, ['demonstrative', 'question', 'school'],
  [tok('Are','verb','verb','be','present-other'), tok('these','determiner','det'), tok('three','numeral','det'), tok('long','adjective','modifier'), tok('rulers','noun','subject','ruler','pl'), tok('for','preposition','prep'), tok('our','determiner','det'), tok('classroom','noun','prep-object','classroom','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Hoàn thành câu hỏi với These.', hint:'to be đảo hỏi · rulers'});

// 191: Blank on 'Is'
addSentence('demonstratives', 'Is that small wooden chair in the room?', 'Chiếc ghế gỗ nhỏ kia có ở trong phòng không?', 3, ['demonstrative', 'question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('that','determiner','det'), tok('small','adjective','modifier'), tok('wooden','adjective','modifier'), tok('chair','noun','subject','chair','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('room','noun','prep-object','room','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Hoàn thành câu hỏi với That.', hint:'to be đảo hỏi · chair'});

// 192: Blank on 'aren\'t'
addSentence('demonstratives', 'These heavy black bags aren\'t on the floor.', 'Những chiếc cặp đen nặng này không có ở trên sàn.', 3, ['demonstrative', 'negative', 'school'],
  [tok('These','determiner','det'), tok('heavy','adjective','modifier'), tok('black','adjective','modifier'), tok('bags','noun','subject','bag','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('on','preposition','prep'), tok('the','article','det'), tok('floor','noun','prep-object','floor','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'aren\'t', alt:['are not'], promptVi:'Điền to be phủ định cho số nhiều.', hint:'to be phủ định · bags'});

// 193: Blank on 'That' (far, singular)
addSentence('demonstratives', 'That old round clock isn\'t slow today.', 'Chiếc đồng hồ tròn cũ kia hôm nay không bị chậm.', 3, ['demonstrative', 'negative'],
  [tok('That','determiner','det'), tok('old','adjective','modifier'), tok('round','adjective','modifier'), tok('clock','noun','subject','clock','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('slow','adjective','complement'), tok('today','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'That', promptVi:'Điền từ chỉ một vật ở XA người nói (số ít).', hint:'từ chỉ định xa (số ít)'},
  ['Today that old round clock isn\'t slow.']);

// 194: Replaced 'youngest' (superlative) with 'new'
addSentence('demonstratives', 'This little girl is our new classmate.', 'Cô bé nhỏ này là bạn cùng lớp mới của chúng tôi.', 3, ['demonstrative', 'family'],
  [tok('This','determiner','det'), tok('little','adjective','modifier'), tok('girl','noun','subject','girl','sg'), tok('is','verb','verb','be','present-3sg'), tok('our','determiner','det'), tok('new','adjective','modifier'), tok('classmate','noun','complement','classmate','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'is', promptVi:'Điền to be phù hợp.', hint:'to be · this girl'});

// 195: Replaced 'always on time' with 'in the classroom'
addSentence('demonstratives', 'Those four polite pupils are in the classroom.', 'Bốn em học sinh lễ phép kia đang ở trong lớp học.', 3, ['demonstrative', 'character'],
  [tok('Those','determiner','det'), tok('four','numeral','det'), tok('polite','adjective','modifier'), tok('pupils','noun','subject','pupil','pl'), tok('are','verb','verb','be','present-other'), tok('in','preposition','prep'), tok('the','article','det'), tok('classroom','noun','prep-object','classroom','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'are', promptVi:'Điền to be cho chủ ngữ số nhiều.', hint:'to be · pupils'});

// 196: Blank on 'Is'
addSentence('demonstratives', 'Is this clean white eraser for our teacher?', 'Cục tẩy trắng sạch sẽ này có phải dành cho cô giáo không?', 3, ['demonstrative', 'question', 'school'],
  [tok('Is','verb','verb','be','present-3sg'), tok('this','determiner','det'), tok('clean','adjective','modifier'), tok('white','adjective','modifier'), tok('eraser','noun','subject','eraser','sg'), tok('for','preposition','prep'), tok('our','determiner','det'), tok('teacher','noun','prep-object','teacher','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Điền to be đảo hỏi số ít.', hint:'to be đảo hỏi · eraser'});

// 197: Blank on 'These' (near, plural)
addSentence('demonstratives', 'These small red apples are very sweet.', 'Những quả táo nhỏ màu đỏ này rất ngọt.', 3, ['demonstrative'],
  [tok('These','determiner','det'), tok('small','adjective','modifier'), tok('red','adjective','modifier'), tok('apples','noun','subject','apple','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('sweet','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'These', promptVi:'Điền từ chỉ nhiều vật ở GẦN người nói (số nhiều).', hint:'từ chỉ định gần (số nhiều)'});

// 198: Blank on 'is'
addSentence('demonstratives', 'That tall chef is in the kitchen now.', 'Người đầu bếp cao ráo kia bây giờ đang ở trong bếp.', 3, ['demonstrative', 'profession'],
  [tok('That','determiner','det'), tok('tall','adjective','modifier'), tok('chef','noun','subject','chef','sg'), tok('is','verb','verb','be','present-3sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('kitchen','noun','prep-object','kitchen','sg'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}, {clauseId:'c1', role:'adverbial', tokenIndices:[7]}],
  ['pos','fill','order','roles'], {idx:3, ans:'is', promptVi:'Điền to be cho danh từ số ít.', hint:'to be · chef'},
  ['Now that tall chef is in the kitchen.']);

// 199: Blank on 'are'
addSentence('demonstratives', 'Those funny dancers are on the stage.', 'Những vũ công vui nhộn kia đang ở trên sân khấu.', 3, ['demonstrative', 'profession'],
  [tok('Those','determiner','det'), tok('funny','adjective','modifier'), tok('dancers','noun','subject','dancer','pl'), tok('are','verb','verb','be','present-other'), tok('on','preposition','prep'), tok('the','article','det'), tok('stage','noun','prep-object','stage','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'are', promptVi:'Điền to be cho danh từ số nhiều.', hint:'to be · dancers'});

// 200: Replaced 'Nam\'s friend' (possessive 's) with 'our friend' + Blank on 'This' (near, singular)
addSentence('demonstratives', 'This polite young boy is our friend.', 'Cậu bé lễ phép này là bạn của chúng tôi.', 3, ['demonstrative', 'character'],
  [tok('This','determiner','det'), tok('polite','adjective','modifier'), tok('young','adjective','modifier'), tok('boy','noun','subject','boy','sg'), tok('is','verb','verb','be','present-3sg'), tok('our','determiner','det'), tok('friend','noun','complement','friend','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'This', promptVi:'Điền từ chỉ một người ở GẦN người nói (số ít).', hint:'từ chỉ định gần (số ít)'});

console.log(`Total sentences generated: ${sentences.length}`);

// Add IDs
const formattedSentences = sentences.map((s, idx) => {
  const numStr = String(idx + 1).padStart(4, '0');
  return {
    id: `A1-s-${numStr}`,
    level: 'A1',
    topic: 'to-be-pronouns',
    grammarPoint: s.grammarPoint,
    en: s.en,
    vi: s.vi,
    tokens: s.tokens,
    roleSpans: s.roleSpans,
    exerciseTypes: s.exerciseTypes,
    ...(s.orderAlternatives ? { orderAlternatives: s.orderAlternatives } : {}),
    blanks: s.blanks,
    difficulty: s.difficulty,
    tags: s.tags,
    source: s.source
  };
});

fs.writeFileSync(
  path.join(outDir, 'A1.sentences.json'),
  JSON.stringify(formattedSentences.map(applyReviewedOrder), null, 2),
  'utf-8'
);
console.log(`✅ Generated A1.sentences.json with ${formattedSentences.length} sentences (target: 200).`);

// Difficulty count summary
const diffCounts = { 1: 0, 2: 0, 3: 0 };
formattedSentences.forEach(s => diffCounts[s.difficulty]++);
console.log(`Difficulty distribution: 1: ${diffCounts[1]} (${(diffCounts[1]/200*100).toFixed(1)}%), 2: ${diffCounts[2]} (${(diffCounts[2]/200*100).toFixed(1)}%), 3: ${diffCounts[3]} (${(diffCounts[3]/200*100).toFixed(1)}%)`);

// Skill count summary
const skillCounts = {};
formattedSentences.forEach(s => {
  skillCounts[s.grammarPoint] = (skillCounts[s.grammarPoint] || 0) + 1;
});
console.log(`Skill counts:`, skillCounts);
