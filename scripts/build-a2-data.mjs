import { applyContentReviewV4 } from './english-content-review-v4.mjs';
import { applyReviewedOrder } from './english-reviewed-order.mjs';
import fs from 'fs';
import path from 'path';
import { applyExercisePrompts } from './english-exercise-prompts.mjs';
import { applyTheoryReview } from './english-theory-review.mjs';

const outDir = path.resolve('src/data/english');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// ==========================================================================
// 1. VOCABULARY A2 (Countable Nouns, plurals, General American IPA)
// ==========================================================================
const rawVocab = [
  // Animals (Regular -s)
  { en: "cat", vi: "con mèo", pos: "noun", ipa: "/kæt/", forms: { plural: "cats" }, exampleEn: "The cat is small.", exampleVi: "Con mèo nhỏ bé.", image: "🐱", tags: ["animal"] },
  { en: "dog", vi: "con chó", pos: "noun", ipa: "/dɔːɡ/", forms: { plural: "dogs" }, exampleEn: "The dogs are friendly.", exampleVi: "Những con chó rất thân thiện.", image: "🐶", tags: ["animal"] },
  { en: "elephant", vi: "con voi", pos: "noun", ipa: "/ˈel.ə.fənt/", forms: { plural: "elephants" }, exampleEn: "It is an elephant.", exampleVi: "Nó là một con voi.", image: "🐘", tags: ["animal"] },
  { en: "lion", vi: "con sư tử", pos: "noun", ipa: "/ˈlaɪ.ən/", forms: { plural: "lions" }, exampleEn: "The lion is strong.", exampleVi: "Con sư tử rất khỏe mạnh.", image: "🦁", tags: ["animal"] },
  { en: "tiger", vi: "con hổ", pos: "noun", ipa: "/ˈtaɪ.ɡɚ/", forms: { plural: "tigers" }, exampleEn: "Those tigers are big.", exampleVi: "Những con hổ kia to lớn.", image: "🐯", tags: ["animal"] },
  { en: "monkey", vi: "con khỉ", pos: "noun", ipa: "/ˈmʌŋ.ki/", forms: { plural: "monkeys" }, exampleEn: "The monkeys are funny.", exampleVi: "Những con khỉ rất vui nhộn.", image: "🐵", tags: ["animal"] },
  { en: "rabbit", vi: "con thỏ", pos: "noun", ipa: "/ˈræb.ɪt/", forms: { plural: "rabbits" }, exampleEn: "This is a white rabbit.", exampleVi: "Đây là một con thỏ trắng.", image: "🐰", tags: ["animal"] },
  { en: "bird", vi: "con chim", pos: "noun", ipa: "/bɝːd/", forms: { plural: "birds" }, exampleEn: "There are two birds.", exampleVi: "Có hai con chim.", image: "🐦", tags: ["animal"] },
  { en: "duck", vi: "con vịt", pos: "noun", ipa: "/dʌk/", forms: { plural: "ducks" }, exampleEn: "The ducks are yellow.", exampleVi: "Những con vịt màu vàng.", image: "🦆", tags: ["animal"] },
  { en: "bear", vi: "con gấu", pos: "noun", ipa: "/ber/", forms: { plural: "bears" }, exampleEn: "The bear is brown.", exampleVi: "Con gấu màu nâu.", image: "🐻", tags: ["animal"] },
  { en: "horse", vi: "con ngựa", pos: "noun", ipa: "/hɔːrs/", forms: { plural: "horses" }, exampleEn: "There is a horse.", exampleVi: "Có một con ngựa.", image: "🐴", tags: ["animal"] },
  { en: "pig", vi: "con lợn, heo", pos: "noun", ipa: "/pɪɡ/", forms: { plural: "pigs" }, exampleEn: "The pigs are pink.", exampleVi: "Những chú lợn màu hồng.", image: "🐷", tags: ["animal"] },
  { en: "cow", vi: "con bò", pos: "noun", ipa: "/kaʊ/", forms: { plural: "cows" }, exampleEn: "The cows are big.", exampleVi: "Những con bò to lớn.", image: "🐮", tags: ["animal"] },
  { en: "chicken", vi: "con gà", pos: "noun", ipa: "/ˈtʃɪk.ɪn/", forms: { plural: "chickens" }, exampleEn: "There are three chickens.", exampleVi: "Có ba con gà.", image: "🐔", tags: ["animal"] },
  { en: "frog", vi: "con ếch", pos: "noun", ipa: "/frɑːɡ/", forms: { plural: "frogs" }, exampleEn: "The frog is green.", exampleVi: "Con ếch màu xanh lá.", image: "🐸", tags: ["animal"] },
  { en: "snake", vi: "con rắn", pos: "noun", ipa: "/sneɪk/", forms: { plural: "snakes" }, exampleEn: "The snake is long.", exampleVi: "Con rắn dài.", image: "🐍", tags: ["animal"] },
  { en: "bee", vi: "con ong", pos: "noun", ipa: "/biː/", forms: { plural: "bees" }, exampleEn: "There is a bee.", exampleVi: "Có một con ong.", image: "🐝", tags: ["animal"] },

  // Animals & Insects (-es, -ies, Irregular)
  { en: "fox", vi: "con cáo", pos: "noun", ipa: "/fɑːks/", forms: { plural: "foxes" }, exampleEn: "The fox is clever.", exampleVi: "Con cáo rất ranh mãnh.", image: "🦊", tags: ["animal"] },
  { en: "puppy", vi: "chó con", pos: "noun", ipa: "/ˈpʌp.i/", forms: { plural: "puppies" }, exampleEn: "These puppies are cute.", exampleVi: "Những chú cún con này rất dễ thương.", image: "🐕", tags: ["animal"] },
  { en: "fly", vi: "con ruồi", pos: "noun", ipa: "/flaɪ/", forms: { plural: "flies" }, exampleEn: "There are two flies.", exampleVi: "Có hai con ruồi.", image: "🪰", tags: ["animal"] },
  { en: "fish", vi: "con cá", pos: "noun", ipa: "/fɪʃ/", forms: { plural: "fish" }, exampleEn: "There are five fish.", exampleVi: "Có năm con cá.", image: "🐟", tags: ["animal"] },
  { en: "sheep", vi: "con cừu", pos: "noun", ipa: "/ʃiːp/", forms: { plural: "sheep" }, exampleEn: "The sheep are white.", exampleVi: "Những con cừu màu trắng.", image: "🐑", tags: ["animal"] },
  { en: "mouse", vi: "con chuột", pos: "noun", ipa: "/maʊs/", forms: { plural: "mice" }, exampleEn: "There is a mouse.", exampleVi: "Có một con chuột.", image: "🐭", tags: ["animal"] },

  // Food & Fruits (Vowel sounds: an apple, an orange, an egg...)
  { en: "apple", vi: "quả táo", pos: "noun", ipa: "/ˈæp.əl/", forms: { plural: "apples" }, exampleEn: "It is an apple.", exampleVi: "Nó là một quả táo.", image: "🍎", tags: ["food"] },
  { en: "orange", vi: "quả cam", pos: "noun", ipa: "/ˈɔːr.ɪndʒ/", forms: { plural: "oranges" }, exampleEn: "This is an orange.", exampleVi: "Đây là một quả cam.", image: "🍊", tags: ["food"] },
  { en: "egg", vi: "quả trứng", pos: "noun", ipa: "/eɡ/", forms: { plural: "eggs" }, exampleEn: "There is an egg.", exampleVi: "Có một quả trứng.", image: "🥚", tags: ["food"] },
  { en: "onion", vi: "củ hành tây", pos: "noun", ipa: "/ˈʌn.jən/", forms: { plural: "onions" }, exampleEn: "It is an onion.", exampleVi: "Nó là một củ hành tây.", image: "🧅", tags: ["food"] },
  { en: "banana", vi: "quả chuối", pos: "noun", ipa: "/bəˈnæn.ə/", forms: { plural: "bananas" }, exampleEn: "The bananas are yellow.", exampleVi: "Những quả chuối màu vàng.", image: "🍌", tags: ["food"] },
  { en: "mango", vi: "quả xoài", pos: "noun", ipa: "/ˈmæŋ.ɡoʊ/", forms: { plural: "mangoes" }, exampleEn: "The mangoes are sweet.", exampleVi: "Những quả xoài rất ngọt.", image: "🥭", tags: ["food"] },
  { en: "tomato", vi: "quả cà chua", pos: "noun", ipa: "/təˈmeɪ.t̬oʊ/", forms: { plural: "tomatoes" }, exampleEn: "These tomatoes are red.", exampleVi: "Những quả cà chua này màu đỏ.", image: "🍅", tags: ["food"] },
  { en: "potato", vi: "củ khoai tây", pos: "noun", ipa: "/pəˈteɪ.t̬oʊ/", forms: { plural: "potatoes" }, exampleEn: "There are four potatoes.", exampleVi: "Có bốn củ khoai tây.", image: "🥔", tags: ["food"] },
  { en: "carrot", vi: "củ cà rốt", pos: "noun", ipa: "/ˈker.ət/", forms: { plural: "carrots" }, exampleEn: "The carrot is orange.", exampleVi: "Củ cà rốt màu cam.", image: "🥕", tags: ["food"] },
  { en: "strawberry", vi: "quả dâu tây", pos: "noun", ipa: "/ˈstrɑːˌber.i/", forms: { plural: "strawberries" }, exampleEn: "Those strawberries are fresh.", exampleVi: "Những quả dâu tây kia rất tươi.", image: "🍓", tags: ["food"] },
  { en: "cherry", vi: "quả anh đào", pos: "noun", ipa: "/ˈtʃer.i/", forms: { plural: "cherries" }, exampleEn: "The cherries are small.", exampleVi: "Những quả anh đào nhỏ nhắn.", image: "🍒", tags: ["food"] },
  { en: "peach", vi: "quả đào", pos: "noun", ipa: "/piːtʃ/", forms: { plural: "peaches" }, exampleEn: "These peaches are soft.", exampleVi: "Những quả đào này rất mềm.", image: "🍑", tags: ["food"] },
  { en: "cake", vi: "chiếc bánh ngọt", pos: "noun", ipa: "/keɪk/", forms: { plural: "cakes" }, exampleEn: "There is a cake.", exampleVi: "Có một chiếc bánh ngọt.", image: "🎂", tags: ["food"] },
  { en: "sandwich", vi: "bánh kẹp", pos: "noun", ipa: "/ˈsæn.wɪtʃ/", forms: { plural: "sandwiches" }, exampleEn: "Two sandwiches are on the plate.", exampleVi: "Hai chiếc bánh kẹp ở trên đĩa.", image: "🥪", tags: ["food"] },
  { en: "cookie", vi: "bánh quy", pos: "noun", ipa: "/ˈkʊk.i/", forms: { plural: "cookies" }, exampleEn: "The cookies are sweet.", exampleVi: "Những chiếc bánh quy rất ngọt.", image: "🍪", tags: ["food"] },
  { en: "candy", vi: "viên kẹo", pos: "noun", ipa: "/ˈkæn.di/", forms: { plural: "candies" }, exampleEn: "There are some candies.", exampleVi: "Có vài viên kẹo.", image: "🍬", tags: ["food"] },
  { en: "pizza", vi: "bánh pizza", pos: "noun", ipa: "/ˈpiːt.sə/", forms: { plural: "pizzas" }, exampleEn: "It is a big pizza.", exampleVi: "Nó là một chiếc bánh pizza to.", image: "🍕", tags: ["food"] },

  // School & Everyday Objects
  { en: "book", vi: "quyển sách", pos: "noun", ipa: "/bʊk/", forms: { plural: "books" }, exampleEn: "There are three books.", exampleVi: "Có ba quyển sách.", image: "📖", tags: ["school"] },
  { en: "notebook", vi: "cuốn vở", pos: "noun", ipa: "/ˈnoʊt.bʊk/", forms: { plural: "notebooks" }, exampleEn: "The notebooks are blue.", exampleVi: "Những cuốn vở màu xanh dương.", image: "📓", tags: ["school"] },
  { en: "pen", vi: "chiếc bút", pos: "noun", ipa: "/pen/", forms: { plural: "pens" }, exampleEn: "There are five pens.", exampleVi: "Có năm chiếc bút.", image: "🖊️", tags: ["school"] },
  { en: "pencil", vi: "bút chì", pos: "noun", ipa: "/ˈpen.səl/", forms: { plural: "pencils" }, exampleEn: "These pencils are new.", exampleVi: "Những chiếc bút chì này mới.", image: "✏️", tags: ["school"] },
  { en: "ruler", vi: "thước kẻ", pos: "noun", ipa: "/ˈruː.lɚ/", forms: { plural: "rulers" }, exampleEn: "Two rulers are on the desk.", exampleVi: "Hai chiếc thước kẻ ở trên bàn.", image: "📏", tags: ["school"] },
  { en: "eraser", vi: "cục tẩy", pos: "noun", ipa: "/ɪˈreɪ.sɚ/", forms: { plural: "erasers" }, exampleEn: "It is an eraser.", exampleVi: "Nó là một cục tẩy.", image: "🧼", tags: ["school"] },
  { en: "bag", vi: "cặp sách", pos: "noun", ipa: "/bæɡ/", forms: { plural: "bags" }, exampleEn: "The bags are heavy.", exampleVi: "Những chiếc cặp sách rất nặng.", image: "🎒", tags: ["school"] },
  { en: "box", vi: "cái hộp", pos: "noun", ipa: "/bɑːks/", forms: { plural: "boxes" }, exampleEn: "There are three boxes.", exampleVi: "Có ba cái hộp.", image: "📦", tags: ["object"] },
  { en: "clock", vi: "đồng hồ", pos: "noun", ipa: "/klɑːk/", forms: { plural: "clocks" }, exampleEn: "The clock is round.", exampleVi: "Chiếc đồng hồ hình tròn.", image: "⏰", tags: ["object"] },
  { en: "watch", vi: "đồng hồ đeo tay", pos: "noun", ipa: "/wɑːtʃ/", forms: { plural: "watches" }, exampleEn: "These watches are expensive.", exampleVi: "Những chiếc đồng hồ đeo tay này đắt tiền.", image: "⌚", tags: ["object"] },
  { en: "dish", vi: "cái đĩa, món ăn", pos: "noun", ipa: "/dɪʃ/", forms: { plural: "dishes" }, exampleEn: "The dishes are clean.", exampleVi: "Những chiếc đĩa rất sạch sẽ.", image: "🍽️", tags: ["object"] },
  { en: "glass", vi: "cốc thủy tinh", pos: "noun", ipa: "/ɡlæs/", forms: { plural: "glasses" }, exampleEn: "There are two glasses.", exampleVi: "Có hai chiếc cốc thủy tinh.", image: "🥛", tags: ["object"] },
  { en: "table", vi: "cái bàn", pos: "noun", ipa: "/ˈteɪ.bəl/", forms: { plural: "tables" }, exampleEn: "There is a wooden table.", exampleVi: "Có một cái bàn gỗ.", image: "🪵", tags: ["object"] },
  { en: "chair", vi: "cái ghế", pos: "noun", ipa: "/tʃer/", forms: { plural: "chairs" }, exampleEn: "Four chairs are in the room.", exampleVi: "Bốn chiếc ghế ở trong phòng.", image: "🪑", tags: ["object"] },
  { en: "door", vi: "cửa ra vào", pos: "noun", ipa: "/dɔːr/", forms: { plural: "doors" }, exampleEn: "The doors are brown.", exampleVi: "Những cánh cửa màu nâu.", image: "🚪", tags: ["object"] },
  { en: "window", vi: "cửa sổ", pos: "noun", ipa: "/ˈwɪn.doʊ/", forms: { plural: "windows" }, exampleEn: "There are two windows.", exampleVi: "Có hai cửa sổ.", image: "🪟", tags: ["object"] },
  { en: "picture", vi: "bức tranh", pos: "noun", ipa: "/ˈpɪk.tʃɚ/", forms: { plural: "pictures" }, exampleEn: "The pictures are beautiful.", exampleVi: "Những bức tranh rất đẹp.", image: "🖼️", tags: ["object"] },
  { en: "lamp", vi: "chiếc đèn", pos: "noun", ipa: "/læmp/", forms: { plural: "lamps" }, exampleEn: "The lamp is bright.", exampleVi: "Chiếc đèn sáng.", image: "🛋️", tags: ["object"] },
  { en: "bed", vi: "chiếc giường", pos: "noun", ipa: "/bed/", forms: { plural: "beds" }, exampleEn: "There is a comfortable bed.", exampleVi: "Có một chiếc giường êm ái.", image: "🛏️", tags: ["object"] },
  { en: "umbrella", vi: "chiếc ô, dù", pos: "noun", ipa: "/ʌmˈbrel.ə/", forms: { plural: "umbrellas" }, exampleEn: "It is an umbrella.", exampleVi: "Nó là một chiếc ô.", image: "☂️", tags: ["object"] },

  // Toys & Vehicles
  { en: "toy", vi: "đồ chơi", pos: "noun", ipa: "/tɔɪ/", forms: { plural: "toys" }, exampleEn: "These toys are new.", exampleVi: "Những món đồ chơi này mới.", image: "🧸", tags: ["toy"] },
  { en: "ball", vi: "quả bóng", pos: "noun", ipa: "/bɑːl/", forms: { plural: "balls" }, exampleEn: "There are three balls.", exampleVi: "Có ba quả bóng.", image: "⚽", tags: ["toy"] },
  { en: "doll", vi: "búp bê", pos: "noun", ipa: "/dɑːl/", forms: { plural: "dolls" }, exampleEn: "The doll is cute.", exampleVi: "Búp bê dễ thương.", image: "🪆", tags: ["toy"] },
  { en: "robot", vi: "người máy", pos: "noun", ipa: "/ˈroʊ.bɑːt/", forms: { plural: "robots" }, exampleEn: "Those robots are cool.", exampleVi: "Những con rô-bốt kia thật ngầu.", image: "🤖", tags: ["toy"] },
  { en: "kite", vi: "con diều", pos: "noun", ipa: "/kaɪt/", forms: { plural: "kites" }, exampleEn: "There is a colorful kite.", exampleVi: "Có một con diều nhiều màu sắc.", image: "🪁", tags: ["toy"] },
  { en: "car", vi: "xe ô tô", pos: "noun", ipa: "/kɑːr/", forms: { plural: "cars" }, exampleEn: "The cars are fast.", exampleVi: "Những chiếc xe ô tô chạy nhanh.", image: "🚗", tags: ["vehicle"] },
  { en: "bus", vi: "xe buýt", pos: "noun", ipa: "/bʌs/", forms: { plural: "buses" }, exampleEn: "There are two buses.", exampleVi: "Có hai chiếc xe buýt.", image: "🚌", tags: ["vehicle"] },
  { en: "train", vi: "tàu hỏa", pos: "noun", ipa: "/treɪn/", forms: { plural: "trains" }, exampleEn: "The train is long.", exampleVi: "Đoàn tàu rất dài.", image: "🚂", tags: ["vehicle"] },
  { en: "plane", vi: "máy bay", pos: "noun", ipa: "/pleɪn/", forms: { plural: "planes" }, exampleEn: "It is an airplane.", exampleVi: "Nó là một chiếc máy bay.", image: "✈️", tags: ["vehicle"] },
  { en: "boat", vi: "thuyền", pos: "noun", ipa: "/boʊt/", forms: { plural: "boats" }, exampleEn: "There is a white boat.", exampleVi: "Có một chiếc thuyền trắng.", image: "⛵", tags: ["vehicle"] },
  { en: "bicycle", vi: "xe đạp", pos: "noun", ipa: "/ˈbaɪ.sə.kəl/", forms: { plural: "bicycles" }, exampleEn: "These bicycles are blue.", exampleVi: "Những chiếc xe đạp này màu xanh dương.", image: "🚲", tags: ["vehicle"] },
  { en: "truck", vi: "xe tải", pos: "noun", ipa: "/trʌk/", forms: { plural: "trucks" }, exampleEn: "The truck is big.", exampleVi: "Chiếc xe tải to lớn.", image: "🚛", tags: ["vehicle"] },

  // People & Body (Irregular & Regular)
  { en: "child", vi: "đứa trẻ", pos: "noun", ipa: "/tʃaɪld/", forms: { plural: "children" }, exampleEn: "The children are happy.", exampleVi: "Những đứa trẻ đang vui vẻ.", image: "🧒", tags: ["people"] },
  { en: "man", vi: "người đàn ông", pos: "noun", ipa: "/mæn/", forms: { plural: "men" }, exampleEn: "Those men are tall.", exampleVi: "Những người đàn ông kia cao lớn.", image: "👨", tags: ["people"] },
  { en: "woman", vi: "người phụ nữ", pos: "noun", ipa: "/ˈwʊm.ən/", forms: { plural: "women" }, exampleEn: "The women are kind.", exampleVi: "Những người phụ nữ rất tốt bụng.", image: "👩", tags: ["people"] },
  { en: "person", vi: "người", pos: "noun", ipa: "/ˈpɝː.sən/", forms: { plural: "people" }, exampleEn: "There are ten people.", exampleVi: "Có mười người.", image: "🧑", tags: ["people"] },
  { en: "baby", vi: "em bé", pos: "noun", ipa: "/ˈbeɪ.bi/", forms: { plural: "babies" }, exampleEn: "These babies are cute.", exampleVi: "Những em bé này rất đáng yêu.", image: "👶", tags: ["people"] },
  { en: "boy", vi: "cậu bé", pos: "noun", ipa: "/bɔɪ/", forms: { plural: "boys" }, exampleEn: "The boys are strong.", exampleVi: "Những cậu bé rất khỏe mạnh.", image: "👦", tags: ["people"] },
  { en: "girl", vi: "cô bé", pos: "noun", ipa: "/ɡɝːl/", forms: { plural: "girls" }, exampleEn: "Three girls are in the class.", exampleVi: "Ba cô bé ở trong lớp học.", image: "👧", tags: ["people"] },
  { en: "foot", vi: "bàn chân", pos: "noun", ipa: "/fʊt/", forms: { plural: "feet" }, exampleEn: "His feet are big.", exampleVi: "Bàn chân của cậu ấy to.", image: "🦶", tags: ["body"] },
  { en: "tooth", vi: "chiếc răng", pos: "noun", ipa: "/tuːθ/", forms: { plural: "teeth" }, exampleEn: "Her teeth are white.", exampleVi: "Hàm răng của cô bé trắng muốt.", image: "🦷", tags: ["body"] },
  { en: "eye", vi: "con mắt", pos: "noun", ipa: "/aɪ/", forms: { plural: "eyes" }, exampleEn: "It is an eye.", exampleVi: "Nó là một con mắt.", image: "👁️", tags: ["body"] },
  { en: "ear", vi: "cái tai", pos: "noun", ipa: "/ɪr/", forms: { plural: "ears" }, exampleEn: "It is an ear.", exampleVi: "Nó là một chiếc tai.", image: "👂", tags: ["body"] },
  { en: "hand", vi: "bàn tay", pos: "noun", ipa: "/hænd/", forms: { plural: "hands" }, exampleEn: "Her hands are clean.", exampleVi: "Đôi bàn tay của cô bé rất sạch sẽ.", image: "✋", tags: ["body"] },
  { en: "arm", vi: "cánh tay", pos: "noun", ipa: "/ɑːrm/", forms: { plural: "arms" }, exampleEn: "It is an arm.", exampleVi: "Nó là một cánh tay.", image: "💪", tags: ["body"] },
  { en: "leg", vi: "cái chân", pos: "noun", ipa: "/leɡ/", forms: { plural: "legs" }, exampleEn: "His legs are long.", exampleVi: "Đôi chân của cậu ấy dài.", image: "🦵", tags: ["body"] },

  // Nature & Places
  { en: "tree", vi: "cái cây", pos: "noun", ipa: "/triː/", forms: { plural: "trees" }, exampleEn: "There are green trees.", exampleVi: "Có những cái cây màu xanh.", image: "🌳", tags: ["nature"] },
  { en: "flower", vi: "bông hoa", pos: "noun", ipa: "/ˈflaʊ.ɚ/", forms: { plural: "flowers" }, exampleEn: "These flowers are pretty.", exampleVi: "Những bông hoa này xinh đẹp.", image: "🌸", tags: ["nature"] },
  { en: "leaf", vi: "chiếc lá", pos: "noun", ipa: "/liːf/", forms: { plural: "leaves" }, exampleEn: "The leaves are yellow.", exampleVi: "Những chiếc lá màu vàng.", image: "🍂", tags: ["nature"] },
  { en: "lake", vi: "hồ nước", pos: "noun", ipa: "/leɪk/", forms: { plural: "lakes" }, exampleEn: "There is a blue lake.", exampleVi: "Có một hồ nước màu xanh.", image: "🌊", tags: ["nature"] },
  { en: "river", vi: "con sông", pos: "noun", ipa: "/ˈrɪv.ɚ/", forms: { plural: "rivers" }, exampleEn: "The river is long.", exampleVi: "Con sông dài.", image: "🏞️", tags: ["nature"] },
  { en: "park", vi: "công viên", pos: "noun", ipa: "/pɑːrk/", forms: { plural: "parks" }, exampleEn: "There are two parks.", exampleVi: "Có hai công viên.", image: "🛝", tags: ["nature"] },
  { en: "house", vi: "ngôi nhà", pos: "noun", ipa: "/haʊs/", forms: { plural: "houses" }, exampleEn: "Those houses are big.", exampleVi: "Những ngôi nhà kia to lớn.", image: "🏡", tags: ["place"] },
  { en: "room", vi: "căn phòng", pos: "noun", ipa: "/ruːm/", forms: { plural: "rooms" }, exampleEn: "There are four rooms.", exampleVi: "Có bốn căn phòng.", image: "🛋️", tags: ["place"] },
  { en: "garden", vi: "khu vườn", pos: "noun", ipa: "/ˈɡɑːr.dən/", forms: { plural: "gardens" }, exampleEn: "The garden is green.", exampleVi: "Khu vườn xanh tươi.", image: "🪴", tags: ["place"] },
  { en: "shelf", vi: "cái giá, kệ", pos: "noun", ipa: "/ʃelf/", forms: { plural: "shelves" }, exampleEn: "There are shelves on the wall.", exampleVi: "Có những chiếc kệ trên tường.", image: "🗄️", tags: ["object"] },
  { en: "plate", vi: "cái đĩa", pos: "noun", ipa: "/pleɪt/", forms: { plural: "plates" }, exampleEn: "The plates are clean.", exampleVi: "Những cái đĩa sạch sẽ.", image: "🍽️", tags: ["object"] },
  { en: "cup", vi: "cái cốc", pos: "noun", ipa: "/kʌp/", forms: { plural: "cups" }, exampleEn: "There is a cup on the desk.", exampleVi: "Có một cái cốc trên bàn.", image: "☕", tags: ["object"] },
  { en: "fork", vi: "chiếc nĩa", pos: "noun", ipa: "/fɔːrk/", forms: { plural: "forks" }, exampleEn: "There are four forks.", exampleVi: "Có bốn chiếc nĩa.", image: "🍴", tags: ["object"] },
  { en: "spoon", vi: "chiếc thìa", pos: "noun", ipa: "/spuːn/", forms: { plural: "spoons" }, exampleEn: "The spoon is silver.", exampleVi: "Chiếc thìa màu bạc.", image: "🥄", tags: ["object"] },
  { en: "bench", vi: "ghế dài", pos: "noun", ipa: "/bentʃ/", forms: { plural: "benches" }, exampleEn: "Two benches are in the park.", exampleVi: "Hai chiếc ghế dài ở trong công viên.", image: "🪑", tags: ["object"] },
  { en: "church", vi: "nhà thờ", pos: "noun", ipa: "/tʃɝːtʃ/", forms: { plural: "churches" }, exampleEn: "There is an old church.", exampleVi: "Có một nhà thờ cổ kính.", image: "⛪", tags: ["place"] },
  { en: "city", vi: "thành phố", pos: "noun", ipa: "/ˈsɪt.i/", forms: { plural: "cities" }, exampleEn: "These cities are large.", exampleVi: "Những thành phố này rất lớn.", image: "🏙️", tags: ["place"] },
  { en: "zoo", vi: "sở thú", pos: "noun", ipa: "/zuː/", forms: { plural: "zoos" }, exampleEn: "There are two zoos in the city.", exampleVi: "Có hai sở thú trong thành phố.", image: "🦁", tags: ["place"] },
  { en: "island", vi: "hòn đảo", pos: "noun", ipa: "/ˈaɪ.lənd/", forms: { plural: "islands" }, exampleEn: "It is an island.", exampleVi: "Nó là một hòn đảo.", image: "🏝️", tags: ["nature"] }
];

const formattedVocab = rawVocab.map((v, idx) => {
  const numStr = String(idx + 1).padStart(4, '0');
  return {
    id: `A2-v-${numStr}`,
    level: "A2",
    topic: "nouns-articles",
    en: v.en,
    vi: v.vi,
    pos: v.pos,
    ipa: v.ipa,
    forms: v.forms,
    exampleEn: v.exampleEn,
    exampleVi: v.exampleVi,
    image: v.image,
    tags: v.tags,
    source: "seed"
  };
});

fs.writeFileSync(
  path.join(outDir, 'A2.vocab.json'),
  JSON.stringify(formattedVocab, null, 2),
  'utf-8'
);
console.log(`✅ Generated A2.vocab.json with ${formattedVocab.length} words (target ≥ 100).`);

// ==========================================================================
// 2. HELPER FUNCTIONS FOR SENTENCES
// ==========================================================================
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

function tok(text, pos, role, lemma, feature) {
  const t = { text, pos, role };
  if (lemma) t.lemma = lemma;
  if (feature) t.feature = feature;
  return t;
}

const punctDot = tok('.', 'punct', 'punct');
const punctQ = tok('?', 'punct', 'punct');
const punctComma = tok(',', 'punct', 'punct');

const sentences = [];

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

// ==========================================================================
// 3. SENTENCES BUILDER (Exact 200 sentences for A2: nouns-articles)
// ==========================================================================

// --------------------------------------------------------------------------
// GROUP 1: a-an (35 sentences) - Distinction between consonant and vowel sounds
// --------------------------------------------------------------------------
// 1-15: Basic It is / This is / That is a/an (diff 1: 15)
addSentence('a-an', 'It is an apple.', 'Nó là một quả táo.', 1, ['article', 'food'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('apple','noun','complement','apple','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'apple bắt đầu bằng nguyên âm'});

addSentence('a-an', 'This is an orange.', 'Đây là một quả cam.', 1, ['article', 'food'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('orange','noun','complement','orange','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'orange bắt đầu bằng nguyên âm'});

addSentence('a-an', 'That is an elephant.', 'Kia là một con voi.', 1, ['article', 'animal'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('elephant','noun','complement','elephant','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'elephant bắt đầu bằng nguyên âm'});

addSentence('a-an', 'It is an egg.', 'Nó là một quả trứng.', 1, ['article', 'food'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('egg','noun','complement','egg','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'egg bắt đầu bằng nguyên âm'});

addSentence('a-an', 'This is an umbrella.', 'Đây là một chiếc ô.', 1, ['article', 'object'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('umbrella','noun','complement','umbrella','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'umbrella bắt đầu bằng nguyên âm'});

addSentence('a-an', 'It is an eraser.', 'Nó là một cục tẩy.', 1, ['article', 'school'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('eraser','noun','complement','eraser','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'eraser bắt đầu bằng nguyên âm'});

addSentence('a-an', 'That is an onion.', 'Kia là một củ hành tây.', 1, ['article', 'food'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('onion','noun','complement','onion','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'onion bắt đầu bằng nguyên âm'});

addSentence('a-an', 'It is an eye.', 'Nó là một con mắt.', 1, ['article', 'body'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('eye','noun','complement','eye','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'eye bắt đầu bằng nguyên âm'});

addSentence('a-an', 'This is an arm.', 'Đây là một cánh tay.', 1, ['article', 'body'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('arm','noun','complement','arm','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'arm bắt đầu bằng nguyên âm'});

addSentence('a-an', 'That is an ear.', 'Kia là một cái tai.', 1, ['article', 'body'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('ear','noun','complement','ear','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'ear bắt đầu bằng nguyên âm'});

addSentence('a-an', 'This is a cat.', 'Đây là một con mèo.', 1, ['article', 'animal'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('cat','noun','complement','cat','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền mạo từ a hoặc an.', hint:'cat bắt đầu bằng phụ âm'});

addSentence('a-an', 'That is a dog.', 'Kia là một con chó.', 1, ['article', 'animal'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('dog','noun','complement','dog','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền mạo từ a hoặc an.', hint:'dog bắt đầu bằng phụ âm'});

addSentence('a-an', 'It is a banana.', 'Nó là một quả chuối.', 1, ['article', 'food'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('banana','noun','complement','banana','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền mạo từ a hoặc an.', hint:'banana bắt đầu bằng phụ âm'});

addSentence('a-an', 'This is a book.', 'Đây là một quyển sách.', 1, ['article', 'school'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('book','noun','complement','book','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền mạo từ a hoặc an.', hint:'book bắt đầu bằng phụ âm'});

addSentence('a-an', 'That is a table.', 'Kia là một cái bàn.', 1, ['article', 'object'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('table','noun','complement','table','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền mạo từ a hoặc an.', hint:'table bắt đầu bằng phụ âm'});

// 16-25: There is a/an & modifiers (diff 2: 10)
addSentence('a-an', 'There is an island in the lake.', 'Có một hòn đảo ở giữa hồ.', 2, ['article', 'nature'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('island','noun','subject','island','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('lake','noun','prep-object','lake','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'island bắt đầu bằng âm nguyên âm'});

addSentence('a-an', 'There is an airplane in the sky.', 'Có một chiếc máy bay trên bầu trời.', 2, ['article', 'vehicle'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('airplane','noun','subject','plane','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('sky','noun','prep-object','sky','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'airplane bắt đầu bằng âm nguyên âm'});

addSentence('a-an', 'She is an intelligent student.', 'Cô bé là một học sinh thông minh.', 2, ['article', 'people'],
  [tok('She','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('intelligent','adjective','modifier'), tok('student','noun','complement','student','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền a hoặc an trước tính từ.', hint:'intelligent bắt đầu bằng âm nguyên âm'});

addSentence('a-an', 'He is an honest boy.', 'Cậu ấy là một cậu bé thật thà.', 2, ['article', 'people'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('honest','adjective','modifier'), tok('boy','noun','complement','boy','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền a hoặc an (chú ý âm câm h-).', hint:'honest có h câm, phát âm bằng nguyên âm'});

addSentence('a-an', 'This is an old church.', 'Đây là một ngôi nhà thờ cổ kính.', 2, ['article', 'place'],
  [tok('This','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('old','adjective','modifier'), tok('church','noun','complement','church','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ a hoặc an.', hint:'old bắt đầu bằng âm nguyên âm'});

addSentence('a-an', 'There is a big clock on the wall.', 'Có một chiếc đồng hồ to trên tường.', 2, ['article', 'object'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('big','adjective','modifier'), tok('clock','noun','subject','clock','sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('wall','noun','prep-object','wall','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền mạo từ a hoặc an.', hint:'big bắt đầu bằng phụ âm'});

addSentence('a-an', 'That is a beautiful garden.', 'Kia là một khu vườn xinh đẹp.', 2, ['article', 'place'],
  [tok('That','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('beautiful','adjective','modifier'), tok('garden','noun','complement','garden','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền mạo từ a hoặc an.', hint:'beautiful bắt đầu bằng phụ âm'});

addSentence('a-an', 'There is a white boat on the river.', 'Có một chiếc thuyền màu trắng trên sông.', 2, ['article', 'vehicle'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('white','adjective','modifier'), tok('boat','noun','subject','boat','sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('river','noun','prep-object','river','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền mạo từ a hoặc an.', hint:'white bắt đầu bằng phụ âm'});

addSentence('a-an', 'It is a useful notebook.', 'Nó là một cuốn vở hữu ích.', 2, ['article', 'school'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('useful','adjective','modifier'), tok('notebook','noun','complement','notebook','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền a hoặc an (chú ý phiên âm /juː/ của useful).', hint:'useful bắt đầu bằng bán nguyên âm /j/'});

addSentence('a-an', 'He is a university teacher.', 'Thầy ấy là một giảng viên đại học.', 2, ['article', 'profession'],
  [tok('He','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('university','noun','modifier','university','sg'), tok('teacher','noun','complement','teacher','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền a hoặc an (chú ý phiên âm /juː/).', hint:'university phát âm bắt đầu bằng /j/'});

// 26-35: Questions and negatives with a/an (diff 2: 5, diff 3: 5)
addSentence('a-an', 'Is it an orange or an apple?', 'Nó là một quả cam hay một quả táo?', 2, ['article', 'question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('it','pronoun','subject'), tok('an','article','det'), tok('orange','noun','complement','orange','sg'), tok('or','conjunction','conj'), tok('an','article','det'), tok('apple','noun','complement','apple','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ cho orange.', hint:'mạo từ · orange'});

addSentence('a-an', 'Is that a red apple on the plate?', 'Kia có phải một quả táo đỏ trên đĩa không?', 2, ['article', 'question', 'food'],
  [tok('Is','verb','verb','be','present-3sg'), tok('that','pronoun','subject'), tok('a','article','det'), tok('red','adjective','modifier'), tok('apple','noun','complement','apple','sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('plate','noun','prep-object','plate','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4, 5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền mạo từ trước tính từ red.', hint:'red bắt đầu bằng phụ âm r'});

addSentence('a-an', 'It is not an easy question.', 'Đó không phải là một câu hỏi dễ.', 2, ['article', 'negative'],
  [tok('It','pronoun','subject'), tok('is','verb','verb','be','present-3sg'), tok('not','adverb','adverbial'), tok('an','article','det'), tok('easy','adjective','modifier'), tok('question','noun','complement','question','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'adverbial', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:3, ans:'an', promptVi:'Điền mạo từ trước easy.', hint:'easy bắt đầu bằng nguyên âm'});

addSentence('a-an', 'Is there an umbrella in your bag?', 'Có một chiếc ô trong cặp của bạn không?', 2, ['article', 'question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('there','pronoun','expletive'), tok('an','article','det'), tok('umbrella','noun','subject','umbrella','sg'), tok('in','preposition','prep'), tok('your','determiner','det'), tok('bag','noun','prep-object','bag','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền mạo từ trước umbrella.', hint:'mạo từ · umbrella'});

addSentence('a-an', 'This isn\'t a pen for you.', 'Đây không phải là chiếc bút dành cho bạn.', 2, ['article', 'negative'],
  [tok('This','pronoun','subject'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('a','article','det'), tok('pen','noun','complement','pen','sg'), tok('for','preposition','prep'), tok('you','pronoun','prep-object'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:2, ans:'a', promptVi:'Điền mạo từ a hoặc an.', hint:'pen bắt đầu bằng phụ âm'});

addSentence('a-an', 'There is an enormous elephant in the zoo.', 'Có một chú voi khổng lồ trong sở thú.', 3, ['article', 'animal'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('enormous','adjective','modifier'), tok('elephant','noun','subject','elephant','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('zoo','noun','prep-object','zoo','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền a hoặc an trước enormous.', hint:'enormous bắt đầu bằng âm nguyên âm'},
  ['In the zoo there is an enormous elephant.']);

addSentence('a-an', 'In the kitchen there is an onion on the table.', 'Trong bếp có một củ hành tây trên bàn.', 3, ['article', 'food'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('kitchen','noun','prep-object','kitchen','sg'), tok('there','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('onion','noun','subject','onion','sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6]}, {clauseId:'c1', role:'adverbial', tokenIndices:[7, 8, 9]}],
  ['pos','fill','order','roles'], {idx:5, ans:'an', promptVi:'Điền mạo từ trước onion.', hint:'onion bắt đầu bằng nguyên âm'},
  ['There is an onion on the table in the kitchen.']);

addSentence('a-an', 'Under the tree there is a small white rabbit.', 'Dưới gốc cây có một chú thỏ trắng nhỏ.', 3, ['article', 'animal'],
  [tok('Under','preposition','prep'), tok('the','article','det'), tok('tree','noun','prep-object','tree','sg'), tok('there','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('small','adjective','modifier'), tok('white','adjective','modifier'), tok('rabbit','noun','subject','rabbit','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7, 8]}],
  ['pos','fill','order','roles'], {idx:5, ans:'a', promptVi:'Điền a hoặc an trước small.', hint:'small bắt đầu bằng phụ âm'},
  ['There is a small white rabbit under the tree.']);

addSentence('a-an', 'Is there an interesting book on your desk?', 'Có một cuốn sách thú vị trên bàn của bạn không?', 3, ['article', 'school', 'question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('there','pronoun','expletive'), tok('an','article','det'), tok('interesting','adjective','modifier'), tok('book','noun','subject','book','sg'), tok('on','preposition','prep'), tok('your','determiner','det'), tok('desk','noun','prep-object','desk','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền a hoặc an trước interesting.', hint:'interesting bắt đầu bằng âm nguyên âm'});

addSentence('a-an', 'There isn\'t an empty chair in our classroom.', 'Không có chiếc ghế trống nào trong lớp học của chúng tôi.', 3, ['article', 'school', 'negative'],
  [tok('There','pronoun','expletive'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('an','article','det'), tok('empty','adjective','modifier'), tok('chair','noun','subject','chair','sg'), tok('in','preposition','prep'), tok('our','determiner','det'), tok('classroom','noun','prep-object','classroom','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:2, ans:'an', promptVi:'Điền a hoặc an trước empty.', hint:'empty bắt đầu bằng nguyên âm'});

console.log(`Group 1 done: ${sentences.length} sentences.`);

// --------------------------------------------------------------------------
// GROUP 2: plural-regular-s (40 sentences) - Regular plurals ending with -s
// --------------------------------------------------------------------------
// 36-55: Direct plurals with numbers and demonstratives (diff 1: 15, diff 2: 5)
const regularSList = [
  { sg: 'cat', pl: 'cats', vi: 'con mèo', num: 'two' },
  { sg: 'dog', pl: 'dogs', vi: 'con chó', num: 'three' },
  { sg: 'book', pl: 'books', vi: 'quyển sách', num: 'four' },
  { sg: 'pen', pl: 'pens', vi: 'chiếc bút', num: 'five' },
  { sg: 'apple', pl: 'apples', vi: 'quả táo', num: 'six' },
  { sg: 'banana', pl: 'bananas', vi: 'quả chuối', num: 'two' },
  { sg: 'duck', pl: 'ducks', vi: 'con vịt', num: 'three' },
  { sg: 'bird', pl: 'birds', vi: 'con chim', num: 'four' },
  { sg: 'table', pl: 'tables', vi: 'cái bàn', num: 'two' },
  { sg: 'chair', pl: 'chairs', vi: 'cái ghế', num: 'five' },
  { sg: 'ruler', pl: 'rulers', vi: 'thước kẻ', num: 'three' },
  { sg: 'bag', pl: 'bags', vi: 'cặp sách', num: 'two' },
  { sg: 'clock', pl: 'clocks', vi: 'đồng hồ', num: 'two' },
  { sg: 'door', pl: 'doors', vi: 'cửa ra vào', num: 'three' },
  { sg: 'window', pl: 'windows', vi: 'cửa sổ', num: 'four' }
];

regularSList.forEach((item) => {
  addSentence('plural-regular-s', `These are ${item.num} ${item.pl}.`, `Đây là ${item.num === 'two' ? 'hai' : item.num === 'three' ? 'ba' : item.num === 'four' ? 'bốn' : item.num === 'five' ? 'năm' : 'sáu'} ${item.vi}.`, 1, ['plural'],
    [tok('These','pronoun','subject'), tok('are','verb','verb','be','present-other'), tok(item.num,'numeral','det'), tok(item.pl,'noun','complement',item.sg,'pl'), punctDot],
    [{clauseId:'c1', role:'subject', tokenIndices:[0]}, {clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'complement', tokenIndices:[2, 3]}],
    ['pos','fill','order','roles'], {idx:3, ans:item.pl, promptVi:`Điền dạng số nhiều của ${item.sg}.`, hint:`số nhiều của ${item.sg}`});
});

// 51-55: Plural nouns with adjectives (diff 2: 5)
addSentence('plural-regular-s', 'The yellow ducks are cute.', 'Những con vịt màu vàng rất dễ thương.', 2, ['plural', 'animal'],
  [tok('The','article','det'), tok('yellow','adjective','modifier'), tok('ducks','noun','subject','duck','pl'), tok('are','verb','verb','be','present-other'), tok('cute','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'ducks', promptVi:'Điền dạng số nhiều của duck.', hint:'số nhiều của duck'});

addSentence('plural-regular-s', 'Those big horses are strong.', 'Những con ngựa to lớn kia rất khỏe mạnh.', 2, ['plural', 'animal'],
  [tok('Those','determiner','det'), tok('big','adjective','modifier'), tok('horses','noun','subject','horse','pl'), tok('are','verb','verb','be','present-other'), tok('strong','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'horses', promptVi:'Điền dạng số nhiều của horse.', hint:'số nhiều của horse'});

addSentence('plural-regular-s', 'These sweet apples are red.', 'Những quả táo ngọt này màu đỏ.', 2, ['plural', 'food'],
  [tok('These','determiner','det'), tok('sweet','adjective','modifier'), tok('apples','noun','subject','apple','pl'), tok('are','verb','verb','be','present-other'), tok('red','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'apples', promptVi:'Điền dạng số nhiều của apple.', hint:'số nhiều của apple'});

addSentence('plural-regular-s', 'The green frogs are small.', 'Những con ếch màu xanh lá thì nhỏ bé.', 2, ['plural', 'animal'],
  [tok('The','article','det'), tok('green','adjective','modifier'), tok('frogs','noun','subject','frog','pl'), tok('are','verb','verb','be','present-other'), tok('small','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'frogs', promptVi:'Điền dạng số nhiều của frog.', hint:'số nhiều của frog'});

addSentence('plural-regular-s', 'Those wooden tables are brown.', 'Những chiếc bàn gỗ kia màu nâu.', 2, ['plural', 'object'],
  [tok('Those','determiner','det'), tok('wooden','adjective','modifier'), tok('tables','noun','subject','table','pl'), tok('are','verb','verb','be','present-other'), tok('brown','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'tables', promptVi:'Điền dạng số nhiều của table.', hint:'số nhiều của table'});

// 56-75: Regular plurals in varied contexts, with noun blanks.
const regularSList2 = [
  { sg: 'lion', pl: 'lions', adjective: 'strong', vi: 'Những con sư tử rất khỏe.' },
  { sg: 'tiger', pl: 'tigers', adjective: 'quiet', vi: 'Những con hổ rất yên lặng.' },
  { sg: 'bear', pl: 'bears', adjective: 'big', vi: 'Những con gấu rất to.' },
  { sg: 'rabbit', pl: 'rabbits', adjective: 'small', vi: 'Những con thỏ rất nhỏ.' },
  { sg: 'cow', pl: 'cows', adjective: 'hungry', vi: 'Những con bò rất đói.' },
  { sg: 'pig', pl: 'pigs', adjective: 'dirty', vi: 'Những con lợn rất bẩn.' },
  { sg: 'chicken', pl: 'chickens', adjective: 'noisy', vi: 'Những con gà rất ồn ào.' },
  { sg: 'snake', pl: 'snakes', adjective: 'long', vi: 'Những con rắn rất dài.' },
  { sg: 'robot', pl: 'robots', adjective: 'heavy', vi: 'Những người máy rất nặng.' },
  { sg: 'kite', pl: 'kites', adjective: 'colorful', vi: 'Những cánh diều có rất nhiều màu sắc.' }
];

regularSList2.forEach((item) => {
  addSentence('plural-regular-s', `The ${item.pl} are very ${item.adjective}.`, item.vi, 2, ['plural'],
    [tok('The','article','det'), tok(item.pl,'noun','subject',item.sg,'pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok(item.adjective,'adjective','complement'), punctDot],
    [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
    ['pos','fill','order','roles'], {idx:1, ans:item.pl, promptVi:`Điền dạng số nhiều của ${item.sg}.`, hint:`${item.sg} → ${item.pl}`});
});

// Diff 3: 10 sentences with prepositional phrases and orderAlternatives
addSentence('plural-regular-s', 'There are five green bottles on the shelf.', 'Có năm chiếc chai màu xanh lá ở trên giá.', 3, ['plural'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('five','numeral','det'), tok('green','adjective','modifier'), tok('bottles','noun','subject','bottle','pl'), tok('on','preposition','prep'), tok('the','article','det'), tok('shelf','noun','prep-object','shelf','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'bottles', promptVi:'Điền dạng số nhiều của bottle.', hint:'số nhiều của bottle'},
  ['On the shelf there are five green bottles.']);

addSentence('plural-regular-s', 'Those four little birds are on the tree now.', 'Bốn chú chim nhỏ kia bây giờ đang ở trên cây.', 3, ['plural', 'animal'],
  [tok('Those','determiner','det'), tok('four','numeral','det'), tok('little','adjective','modifier'), tok('birds','noun','subject','bird','pl'), tok('are','verb','verb','be','present-other'), tok('on','preposition','prep'), tok('the','article','det'), tok('tree','noun','prep-object','tree','sg'), tok('now','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}, {clauseId:'c1', role:'adverbial', tokenIndices:[8]}],
  ['pos','fill','order','roles'], {idx:3, ans:'birds', promptVi:'Điền dạng số nhiều của bird.', hint:'số nhiều của bird'},
  ['Now those four little birds are on the tree.']);

addSentence('plural-regular-s', 'Are those two red cars in the garage?', 'Hai chiếc xe ô tô màu đỏ kia có ở trong gara không?', 3, ['plural', 'vehicle', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('those','determiner','det'), tok('two','numeral','det'), tok('red','adjective','modifier'), tok('cars','noun','subject','car','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('garage','noun','prep-object','garage','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'cars', promptVi:'Điền dạng số nhiều của car.', hint:'số nhiều của car'});

addSentence('plural-regular-s', 'In the park there are ten tall trees.', 'Trong công viên có mười cái cây cao lớn.', 3, ['plural', 'nature'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('ten','numeral','det'), tok('tall','adjective','modifier'), tok('trees','noun','subject','tree','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:7, ans:'trees', promptVi:'Điền dạng số nhiều của tree.', hint:'số nhiều của tree'},
  ['There are ten tall trees in the park.']);

addSentence('plural-regular-s', 'These seven new notebooks aren\'t in my bag.', 'Bảy cuốn vở mới này không có ở trong cặp của tôi.', 3, ['plural', 'school', 'negative'],
  [tok('These','determiner','det'), tok('seven','numeral','det'), tok('new','adjective','modifier'), tok('notebooks','noun','subject','notebook','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('in','preposition','prep'), tok('my','determiner','det'), tok('bag','noun','prep-object','bag','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:3, ans:'notebooks', promptVi:'Điền dạng số nhiều của notebook.', hint:'số nhiều của notebook'});

addSentence('plural-regular-s', 'Are these three long rulers on the table?', 'Ba chiếc thước kẻ dài này có ở trên bàn không?', 3, ['plural', 'school', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('these','determiner','det'), tok('three','numeral','det'), tok('long','adjective','modifier'), tok('rulers','noun','subject','ruler','pl'), tok('on','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'rulers', promptVi:'Điền dạng số nhiều của ruler.', hint:'số nhiều của ruler'});

addSentence('plural-regular-s', 'There are eight yellow bananas in the basket.', 'Có tám quả chuối màu vàng ở trong giỏ.', 3, ['plural', 'food'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('eight','numeral','det'), tok('yellow','adjective','modifier'), tok('bananas','noun','subject','banana','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('basket','noun','prep-object','basket','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'bananas', promptVi:'Điền dạng số nhiều của banana.', hint:'số nhiều của banana'},
  ['In the basket there are eight yellow bananas.']);

addSentence('plural-regular-s', 'Those six cute rabbits aren\'t outside today.', 'Sáu chú thỏ dễ thương kia hôm nay không có ở bên ngoài.', 3, ['plural', 'animal', 'negative'],
  [tok('Those','determiner','det'), tok('six','numeral','det'), tok('cute','adjective','modifier'), tok('rabbits','noun','subject','rabbit','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('outside','adverb','complement'), tok('today','adverb','adverbial'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5]}, {clauseId:'c1', role:'adverbial', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'rabbits', promptVi:'Điền dạng số nhiều của rabbit.', hint:'số nhiều của rabbit'},
  ['Today those six cute rabbits aren\'t outside.']);

addSentence('plural-regular-s', 'On the floor there are four colorful balls.', 'Trên sàn nhà có bốn quả bóng nhiều màu sắc.', 3, ['plural', 'toy'],
  [tok('On','preposition','prep'), tok('the','article','det'), tok('floor','noun','prep-object','floor','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('four','numeral','det'), tok('colorful','adjective','modifier'), tok('balls','noun','subject','ball','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:7, ans:'balls', promptVi:'Điền dạng số nhiều của ball.', hint:'số nhiều của ball'},
  ['There are four colorful balls on the floor.']);

addSentence('plural-regular-s', 'These two new bicycles are very expensive.', 'Hai chiếc xe đạp mới này rất đắt tiền.', 3, ['plural', 'vehicle'],
  [tok('These','determiner','det'), tok('two','numeral','det'), tok('new','adjective','modifier'), tok('bicycles','noun','subject','bicycle','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('expensive','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'bicycles', promptVi:'Điền dạng số nhiều của bicycle.', hint:'số nhiều của bicycle'});

console.log(`Group 2 done: ${sentences.length} sentences.`);

// --------------------------------------------------------------------------
// GROUP 3: plural-es-ies (35 sentences) - Plurals ending in -es, -ies
// --------------------------------------------------------------------------
// 76-90: -es and -ies basics (diff 1: 15)
const esIesList = [
  { sg: 'box', pl: 'boxes', vi: 'cái hộp', num: 'two' },
  { sg: 'watch', pl: 'watches', vi: 'đồng hồ đeo tay', num: 'three' },
  { sg: 'dish', pl: 'dishes', vi: 'chiếc đĩa', num: 'four' },
  { sg: 'bus', pl: 'buses', vi: 'xe buýt', num: 'two' },
  { sg: 'fox', pl: 'foxes', vi: 'con cáo', num: 'three' },
  { sg: 'glass', pl: 'glasses', vi: 'cốc thủy tinh', num: 'five' },
  { sg: 'bench', pl: 'benches', vi: 'ghế dài', num: 'two' },
  { sg: 'peach', pl: 'peaches', vi: 'quả đào', num: 'four' },
  { sg: 'tomato', pl: 'tomatoes', vi: 'quả cà chua', num: 'six' },
  { sg: 'potato', pl: 'potatoes', vi: 'củ khoai tây', num: 'three' },
  { sg: 'baby', pl: 'babies', vi: 'em bé', num: 'two' },
  { sg: 'puppy', pl: 'puppies', vi: 'chú cún con', num: 'three' },
  { sg: 'candy', pl: 'candies', vi: 'viên kẹo', num: 'five' },
  { sg: 'strawberry', pl: 'strawberries', vi: 'quả dâu tây', num: 'four' },
  { sg: 'cherry', pl: 'cherries', vi: 'quả anh đào', num: 'six' }
];

esIesList.forEach((item) => {
  addSentence('plural-es-ies', `There are ${item.num} ${item.pl}.`, `Có ${item.num === 'two' ? 'hai' : item.num === 'three' ? 'ba' : item.num === 'four' ? 'bốn' : item.num === 'five' ? 'năm' : 'sáu'} ${item.vi}.`, 1, ['plural'],
    [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok(item.num,'numeral','det'), tok(item.pl,'noun','subject',item.sg,'pl'), punctDot],
    [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
    ['pos','fill','order','roles'], {idx:3, ans:item.pl, promptVi:`Điền dạng số nhiều (-es/-ies) của ${item.sg}.`, hint:`số nhiều của ${item.sg}`});
});

// 91-100: Sentences with these/those and adjectives (diff 2: 10)
addSentence('plural-es-ies', 'The boxes are very heavy.', 'Những chiếc hộp rất nặng.', 2, ['plural', 'object'],
  [tok('The','article','det'), tok('boxes','noun','subject','box','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('heavy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'boxes', promptVi:'Điền dạng số nhiều của box (-es).', hint:'box → boxes'});

addSentence('plural-es-ies', 'Those watches are expensive.', 'Những chiếc đồng hồ đeo tay kia đắt tiền.', 2, ['plural', 'object'],
  [tok('Those','determiner','det'), tok('watches','noun','subject','watch','pl'), tok('are','verb','verb','be','present-other'), tok('expensive','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'watches', promptVi:'Điền dạng số nhiều của watch (-es).', hint:'watch → watches'});

addSentence('plural-es-ies', 'These dishes are very clean.', 'Những chiếc đĩa này rất sạch sẽ.', 2, ['plural', 'object'],
  [tok('These','determiner','det'), tok('dishes','noun','subject','dish','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'dishes', promptVi:'Điền dạng số nhiều của dish (-es).', hint:'dish → dishes'});

addSentence('plural-es-ies', 'The cute babies are sleepy.', 'Những em bé đáng yêu đang buồn ngủ.', 2, ['plural', 'people'],
  [tok('The','article','det'), tok('cute','adjective','modifier'), tok('babies','noun','subject','baby','pl'), tok('are','verb','verb','be','present-other'), tok('sleepy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'babies', promptVi:'Điền dạng số nhiều của baby (-ies).', hint:'baby → babies'});

addSentence('plural-es-ies', 'These strawberries are very fresh.', 'Những quả dâu tây này rất tươi.', 2, ['plural', 'food'],
  [tok('These','determiner','det'), tok('strawberries','noun','subject','strawberry','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('fresh','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'strawberries', promptVi:'Điền dạng số nhiều của strawberry (-ies).', hint:'strawberry → strawberries'});

addSentence('plural-es-ies', 'Those sweet candies are colorful.', 'Những viên kẹo ngọt kia nhiều màu sắc.', 2, ['plural', 'food'],
  [tok('Those','determiner','det'), tok('sweet','adjective','modifier'), tok('candies','noun','subject','candy','pl'), tok('are','verb','verb','be','present-other'), tok('colorful','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'candies', promptVi:'Điền dạng số nhiều của candy (-ies).', hint:'candy → candies'});

addSentence('plural-es-ies', 'These big buses are yellow.', 'Những chiếc xe buýt lớn này màu vàng.', 2, ['plural', 'vehicle'],
  [tok('These','determiner','det'), tok('big','adjective','modifier'), tok('buses','noun','subject','bus','pl'), tok('are','verb','verb','be','present-other'), tok('yellow','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'buses', promptVi:'Điền dạng số nhiều của bus (-es).', hint:'bus → buses'});

addSentence('plural-es-ies', 'The red tomatoes are ripe.', 'Những quả cà chua đỏ đã chín.', 2, ['plural', 'food'],
  [tok('The','article','det'), tok('red','adjective','modifier'), tok('tomatoes','noun','subject','tomato','pl'), tok('are','verb','verb','be','present-other'), tok('ripe','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'tomatoes', promptVi:'Điền dạng số nhiều của tomato (-es).', hint:'tomato → tomatoes'});

addSentence('plural-es-ies', 'Those little puppies are playful.', 'Những chú cún con nhỏ kia rất tinh nghịch.', 2, ['plural', 'animal'],
  [tok('Those','determiner','det'), tok('little','adjective','modifier'), tok('puppies','noun','subject','puppy','pl'), tok('are','verb','verb','be','present-other'), tok('playful','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'puppies', promptVi:'Điền dạng số nhiều của puppy (-ies).', hint:'puppy → puppies'});

addSentence('plural-es-ies', 'These glasses are on the table.', 'Những chiếc cốc thủy tinh này đang ở trên bàn.', 2, ['plural', 'object'],
  [tok('These','determiner','det'), tok('glasses','noun','subject','glass','pl'), tok('are','verb','verb','be','present-other'), tok('on','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:1, ans:'glasses', promptVi:'Điền dạng số nhiều của glass (-es).', hint:'glass → glasses'});

// 101-110: Advanced with questions/negatives/prepositional (diff 3: 10)
addSentence('plural-es-ies', 'In the garden there are three clever foxes.', 'Trong vườn có ba con cáo ranh mãnh.', 3, ['plural', 'animal'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('garden','noun','prep-object','garden','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('three','numeral','det'), tok('clever','adjective','modifier'), tok('foxes','noun','subject','fox','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:7, ans:'foxes', promptVi:'Điền dạng số nhiều của fox (-es).', hint:'fox → foxes'},
  ['There are three clever foxes in the garden.']);

addSentence('plural-es-ies', 'Are there any sweet peaches in the fridge?', 'Có quả đào ngọt nào trong tủ lạnh không?', 3, ['plural', 'food', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('there','pronoun','expletive'), tok('any','determiner','det'), tok('sweet','adjective','modifier'), tok('peaches','noun','subject','peach','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('fridge','noun','prep-object','fridge','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'peaches', promptVi:'Điền dạng số nhiều của peach (-es).', hint:'peach → peaches'});

addSentence('plural-es-ies', 'Those five wooden benches aren\'t dirty.', 'Năm chiếc ghế dài bằng gỗ kia không bị bẩn.', 3, ['plural', 'object', 'negative'],
  [tok('Those','determiner','det'), tok('five','numeral','det'), tok('wooden','adjective','modifier'), tok('benches','noun','subject','bench','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('dirty','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5]}],
  ['pos','fill','order','roles'], {idx:3, ans:'benches', promptVi:'Điền dạng số nhiều của bench (-es).', hint:'bench → benches'});

addSentence('plural-es-ies', 'There aren\'t any fresh strawberries in the kitchen.', 'Không có quả dâu tây tươi nào trong bếp.', 3, ['plural', 'food', 'negative'],
  [tok('There','pronoun','expletive'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('any','determiner','det'), tok('fresh','adjective','modifier'), tok('strawberries','noun','subject','strawberry','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('kitchen','noun','prep-object','kitchen','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'strawberries', promptVi:'Điền dạng số nhiều của strawberry (-ies).', hint:'strawberry → strawberries'});

addSentence('plural-es-ies', 'On the plate there are four delicious sandwiches.', 'Trên đĩa có bốn chiếc bánh kẹp ngon lành.', 3, ['plural', 'food'],
  [tok('On','preposition','prep'), tok('the','article','det'), tok('plate','noun','prep-object','plate','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('four','numeral','det'), tok('delicious','adjective','modifier'), tok('sandwiches','noun','subject','sandwich','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:7, ans:'sandwiches', promptVi:'Điền dạng số nhiều của sandwich (-es).', hint:'sandwich → sandwiches'},
  ['There are four delicious sandwiches on the plate.']);

addSentence('plural-es-ies', 'These three big cities are in Vietnam.', 'Ba thành phố lớn này ở Việt Nam.', 3, ['plural', 'place'],
  [tok('These','determiner','det'), tok('three','numeral','det'), tok('big','adjective','modifier'), tok('cities','noun','subject','city','pl'), tok('are','verb','verb','be','present-other'), tok('in','preposition','prep'), tok('Vietnam','noun','prep-object','Vietnam','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6]}],
  ['pos','fill','order','roles'], {idx:3, ans:'cities', promptVi:'Điền dạng số nhiều của city (-ies).', hint:'city → cities'});

addSentence('plural-es-ies', 'Are those red cherries sweet?', 'Những quả anh đào đỏ kia có ngọt không?', 3, ['plural', 'food', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('those','determiner','det'), tok('red','adjective','modifier'), tok('cherries','noun','subject','cherry','pl'), tok('sweet','adjective','complement'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:3, ans:'cherries', promptVi:'Điền dạng số nhiều của cherry (-ies).', hint:'cherry → cherries'});

addSentence('plural-es-ies', 'There are two old churches in this small town.', 'Có hai ngôi nhà thờ cổ kính ở thị trấn nhỏ này.', 3, ['plural', 'place'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('two','numeral','det'), tok('old','adjective','modifier'), tok('churches','noun','subject','church','pl'), tok('in','preposition','prep'), tok('this','determiner','det'), tok('small','adjective','modifier'), tok('town','noun','prep-object','town','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7, 8]}],
  ['pos','fill','order','roles'], {idx:4, ans:'churches', promptVi:'Điền dạng số nhiều của church (-es).', hint:'church → churches'});

addSentence('plural-es-ies', 'Those six heavy boxes aren\'t on the truck.', 'Sáu chiếc hộp nặng kia không có ở trên xe tải.', 3, ['plural', 'object', 'negative'],
  [tok('Those','determiner','det'), tok('six','numeral','det'), tok('heavy','adjective','modifier'), tok('boxes','noun','subject','box','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('on','preposition','prep'), tok('the','article','det'), tok('truck','noun','prep-object','truck','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'complement', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:3, ans:'boxes', promptVi:'Điền dạng số nhiều của box (-es).', hint:'box → boxes'});

addSentence('plural-es-ies', 'Are there two cute puppies under the table?', 'Có hai chú cún con dễ thương ở dưới bàn không?', 3, ['plural', 'animal', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('there','pronoun','expletive'), tok('two','numeral','det'), tok('cute','adjective','modifier'), tok('puppies','noun','subject','puppy','pl'), tok('under','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'puppies', promptVi:'Điền dạng số nhiều của puppy (-ies).', hint:'puppy → puppies'});

console.log(`Group 3 done: ${sentences.length} sentences.`);

// --------------------------------------------------------------------------
// GROUP 4: plural-irregular (30 sentences) - Irregular plural nouns
// --------------------------------------------------------------------------
// 111-125: Irregular plurals basics (diff 1: 15)
const irregList = [
  { sg: 'child', pl: 'children', vi: 'đứa trẻ', num: 'two' },
  { sg: 'man', pl: 'men', vi: 'người đàn ông', num: 'three' },
  { sg: 'woman', pl: 'women', vi: 'người phụ nữ', num: 'four' },
  { sg: 'person', pl: 'people', vi: 'người', num: 'five' },
  { sg: 'foot', pl: 'feet', vi: 'bàn chân', num: 'two' },
  { sg: 'tooth', pl: 'teeth', vi: 'chiếc răng', num: 'twenty' },
  { sg: 'mouse', pl: 'mice', vi: 'con chuột', num: 'three' },
  { sg: 'sheep', pl: 'sheep', vi: 'con cừu', num: 'four' },
  { sg: 'fish', pl: 'fish', vi: 'con cá', num: 'five' },
  { sg: 'leaf', pl: 'leaves', vi: 'chiếc lá', num: 'many' },
  { sg: 'shelf', pl: 'shelves', vi: 'chiếc kệ', num: 'two' }
];

irregList.forEach((item) => {
  addSentence('plural-irregular', `There are ${item.num} ${item.pl}.`, `Có ${item.num === 'two' ? 'hai' : item.num === 'three' ? 'ba' : item.num === 'four' ? 'bốn' : item.num === 'five' ? 'năm' : item.num === 'twenty' ? 'hai mươi' : 'nhiều'} ${item.vi}.`, 1, ['plural', 'irregular'],
    [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok(item.num,'numeral','det'), tok(item.pl,'noun','subject',item.sg,'pl'), punctDot],
    [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
    ['pos','fill','order','roles'], {idx:3, ans:item.pl, promptVi:`Điền dạng số nhiều bất quy tắc của ${item.sg}.`, hint:`số nhiều bất quy tắc của ${item.sg}`});
});

// Extra 4 diff 1 sentences
addSentence('plural-irregular', 'The children are happy.', 'Những đứa trẻ rất vui vẻ.', 1, ['plural', 'irregular'],
  [tok('The','article','det'), tok('children','noun','subject','child','pl'), tok('are','verb','verb','be','present-other'), tok('happy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'children', promptVi:'Điền số nhiều của child.', hint:'child → children'});

addSentence('plural-irregular', 'Those men are tall.', 'Những người đàn ông kia cao lớn.', 1, ['plural', 'irregular'],
  [tok('Those','determiner','det'), tok('men','noun','subject','man','pl'), tok('are','verb','verb','be','present-other'), tok('tall','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'men', promptVi:'Điền số nhiều của man.', hint:'man → men'});

addSentence('plural-irregular', 'These women are kind.', 'Những người phụ nữ này rất tốt bụng.', 1, ['plural', 'irregular'],
  [tok('These','determiner','det'), tok('women','noun','subject','woman','pl'), tok('are','verb','verb','be','present-other'), tok('kind','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'women', promptVi:'Điền số nhiều của woman.', hint:'woman → women'});

addSentence('plural-irregular', 'The fish are colorful.', 'Những con cá có nhiều màu sắc.', 1, ['plural', 'irregular'],
  [tok('The','article','det'), tok('fish','noun','subject','fish','pl'), tok('are','verb','verb','be','present-other'), tok('colorful','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'fish', promptVi:'Điền số nhiều của fish (giữ nguyên).', hint:'fish (số nhiều không đổi)'});

// 126-135: Sentences with attributes and agreement (diff 2: 10)
addSentence('plural-irregular', 'His feet are very big.', 'Hai bàn chân của cậu ấy rất to.', 2, ['plural', 'irregular', 'body'],
  [tok('His','determiner','det'), tok('feet','noun','subject','foot','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('big','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'feet', promptVi:'Điền số nhiều của foot.', hint:'foot → feet'});

addSentence('plural-irregular', 'Her teeth are clean.', 'Hàm răng của cô bé sạch sẽ.', 2, ['plural', 'irregular', 'body'],
  [tok('Her','determiner','det'), tok('teeth','noun','subject','tooth','pl'), tok('are','verb','verb','be','present-other'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'teeth', promptVi:'Điền số nhiều của tooth.', hint:'tooth → teeth'});

addSentence('plural-irregular', 'The sheep are on the green hill.', 'Những con cừu đang ở trên đồi xanh.', 2, ['plural', 'irregular', 'animal'],
  [tok('The','article','det'), tok('sheep','noun','subject','sheep','pl'), tok('are','verb','verb','be','present-other'), tok('on','preposition','prep'), tok('the','article','det'), tok('green','adjective','modifier'), tok('hill','noun','prep-object','hill','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'sheep', promptVi:'Điền số nhiều của sheep.', hint:'sheep → sheep'});

addSentence('plural-irregular', 'Those people are very friendly.', 'Những người kia rất thân thiện.', 2, ['plural', 'irregular', 'people'],
  [tok('Those','determiner','det'), tok('people','noun','subject','person','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('friendly','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'people', promptVi:'Điền số nhiều của person.', hint:'person → people'});

addSentence('plural-irregular', 'These little mice are scared.', 'Những chú chuột nhỏ này đang sợ hãi.', 2, ['plural', 'irregular', 'animal'],
  [tok('These','determiner','det'), tok('little','adjective','modifier'), tok('mice','noun','subject','mouse','pl'), tok('are','verb','verb','be','present-other'), tok('scared','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'mice', promptVi:'Điền số nhiều của mouse.', hint:'mouse → mice'});

addSentence('plural-irregular', 'The yellow leaves are on the grass.', 'Những chiếc lá vàng đang ở trên cỏ.', 2, ['plural', 'irregular', 'nature'],
  [tok('The','article','det'), tok('yellow','adjective','modifier'), tok('leaves','noun','subject','leaf','pl'), tok('are','verb','verb','be','present-other'), tok('on','preposition','prep'), tok('the','article','det'), tok('grass','noun','prep-object','grass','uncountable'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'leaves', promptVi:'Điền số nhiều của leaf.', hint:'leaf → leaves'});

addSentence('plural-irregular', 'These wooden shelves are new.', 'Những chiếc giá gỗ này mới.', 2, ['plural', 'irregular', 'object'],
  [tok('These','determiner','det'), tok('wooden','adjective','modifier'), tok('shelves','noun','subject','shelf','pl'), tok('are','verb','verb','be','present-other'), tok('new','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'shelves', promptVi:'Điền số nhiều của shelf.', hint:'shelf → shelves'});

addSentence('plural-irregular', 'Are those children polite pupils?', 'Những đứa trẻ kia có phải học sinh lễ phép không?', 2, ['plural', 'irregular', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('those','determiner','det'), tok('children','noun','subject','child','pl'), tok('polite','adjective','modifier'), tok('pupils','noun','complement','pupil','pl'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:2, ans:'children', promptVi:'Điền số nhiều của child.', hint:'child → children'});

addSentence('plural-irregular', 'Those men aren\'t lazy workers.', 'Những người đàn ông kia không phải công nhân lười biếng.', 2, ['plural', 'irregular', 'negative'],
  [tok('Those','determiner','det'), tok('men','noun','subject','man','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('lazy','adjective','modifier'), tok('workers','noun','complement','worker','pl'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4]}],
  ['pos','fill','order','roles'], {idx:1, ans:'men', promptVi:'Điền số nhiều của man.', hint:'man → men'});

addSentence('plural-irregular', 'Are the women doctors in this hospital?', 'Những người phụ nữ có phải bác sĩ ở bệnh viện này không?', 2, ['plural', 'irregular', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('the','article','det'), tok('women','noun','subject','woman','pl'), tok('doctors','noun','complement','doctor','pl'), tok('in','preposition','prep'), tok('this','determiner','det'), tok('hospital','noun','prep-object','hospital','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:2, ans:'women', promptVi:'Điền số nhiều của woman.', hint:'woman → women'});

// 136-140: Complex sentences with irregular plurals (diff 3: 5)
addSentence('plural-irregular', 'In the pond there are ten colorful fish.', 'Trong ao có mười con cá nhiều màu sắc.', 3, ['plural', 'irregular', 'animal'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('pond','noun','prep-object','pond','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('ten','numeral','det'), tok('colorful','adjective','modifier'), tok('fish','noun','subject','fish','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:7, ans:'fish', promptVi:'Điền dạng số nhiều của fish.', hint:'fish (không đổi)'},
  ['There are ten colorful fish in the pond.']);

addSentence('plural-irregular', 'Under the old house there are five small mice.', 'Dưới ngôi nhà cũ có năm con chuột nhỏ.', 3, ['plural', 'irregular', 'animal'],
  [tok('Under','preposition','prep'), tok('the','article','det'), tok('old','adjective','modifier'), tok('house','noun','prep-object','house','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('five','numeral','det'), tok('small','adjective','modifier'), tok('mice','noun','subject','mouse','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'subject', tokenIndices:[6, 7, 8]}],
  ['pos','fill','order','roles'], {idx:8, ans:'mice', promptVi:'Điền số nhiều của mouse.', hint:'mouse → mice'},
  ['There are five small mice under the old house.']);

addSentence('plural-irregular', 'Those polite children aren\'t noisy in the library.', 'Những đứa trẻ lễ phép kia không ồn ào trong thư viện.', 3, ['plural', 'irregular', 'negative'],
  [tok('Those','determiner','det'), tok('polite','adjective','modifier'), tok('children','noun','subject','child','pl'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('noisy','adjective','complement'), tok('in','preposition','prep'), tok('the','article','det'), tok('library','noun','prep-object','library','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[3]}, {clauseId:'c1', role:'complement', tokenIndices:[4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:2, ans:'children', promptVi:'Điền số nhiều của child.', hint:'child → children'});

addSentence('plural-irregular', 'Are there twenty people in this small room?', 'Có hai mươi người trong căn phòng nhỏ này không?', 3, ['plural', 'irregular', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('there','pronoun','expletive'), tok('twenty','numeral','det'), tok('people','noun','subject','person','pl'), tok('in','preposition','prep'), tok('this','determiner','det'), tok('small','adjective','modifier'), tok('room','noun','prep-object','room','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:3, ans:'people', promptVi:'Điền số nhiều của person.', hint:'person → people'});

addSentence('plural-irregular', 'On the green grass there are fifty white sheep.', 'Trên đồng cỏ xanh có năm mươi con cừu trắng.', 3, ['plural', 'irregular', 'animal'],
  [tok('On','preposition','prep'), tok('the','article','det'), tok('green','adjective','modifier'), tok('grass','noun','prep-object','grass','uncountable'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('fifty','numeral','det'), tok('white','adjective','modifier'), tok('sheep','noun','subject','sheep','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2, 3]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'subject', tokenIndices:[6, 7, 8]}],
  ['pos','fill','order','roles'], {idx:8, ans:'sheep', promptVi:'Điền số nhiều của sheep.', hint:'sheep → sheep'},
  ['There are fifty white sheep on the green grass.']);

console.log(`Group 4 done: ${sentences.length} sentences.`);

// --------------------------------------------------------------------------
// GROUP 5: there-is-are (40 sentences) - There is / There are, negation, question
// --------------------------------------------------------------------------
// 141-155: Basic There is vs There are (diff 1: 15)
addSentence('there-is-are', 'There is a cat.', 'Có một con mèo.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('cat','noun','subject','cat','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền is hoặc are cho danh từ số ít.', hint:'there is · số ít'});

addSentence('there-is-are', 'There are two dogs.', 'Có hai con chó.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('two','numeral','det'), tok('dogs','noun','subject','dog','pl'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Điền is hoặc are cho danh từ số nhiều.', hint:'there are · số nhiều'});

addSentence('there-is-are', 'There is a book.', 'Có một quyển sách.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('book','noun','subject','book','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền is hoặc are.', hint:'there is · a book'});

addSentence('there-is-are', 'There are three pens.', 'Có ba chiếc bút.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('three','numeral','det'), tok('pens','noun','subject','pen','pl'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Điền is hoặc are.', hint:'there are · three pens'});

addSentence('there-is-are', 'There is an apple.', 'Có một quả táo.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('apple','noun','subject','apple','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền to be phù hợp.', hint:'there is · an apple'});

addSentence('there-is-are', 'There are four apples.', 'Có bốn quả táo.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('four','numeral','det'), tok('apples','noun','subject','apple','pl'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Điền to be phù hợp.', hint:'there are · apples'});

addSentence('there-is-are', 'There is a chair.', 'Có một cái ghế.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('chair','noun','subject','chair','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'There', promptVi:'Điền từ There để bắt đầu cấu trúc "Có một...".', hint:'There is'});

addSentence('there-is-are', 'There are five chairs.', 'Có năm cái ghế.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('five','numeral','det'), tok('chairs','noun','subject','chair','pl'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'There', promptVi:'Điền từ There để bắt đầu cấu trúc "Có...".', hint:'There are'});

addSentence('there-is-are', 'There is a tree.', 'Có một cái cây.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('tree','noun','subject','tree','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền is hoặc are.', hint:'there is · a tree'});

addSentence('there-is-are', 'There are two trees.', 'Có hai cái cây.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('two','numeral','det'), tok('trees','noun','subject','tree','pl'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Điền is hoặc are.', hint:'there are · two trees'});

addSentence('there-is-are', 'There is a boy.', 'Có một cậu bé.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('boy','noun','subject','boy','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền to be số ít.', hint:'there is · a boy'});

addSentence('there-is-are', 'There are three boys.', 'Có ba cậu bé.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('three','numeral','det'), tok('boys','noun','subject','boy','pl'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Điền to be số nhiều.', hint:'there are · three boys'});

addSentence('there-is-are', 'There is a car.', 'Có một chiếc xe hơi.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('car','noun','subject','car','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền to be.', hint:'there is · a car'});

addSentence('there-is-are', 'There are two cars.', 'Có hai chiếc xe hơi.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('two','numeral','det'), tok('cars','noun','subject','car','pl'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Điền to be.', hint:'there are · two cars'});

addSentence('there-is-are', 'There is an egg.', 'Có một quả trứng.', 1, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('an','article','det'), tok('egg','noun','subject','egg','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền to be.', hint:'there is · an egg'});

// 156-170: There is/are with locations and some/any (diff 2: 15)
addSentence('there-is-are', 'There is a cat on the chair.', 'Có một con mèo ở trên ghế.', 2, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('cat','noun','subject','cat','sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('chair','noun','prep-object','chair','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền is hoặc are.', hint:'there is · a cat'});

addSentence('there-is-are', 'There are some apples in the basket.', 'Có vài quả táo trong giỏ.', 2, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('some','determiner','det'), tok('apples','noun','subject','apple','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('basket','noun','prep-object','basket','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Điền is hoặc are.', hint:'there are · some apples'});

addSentence('there-is-are', 'There is a big clock on the desk.', 'Có một chiếc đồng hồ to trên bàn.', 2, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('big','adjective','modifier'), tok('clock','noun','subject','clock','sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('desk','noun','prep-object','desk','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền to be phù hợp.', hint:'there is · a big clock'});

addSentence('there-is-are', 'There are two rulers in my bag.', 'Có hai chiếc thước kẻ trong cặp của tôi.', 2, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('two','numeral','det'), tok('rulers','noun','subject','ruler','pl'), tok('in','preposition','prep'), tok('my','determiner','det'), tok('bag','noun','prep-object','bag','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Điền to be phù hợp.', hint:'there are · two rulers'});

addSentence('there-is-are', 'There isn\'t a dog in this room.', 'Không có con chó nào trong căn phòng này.', 2, ['there-is-are', 'negative'],
  [tok('There','pronoun','expletive'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('a','article','det'), tok('dog','noun','subject','dog','sg'), tok('in','preposition','prep'), tok('this','determiner','det'), tok('room','noun','prep-object','room','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'isn\'t', alt:['is not'], promptVi:'Điền phủ định của there is.', hint:'there isn\'t'});

addSentence('there-is-are', 'There aren\'t any books on the floor.', 'Không có cuốn sách nào ở trên sàn.', 2, ['there-is-are', 'negative'],
  [tok('There','pronoun','expletive'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('any','determiner','det'), tok('books','noun','subject','book','pl'), tok('on','preposition','prep'), tok('the','article','det'), tok('floor','noun','prep-object','floor','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Điền phủ định của there are.', hint:'there aren\'t'});

addSentence('there-is-are', 'Is there a teacher in the classroom?', 'Có giáo viên nào trong lớp học không?', 2, ['there-is-are', 'question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('there','pronoun','expletive'), tok('a','article','det'), tok('teacher','noun','subject','teacher','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('classroom','noun','prep-object','classroom','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Đảo to be lên đầu câu hỏi số ít.', hint:'Is there...?'});

addSentence('there-is-are', 'Are there any students in the library?', 'Có học sinh nào trong thư viện không?', 2, ['there-is-are', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('there','pronoun','expletive'), tok('any','determiner','det'), tok('students','noun','subject','student','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('library','noun','prep-object','library','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Đảo to be lên đầu câu hỏi số nhiều.', hint:'Are there...?'});

addSentence('there-is-are', 'There is a small bird in the tree.', 'Có một chú chim nhỏ ở trên cây.', 2, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('small','adjective','modifier'), tok('bird','noun','subject','bird','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('tree','noun','prep-object','tree','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền to be số ít.', hint:'there is · a bird'});

addSentence('there-is-are', 'There are some eggs on the table.', 'Có vài quả trứng ở trên bàn.', 2, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('some','determiner','det'), tok('eggs','noun','subject','egg','pl'), tok('on','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Điền to be số nhiều.', hint:'there are · eggs'});

addSentence('there-is-are', 'There isn\'t any milk in the glass.', 'Không có giọt sữa nào trong cốc.', 2, ['there-is-are', 'negative'],
  [tok('There','pronoun','expletive'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('any','determiner','det'), tok('milk','noun','subject','milk','uncountable'), tok('in','preposition','prep'), tok('the','article','det'), tok('glass','noun','prep-object','glass','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định cho danh từ không đếm được.', hint:'there isn\'t · milk'});

addSentence('there-is-are', 'Is there an eraser under your desk?', 'Có một cục tẩy ở dưới bàn của bạn không?', 2, ['there-is-are', 'question'],
  [tok('Is','verb','verb','be','present-3sg'), tok('there','pronoun','expletive'), tok('an','article','det'), tok('eraser','noun','subject','eraser','sg'), tok('under','preposition','prep'), tok('your','determiner','det'), tok('desk','noun','prep-object','desk','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Is', promptVi:'Đảo to be lên đầu câu hỏi.', hint:'Is there...?'});

addSentence('there-is-are', 'There are three ducks on the pond.', 'Có ba con vịt ở trên ao.', 2, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('three','numeral','det'), tok('ducks','noun','subject','duck','pl'), tok('on','preposition','prep'), tok('the','article','det'), tok('pond','noun','prep-object','pond','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'are', promptVi:'Điền to be số nhiều.', hint:'there are · ducks'});

addSentence('there-is-are', 'There is a picture on the wall.', 'Có một bức tranh ở trên tường.', 2, ['there-is-are'],
  [tok('There','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('picture','noun','subject','picture','sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('wall','noun','prep-object','wall','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:1, ans:'is', promptVi:'Điền to be số ít.', hint:'there is · picture'});

addSentence('there-is-are', 'Are there two pencils in your pocket?', 'Có hai chiếc bút chì trong túi áo của bạn không?', 2, ['there-is-are', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('there','pronoun','expletive'), tok('two','numeral','det'), tok('pencils','noun','subject','pencil','pl'), tok('in','preposition','prep'), tok('your','determiner','det'), tok('pocket','noun','prep-object','pocket','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Đảo to be lên đầu câu hỏi số nhiều.', hint:'Are there...?'});

// 171-180: Advanced there is/are with inversion alternatives (diff 3: 10)
addSentence('there-is-are', 'In the park there are many colorful flowers.', 'Trong công viên có nhiều bông hoa rực rỡ.', 3, ['there-is-are', 'nature'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('park','noun','prep-object','park','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('many','determiner','det'), tok('colorful','adjective','modifier'), tok('flowers','noun','subject','flower','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'are', promptVi:'Điền to be cho flowers.', hint:'there are · flowers'},
  ['There are many colorful flowers in the park.']);

addSentence('there-is-are', 'On the roof there is a small black cat.', 'Trên mái nhà có một con mèo đen nhỏ.', 3, ['there-is-are', 'animal'],
  [tok('On','preposition','prep'), tok('the','article','det'), tok('roof','noun','prep-object','roof','sg'), tok('there','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('small','adjective','modifier'), tok('black','adjective','modifier'), tok('cat','noun','subject','cat','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7, 8]}],
  ['pos','fill','order','roles'], {idx:4, ans:'is', promptVi:'Điền to be cho cat.', hint:'there is · cat'},
  ['There is a small black cat on the roof.']);

addSentence('there-is-are', 'Are there three delicious cakes on the table?', 'Có ba chiếc bánh ngọt ngon lành ở trên bàn không?', 3, ['there-is-are', 'food', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('there','pronoun','expletive'), tok('three','numeral','det'), tok('delicious','adjective','modifier'), tok('cakes','noun','subject','cake','pl'), tok('on','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Đảo to be hỏi số nhiều.', hint:'Are there...?'});

addSentence('there-is-are', 'There aren\'t any noisy monkeys in this cage.', 'Không có con khỉ ồn ào nào trong chiếc lồng này.', 3, ['there-is-are', 'animal', 'negative'],
  [tok('There','pronoun','expletive'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('any','determiner','det'), tok('noisy','adjective','modifier'), tok('monkeys','noun','subject','monkey','pl'), tok('in','preposition','prep'), tok('this','determiner','det'), tok('cage','noun','prep-object','cage','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:1, ans:'aren\'t', alt:['are not'], promptVi:'Điền to be phủ định số nhiều.', hint:'there aren\'t · monkeys'});

addSentence('there-is-are', 'Under the bed there is a big brown box.', 'Ở gầm giường có một chiếc hộp to màu nâu.', 3, ['there-is-are', 'object'],
  [tok('Under','preposition','prep'), tok('the','article','det'), tok('bed','noun','prep-object','bed','sg'), tok('there','pronoun','expletive'), tok('is','verb','verb','be','present-3sg'), tok('a','article','det'), tok('big','adjective','modifier'), tok('brown','adjective','modifier'), tok('box','noun','subject','box','sg'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7, 8]}],
  ['pos','fill','order','roles'], {idx:4, ans:'is', promptVi:'Điền to be cho box.', hint:'there is · box'},
  ['There is a big brown box under the bed.']);

addSentence('there-is-are', 'In the sky there are many white clouds.', 'Trên bầu trời có rất nhiều đám mây trắng.', 3, ['there-is-are', 'nature'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('sky','noun','prep-object','sky','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('many','determiner','det'), tok('white','adjective','modifier'), tok('clouds','noun','subject','cloud','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'are', promptVi:'Điền to be cho clouds.', hint:'there are · clouds'},
  ['There are many white clouds in the sky.']);

addSentence('there-is-are', 'Are there any apples in that wooden box?', 'Có quả táo nào trong chiếc hộp gỗ kia không?', 3, ['there-is-are', 'food', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('there','pronoun','expletive'), tok('any','determiner','det'), tok('apples','noun','subject','apple','pl'), tok('in','preposition','prep'), tok('that','determiner','det'), tok('wooden','adjective','modifier'), tok('box','noun','prep-object','box','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Đảo to be hỏi số nhiều.', hint:'Are there...?'});

addSentence('there-is-are', 'There isn\'t an apple on the wooden table.', 'Không có quả táo nào ở trên chiếc bàn gỗ.', 3, ['there-is-are', 'food', 'negative'],
  [tok('There','pronoun','expletive'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('an','article','det'), tok('apple','noun','subject','apple','sg'), tok('on','preposition','prep'), tok('the','article','det'), tok('wooden','adjective','modifier'), tok('table','noun','prep-object','table','sg'), punctDot],
  [{clauseId:'c1', role:'verb', tokenIndices:[1]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3]}, {clauseId:'c1', role:'adverbial', tokenIndices:[4, 5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:1, ans:'isn\'t', alt:['is not'], promptVi:'Điền to be phủ định số ít.', hint:'there isn\'t'});

addSentence('there-is-are', 'In the river there are five large boats.', 'Trên dòng sông có năm chiếc thuyền lớn.', 3, ['there-is-are', 'vehicle'],
  [tok('In','preposition','prep'), tok('the','article','det'), tok('river','noun','prep-object','river','sg'), tok('there','pronoun','expletive'), tok('are','verb','verb','be','present-other'), tok('five','numeral','det'), tok('large','adjective','modifier'), tok('boats','noun','subject','boat','pl'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'verb', tokenIndices:[4]}, {clauseId:'c1', role:'subject', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:4, ans:'are', promptVi:'Điền to be cho boats.', hint:'there are · boats'},
  ['There are five large boats in the river.']);

addSentence('there-is-are', 'Are there two small windows in this bedroom?', 'Có hai chiếc cửa sổ nhỏ trong phòng ngủ này không?', 3, ['there-is-are', 'place', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('there','pronoun','expletive'), tok('two','numeral','det'), tok('small','adjective','modifier'), tok('windows','noun','subject','window','pl'), tok('in','preposition','prep'), tok('this','determiner','det'), tok('bedroom','noun','prep-object','bedroom','sg'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[2, 3, 4]}, {clauseId:'c1', role:'adverbial', tokenIndices:[5, 6, 7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'Are', promptVi:'Đảo to be hỏi số nhiều.', hint:'Are there...?'});

console.log(`Group 5 done: ${sentences.length} sentences.`);

// --------------------------------------------------------------------------
// GROUP 6: the-determiners (20 sentences) - Specific "The", unique objects
// --------------------------------------------------------------------------
// 181-190: The sun, The moon, The teacher, etc. (diff 1: 10)
addSentence('the-determiners', 'The sun is hot.', 'Mặt trời nóng bỏng.', 1, ['the-determiners', 'nature'],
  [tok('The','article','det'), tok('sun','noun','subject','sun','sg'), tok('is','verb','verb','be','present-3sg'), tok('hot','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định duy nhất.', hint:'The · sun'});

addSentence('the-determiners', 'The moon is round.', 'Mặt trăng hình tròn.', 1, ['the-determiners', 'nature'],
  [tok('The','article','det'), tok('moon','noun','subject','moon','sg'), tok('is','verb','verb','be','present-3sg'), tok('round','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định duy nhất.', hint:'The · moon'});

addSentence('the-determiners', 'The sky is blue.', 'Bầu trời màu xanh dương.', 1, ['the-determiners', 'nature'],
  [tok('The','article','det'), tok('sky','noun','subject','sky','sg'), tok('is','verb','verb','be','present-3sg'), tok('blue','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · sky'});

addSentence('the-determiners', 'The earth is big.', 'Trái đất to lớn.', 1, ['the-determiners', 'nature'],
  [tok('The','article','det'), tok('earth','noun','subject','earth','sg'), tok('is','verb','verb','be','present-3sg'), tok('big','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · earth'});

addSentence('the-determiners', 'The teacher is kind.', 'Cô giáo rất hiền từ.', 1, ['the-determiners', 'school'],
  [tok('The','article','det'), tok('teacher','noun','subject','teacher','sg'), tok('is','verb','verb','be','present-3sg'), tok('kind','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định cho cô giáo.', hint:'The · teacher'});

addSentence('the-determiners', 'The door is open.', 'Cửa ra vào đang mở.', 1, ['the-determiners', 'object'],
  [tok('The','article','det'), tok('door','noun','subject','door','sg'), tok('is','verb','verb','be','present-3sg'), tok('open','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · door'});

addSentence('the-determiners', 'The window is closed.', 'Cửa sổ đang đóng.', 1, ['the-determiners', 'object'],
  [tok('The','article','det'), tok('window','noun','subject','window','sg'), tok('is','verb','verb','be','present-3sg'), tok('closed','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · window'});

addSentence('the-determiners', 'The water is cold.', 'Nước lạnh ngắt.', 1, ['the-determiners'],
  [tok('The','article','det'), tok('water','noun','subject','water','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('cold','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · water'});

addSentence('the-determiners', 'The classroom is clean.', 'Lớp học sạch sẽ.', 1, ['the-determiners', 'school'],
  [tok('The','article','det'), tok('classroom','noun','subject','classroom','sg'), tok('is','verb','verb','be','present-3sg'), tok('clean','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · classroom'});

addSentence('the-determiners', 'The food is delicious.', 'Món ăn rất ngon miệng.', 1, ['the-determiners', 'food'],
  [tok('The','article','det'), tok('food','noun','subject','food','uncountable'), tok('is','verb','verb','be','present-3sg'), tok('delicious','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · food'});

// 191-200: Diff 2 & Diff 3 The determiners (diff 2: 5, diff 3: 5)
addSentence('the-determiners', 'The apples on the plate are sweet.', 'Những quả táo trên đĩa rất ngọt.', 2, ['the-determiners', 'food'],
  [tok('The','article','det'), tok('apples','noun','subject','apple','pl'), tok('on','preposition','prep'), tok('the','article','det'), tok('plate','noun','prep-object','plate','sg'), tok('are','verb','verb','be','present-other'), tok('sweet','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định cho nhóm quả táo cụ thể.', hint:'The · apples'});

addSentence('the-determiners', 'The boys in the yard are noisy.', 'Những cậu bé ngoài sân đang ồn ào.', 2, ['the-determiners', 'people'],
  [tok('The','article','det'), tok('boys','noun','subject','boy','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('yard','noun','prep-object','yard','sg'), tok('are','verb','verb','be','present-other'), tok('noisy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · boys'});

addSentence('the-determiners', 'The keys are under the table.', 'Những chiếc chìa khóa đang ở dưới bàn.', 2, ['the-determiners', 'object'],
  [tok('The','article','det'), tok('keys','noun','subject','key','pl'), tok('are','verb','verb','be','present-other'), tok('under','preposition','prep'), tok('the','article','det'), tok('table','noun','prep-object','table','sg'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1]}, {clauseId:'c1', role:'verb', tokenIndices:[2]}, {clauseId:'c1', role:'complement', tokenIndices:[3, 4, 5]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · keys'});

addSentence('the-determiners', 'The children in the room are quiet.', 'Những đứa trẻ trong phòng đang yên lặng.', 2, ['the-determiners', 'people'],
  [tok('The','article','det'), tok('children','noun','subject','child','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('room','noun','prep-object','room','sg'), tok('are','verb','verb','be','present-other'), tok('quiet','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · children'});

addSentence('the-determiners', 'The flowers in our garden are red.', 'Những bông hoa trong vườn chúng tôi màu đỏ.', 2, ['the-determiners', 'nature'],
  [tok('The','article','det'), tok('flowers','noun','subject','flower','pl'), tok('in','preposition','prep'), tok('our','determiner','det'), tok('garden','noun','prep-object','garden','sg'), tok('are','verb','verb','be','present-other'), tok('red','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3, 4]}, {clauseId:'c1', role:'verb', tokenIndices:[5]}, {clauseId:'c1', role:'complement', tokenIndices:[6]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · flowers'});

addSentence('the-determiners', 'The bright stars in the night sky are beautiful.', 'Những vì sao sáng trên bầu trời đêm thật đẹp.', 3, ['the-determiners', 'nature'],
  [tok('The','article','det'), tok('bright','adjective','modifier'), tok('stars','noun','subject','star','pl'), tok('in','preposition','prep'), tok('the','article','det'), tok('night','noun','modifier','night','sg'), tok('sky','noun','prep-object','sky','sg'), tok('are','verb','verb','be','present-other'), tok('beautiful','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3, 4, 5, 6]}, {clauseId:'c1', role:'verb', tokenIndices:[7]}, {clauseId:'c1', role:'complement', tokenIndices:[8]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định cho stars.', hint:'The · stars'});

addSentence('the-determiners', 'The little puppy in the box isn\'t noisy.', 'Chú cún con nhỏ ở trong hộp không hề ồn ào.', 3, ['the-determiners', 'animal', 'negative'],
  [tok('The','article','det'), tok('little','adjective','modifier'), tok('puppy','noun','subject','puppy','sg'), tok('in','preposition','prep'), tok('the','article','det'), tok('box','noun','prep-object','box','sg'), tok('isn\'t','verb','verb','be','present-3sg-neg'), tok('noisy','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3, 4, 5]}, {clauseId:'c1', role:'verb', tokenIndices:[6]}, {clauseId:'c1', role:'complement', tokenIndices:[7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định cho puppy.', hint:'The · puppy'});

addSentence('the-determiners', 'Are the red apples on that tree ripe now?', 'Những quả táo đỏ trên cái cây kia bây giờ đã chín chưa?', 3, ['the-determiners', 'food', 'question'],
  [tok('Are','verb','verb','be','present-other'), tok('the','article','det'), tok('red','adjective','modifier'), tok('apples','noun','subject','apple','pl'), tok('on','preposition','prep'), tok('that','determiner','det'), tok('tree','noun','prep-object','tree','sg'), tok('ripe','adjective','complement'), tok('now','adverb','adverbial'), punctQ],
  [{clauseId:'c1', role:'verb', tokenIndices:[0]}, {clauseId:'c1', role:'subject', tokenIndices:[1, 2, 3, 4, 5, 6]}, {clauseId:'c1', role:'complement', tokenIndices:[7]}, {clauseId:'c1', role:'adverbial', tokenIndices:[8]}],
  ['pos','fill','order','roles'], {idx:1, ans:'the', promptVi:'Điền mạo từ the.', hint:'the · red apples'});

addSentence('the-determiners', 'The old books in our library aren\'t cheap.', 'Những cuốn sách cũ trong thư viện chúng tôi không rẻ chút nào.', 3, ['the-determiners', 'school', 'negative'],
  [tok('The','article','det'), tok('old','adjective','modifier'), tok('books','noun','subject','book','pl'), tok('in','preposition','prep'), tok('our','determiner','det'), tok('library','noun','prep-object','library','sg'), tok('aren\'t','verb','verb','be','present-other-neg'), tok('cheap','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'subject', tokenIndices:[0, 1, 2, 3, 4, 5]}, {clauseId:'c1', role:'verb', tokenIndices:[6]}, {clauseId:'c1', role:'complement', tokenIndices:[7]}],
  ['pos','fill','order','roles'], {idx:0, ans:'The', promptVi:'Điền mạo từ xác định.', hint:'The · books'});

addSentence('the-determiners', 'On the roof the two birds are very quiet.', 'Trên mái nhà hai con chim đang rất yên lặng.', 3, ['the-determiners', 'animal'],
  [tok('On','preposition','prep'), tok('the','article','det'), tok('roof','noun','prep-object','roof','sg'), tok('the','article','det'), tok('two','numeral','det'), tok('birds','noun','subject','bird','pl'), tok('are','verb','verb','be','present-other'), tok('very','adverb','modifier'), tok('quiet','adjective','complement'), punctDot],
  [{clauseId:'c1', role:'adverbial', tokenIndices:[0, 1, 2]}, {clauseId:'c1', role:'subject', tokenIndices:[3, 4, 5]}, {clauseId:'c1', role:'verb', tokenIndices:[6]}, {clauseId:'c1', role:'complement', tokenIndices:[7, 8]}],
  ['pos','fill','order','roles'], {idx:3, ans:'the', promptVi:'Điền mạo từ xác định.', hint:'the · two birds'},
  ['The two birds are very quiet on the roof.']);

console.log(`Total sentences generated: ${sentences.length}`);

// Add IDs
const formattedSentences = sentences.map((s, idx) => {
  const numStr = String(idx + 1).padStart(4, '0');
  return applyExercisePrompts({
    id: `A2-s-${numStr}`,
    level: 'A2',
    topic: 'nouns-articles',
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
  });
});

// Fix #09 (docs/english-content-fix-list-v3.md): câu tồn tại "there is/are" không sinh câu hỏi vai trò (plan §6.1).
for (const s of formattedSentences)
  if (s.tokens.some((t) => t.role === 'expletive'))
    s.exerciseTypes = s.exerciseTypes.filter((x) => x !== 'roles');

fs.writeFileSync(
  path.join(outDir, 'A2.sentences.json'),
  JSON.stringify(formattedSentences.map(applyReviewedOrder), null, 2),
  'utf-8'
);
console.log(`✅ Generated A2.sentences.json with ${formattedSentences.length} sentences (target: 200).`);

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

// ==========================================================================
// 4. THEORY PAGE A2 (nouns-articles)
// ==========================================================================
const theory = {
  id: "A2",
  title: "Danh từ (Số ít & Số nhiều) và Mạo từ (A, An, The)",
  level: "A2",
  summary: "Học cách phân biệt danh từ số ít và số nhiều, các quy tắc thêm -s/-es/-ies hoặc bất quy tắc, cách dùng mạo từ a/an/the và cấu trúc There is / There are.",
  formulas: [
    {
      label: "Mạo từ A / An",
      pattern: "a + danh từ đếm được số ít (bắt đầu bằng âm phụ âm) / an + danh từ đếm được số ít (bắt đầu bằng âm nguyên âm u, e, o, a, i)",
      example: "a cat, a book / an apple, an egg, an umbrella"
    },
    {
      label: "Cấu trúc There is / There are",
      pattern: "There is + Danh từ số ít / There are + Danh từ số nhiều",
      example: "There is an apple. / There are three cats."
    },
    {
      label: "Phủ định & Nghi vấn với There",
      pattern: "There isn't a... / There aren't any... | Is there a...? / Are there any...?",
      example: "There aren't any pens on the desk. / Is there a cat under the table?"
    }
  ],
  sections: [
    {
      heading: "1. Mạo từ không xác định: A và An",
      body: "A và An đều mang nghĩa là 'một' và chỉ đi với danh từ đếm được số ít:\n- Dùng 'an' trước các từ bắt đầu bằng một âm nguyên âm (u, e, o, a, i như an apple, an elephant, an orange, an umbrella, an hour).\n- Dùng 'a' trước các từ bắt đầu bằng một âm phụ âm (như a cat, a dog, a uniform /juːnɪfɔːrm/).",
      table: {
        columns: ["Mạo từ", "Quy tắc phát âm", "Ví dụ"],
        rows: [
          ["a", "Đứng trước từ bắt đầu bằng âm phụ âm", "a cat, a book, a uniform, a table"],
          ["an", "Đứng trước từ bắt đầu bằng âm nguyên âm", "an apple, an egg, an orange, an umbrella, an hour"]
        ]
      },
      exampleIds: ["A2-s-0001", "A2-s-0002", "A2-s-0011", "A2-s-0012"]
    },
    {
      heading: "2. Quy tắc chuyển Danh từ sang số nhiều (-s, -es, -ies)",
      body: "Khi nói về hai người hoặc hai đồ vật trở lên, ta chuyển danh từ sang số nhiều:\n- Thêm '-s' vào hầu hết các danh từ: cat → cats, book → books.\n- Thêm '-es' vào danh từ kết thúc bằng ch, sh, s, x, z hoặc phụ âm + o: box → boxes, watch → watches, bus → buses, tomato → tomatoes.\n- Phụ âm + y đổi thành '-ies': baby → babies, puppy → puppies, strawberry → strawberries.",
      table: {
        columns: ["Đuôi danh từ", "Cách biến đổi", "Ví dụ"],
        rows: [
          ["Thông thường", "Thêm -s", "book → books, cat → cats, apple → apples"],
          ["ch, sh, s, x, z, o", "Thêm -es", "watch → watches, dish → dishes, box → boxes, bus → buses, tomato → tomatoes"],
          ["Phụ âm + y", "Bỏ y, thêm -ies", "baby → babies, candy → candies, puppy → puppies"]
        ]
      },
      exampleIds: ["A2-s-0036", "A2-s-0037", "A2-s-0076", "A2-s-0086"]
    },
    {
      heading: "3. Các danh từ số nhiều bất quy tắc cần ghi nhớ",
      body: "Một số danh từ không thêm -s hay -es mà biến đổi thành từ hoàn toàn mới, hoặc giữ nguyên dạng:",
      table: {
        columns: ["Số ít (Singular)", "Số nhiều (Plural)", "Nghĩa tiếng Việt"],
        rows: [
          ["child", "children", "đứa trẻ → những đứa trẻ"],
          ["man", "men", "người đàn ông → những người đàn ông"],
          ["woman", "women", "người phụ nữ → những người phụ nữ"],
          ["person", "people", "người → mọi người"],
          ["foot", "feet", "bàn chân → đôi bàn chân"],
          ["tooth", "teeth", "chiếc răng → hàm răng"],
          ["mouse", "mice", "con chuột → những con chuột"],
          ["sheep", "sheep", "con cừu → đàn cừu (giữ nguyên)"],
          ["fish", "fish", "con cá → những con cá (giữ nguyên)"]
        ]
      },
      exampleIds: ["A2-s-0111", "A2-s-0112", "A2-s-0113", "A2-s-0114", "A2-s-0118", "A2-s-0119"]
    },
    {
      heading: "4. Cấu trúc There is và There are",
      body: "Cấu trúc 'There is / There are' dùng để diễn tả sự tồn tại ('Có cái gì ở đâu'):\n- 'There is' đi với danh từ số ít hoặc danh từ không đếm được.\n- 'There are' đi với danh từ số nhiều.\n- Phủ định: There isn't a... / There aren't any...\n- Câu hỏi đảo: Is there a...? / Are there any...?",
      exampleIds: ["A2-s-0141", "A2-s-0142", "A2-s-0145", "A2-s-0146"]
    },
    {
      heading: "5. Mạo từ xác định: The",
      body: "'The' được dùng khi cả người nói và người nghe đều biết rõ về người hoặc vật đó, hoặc dùng cho những vật thể duy nhất trong vũ trụ (The sun, The moon, The sky).",
      exampleIds: ["A2-s-0181", "A2-s-0182", "A2-s-0183"]
    }
  ],
  commonMistakes: [
    {
      wrong: "There is three cats.",
      right: "There are three cats.",
      why: "Three cats là danh từ số nhiều, bắt buộc phải dùng 'There are'."
    },
    {
      wrong: "It is a apple.",
      right: "It is an apple.",
      why: "Apple phát âm bắt đầu bằng nguyên âm /æ/, bắt buộc dùng 'an'."
    },
    {
      wrong: "The childs are playing.",
      right: "The children are playing.",
      why: "Child là danh từ bất quy tắc, số nhiều là 'children', không thêm -s."
    },
    {
      wrong: "I have two tooths.",
      right: "I have two teeth.",
      why: "Tooth số nhiều đổi thành 'teeth'."
    }
  ],
  tips: [
    "Mẹo nhớ 'an': Nhớ từ U-E-O-A-I (uể oải). Khi danh từ phát âm bắt đầu bằng các âm nguyên âm này, hãy dùng 'an' nhé!",
    "Quy tắc số nhiều: Hãy nhớ kiểm tra xem từ đó là thông thường (thêm s), có đuôi đặc biệt (thêm es/ies), hay là từ bất quy tắc đặc biệt (child→children, man→men, tooth→teeth).",
    "Có một thì 'There is', có nhiều thì 'There are'."
  ]
};

fs.writeFileSync(
  path.join(outDir, 'A2.theory.json'),
  JSON.stringify(typeof applyTheoryReview === 'function' ? applyTheoryReview(theory) : theory, null, 2),
  'utf-8'
);
console.log(`✅ Generated A2.theory.json.`);
