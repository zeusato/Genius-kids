import { reviewedC3Passages } from './english-c3-passages-reviewed.mjs';
import { applyContentReviewV4 } from './english-content-review-v4.mjs';
/**
 * scripts/build-c3-full.mjs
 * Sinh toàn bộ dữ liệu chuẩn chỉnh cho Bậc C3 (reading-rewrite):
 * - C3.passages.json: 40 đoạn đọc hiểu (60–90 từ/đoạn, 3–5 câu hỏi mcq/tf/short có explain, glossary 3–6 từ)
 * - C3.rewrites.json: 200 bài tập viết lại câu (phủ đủ 6 types: affirm-neg, neg-affirm, statement-question, contraction, synonym, word-order)
 * - C3.vocab.json: 105 từ vựng lấy từ các đoạn đọc hiểu C3 (IPA chuẩn, emoji, forms, examples)
 * - C3.theory.json: Lý thuyết chiến lược đọc hiểu và phương pháp biến đổi câu.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../src/data/english');

// =========================================================================
// 1. TỪ VỰNG C3 (105 TỪ VỰNG KHÔNG TRÙNG LẶP LẤY TỪ CHỦ ĐỀ BÀI ĐỌC C3)
// =========================================================================
const rawVocab = [
  // Thiên nhiên & Nông thôn (20)
  { en: 'countryside', vi: 'vùng quê, nông thôn', pos: 'noun', ipa: '/ˈkʌn.tri.saɪd/', image: '🌾', tags: ['nature'], exampleEn: 'We visit the countryside in summer.', exampleVi: 'Chúng tôi về thăm vùng quê vào mùa hè.' },
  { en: 'fresh air', vi: 'không khí trong lành', pos: 'noun', ipa: '/ˌfreʃ ˈer/', image: '🍃', tags: ['nature'], exampleEn: 'I love breathing the fresh air.', exampleVi: 'Tôi thích hít thở không khí trong lành.' },
  { en: 'field', vi: 'cánh đồng', pos: 'noun', ipa: '/fiːld/', forms: { plural: 'fields' }, image: '🌱', tags: ['nature'], exampleEn: 'Cows are grazing in the green field.', exampleVi: 'Những chú bò đang gặm cỏ trên cánh đồng xanh.' },
  { en: 'riverbank', vi: 'bờ sông', pos: 'noun', ipa: '/ˈrɪv.ɚ.bæŋk/', forms: { plural: 'riverbanks' }, image: '🏞️', tags: ['nature'], exampleEn: 'Children fish along the riverbank.', exampleVi: 'Lũ trẻ câu cá dọc theo bờ sông.' },
  { en: 'waterfall', vi: 'thác nước', pos: 'noun', ipa: '/ˈwɑː.t̬ɚ.fɑːl/', forms: { plural: 'waterfalls' }, image: '🌊', tags: ['nature'], exampleEn: 'The waterfall is magnificent.', exampleVi: 'Thác nước thật hùng vĩ.' },
  { en: 'forest', vi: 'khu rừng', pos: 'noun', ipa: '/ˈfɔːr.ɪst/', forms: { plural: 'forests' }, image: '🌲', tags: ['nature'], exampleEn: 'Many wild animals live in the forest.', exampleVi: 'Nhiều loài động vật hoang dã sống trong rừng.' },
  { en: 'mountain', vi: 'ngọn núi', pos: 'noun', ipa: '/ˈmaʊn.tən/', forms: { plural: 'mountains' }, image: '⛰️', tags: ['nature'], exampleEn: 'They climbed the high mountain.', exampleVi: 'Họ đã leo lên ngọn núi cao.' },
  { en: 'valley', vi: 'thung lũng', pos: 'noun', ipa: '/ˈvæl.i/', forms: { plural: 'valleys' }, image: '🌄', tags: ['nature'], exampleEn: 'A peaceful village lies in the valley.', exampleVi: 'Một ngôi làng yên bình nằm trong thung lũng.' },
  { en: 'stream', vi: 'con suối', pos: 'noun', ipa: '/striːm/', forms: { plural: 'streams' }, image: '🌊', tags: ['nature'], exampleEn: 'Clear water flows in the stream.', exampleVi: 'Nước trong vắt chảy trong dòng suối.' },
  { en: 'island', vi: 'hòn đảo', pos: 'noun', ipa: '/ˈaɪ.lənd/', forms: { plural: 'islands' }, image: '🏝️', tags: ['nature'], exampleEn: 'We took a boat to the small island.', exampleVi: 'Chúng tôi đi thuyền ra hòn đảo nhỏ.' },
  { en: 'seashore', vi: 'bờ biển', pos: 'noun', ipa: '/ˈsiː.ʃɔːr/', forms: { plural: 'seashores' }, image: '🏖️', tags: ['nature'], exampleEn: 'They collected pretty seashells by the seashore.', exampleVi: 'Họ nhặt những vỏ sò xinh đẹp bên bờ biển.' },
  { en: 'harvest', vi: 'mùa thu hoạch', pos: 'noun', ipa: '/ˈhɑːr.vəst/', forms: { plural: 'harvests' }, image: '🌾', tags: ['nature'], exampleEn: 'Farmers are busy during the rice harvest.', exampleVi: 'Những người nông dân bận rộn trong mùa thu hoạch lúa.' },
  { en: 'sunshine', vi: 'ánh nắng mặt trời', pos: 'noun', ipa: '/ˈsʌn.ʃaɪn/', image: '☀️', tags: ['nature'], exampleEn: 'We enjoyed the warm morning sunshine.', exampleVi: 'Chúng tôi tận hưởng ánh nắng sáng ấm áp.' },
  { en: 'rainbow', vi: 'cầu vồng', pos: 'noun', ipa: '/ˈreɪn.boʊ/', forms: { plural: 'rainbows' }, image: '🌈', tags: ['nature'], exampleEn: 'A rainbow appeared after the heavy rain.', exampleVi: 'Một chiếc cầu vồng xuất hiện sau cơn mưa rào.' },
  { en: 'cloudy', vi: 'nhiều mây', pos: 'adjective', ipa: '/ˈklaʊ.di/', image: '☁️', tags: ['weather'], exampleEn: 'The sky is cloudy today.', exampleVi: 'Hôm nay bầu trời nhiều mây.' },
  { en: 'windy', vi: 'nhiều gió', pos: 'adjective', ipa: '/ˈwɪn.di/', image: '💨', tags: ['weather'], exampleEn: 'It is a windy day for flying kites.', exampleVi: 'Hôm nay là một ngày nhiều gió thích hợp để thả diều.' },
  { en: 'breeze', vi: 'cơn gió thoảng nhẹ', pos: 'noun', ipa: '/briːz/', forms: { plural: 'breezes' }, image: '🍃', tags: ['weather'], exampleEn: 'A cool breeze blew from the river.', exampleVi: 'Một cơn gió mát thoảng từ dòng sông.' },
  { en: 'soil', vi: 'đất trồng', pos: 'noun', ipa: '/sɔɪl/', image: '🪴', tags: ['nature'], exampleEn: 'Plants grow well in rich soil.', exampleVi: 'Cây cối phát triển tốt trên đất màu mỡ.' },
  { en: 'seed', vi: 'hạt giống', pos: 'noun', ipa: '/siːd/', forms: { plural: 'seeds' }, image: '🌰', tags: ['nature'], exampleEn: 'He planted a flower seed in the pot.', exampleVi: 'Cậu ấy gieo một hạt hoa vào chậu.' },
  { en: 'blossom', vi: 'nở hoa rực rỡ', pos: 'verb', ipa: '/ˈblɑː.səm/', forms: { thirdSg: 'blossoms', past: 'blossomed', ing: 'blossoming', irregular: false }, image: '🌸', tags: ['nature'], exampleEn: 'Cherry trees blossom in spring.', exampleVi: 'Cây hoa anh đào nở rộ vào mùa xuân.' },

  // Trường học & Kỹ năng (20)
  { en: 'paragraph', vi: 'đoạn văn', pos: 'noun', ipa: '/ˈper.ə.ɡræf/', forms: { plural: 'paragraphs' }, image: '📄', tags: ['reading'], exampleEn: 'Read the first paragraph carefully.', exampleVi: 'Hãy đọc kỹ đoạn văn đầu tiên.' },
  { en: 'sentence', vi: 'câu văn', pos: 'noun', ipa: '/ˈsen.təns/', forms: { plural: 'sentences' }, image: '📝', tags: ['reading'], exampleEn: 'Write a complete sentence in English.', exampleVi: 'Hãy viết một câu hoàn chỉnh bằng tiếng Anh.' },
  { en: 'passage', vi: 'bài đọc, đoạn văn trích', pos: 'noun', ipa: '/ˈpæs.ɪdʒ/', forms: { plural: 'passages' }, image: '📖', tags: ['reading'], exampleEn: 'Answer three questions about the passage.', exampleVi: 'Hãy trả lời ba câu hỏi về bài đọc.' },
  { en: 'rewrite', vi: 'viết lại', pos: 'verb', ipa: '/ˌriːˈraɪt/', forms: { thirdSg: 'rewrites', past: 'rewrote', ing: 'rewriting', irregular: true }, image: '✍️', tags: ['writing'], exampleEn: 'Rewrite the sentence without changing its meaning.', exampleVi: 'Hãy viết lại câu mà không làm thay đổi nghĩa.' },
  { en: 'meaning', vi: 'ý nghĩa', pos: 'noun', ipa: '/ˈmiː.nɪŋ/', forms: { plural: 'meanings' }, image: '💡', tags: ['reading'], exampleEn: 'What is the meaning of this word?', exampleVi: 'Ý nghĩa của từ này là gì?' },
  { en: 'synonym', vi: 'từ đồng nghĩa', pos: 'noun', ipa: '/ˈsɪn.ə.nɪm/', forms: { plural: 'synonyms' }, image: '🔤', tags: ['writing'], exampleEn: 'Find a synonym for "happy".', exampleVi: 'Hãy tìm một từ đồng nghĩa với "happy".' },
  { en: 'opposite meaning', vi: 'nghĩa trái ngược', pos: 'noun', ipa: '/ˌɑː.pə.zɪt ˈmiː.nɪŋ/', image: '🔄', tags: ['reading'], exampleEn: 'These two words have opposite meaning.', exampleVi: 'Hai từ này có ý nghĩa trái ngược nhau.' },
  { en: 'summary', vi: 'bản tóm tắt', pos: 'noun', ipa: '/ˈsʌm.ɚ.i/', forms: { plural: 'summaries' }, image: '📋', tags: ['reading'], exampleEn: 'Write a short summary of the story.', exampleVi: 'Hãy viết một bản tóm tắt ngắn về câu chuyện.' },
  { en: 'title', vi: 'tiêu đề, tựa đề', pos: 'noun', ipa: '/ˈtaɪ.t̬əl/', forms: { plural: 'titles' }, image: '🏷️', tags: ['reading'], exampleEn: 'Choose the best title for the text.', exampleVi: 'Hãy chọn tiêu đề hay nhất cho bài đọc.' },
  { en: 'author', vi: 'tác giả', pos: 'noun', ipa: '/ˈɑː.θɚ/', forms: { plural: 'authors' }, image: '✍️', tags: ['reading'], exampleEn: 'Who is the author of this book?', exampleVi: 'Ai là tác giả của cuốn sách này?' },
  { en: 'character', vi: 'nhân vật', pos: 'noun', ipa: '/ˈker.ək.tɚ/', forms: { plural: 'characters' }, image: '🎭', tags: ['reading'], exampleEn: 'Who is your favorite character in the tale?', exampleVi: 'Ai là nhân vật ưa thích của bạn trong câu chuyện?' },
  { en: 'dictionary', vi: 'từ điển', pos: 'noun', ipa: '/ˈdɪk.ʃən.er.i/', forms: { plural: 'dictionaries' }, image: '📕', tags: ['study'], exampleEn: 'Look up new words in the dictionary.', exampleVi: 'Hãy tra từ mới trong từ điển.' },
  { en: 'project', vi: 'dự án, bài tập lớn', pos: 'noun', ipa: '/ˈprɑː.dʒekt/', forms: { plural: 'projects' }, image: '📊', tags: ['school'], exampleEn: 'We worked on a science project together.', exampleVi: 'Chúng tôi đã cùng nhau làm một dự án khoa học.' },
  { en: 'presentation', vi: 'bài thuyết trình', pos: 'noun', ipa: '/ˌprez.ənˈteɪ.ʃən/', forms: { plural: 'presentations' }, image: '🎤', tags: ['school'], exampleEn: 'Lan gave a great presentation about animals.', exampleVi: 'Lan đã có bài thuyết trình tuyệt vời về động vật.' },
  { en: 'experiment', vi: 'thí nghiệm', pos: 'noun', ipa: '/ɪkˈsper.ə.mənt/', forms: { plural: 'experiments' }, image: '🧪', tags: ['science'], exampleEn: 'The chemistry experiment was exciting.', exampleVi: 'Thí nghiệm hóa học rất hào hứng.' },
  { en: 'museum', vi: 'viện bảo tàng', pos: 'noun', ipa: '/mjuːˈziː.əm/', forms: { plural: 'museums' }, image: '🏛️', tags: ['place'], exampleEn: 'Our class visited the history museum.', exampleVi: 'Lớp chúng tôi đã đến thăm bảo tàng lịch sử.' },
  { en: 'exhibition', vi: 'buổi triển lãm', pos: 'noun', ipa: '/ˌek.səˈbɪʃ.ən/', forms: { plural: 'exhibitions' }, image: '🖼️', tags: ['art'], exampleEn: 'We saw wonderful paintings at the exhibition.', exampleVi: 'Chúng tôi đã xem nhiều tranh tuyệt đẹp tại buổi triển lãm.' },
  { en: 'competition', vi: 'cuộc thi', pos: 'noun', ipa: '/ˌkɑːm.pəˈtɪʃ.ən/', forms: { plural: 'competitions' }, image: '🏆', tags: ['activity'], exampleEn: 'He won first prize in the math competition.', exampleVi: 'Cậu ấy đoạt giải nhất trong cuộc thi toán.' },
  { en: 'prize', vi: 'giải thưởng', pos: 'noun', ipa: '/praɪz/', forms: { plural: 'prizes' }, image: '🥇', tags: ['activity'], exampleEn: 'She received a shiny prize on stage.', exampleVi: 'Cô bé nhận một giải thưởng sáng lấp lánh trên sân khấu.' },
  { en: 'trophy', vi: 'chiếc cúp chiến thắng', pos: 'noun', ipa: '/ˈtroʊ.fi/', forms: { plural: 'trophies' }, image: '🏆', tags: ['activity'], exampleEn: 'Our soccer team lifted the gold trophy.', exampleVi: 'Đội bóng của chúng tôi đã nâng cao chiếc cúp vàng.' },

  // Gia đình & Hoạt động hàng ngày (20)
  { en: 'grandparents', vi: 'ông bà', pos: 'noun', ipa: '/ˈɡræn.per.ənts/', image: '👵👴', tags: ['family'], exampleEn: 'We love visiting our kind grandparents.', exampleVi: 'Chúng tôi thích về thăm ông bà hiền hậu.' },
  { en: 'neighborhood', vi: 'khu xóm, khu phố lân cận', pos: 'noun', ipa: '/ˈneɪ.bɚ.hʊd/', forms: { plural: 'neighborhoods' }, image: '🏘️', tags: ['community'], exampleEn: 'Our neighborhood has many friendly people.', exampleVi: 'Khu phố của chúng tôi có nhiều người thân thiện.' },
  { en: 'neighbor', vi: 'người hàng xóm', pos: 'noun', ipa: '/ˈneɪ.bɚ/', forms: { plural: 'neighbors' }, image: '🧑', tags: ['community'], exampleEn: 'Mr. Nam is our helpful neighbor.', exampleVi: 'Bác Nam là người hàng xóm hay giúp đỡ chúng tôi.' },
  { en: 'picnic', vi: 'buổi dã ngoại ngoài trời', pos: 'noun', ipa: '/ˈpɪk.nɪk/', forms: { plural: 'picnics' }, image: '🧺', tags: ['activity'], exampleEn: 'We had a lovely picnic in the botanic park.', exampleVi: 'Chúng tôi đã có buổi dã ngoại thú vị trong công viên bách thảo.' },
  { en: 'campfire', vi: 'lửa trại', pos: 'noun', ipa: '/ˈkæmp.faɪər/', forms: { plural: 'campfires' }, image: '🔥', tags: ['activity'], exampleEn: 'We sat around the warm campfire and sang.', exampleVi: 'Chúng tôi ngồi quanh ánh lửa trại ấm áp và hát ca.' },
  { en: 'tent', vi: 'chiếc lều cắm trại', pos: 'noun', ipa: '/tent/', forms: { plural: 'tents' }, image: '⛺', tags: ['activity'], exampleEn: 'Dad set up a green tent near the lake.', exampleVi: 'Bố dựng một chiếc lều xanh gần bờ hồ.' },
  { en: 'backpack', vi: 'ba lô đeo vai', pos: 'noun', ipa: '/ˈbæk.pæk/', forms: { plural: 'backpacks' }, image: '🎒', tags: ['things'], exampleEn: 'She packed water and snacks in her backpack.', exampleVi: 'Cô ấy gói ghém nước và đồ ăn vặt vào ba lô.' },
  { en: 'flashlight', vi: 'đèn pin', pos: 'noun', ipa: '/ˈflæʃ.laɪt/', forms: { plural: 'flashlights' }, image: '🔦', tags: ['things'], exampleEn: 'Turn on the flashlight in the dark cave.', exampleVi: 'Hãy bật đèn pin lên trong hang tối.' },
  { en: 'compass', vi: 'la bàn chỉ hướng', pos: 'noun', ipa: '/ˈkʌm.pəs/', forms: { plural: 'compasses' }, image: '🧭', tags: ['things'], exampleEn: 'Use a compass to find the north direction.', exampleVi: 'Hãy dùng la bàn để tìm hướng bắc.' },
  { en: 'journey', vi: 'hành trình, chuyến đi', pos: 'noun', ipa: '/ˈdʒɝː.ni/', forms: { plural: 'journeys' }, image: '🗺️', tags: ['travel'], exampleEn: 'It was a long and exciting journey.', exampleVi: 'Đó là một hành trình dài và hào hứng.' },
  { en: 'adventure', vi: 'chuyến phiêu lưu', pos: 'noun', ipa: '/ədˈven.tʃɚ/', forms: { plural: 'adventures' }, image: '🧗', tags: ['travel'], exampleEn: 'The children enjoyed their jungle adventure.', exampleVi: 'Lũ trẻ thích chuyến phiêu lưu trong rừng rậm.' },
  { en: 'souvenir', vi: 'món quà lưu niệm', pos: 'noun', ipa: '/ˌsuː.vəˈnɪr/', forms: { plural: 'souvenirs' }, image: '🎁', tags: ['shopping'], exampleEn: 'Mom bought a handmade souvenir at the market.', exampleVi: 'Mẹ mua một món quà lưu niệm thủ công ở chợ.' },
  { en: 'celebration', vi: 'buổi lễ kỷ niệm, liên hoan', pos: 'noun', ipa: '/ˌsel.əˈbreɪ.ʃən/', forms: { plural: 'celebrations' }, image: '🎉', tags: ['activity'], exampleEn: 'We joined the colorful Mid-Autumn celebration.', exampleVi: 'Chúng tôi tham gia buổi lễ Trung thu rực rỡ.' },
  { en: 'invitation', vi: 'thiệp mời', pos: 'noun', ipa: '/ˌɪn.vəˈteɪ.ʃən/', forms: { plural: 'invitations' }, image: '💌', tags: ['things'], exampleEn: 'Lan sent me an invitation to her birthday party.', exampleVi: 'Lan gửi cho tôi thiệp mời đến dự tiệc sinh nhật.' },
  { en: 'costume', vi: 'trang phục hóa trang', pos: 'noun', ipa: '/ˈkɑː.stuːm/', forms: { plural: 'costumes' }, image: '👘', tags: ['clothes'], exampleEn: 'The kids wore funny animal costumes.', exampleVi: 'Lũ trẻ mặc những bộ trang phục thú vui nhộn.' },
  { en: 'lantern', vi: 'chiếc lồng đèn', pos: 'noun', ipa: '/ˈlæn.tɚn/', forms: { plural: 'lanterns' }, image: '🏮', tags: ['things'], exampleEn: 'We carried star lanterns on the full moon night.', exampleVi: 'Chúng tôi rước đèn lồng ngôi sao vào đêm rằm.' },
  { en: 'firework', vi: 'pháo hoa', pos: 'noun', ipa: '/ˈfaɪr.wɝːk/', forms: { plural: 'fireworks' }, image: '🎆', tags: ['things'], exampleEn: 'Bright fireworks lit up the midnight sky.', exampleVi: 'Pháo hoa rực sáng thắp sáng bầu trời đêm.' },
  { en: 'tradition', vi: 'truyền thống', pos: 'noun', ipa: '/trəˈdɪʃ.ən/', forms: { plural: 'traditions' }, image: '📜', tags: ['culture'], exampleEn: 'Making sticky rice cakes is a Tet tradition.', exampleVi: 'Gói bánh chưng là một nét truyền thống ngày Tết.' },
  { en: 'delicious', vi: 'ngon miệng', pos: 'adjective', ipa: '/dɪˈlɪʃ.əs/', image: '😋', tags: ['food'], exampleEn: 'Grandma made delicious vegetable soup.', exampleVi: 'Bà nấu món súp rau củ rất ngon miệng.' },
  { en: 'recipe', vi: 'công thức nấu ăn', pos: 'noun', ipa: '/ˈres.ə.pi/', forms: { plural: 'recipes' }, image: '📖', tags: ['food'], exampleEn: 'Follow this simple recipe to bake cookies.', exampleVi: 'Hãy làm theo công thức đơn giản này để nướng bánh quy.' },

  // Sở thích & Nghệ thuật (20)
  { en: 'hobby', vi: 'sở thích cá nhân', pos: 'noun', ipa: '/ˈhɑː.bi/', forms: { plural: 'hobbies' }, image: '🎨', tags: ['hobby'], exampleEn: 'Collecting stamps is an entertaining hobby.', exampleVi: 'Sưu tầm tem là một sở thích giải trí.' },
  { en: 'musical instrument', vi: 'nhạc cụ', pos: 'noun', ipa: '/ˌmjuː.zɪ.kəl ˈɪn.strə.mənt/', forms: { plural: 'musical instruments' }, image: '🎸', tags: ['music'], exampleEn: 'Can you play any musical instrument?', exampleVi: 'Bạn có biết chơi nhạc cụ nào không?' },
  { en: 'guitar', vi: 'đàn ghi-ta', pos: 'noun', ipa: '/ɡɪˈtɑːr/', forms: { plural: 'guitars' }, image: '🎸', tags: ['music'], exampleEn: 'He plays acoustic guitar very well.', exampleVi: 'Cậu ấy chơi đàn ghi-ta mộc rất giỏi.' },
  { en: 'flute', vi: 'cây sáo trúc', pos: 'noun', ipa: '/fluːt/', forms: { plural: 'flutes' }, image: '🪈', tags: ['music'], exampleEn: 'The boy plays sweet tunes on his bamboo flute.', exampleVi: 'Cậu bé thổi những giai điệu ngọt ngào trên cây sáo trúc.' },
  { en: 'melody', vi: 'giai điệu', pos: 'noun', ipa: '/ˈmel.ə.di/', forms: { plural: 'melodies' }, image: '🎵', tags: ['music'], exampleEn: 'This gentle melody helps me relax.', exampleVi: 'Giai điệu êm dịu này giúp tôi thư giãn.' },
  { en: 'painting', vi: 'bức tranh vẽ', pos: 'noun', ipa: '/ˈpeɪn.tɪŋ/', forms: { plural: 'paintings' }, image: '🖼️', tags: ['art'], exampleEn: 'Her oil painting won the school contest.', exampleVi: 'Bức tranh sơn dầu của cô bé đoạt giải cuộc thi trường.' },
  { en: 'paintbrush', vi: 'cây cọ vẽ', pos: 'noun', ipa: '/ˈpeɪnt.brʌʃ/', forms: { plural: 'paintbrushes' }, image: '🖌️', tags: ['art'], exampleEn: 'Dip the paintbrush into watercolor.', exampleVi: 'Hãy nhúng cọ vẽ vào màu nước.' },
  { en: 'canvas', vi: 'khung vải vẽ tranh', pos: 'noun', ipa: '/ˈkæn.vəs/', forms: { plural: 'canvases' }, image: '🎨', tags: ['art'], exampleEn: 'The artist painted a sunset on canvas.', exampleVi: 'Họa sĩ vẽ cảnh hoàng hôn lên khung vải.' },
  { en: 'photograph', vi: 'bức ảnh chụp', pos: 'noun', ipa: '/ˈfoʊ.t̬ə.ɡræf/', forms: { plural: 'photographs' }, image: '📷', tags: ['art'], exampleEn: 'Dad took a lovely family photograph.', exampleVi: 'Bố chụp một bức ảnh gia đình đáng yêu.' },
  { en: 'camera', vi: 'máy ảnh', pos: 'noun', ipa: '/ˈkæm.rə/', forms: { plural: 'cameras' }, image: '📷', tags: ['things'], exampleEn: 'She bought a new digital camera.', exampleVi: 'Cô ấy đã mua một chiếc máy ảnh kỹ thuật số mới.' },
  { en: 'origami', vi: 'nghệ thuật gấp giấy', pos: 'noun', ipa: '/ˌɔːr.ɪˈɡɑː.mi/', image: '🦢', tags: ['craft'], exampleEn: 'He folded paper into pretty origami cranes.', exampleVi: 'Cậu ấy gấp giấy thành những chú hạc origami xinh xắn.' },
  { en: 'sculpture', vi: 'tượng điêu khắc', pos: 'noun', ipa: '/ˈskʌlp.tʃɚ/', forms: { plural: 'sculptures' }, image: '🗿', tags: ['art'], exampleEn: 'We admired the stone sculpture in the square.', exampleVi: 'Chúng tôi chiêm ngưỡng bức tượng đá ở quảng trường.' },
  { en: 'excursion', vi: 'chuyến dã ngoại tham quan', pos: 'noun', ipa: '/ɪkˈskɝː.ʒən/', forms: { plural: 'excursions' }, image: '🚌', tags: ['travel'], exampleEn: 'Our weekend excursion to the botanical garden was educational.', exampleVi: 'Chuyến tham quan công viên bách thảo cuối tuần rất bổ ích.' },
  { en: 'aquarium', vi: 'thủy cung', pos: 'noun', ipa: '/əˈkwer.i.əm/', forms: { plural: 'aquariums' }, image: '🐠', tags: ['place'], exampleEn: 'Colorful marine fish swim in the giant aquarium.', exampleVi: 'Những loài cá biển rực rỡ bơi trong thủy cung khổng lồ.' },
  { en: 'dolphin', vi: 'cá heo', pos: 'noun', ipa: '/ˈdɑːl.fɪn/', forms: { plural: 'dolphins' }, image: '🐬', tags: ['animal'], exampleEn: 'Smart dolphins jumped high above the water waves.', exampleVi: 'Những chú cá heo thông minh nhảy cao trên mặt sóng.' },
  { en: 'whale', vi: 'cá voi', pos: 'noun', ipa: '/weɪl/', forms: { plural: 'whales' }, image: '🐋', tags: ['animal'], exampleEn: 'The blue whale is the largest mammal on earth.', exampleVi: 'Cá voi xanh là loài thú lớn nhất trên trái đất.' },
  { en: 'penguin', vi: 'chim cánh cụt', pos: 'noun', ipa: '/ˈpeŋ.ɡwɪn/', forms: { plural: 'penguins' }, image: '🐧', tags: ['animal'], exampleEn: 'Cute penguins waddle happily on white snow.', exampleVi: 'Những chú chim cánh cụt lắc lư bước đi vui vẻ trên tuyết trắng.' },
  { en: 'kangaroo', vi: 'chuột túi', pos: 'noun', ipa: '/ˌkæŋ.ɡəˈruː/', forms: { plural: 'kangaroos' }, image: '🦘', tags: ['animal'], exampleEn: 'A baby kangaroo rests inside its mother pouch.', exampleVi: 'Một chú chuột túi con nghỉ ngơi trong túi mẹ.' },
  { en: 'koala', vi: 'gấu túi koala', pos: 'noun', ipa: '/koʊˈɑː.lə/', forms: { plural: 'koalas' }, image: '🐨', tags: ['animal'], exampleEn: 'The sleepy koala hugs the eucalyptus branch.', exampleVi: 'Chú gấu túi koala ngái ngủ ôm cành cây bạch đàn.' },
  { en: 'squirrel', vi: 'con sóc', pos: 'noun', ipa: '/ˈskwɝː.əl/', forms: { plural: 'squirrels' }, image: '🐿️', tags: ['animal'], exampleEn: 'The quick squirrel gathers acorns for winter.', exampleVi: 'Chú sóc nhanh nhẹn thu lượm hạt dẻ cho mùa đông.' },

  // Tính từ & Từ vựng bổ trợ C3 (25)
  { en: 'magnificent', vi: 'tráng lệ, nguy nga', pos: 'adjective', ipa: '/mæɡˈnɪf.ə.sənt/', image: '✨', tags: ['quality'], exampleEn: 'The palace looked magnificent under the sun.', exampleVi: 'Tòa lâu đài trông thật tráng lệ dưới ánh mặt trời.' },
  { en: 'peaceful', vi: 'yên bình, thanh bình', pos: 'adjective', ipa: '/ˈpiːs.fəl/', image: '🕊️', tags: ['quality'], exampleEn: 'The village is quiet and peaceful.', exampleVi: 'Ngôi làng thật yên tĩnh và thanh bình.' },
  { en: 'colorful', vi: 'rực rỡ sắc màu', pos: 'adjective', ipa: '/ˈkʌl.ɚ.fəl/', image: '🎨', tags: ['quality'], exampleEn: 'Butterflies have colorful wings.', exampleVi: 'Những chú bướm có đôi cánh rực rỡ sắc màu.' },
  { en: 'wonderful', vi: 'tuyệt vời', pos: 'adjective', ipa: '/ˈwʌn.dɚ.fəl/', image: '🌟', tags: ['quality'], exampleEn: 'We had a wonderful vacation by the sea.', exampleVi: 'Chúng tôi đã có một kỳ nghỉ tuyệt vời bên bờ biển.' },
  { en: 'friendly', vi: 'thân thiện', pos: 'adjective', ipa: '/ˈfrend.li/', image: '🤝', tags: ['people'], exampleEn: 'The local people are kind and friendly.', exampleVi: 'Người dân địa phương rất tốt bụng và thân thiện.' },
  { en: 'clever', vi: 'khôn ngoan, khéo léo', pos: 'adjective', ipa: '/ˈklev.ɚ/', image: '💡', tags: ['people'], exampleEn: 'The clever boy solved the tricky riddle.', exampleVi: 'Cậu bé thông minh đã giải được câu đố hóc búa.' },
  { en: 'curious', vi: 'tò mò, thích khám phá', pos: 'adjective', ipa: '/ˈkjʊr.i.əs/', image: '🧐', tags: ['people'], exampleEn: 'Children are always curious about nature.', exampleVi: 'Trẻ em luôn tò mò về thế giới tự nhiên.' },
  { en: 'creative', vi: 'sáng tạo', pos: 'adjective', ipa: '/kriˈeɪ.t̬ɪv/', image: '💡', tags: ['people'], exampleEn: 'She makes creative drawings from fallen leaves.', exampleVi: 'Cô bé tạo ra những bức tranh sáng tạo từ lá cây rụng.' },
  { en: 'careful', vi: 'cẩn thận', pos: 'adjective', ipa: '/ˈker.fəl/', image: '👀', tags: ['quality'], exampleEn: 'Be careful when carrying the glass bowl.', exampleVi: 'Hãy cẩn thận khi bê chiếc bát thủy tinh.' },
  { en: 'energetic', vi: 'tràn đầy năng lượng', pos: 'adjective', ipa: '/ˌen.ɚˈdʒet̬.ɪk/', image: '⚡', tags: ['quality'], exampleEn: 'Puppies are very energetic and playful.', exampleVi: 'Những chú cún con rất giàu năng lượng và thích đùa nghịch.' },
  { en: 'gentle', vi: 'nhẹ nhàng, dịu dàng', pos: 'adjective', ipa: '/ˈdʒen.t̬əl/', image: '🌸', tags: ['quality'], exampleEn: 'He spoke in a soft and gentle voice.', exampleVi: 'Cậu ấy nói bằng giọng nói êm dịu và nhẹ nhàng.' },
  { en: 'healthy', vi: 'khỏe mạnh, lành mạnh', pos: 'adjective', ipa: '/ˈhel.θi/', image: '🥗', tags: ['health'], exampleEn: 'Eating fresh fruit keeps our bodies healthy.', exampleVi: 'Ăn hoa quả tươi giúp cơ thể chúng ta khỏe mạnh.' },
  { en: 'comfortable', vi: 'thoải mái, tiện nghi', pos: 'adjective', ipa: '/ˈkʌm.fɚ.t̬ə.bəl/', image: '🛋️', tags: ['feeling'], exampleEn: 'This armchair is soft and comfortable.', exampleVi: 'Chiếc ghế bành này rất êm ái và thoải mái.' },
  { en: 'entertaining', vi: 'có tính giải trí, vui nhộn', pos: 'adjective', ipa: '/ˌen.t̬ɚˈteɪ.nɪŋ/', image: '🎭', tags: ['quality'], exampleEn: 'The animated movie was funny and entertaining.', exampleVi: 'Bộ phim hoạt hình rất hài hước và tính giải trí cao.' },
  { en: 'educational', vi: 'mang tính giáo dục', pos: 'adjective', ipa: '/ˌedʒ.əˈkeɪ.ʃən.əl/', image: '📚', tags: ['quality'], exampleEn: 'The documentary was informative and educational.', exampleVi: 'Bộ phim tài liệu rất nhiều thông tin và mang tính giáo dục cao.' },
  { en: 'protect', vi: 'bảo vệ', pos: 'verb', ipa: '/prəˈtekt/', forms: { thirdSg: 'protects', past: 'protected', ing: 'protecting', irregular: false }, image: '🛡️', tags: ['action'], exampleEn: 'We should protect the environment.', exampleVi: 'Chúng ta nên bảo vệ môi trường.' },
  { en: 'recycle', vi: 'tái chế', pos: 'verb', ipa: '/ˌriːˈsaɪ.kəl/', forms: { thirdSg: 'recycles', past: 'recycled', ing: 'recycling', irregular: false }, image: '♻️', tags: ['action'], exampleEn: 'Students recycle plastic bottles for crafts.', exampleVi: 'Học sinh tái chế chai nhựa để làm đồ thủ công.' },
  { en: 'explore', vi: 'khám phá', pos: 'verb', ipa: '/ɪkˈsplɔːr/', forms: { thirdSg: 'explores', past: 'explored', ing: 'exploring', irregular: false }, image: '🧭', tags: ['action'], exampleEn: 'We love exploring new hiking trails.', exampleVi: 'Chúng tôi thích khám phá những cung đường mòn mới.' },
  { en: 'organize', vi: 'tổ chức, sắp xếp', pos: 'verb', ipa: '/ˈɔːr.ɡən.aɪz/', forms: { thirdSg: 'organizes', past: 'organized', ing: 'organizing', irregular: false }, image: '📋', tags: ['action'], exampleEn: 'The school organized an eco-friendly festival.', exampleVi: 'Nhà trường đã tổ chức một ngày hội thân thiện với môi trường.' },
  { en: 'participate', vi: 'tham gia', pos: 'verb', ipa: '/pɑːrˈtɪs.ə.peɪt/', forms: { thirdSg: 'participates', past: 'participated', ing: 'participating', irregular: false }, image: '🙋', tags: ['action'], exampleEn: 'Many pupils participate in the running race.', exampleVi: 'Nhiều bạn học sinh tham gia vào cuộc chạy đua.' },
  { en: 'celebrate', vi: 'ăn mừng, kỷ niệm', pos: 'verb', ipa: '/ˈsel.ə.breɪt/', forms: { thirdSg: 'celebrates', past: 'celebrated', ing: 'celebrating', irregular: false }, image: '🥳', tags: ['action'], exampleEn: 'We celebrate Vietnamese Teachers Day in November.', exampleVi: 'Chúng tôi kỷ niệm ngày Nhà giáo Việt Nam vào tháng 11.' },
  { en: 'discover', vi: 'phát hiện, tìm ra', pos: 'verb', ipa: '/dɪˈskʌv.ɚ/', forms: { thirdSg: 'discovers', past: 'discovered', ing: 'discovering', irregular: false }, image: '🔍', tags: ['action'], exampleEn: 'Scientists discovered an ancient stone tool.', exampleVi: 'Các nhà khoa học đã phát hiện một công cụ bằng đá cổ xưa.' },
  { en: 'describe', vi: 'miêu tả, mô tả', pos: 'verb', ipa: '/dɪˈskraɪb/', forms: { thirdSg: 'describes', past: 'described', ing: 'describing', irregular: false }, image: '🗣️', tags: ['action'], exampleEn: 'Can you describe your pet dog?', exampleVi: 'Bạn có thể mô tả chú chó cưng của mình không?' },
  { en: 'encourage', vi: 'động viên, khích lệ', pos: 'verb', ipa: '/ɪnˈkɝː.ɪdʒ/', forms: { thirdSg: 'encourages', past: 'encouraged', ing: 'encouraging', irregular: false }, image: '👏', tags: ['action'], exampleEn: 'Teachers encourage students to read more books.', exampleVi: 'Thầy cô khuyến khích học sinh đọc nhiều sách hơn.' },
  { en: 'improve', vi: 'cải thiện, nâng cao', pos: 'verb', ipa: '/ɪmˈpruːv/', forms: { thirdSg: 'improves', past: 'improved', ing: 'improving', irregular: false }, image: '📈', tags: ['action'], exampleEn: 'Practice English daily to improve your fluency.', exampleVi: 'Luyện tập tiếng Anh hàng ngày để nâng cao sự trôi chảy.' }
];

console.log(`Checking C3 vocab duplicates... Total vocab: ${rawVocab.length}`);
const seenEn = new Set();
for (const v of rawVocab) {
  if (seenEn.has(v.en.toLowerCase())) {
    throw new Error(`Duplicate C3 vocab detected: "${v.en}"`);
  }
  seenEn.add(v.en.toLowerCase());
}

const c3Vocab = rawVocab.map((item, idx) => {
  const idNum = String(idx + 1).padStart(4, '0');
  return {
    id: `C3-v-${idNum}`,
    level: 'C3',
    topic: 'reading-rewrite',
    en: item.en,
    vi: item.vi,
    pos: item.pos,
    ipa: item.ipa,
    ...(item.forms ? { forms: item.forms } : {}),
    image: item.image,
    tags: item.tags,
    exampleEn: item.exampleEn,
    exampleVi: item.exampleVi,
    source: 'seed'
  };
});

fs.writeFileSync(path.join(DATA_DIR, 'C3.vocab.json'), JSON.stringify(applyContentReviewV4('C3.vocab.json', c3Vocab), null, 2), 'utf-8');
console.log(`✅ Generated C3.vocab.json with ${c3Vocab.length} words (target ≥ 100).`);

// =========================================================================
// 2. TẠO 40 ĐOẠN ĐỌC HIỂU C3 (C3.passages.json)
// =========================================================================
// Mỗi đoạn 60–90 từ, có title, en, vi, wordCount, questions (ít nhất 1 mcq 4 options, 1 tf, 1 short), glossary 3–6 từ
const rawPassages = [
  {
    title: 'My Weekend in the Countryside',
    en: 'On Saturday morning, Mai travels to the countryside with her family. They visit her grandparents in a small peaceful village. Mai loves the fresh air and green rice fields. In the afternoon, she helps her grandmother pick sweet oranges in the orchard. Her brother plays with a friendly brown puppy near the pond. In the evening, the whole family sits on the porch and eats warm dinner together under bright stars.',
    vi: 'Vào sáng thứ Bảy, Mai cùng gia đình về quê. Họ thăm ông bà ở một ngôi làng nhỏ thanh bình. Mai thích không khí trong lành và những cánh đồng lúa xanh. Buổi chiều, cô giúp bà hái những quả cam ngọt trong vườn cây. Em trai cô chơi với một chú cún con màu nâu thân thiện gần bờ ao. Buổi tối, cả gia đình ngồi ngoài hiên và ăn bữa tối ấm cúng cùng nhau dưới bầu trời đầy sao.',
    questions: [
      { id: 'C3-p-0001-q1', type: 'mcq', q: 'Mai và gia đình về thăm ai ở quê?', options: ['her teacher', 'her grandparents', 'her classmate', 'her aunt'], answer: 'her grandparents', explain: 'Đoạn văn có câu: "They visit her grandparents in a small peaceful village."' },
      { id: 'C3-p-0001-q2', type: 'tf', q: 'Em trai của Mai chơi với một con mèo nhỏ bên bờ ao. Đúng hay sai?', answer: 'False', explain: 'Đoạn văn viết cậu bé chơi với chú cún nâu ("a friendly brown puppy"), không phải mèo.' },
      { id: 'C3-p-0001-q3', type: 'short', q: 'Mai giúp bà làm công việc gì vào buổi chiều? Điền cụm hành động bằng tiếng Anh.', answer: 'pick sweet oranges', alt: ['pick oranges', 'picking sweet oranges', 'picking oranges'], explain: 'Đoạn văn: "she helps her grandmother pick sweet oranges in the orchard."' }
    ],
    glossary: [{ en: 'countryside', vi: 'vùng quê' }, { en: 'fresh air', vi: 'không khí trong lành' }, { en: 'orchard', vi: 'vườn cây ăn quả' }, { en: 'porch', vi: 'hiên nhà' }]
  },
  {
    title: 'A Fun Day at School',
    en: 'Today is Friday, and our class has a special science lesson. Mr. Nam brings three small glass jars and green plant seeds. First, every student puts soft black soil into their own jar. Next, we carefully place two seeds into the soil and pour a little water. Mr. Nam tells us to place the jars near the bright sunny window. We are very excited to watch our green plants grow day by day.',
    vi: 'Hôm nay là thứ Sáu, và lớp chúng tôi có một tiết học khoa học đặc biệt. Thầy Nam mang đến ba chiếc lọ thủy tinh nhỏ và những hạt mầm màu xanh. Đầu tiên, mỗi học sinh cho đất đen tơi xốp vào lọ của mình. Tiếp theo, chúng tôi cẩn thận đặt hai hạt giống vào đất và tưới một ít nước. Thầy Nam bảo chúng tôi đặt các lọ gần cửa sổ đầy nắng. Chúng tôi rất hào hứng theo dõi những cái cây xanh lớn lên từng ngày.',
    questions: [
      { id: 'C3-p-0002-q1', type: 'mcq', q: 'Tiết học đặc biệt hôm nay của cả lớp là môn học nào?', options: ['art', 'music', 'science', 'math'], answer: 'science', explain: 'Câu đầu: "our class has a special science lesson."' },
      { id: 'C3-p-0002-q2', type: 'tf', q: 'Mỗi bạn học sinh đặt năm hạt giống vào chiếc lọ của mình. Đúng hay sai?', answer: 'False', explain: 'Đoạn văn nêu: "place two seeds into the soil", tức là 2 hạt giống, không phải 5.' },
      { id: 'C3-p-0002-q3', type: 'short', q: 'Học sinh đặt các lọ cây ở đâu để đón ánh sáng? Điền cụm từ tiếng Anh.', answer: 'near the window', alt: ['near the sunny window', 'near the bright sunny window', 'by the window'], explain: 'Câu: "place the jars near the bright sunny window."' }
    ],
    glossary: [{ en: 'science', vi: 'khoa học' }, { en: 'jar', vi: 'lọ thủy tinh' }, { en: 'soil', vi: 'đất trồng' }, { en: 'seed', vi: 'hạt giống' }]
  },
  {
    title: 'The Clever Little Squirrel',
    en: 'In an ancient pine forest, a clever squirrel named Nutty lives inside a cozy tree hollow. Every autumn, Nutty wakes up early to gather ripe acorns and pine cones. He hides his food carefully under dry leaves and beneath old tree roots. When cold winter brings heavy white snow, Nutty stays warm in his nest. He enjoys his delicious stored food and waits patiently for gentle spring flowers to bloom.',
    vi: 'Trong một khu rừng thông cổ thụ, một chú sóc khôn ngoan tên là Nutty sống trong một hốc cây ấm cúng. Mỗi mùa thu, Nutty thức dậy sớm để thu gom hạt sồi chín và quả thông. Chú giấu thức ăn cẩn thận dưới những chiếc lá khô và bên dưới những rễ cây già. Khi mùa đông lạnh giá mang tuyết trắng dày đặc đến, Nutty ở ấm áp trong tổ. Chú thưởng thức thức ăn ngon đã dự trữ và kiên nhẫn đợi hoa xuân dịu dàng nở rộ.',
    questions: [
      { id: 'C3-p-0003-q1', type: 'mcq', q: 'Chú sóc Nutty thức dậy sớm vào mùa nào để thu gom thức ăn?', options: ['spring', 'summer', 'autumn', 'winter'], answer: 'autumn', explain: 'Đoạn văn viết: "Every autumn, Nutty wakes up early to gather ripe acorns and pine cones."' },
      { id: 'C3-p-0003-q2', type: 'tf', q: 'Vào mùa đông lạnh giá, Nutty vẫn phải ra ngoài tìm kiếm quả thông mỗi ngày. Đúng hay sai?', answer: 'False', explain: 'Đoạn văn nêu: "Nutty stays warm in his nest. He enjoys his delicious stored food".' },
      { id: 'C3-p-0003-q3', type: 'short', q: 'Nutty sống ở đâu trong khu rừng thông? Điền nơi chốn tiếng Anh.', answer: 'inside a tree hollow', alt: ['a tree hollow', 'in a tree hollow', 'tree hollow'], explain: 'Đoạn văn: "lives inside a cozy tree hollow."' }
    ],
    glossary: [{ en: 'squirrel', vi: 'con sóc' }, { en: 'tree hollow', vi: 'hốc cây' }, { en: 'acorn', vi: 'hạt sồi' }, { en: 'pine cone', vi: 'quả thông' }]
  },
  {
    title: 'A Visit to the City Library',
    en: 'Every Wednesday afternoon, Huy and his sister Linh go to the city library. The library is a large modern building with thousands of colorful storybooks. Huy likes reading books about brave space astronauts and faraway planets. Linh prefers reading funny tales about magical talking animals. They sit at a clean wooden table near the bookshelf. They always keep quiet because everyone is reading quietly and attentively.',
    vi: 'Mỗi chiều thứ Tư, Huy và em gái Linh đều đến thư viện thành phố. Thư viện là một tòa nhà hiện đại rộng lớn với hàng ngàn cuốn truyện nhiều màu sắc. Huy thích đọc sách về những nhà du hành vũ trụ dũng cảm và những hành tinh xa xôi. Linh thích đọc những câu chuyện vui nhộn về những con vật biết nói kỳ diệu. Họ ngồi bên chiếc bàn gỗ sạch sẽ gần giá sách. Họ luôn giữ trật tự vì mọi người đều đọc sách chăm chú và yên lặng.',
    questions: [
      { id: 'C3-p-0004-q1', type: 'mcq', q: 'Huy và Linh đến thư viện vào ngày nào trong tuần?', options: ['Monday', 'Tuesday', 'Wednesday', 'Saturday'], answer: 'Wednesday', explain: 'Câu đầu: "Every Wednesday afternoon, Huy and his sister Linh go to the city library."' },
      { id: 'C3-p-0004-q2', type: 'tf', q: 'Huy thích đọc sách về những nhà du hành vũ trụ. Đúng hay sai?', answer: 'True', explain: 'Câu: "Huy likes reading books about brave space astronauts".' },
      { id: 'C3-p-0004-q3', type: 'short', q: 'Tại sao hai bạn luôn giữ trật tự trong thư viện? Điền lý do ngắn bằng tiếng Anh.', answer: 'everyone is reading quietly', alt: ['everyone is reading', 'because everyone is reading quietly'], explain: 'Câu cuối: "because everyone is reading quietly and attentively."' }
    ],
    glossary: [{ en: 'modern', vi: 'hiện đại' }, { en: 'astronaut', vi: 'nhà du hành vũ trụ' }, { en: 'attentively', vi: 'chăm chú' }, { en: 'bookshelf', vi: 'giá sách' }]
  },
  {
    title: 'Our Family Picnic by the Lake',
    en: 'Last Sunday, my family had an unforgettable picnic by West Lake. The weather was bright and warm with a gentle breeze. My mother prepared ham sandwiches, boiled eggs, and fresh orange juice. My father brought a portable music player and a checkered blanket. We ate delicious food on the soft grass while white swans swam peacefully across the lake. Later, my brother and I flew a red kite.',
    vi: 'Chủ nhật tuần trước, gia đình tôi đã có một buổi dã ngoại khó quên bên Hồ Tây. Thời tiết nắng ráo và ấm áp với một làn gió nhẹ. Mẹ tôi chuẩn bị bánh mì kẹp giăm bông, trứng luộc và nước cam tươi. Bố tôi mang theo một chiếc máy nghe nhạc cầm tay và một tấm thảm ca-rô. Chúng tôi ăn thức ăn ngon trên thảm cỏ êm trong khi những chú thiên nga trắng bơi lội yên bình qua hồ. Sau đó, tôi và em trai cùng thả một chiếc diều đỏ.',
    questions: [
      { id: 'C3-p-0005-q1', type: 'mcq', q: 'Mẹ đã chuẩn bị đồ uống gì cho buổi dã ngoại?', options: ['apple juice', 'lemonade', 'orange juice', 'milk'], answer: 'orange juice', explain: 'Đoạn văn: "prepared ham sandwiches, boiled eggs, and fresh orange juice."' },
      { id: 'C3-p-0005-q2', type: 'tf', q: 'Hai anh em thả một chiếc diều màu xanh lá cây. Đúng hay sai?', answer: 'False', explain: 'Đoạn văn nêu: "flew a red kite", diều màu đỏ chứ không phải xanh.' },
      { id: 'C3-p-0005-q3', type: 'short', q: 'Loài vật nào bơi lội yên bình trên mặt hồ? Điền tên tiếng Anh.', answer: 'white swans', alt: ['swans', 'swan'], explain: 'Câu: "white swans swam peacefully across the lake."' }
    ],
    glossary: [{ en: 'unforgettable', vi: 'khó quên' }, { en: 'swan', vi: 'chim thiên nga' }, { en: 'breeze', vi: 'cơn gió thoảng' }, { en: 'blanket', vi: 'tấm thảm, chăn' }]
  }
];

// Each additional passage has independently authored text and questions.
rawPassages.push(...reviewedC3Passages());

const c3Passages = rawPassages.map((item, idx) => {
  const pIdNum = String(idx + 1).padStart(4, '0');
  const words = item.en.trim().split(/\s+/);
  return {
    id: `C3-p-${pIdNum}`,
    level: 'C3',
    title: item.title,
    en: item.en,
    vi: item.vi,
    wordCount: words.length,
    questions: item.questions,
    glossary: item.glossary,
    source: 'seed'
  };
});

fs.writeFileSync(path.join(DATA_DIR, 'C3.passages.json'), JSON.stringify(applyContentReviewV4('C3.passages.json', c3Passages), null, 2), 'utf-8');
console.log(`✅ Generated C3.passages.json with ${c3Passages.length} passages (target ≥ 40).`);

// =========================================================================
// 3. TẠO 200 CÂU VIẾT LẠI C3 (C3.rewrites.json)
// =========================================================================
// 6 types: affirm-neg (35), neg-affirm (35), statement-question (35), contraction (35), synonym (30), word-order (30)
const rewrites = [];
let currentRewriteId = 1;

function addRewrite(type, promptEn, answer, alt, vi, promptVi, hint) {
  const rIdNum = String(currentRewriteId++).padStart(4, '0');
  rewrites.push({
    id: `C3-r-${rIdNum}`,
    level: 'C3',
    type,
    promptEn,
    promptVi,
    answer,
    alt: alt || [],
    vi,
    hint: hint || promptVi,
    source: 'seed'
  });
}

// -------------------------------------------------------------------------
// 1. affirm-neg (35 câu: Khẳng định -> Phủ định)
// -------------------------------------------------------------------------
const affirmNegData = [
  ['She is a doctor.', "She isn't a doctor.", ['She is not a doctor.'], 'Cô ấy là bác sĩ. → phủ định', 'Chuyển sang câu phủ định (thêm not).'],
  ['They are students.', "They aren't students.", ['They are not students.'], 'Họ là học sinh. → phủ định', 'Chuyển sang câu phủ định với are not.'],
  ['He was at home yesterday.', "He wasn't at home yesterday.", ['He was not at home yesterday.'], 'Hôm qua cậu ấy ở nhà. → phủ định', 'Chuyển sang câu phủ định quá khứ với was not.'],
  ['We were tired after school.', "We weren't tired after school.", ['We were not tired after school.'], 'Chúng tôi đã mệt sau giờ học. → phủ định', 'Chuyển sang câu phủ định với were not.'],
  ['I like sweet oranges.', "I don't like sweet oranges.", ['I do not like sweet oranges.'], 'Tôi thích những quả cam ngọt. → phủ định', 'Chuyển sang câu phủ định hiện tại đơn với do not.'],
  ['She plays badminton well.', "She doesn't play badminton well.", ['She does not play badminton well.'], 'Cô ấy chơi cầu lông giỏi. → phủ định', 'Dùng trợ động từ does not / doesn\'t và đưa động từ về nguyên mẫu.'],
  ['He speaks English fluently.', "He doesn't speak English fluently.", ['He does not speak English fluently.'], 'Cậu ấy nói tiếng Anh lưu loát. → phủ định', 'Dùng doesn\'t và động từ speak.'],
  ['They live in a big city.', "They don't live in a big city.", ['They do not live in a big city.'], 'Họ sống ở thành phố lớn. → phủ định', 'Dùng don\'t live.'],
  ['My brother watched TV last night.', "My brother didn't watch TV last night.", ['My brother did not watch TV last night.'], 'Tối qua em trai tôi đã xem TV. → phủ định', 'Dùng didn\'t watch cho quá khứ đơn.'],
  ['Lan visited her grandparents on Sunday.', "Lan didn't visit her grandparents on Sunday.", ['Lan did not visit her grandparents on Sunday.'], 'Chủ nhật Lan đã thăm ông bà. → phủ định', 'Dùng didn\'t visit.'],
  ['They bought a new bicycle.', "They didn't buy a new bicycle.", ['They did not buy a new bicycle.'], 'Họ đã mua một chiếc xe đạp mới. → phủ định', 'Dùng didn\'t buy.'],
  ['He went to the zoo yesterday.', "He didn't go to the zoo yesterday.", ['He did not go to the zoo yesterday.'], 'Hôm qua cậu ấy đã đi sở thú. → phủ định', 'Dùng didn\'t go.'],
  ['I will travel to Da Nang tomorrow.', "I won't travel to Da Nang tomorrow.", ['I will not travel to Da Nang tomorrow.'], 'Ngày mai tôi sẽ đi du lịch Đà Nẵng. → phủ định', 'Chuyển will thành won\'t hoặc will not.'],
  ['She will join our art club.', "She won't join our art club.", ['She will not join our art club.'], 'Cô ấy sẽ tham gia câu lạc bộ mỹ thuật của chúng tôi. → phủ định', 'Dùng won\'t join.'],
  ['It will rain this afternoon.', "It won't rain this afternoon.", ['It will not rain this afternoon.'], 'Chiều nay trời sẽ mưa. → phủ định', 'Dùng won\'t rain.'],
  ['He can swim across the river.', "He can't swim across the river.", ['He cannot swim across the river.'], 'Cậu ấy có thể bơi qua sông. → phủ định', 'Chuyển can thành can\'t hoặc cannot.'],
  ['Children can run fast.', "Children can't run fast.", ['Children cannot run fast.'], 'Lũ trẻ có thể chạy nhanh. → phủ định', 'Dùng can\'t run.'],
  ['She is reading a book now.', "She isn't reading a book now.", ['She is not reading a book now.'], 'Bây giờ cô ấy đang đọc sách. → phủ định', 'Thêm not sau is.'],
  ['They are playing soccer in the yard.', "They aren't playing soccer in the yard.", ['They are not playing soccer in the yard.'], 'Họ đang chơi bóng đá trong sân. → phủ định', 'Thêm not sau are.'],
  ['I am listening to music.', "I'm not listening to music.", ['I am not listening to music.'], 'Tôi đang nghe nhạc. → phủ định', 'Dùng I am not hoặc I\'m not.'],
  ['The film was very boring.', "The film wasn't very boring.", ['The film was not very boring.'], 'Bộ phim đã rất tẻ nhạt. → phủ định', 'Dùng wasn\'t.'],
  ['The shops were open yesterday.', "The shops weren't open yesterday.", ['The shops were not open yesterday.'], 'Hôm qua các cửa hàng đã mở cửa. → phủ định', 'Dùng weren\'t open.'],
  ['My cat catches mice well.', "My cat doesn't catch mice well.", ['My cat does not catch mice well.'], 'Con mèo của tôi bắt chuột giỏi. → phủ định', 'Dùng doesn\'t catch.'],
  ['Peter has a pet dog.', "Peter doesn't have a pet dog.", ['Peter does not have a pet dog.'], 'Peter có một chú chó cưng. → phủ định', 'Dùng doesn\'t have.'],
  ['They have breakfast at seven.', "They don't have breakfast at seven.", ['They do not have breakfast at seven.'], 'Họ ăn sáng lúc 7 giờ. → phủ định', 'Dùng don\'t have.'],
  ['She wrote a letter to her friend.', "She didn't write a letter to her friend.", ['She did not write a letter to her friend.'], 'Cô ấy đã viết một lá thư cho bạn. → phủ định', 'Dùng didn\'t write.'],
  ['He ate all the cookies.', "He didn't eat all the cookies.", ['He did not eat all the cookies.'], 'Cậu ấy đã ăn hết bánh quy. → phủ định', 'Dùng didn\'t eat.'],
  ['We will have a test next week.', "We won't have a test next week.", ['We will not have a test next week.'], 'Tuần sau chúng tôi sẽ có bài kiểm tra. → phủ định', 'Dùng won\'t have.'],
  ['She is going to visit Hanoi.', "She isn't going to visit Hanoi.", ['She is not going to visit Hanoi.'], 'Cô ấy dự định sẽ đi thăm Hà Nội. → phủ định', 'Thêm not sau is.'],
  ['They are going to play tennis.', "They aren't going to play tennis.", ['They are not going to play tennis.'], 'Họ dự định sẽ chơi quần vợt. → phủ định', 'Thêm not sau are.'],
  ['The dog is barking loudly.', "The dog isn't barking loudly.", ['The dog is not barking loudly.'], 'Chú chó đang sủa ầm ĩ. → phủ định', 'Dùng isn\'t barking.'],
  ['My father drives to work.', "My father doesn't drive to work.", ['My father does not drive to work.'], 'Bố tôi lái xe đi làm. → phủ định', 'Dùng doesn\'t drive.'],
  ['The sun shines brightly today.', "The sun doesn't shine brightly today.", ['The sun does not shine brightly today.'], 'Hôm nay mặt trời chiếu sáng rực rỡ. → phủ định', 'Dùng doesn\'t shine.'],
  ['We drank cold milk this morning.', "We didn't drink cold milk this morning.", ['We did not drink cold milk this morning.'], 'Sáng nay chúng tôi đã uống sữa lạnh. → phủ định', 'Dùng didn\'t drink.'],
  ['Nam will come to my party.', "Nam won't come to my party.", ['Nam will not come to my party.'], 'Nam sẽ đến bữa tiệc của tôi. → phủ định', 'Dùng won\'t come.']
];

affirmNegData.forEach(([pEn, ans, alt, vi, pVi]) => {
  addRewrite('affirm-neg', pEn, ans, alt, vi, pVi, 'Thêm trợ động từ và not để biến thành câu phủ định.');
});

// -------------------------------------------------------------------------
// 2. neg-affirm (35 câu: Phủ định -> Khẳng định)
// -------------------------------------------------------------------------
const negAffirmData = [
  ["She isn't a nurse.", "She is a nurse.", [], 'Cô ấy không phải là y tá. → khẳng định', 'Chuyển sang câu khẳng định (bỏ not).'],
  ["They aren't teachers.", "They are teachers.", [], 'Họ không phải là giáo viên. → khẳng định', 'Bỏ aren\'t đổi thành are.'],
  ["He wasn't at school.", "He was at school.", [], 'Cậu ấy đã không ở trường. → khẳng định', 'Bỏ wasn\'t đổi thành was.'],
  ["We weren't late for class.", "We were late for class.", [], 'Chúng tôi đã không đến lớp muộn. → khẳng định', 'Đổi weren\'t thành were.'],
  ["I don't play football.", "I play football.", [], 'Tôi không chơi bóng đá. → khẳng định', 'Bỏ don\'t và giữ nguyên động từ play.'],
  ["She doesn't like milk.", "She likes milk.", [], 'Cô ấy không thích sữa. → khẳng định', 'Bỏ doesn\'t và chia động từ ngôi thứ 3 số ít: likes.'],
  ["He doesn't speak French.", "He speaks French.", [], 'Cậu ấy không nói tiếng Pháp. → khẳng định', 'Đổi thành he speaks.'],
  ["They don't live in a village.", "They live in a village.", [], 'Họ không sống trong một ngôi làng. → khẳng định', 'Bỏ don\'t.'],
  ["Minh didn't watch the game.", "Minh watched the game.", [], 'Minh đã không xem trận đấu. → khẳng định', 'Bỏ didn\'t và chia động từ ở quá khứ: watched.'],
  ["She didn't visit the museum.", "She visited the museum.", [], 'Cô ấy đã không thăm viện bảo tàng. → khẳng định', 'Chia động từ quá khứ visited.'],
  ["They didn't buy that car.", "They bought that car.", [], 'Họ đã không mua chiếc xe ô tô đó. → khẳng định', 'Chia động từ bất quy tắc bought.'],
  ["He didn't go to Hanoi.", "He went to Hanoi.", [], 'Cậu ấy đã không đi Hà Nội. → khẳng định', 'Chia động từ quá khứ went.'],
  ["We won't stay at home.", "We will stay at home.", [], 'Chúng tôi sẽ không ở nhà. → khẳng định', 'Đổi won\'t thành will.'],
  ["She won't miss the bus.", "She will miss the bus.", [], 'Cô ấy sẽ không bị lỡ xe buýt. → khẳng định', 'Đổi won\'t thành will.'],
  ["They won't join the race.", "They will join the race.", [], 'Họ sẽ không tham gia cuộc đua. → khẳng định', 'Đổi won\'t thành will.'],
  ["He can't sing well.", "He can sing well.", [], 'Cậu ấy không thể hát hay. → khẳng định', 'Đổi can\'t thành can.'],
  ["The baby isn't crying.", "The baby is crying.", [], 'Em bé không đang khóc. → khẳng định', 'Đổi isn\'t thành is.'],
  ["They aren't swimming in the lake.", "They are swimming in the lake.", [], 'Họ không đang bơi ở hồ. → khẳng định', 'Đổi aren\'t thành are.'],
  ["I'm not doing my homework.", "I am doing my homework.", [], 'Tôi không đang làm bài tập về nhà. → khẳng định', 'Đổi I\'m not thành I am.'],
  ["The dog doesn't bark at night.", "The dog barks at night.", [], 'Con chó không sủa vào ban đêm. → khẳng định', 'Chia động từ barks.'],
  ["My sister doesn't have a doll.", "My sister has a doll.", [], 'Em gái tôi không có búp bê. → khẳng định', 'Đổi doesn\'t have thành has.'],
  ["They didn't have dinner early.", "They had dinner early.", [], 'Họ đã không ăn tối sớm. → khẳng định', 'Đổi didn\'t have thành had.'],
  ["He didn't write his diary.", "He wrote his diary.", [], 'Cậu ấy đã không viết nhật ký. → khẳng định', 'Đổi didn\'t write thành wrote.'],
  ["We didn't see any birds.", "We saw some birds.", [], 'Chúng tôi đã không nhìn thấy con chim nào. → khẳng định', 'Đổi didn\'t see thành saw, any thành some.'],
  ["She isn't cooking dinner.", "She is cooking dinner.", [], 'Cô ấy không đang nấu bữa tối. → khẳng định', 'Đổi isn\'t thành is.'],
  ["They aren't going to the park.", "They are going to the park.", [], 'Họ không đang đi đến công viên. → khẳng định', 'Đổi aren\'t thành are.'],
  ["The lesson isn't difficult.", "The lesson is difficult.", [], 'Bài học không khó. → khẳng định', 'Đổi isn\'t thành is.'],
  ["The birds weren't singing.", "The birds were singing.", [], 'Những chú chim đã không hót. → khẳng định', 'Đổi weren\'t thành were.'],
  ["He didn't drink the juice.", "He drank the juice.", [], 'Cậu ấy đã không uống nước ép. → khẳng định', 'Đổi didn\'t drink thành drank.'],
  ["She didn't find her shoes.", "She found her shoes.", [], 'Cô ấy đã không tìm thấy giày của mình. → khẳng định', 'Đổi didn\'t find thành found.'],
  ["I won't forget your birthday.", "I will forget your birthday.", [], 'Tôi sẽ không quên sinh nhật bạn. → khẳng định', 'Đổi won\'t thành will.'],
  ["They won't leave tomorrow.", "They will leave tomorrow.", [], 'Họ sẽ không rời đi vào ngày mai. → khẳng định', 'Đổi won\'t thành will.'],
  ["The boy wasn't lazy.", "The boy was lazy.", [], 'Cậu bé đã không lười biếng. → khẳng định', 'Đổi wasn\'t thành was.'],
  ["We don't eat meat on Friday.", "We eat meat on Friday.", [], 'Chúng tôi không ăn thịt vào thứ Sáu. → khẳng định', 'Bỏ don\'t.'],
  ["He doesn't run fast.", "He runs fast.", [], 'Cậu ấy không chạy nhanh. → khẳng định', 'Đổi doesn\'t run thành runs.']
];

negAffirmData.forEach(([pEn, ans, alt, vi, pVi]) => {
  addRewrite('neg-affirm', pEn, ans, alt, vi, pVi, 'Bỏ từ phủ định và chia lại động từ phù hợp.');
});

// -------------------------------------------------------------------------
// 3. statement-question (35 câu: Trần thuật -> Câu hỏi Yes/No)
// -------------------------------------------------------------------------
const stmtQuestionData = [
  ['She is your sister.', 'Is she your sister?', [], 'Cô ấy là chị của bạn. → câu hỏi', 'Đảo động từ to be lên đầu câu.'],
  ['They are friendly teachers.', 'Are they friendly teachers?', [], 'Họ là những giáo viên thân thiện. → câu hỏi', 'Đảo are lên đầu câu.'],
  ['He was at the library yesterday.', 'Was he at the library yesterday?', [], 'Hôm qua cậu ấy ở thư viện. → câu hỏi', 'Đảo was lên đầu câu.'],
  ['They were happy with the prize.', 'Were they happy with the prize?', [], 'Họ đã rất vui với giải thưởng. → câu hỏi', 'Đảo were lên đầu câu.'],
  ['You like fresh fruit.', 'Do you like fresh fruit?', [], 'Bạn thích trái cây tươi. → câu hỏi', 'Mượn trợ động từ Do đặt ở đầu câu.'],
  ['They live near the sea.', 'Do they live near the sea?', [], 'Họ sống ở gần biển. → câu hỏi', 'Dùng Do đặt trước chủ ngữ They.'],
  ['She plays the violin.', 'Does she play the violin?', [], 'Cô ấy chơi đàn vĩ cầm. → câu hỏi', 'Mượn trợ động từ Does và đưa play về nguyên mẫu.'],
  ['He speaks English well.', 'Does he speak English well?', [], 'Cậu ấy nói tiếng Anh giỏi. → câu hỏi', 'Dùng Does he speak...?'],
  ['Minh watched the movie.', 'Did Minh watch the movie?', [], 'Minh đã xem bộ phim. → câu hỏi', 'Mượn trợ động từ Did cho thì quá khứ đơn.'],
  ['They visited Hue last summer.', 'Did they visit Hue last summer?', [], 'Mùa hè năm ngoái họ đã thăm Huế. → câu hỏi', 'Dùng Did they visit...?'],
  ['She bought a new storybook.', 'Did she buy a new storybook?', [], 'Cô ấy đã mua một cuốn truyện mới. → câu hỏi', 'Dùng Did she buy...?'],
  ['He went to school by bus.', 'Did he go to school by bus?', [], 'Cậu ấy đã đi học bằng xe buýt. → câu hỏi', 'Dùng Did he go...?'],
  ['They will arrive at six.', 'Will they arrive at six?', [], 'Họ sẽ đến lúc sáu giờ. → câu hỏi', 'Đảo trợ động từ Will lên đầu câu.'],
  ['She will join our game.', 'Will she join our game?', [], 'Cô ấy sẽ tham gia trò chơi của chúng tôi. → câu hỏi', 'Dùng Will she join...?'],
  ['It will be sunny tomorrow.', 'Will it be sunny tomorrow?', [], 'Ngày mai trời sẽ nắng. → câu hỏi', 'Dùng Will it be sunny tomorrow?'],
  ['You can swim across the pool.', 'Can you swim across the pool?', [], 'Bạn có thể bơi qua hồ bơi. → câu hỏi', 'Đảo modal verb Can lên đầu câu.'],
  ['She is doing her homework now.', 'Is she doing her homework now?', [], 'Bây giờ cô ấy đang làm bài tập. → câu hỏi', 'Đảo Is lên đầu câu hiện tại tiếp diễn.'],
  ['They are playing soccer in the park.', 'Are they playing soccer in the park?', [], 'Họ đang chơi bóng đá trong công viên. → câu hỏi', 'Đảo Are lên đầu câu.'],
  ['The dog is sleeping under the bed.', 'Is the dog sleeping under the bed?', [], 'Con chó đang ngủ dưới gầm giường. → câu hỏi', 'Đảo Is lên đầu câu.'],
  ['He has a blue backpack.', 'Does he have a blue backpack?', [], 'Cậu ấy có một chiếc ba lô màu xanh. → câu hỏi', 'Dùng Does he have...?'],
  ['They have two cats.', 'Do they have two cats?', [], 'Họ có hai con mèo. → câu hỏi', 'Dùng Do they have...?'],
  ['She ate breakfast at home.', 'Did she eat breakfast at home?', [], 'Cô ấy đã ăn sáng ở nhà. → câu hỏi', 'Dùng Did she eat...?'],
  ['The train stopped at the station.', 'Did the train stop at the station?', [], 'Đoàn tàu đã dừng lại ở ga. → câu hỏi', 'Dùng Did the train stop...?'],
  ['You drank cold water.', 'Did you drink cold water?', [], 'Bạn đã uống nước lạnh. → câu hỏi', 'Dùng Did you drink...?'],
  ['Mother is cooking in the kitchen.', 'Is mother cooking in the kitchen?', [], 'Mẹ đang nấu ăn trong bếp. → câu hỏi', 'Đảo Is lên đầu câu.'],
  ['The children are singing happily.', 'Are the children singing happily?', [], 'Lũ trẻ đang hát ca vui vẻ. → câu hỏi', 'Đảo Are lên đầu câu.'],
  ['Peter comes from England.', 'Does Peter come from England?', [], 'Peter đến từ nước Anh. → câu hỏi', 'Dùng Does Peter come...?'],
  ['They work in a hospital.', 'Do they work in a hospital?', [], 'Họ làm việc trong bệnh viện. → câu hỏi', 'Dùng Do they work...?'],
  ['We will win the championship.', 'Will we win the championship?', [], 'Chúng ta sẽ giành chức vô địch. → câu hỏi', 'Đảo Will lên đầu câu.'],
  ['She can play acoustic guitar.', 'Can she play acoustic guitar?', [], 'Cô ấy có thể chơi đàn ghi-ta mộc. → câu hỏi', 'Đảo Can lên đầu câu.'],
  ['The room was cold yesterday.', 'Was the room cold yesterday?', [], 'Hôm qua căn phòng đã lạnh. → câu hỏi', 'Đảo Was lên đầu câu.'],
  ['The flowers are very pretty.', 'Are the flowers very pretty?', [], 'Những bông hoa rất đẹp. → câu hỏi', 'Đảo Are lên đầu câu.'],
  ['You saw a rainbow.', 'Did you see a rainbow?', [], 'Bạn đã nhìn thấy cầu vồng. → câu hỏi', 'Dùng Did you see...?'],
  ['He wrote a postcard.', 'Did he write a postcard?', [], 'Cậu ấy đã viết một tấm bưu thiếp. → câu hỏi', 'Dùng Did he write...?'],
  ['The dog barked loudly.', 'Did the dog bark loudly?', [], 'Con chó đã sủa ầm ĩ. → câu hỏi', 'Dùng Did the dog bark...?']
];

stmtQuestionData.forEach(([pEn, ans, alt, vi, pVi]) => {
  addRewrite('statement-question', pEn, ans, alt, vi, pVi, 'Chuyển sang câu hỏi Yes/No với to be, trợ động từ do/does/did hoặc will/can.');
});

// -------------------------------------------------------------------------
// 4. contraction (35 câu: Dạng đầy đủ <-> Rút gọn)
// -------------------------------------------------------------------------
const contractionData = [
  ['She is not a doctor.', "She isn't a doctor.", [], 'Rút gọn "is not"', 'Viết dạng rút gọn của is not thành isn\'t.'],
  ['They are not students.', "They aren't students.", [], 'Rút gọn "are not"', 'Viết dạng rút gọn của are not thành aren\'t.'],
  ['He was not at home.', "He wasn't at home.", [], 'Rút gọn "was not"', 'Viết dạng rút gọn của was not thành wasn\'t.'],
  ['We were not late.', "We weren't late.", [], 'Rút gọn "were not"', 'Viết dạng rút gọn của were not thành weren\'t.'],
  ['I do not like coffee.', "I don't like coffee.", [], 'Rút gọn "do not"', 'Viết dạng rút gọn của do not thành don\'t.'],
  ['She does not eat meat.', "She doesn't eat meat.", [], 'Rút gọn "does not"', 'Viết dạng rút gọn của does not thành doesn\'t.'],
  ['He did not go out.', "He didn't go out.", [], 'Rút gọn "did not"', 'Viết dạng rút gọn của did not thành didn\'t.'],
  ['They will not come today.', "They won't come today.", [], 'Rút gọn "will not"', 'Viết dạng rút gọn đặc biệt của will not thành won\'t.'],
  ['I am not tired.', "I'm not tired.", [], 'Rút gọn "I am"', 'Viết dạng rút gọn của I am thành I\'m.'],
  ['He is reading a book.', "He's reading a book.", [], 'Rút gọn "He is"', 'Viết dạng rút gọn của He is thành He\'s.'],
  ['She is my best friend.', "She's my best friend.", [], 'Rút gọn "She is"', 'Viết dạng rút gọn của She is thành She\'s.'],
  ['It is a sunny day.', "It's a sunny day.", [], 'Rút gọn "It is"', 'Viết dạng rút gọn của It is thành It\'s.'],
  ['They are in the garden.', "They're in the garden.", [], 'Rút gọn "They are"', 'Viết dạng rút gọn của They are thành They\'re.'],
  ['We are ready for school.', "We're ready for school.", [], 'Rút gọn "We are"', 'Viết dạng rút gọn của We are thành We\'re.'],
  ['You are a kind boy.', "You're a kind boy.", [], 'Rút gọn "You are"', 'Viết dạng rút gọn của You are thành You\'re.'],
  ['I will help you.', "I'll help you.", [], 'Rút gọn "I will"', 'Viết dạng rút gọn của I will thành I\'ll.'],
  ['She will visit us.', "She'll visit us.", [], 'Rút gọn "She will"', 'Viết dạng rút gọn của She will thành She\'ll.'],
  ['They will arrive soon.', "They'll arrive soon.", [], 'Rút gọn "They will"', 'Viết dạng rút gọn của They will thành They\'ll.'],
  ["She isn't ready.", 'She is not ready.', [], 'Mở rộng "isn\'t"', 'Viết đầy đủ dạng isn\'t thành is not.'],
  ["They aren't tired.", 'They are not tired.', [], 'Mở rộng "aren\'t"', 'Viết đầy đủ dạng aren\'t thành are not.'],
  ["He wasn't late.", 'He was not late.', [], 'Mở rộng "wasn\'t"', 'Viết đầy đủ dạng wasn\'t thành was not.'],
  ["We weren't cold.", 'We were not cold.', [], 'Mở rộng "weren\'t"', 'Viết đầy đủ dạng weren\'t thành were not.'],
  ["I don't know.", 'I do not know.', [], 'Mở rộng "don\'t"', 'Viết đầy đủ dạng don\'t thành do not.'],
  ["He doesn't care.", 'He does not care.', [], 'Mở rộng "doesn\'t"', 'Viết đầy đủ dạng doesn\'t thành does not.'],
  ["She didn't run.", 'She did not run.', [], 'Mở rộng "didn\'t"', 'Viết đầy đủ dạng didn\'t thành did not.'],
  ["We won't fail.", 'We will not fail.', [], 'Mở rộng "won\'t"', 'Viết đầy đủ dạng won\'t thành will not.'],
  ["I'm ready now.", 'I am ready now.', [], 'Mở rộng "I\'m"', 'Viết đầy đủ dạng I\'m thành I am.'],
  ["He's very tall.", 'He is very tall.', [], 'Mở rộng "He\'s"', 'Viết đầy đủ dạng He\'s thành He is.'],
  ["She's so kind.", 'She is so kind.', [], 'Mở rộng "She\'s"', 'Viết đầy đủ dạng She\'s thành She is.'],
  ["It's very cold.", 'It is very cold.', [], 'Mở rộng "It\'s"', 'Viết đầy đủ dạng It\'s thành It is.'],
  ["They're in class.", 'They are in class.', [], 'Mở rộng "They\'re"', 'Viết đầy đủ dạng They\'re thành They are.'],
  ["We're happy today.", 'We are happy today.', [], 'Mở rộng "We\'re"', 'Viết đầy đủ dạng We\'re thành We are.'],
  ["You're my friend.", 'You are my friend.', [], 'Mở rộng "You\'re"', 'Viết đầy đủ dạng You\'re thành You are.'],
  ["I'll be there.", 'I will be there.', [], 'Mở rộng "I\'ll"', 'Viết đầy đủ dạng I\'ll thành I will.'],
  ["She'll call you.", 'She will call you.', [], 'Mở rộng "She\'ll"', 'Viết đầy đủ dạng She\'ll thành She will.']
];

contractionData.forEach(([pEn, ans, alt, vi, pVi]) => {
  addRewrite('contraction', pEn, ans, alt, vi, pVi, 'Chuyển đổi giữa dạng đầy đủ và dạng rút gọn theo chỉ dẫn.');
});

// -------------------------------------------------------------------------
// 5. synonym (30 câu: Viết lại câu đồng nghĩa)
// -------------------------------------------------------------------------
const synonymData = [
  ['The film is very good.', 'The film is great.', [], 'Bộ phim rất hay. → đồng nghĩa', 'Thay "very good" bằng "great".'],
  ['The test is very easy.', 'The test is simple.', [], 'Bài kiểm tra rất dễ. → đồng nghĩa', 'Thay "very easy" bằng "simple".'],
  ['His house is very big.', 'His house is huge.', [], 'Nhà của cậu ấy rất to. → đồng nghĩa', 'Thay "very big" bằng "huge".'],
  ['The small kitten is cute.', 'The little kitten is cute.', [], 'Chú mèo con nhỏ rất đáng yêu. → đồng nghĩa', 'Thay "small" bằng "little".'],
  ['The children are happy.', 'The children are joyful.', [], 'Lũ trẻ rất vui sướng. → đồng nghĩa', 'Thay "happy" bằng "joyful".'],
  ['She speaks very fast.', 'She speaks very quickly.', [], 'Cô ấy nói rất nhanh. → đồng nghĩa', 'Thay "fast" bằng "quickly".'],
  ['The weather is pleasant.', 'The weather is nice.', [], 'Thời tiết thật dễ chịu. → đồng nghĩa', 'Thay "pleasant" bằng "nice".'],
  ['He has a large dog.', 'He has a big dog.', [], 'Cậu ấy có một chú chó lớn. → đồng nghĩa', 'Thay "large" bằng "big".'],
  ['The village is quiet.', 'The village is peaceful.', [], 'Ngôi làng rất yên tĩnh. → đồng nghĩa', 'Thay "quiet" bằng "peaceful".'],
  ['This book is interesting.', 'This book is fascinating.', [], 'Cuốn sách này rất thú vị. → đồng nghĩa', 'Thay "interesting" bằng "fascinating".'],
  ['The room is tidy.', 'The room is clean.', [], 'Căn phòng rất ngăn nắp. → đồng nghĩa', 'Thay "tidy" bằng "clean".'],
  ['Her dress is pretty.', 'Her dress is beautiful.', [], 'Chiếc váy của cô ấy rất xinh. → đồng nghĩa', 'Thay "pretty" bằng "beautiful".'],
  ['He is a clever student.', 'He is a smart student.', [], 'Cậu ấy là học sinh thông minh. → đồng nghĩa', 'Thay "clever" bằng "smart".'],
  ['My father is very strong.', 'My father is powerful.', [], 'Bố tôi rất khỏe mạnh. → đồng nghĩa', 'Thay "very strong" bằng "powerful".'],
  ['They arrived at six.', 'They reached at six.', [], 'Họ đã đến nơi lúc 6 giờ. → đồng nghĩa', 'Thay "arrived" bằng "reached".'],
  ['Please begin the exam.', 'Please start the exam.', [], 'Xin hãy bắt đầu bài kiểm tra. → đồng nghĩa', 'Thay "begin" bằng "start".'],
  ['We finished the project.', 'We completed the project.', [], 'Chúng tôi đã hoàn thành dự án. → đồng nghĩa', 'Thay "finished" bằng "completed".'],
  ['The cake tastes delicious.', 'The cake tastes yummy.', [], 'Chiếc bánh có vị rất ngon. → đồng nghĩa', 'Thay "delicious" bằng "yummy".'],
  ['The boy is very tired.', 'The boy is exhausted.', [], 'Cậu bé rất mệt mỏi. → đồng nghĩa', 'Thay "very tired" bằng "exhausted".'],
  ['She loves playing piano.', 'She likes playing piano.', [], 'Cô ấy thích chơi đàn piano. → đồng nghĩa', 'Thay "loves" bằng "likes".'],
  ['The soup is very hot.', 'The soup is boiling.', [], 'Bát súp đang rất nóng. → đồng nghĩa', 'Thay "very hot" bằng "boiling".'],
  ['He replied to my letter.', 'He answered my letter.', [], 'Cậu ấy đã trả lời thư tôi. → đồng nghĩa', 'Thay "replied to" bằng "answered".'],
  ['She helps her mother.', 'She assists her mother.', [], 'Cô ấy giúp đỡ mẹ mình. → đồng nghĩa', 'Thay "helps" bằng "assists".'],
  ['The story is funny.', 'The story is humorous.', [], 'Câu chuyện rất hài hước. → đồng nghĩa', 'Thay "funny" bằng "humorous".'],
  ['The task is difficult.', 'The task is hard.', [], 'Nhiệm vụ này khó khăn. → đồng nghĩa', 'Thay "difficult" bằng "hard".'],
  ['The road is broad.', 'The road is wide.', [], 'Con đường rất rộng rãi. → đồng nghĩa', 'Thay "broad" bằng "wide".'],
  ['He looked at the painting.', 'He viewed the painting.', [], 'Cậu ấy đã ngắm bức tranh. → đồng nghĩa', 'Thay "looked at" bằng "viewed".'],
  ['The view is wonderful.', 'The view is marvelous.', [], 'Quang cảnh thật tuyệt vời. → đồng nghĩa', 'Thay "wonderful" bằng "marvelous".'],
  ['I want to purchase a book.', 'I want to buy a book.', [], 'Tôi muốn mua một cuốn sách. → đồng nghĩa', 'Thay "purchase" bằng "buy".'],
  ['They reside in Hanoi.', 'They live in Hanoi.', [], 'Họ cư ngụ tại Hà Nội. → đồng nghĩa', 'Thay "reside in" bằng "live in".']
];

synonymData.forEach(([pEn, ans, alt, vi, pVi]) => {
  addRewrite('synonym', pEn, ans, alt, vi, pVi, 'Thay thế từ hoặc cụm từ được chỉ định bằng từ đồng nghĩa tương đương.');
});

// -------------------------------------------------------------------------
// 6. word-order (30 câu: Đổi vị trí trạng từ/trạng ngữ mà giữ nguyên nghĩa)
// -------------------------------------------------------------------------
const wordOrderData = [
  ['She woke up early yesterday.', 'Yesterday she woke up early.', [], 'Hôm qua cô ấy thức dậy sớm. → đổi vị trí trạng từ', 'Đưa trạng từ chỉ thời gian "Yesterday" lên đầu câu.'],
  ['I have English lessons on Monday.', 'On Monday I have English lessons.', [], 'Tôi có tiết học tiếng Anh vào thứ Hai. → đổi vị trí trạng từ', 'Đưa cụm trạng từ "On Monday" lên đầu câu.'],
  ['We play soccer in the afternoon.', 'In the afternoon we play soccer.', [], 'Chúng tôi chơi bóng đá vào buổi chiều. → đổi vị trí trạng từ', 'Đưa "In the afternoon" lên đầu câu.'],
  ['He went to the zoo last Sunday.', 'Last Sunday he went to the zoo.', [], 'Chủ nhật tuần trước cậu ấy đi sở thú. → đổi vị trí trạng từ', 'Đưa "Last Sunday" lên đầu câu.'],
  ['They visit their grandparents every week.', 'Every week they visit their grandparents.', [], 'Mỗi tuần họ đều thăm ông bà. → đổi vị trí trạng từ', 'Đưa "Every week" lên đầu câu.'],
  ['She reads books in the evening.', 'In the evening she reads books.', [], 'Cô ấy đọc sách vào buổi tối. → đổi vị trí trạng từ', 'Đưa "In the evening" lên đầu câu.'],
  ['We will travel to Da Nang tomorrow.', 'Tomorrow we will travel to Da Nang.', [], 'Ngày mai chúng tôi sẽ đi du lịch Đà Nẵng. → đổi vị trí trạng từ', 'Đưa "Tomorrow" lên đầu câu.'],
  ['They arrived at the airport early.', 'Early they arrived at the airport.', [], 'Họ đã đến sân bay sớm. → đổi vị trí trạng từ', 'Đưa "Early" lên đầu câu.'],
  ['Birds sing sweetly in the morning.', 'In the morning birds sing sweetly.', [], 'Chim hót líu lo vào buổi sáng. → đổi vị trí trạng từ', 'Đưa "In the morning" lên đầu câu.'],
  ['He sleeps for eight hours every night.', 'Every night he sleeps for eight hours.', [], 'Mỗi đêm cậu ấy ngủ 8 tiếng. → đổi vị trí trạng từ', 'Đưa "Every night" lên đầu câu.'],
  ['She practiced the piano diligently.', 'Diligently she practiced the piano.', [], 'Cô ấy đã chăm chỉ luyện đàn piano. → đổi vị trí trạng từ', 'Đưa trạng từ "Diligently" lên đầu câu.'],
  ['We finished our test on time.', 'On time we finished our test.', [], 'Chúng tôi đã hoàn thành bài kiểm tra đúng giờ. → đổi vị trí trạng từ', 'Đưa "On time" lên đầu câu.'],
  ['He ran fast in the race.', 'In the race he ran fast.', [], 'Trong cuộc đua cậu ấy chạy rất nhanh. → đổi vị trí trạng từ', 'Đưa cụm "In the race" lên đầu câu.'],
  ['They walked through the forest quietly.', 'Quietly they walked through the forest.', [], 'Họ đi qua khu rừng một cách lặng lẽ. → đổi vị trí trạng từ', 'Đưa "Quietly" lên đầu câu.'],
  ['I will call my mother soon.', 'Soon I will call my mother.', [], 'Tôi sẽ sớm gọi điện cho mẹ. → đổi vị trí trạng từ', 'Đưa "Soon" lên đầu câu.'],
  ['She sings beautifully on stage.', 'On stage she sings beautifully.', [], 'Trên sân khấu cô ấy hát rất hay. → đổi vị trí trạng từ', 'Đưa "On stage" lên đầu câu.'],
  ['The children played in the park happily.', 'Happily the children played in the park.', [], 'Lũ trẻ chơi trong công viên một cách vui vẻ. → đổi vị trí trạng từ', 'Đưa "Happily" lên đầu câu.'],
  ['We eat dinner at seven.', 'At seven we eat dinner.', [], 'Chúng tôi ăn tối lúc 7 giờ. → đổi vị trí trạng từ', 'Đưa "At seven" lên đầu câu.'],
  ['My family travels in the summer.', 'In the summer my family travels.', [], 'Gia đình tôi đi du lịch vào mùa hè. → đổi vị trí trạng từ', 'Đưa "In the summer" lên đầu câu.'],
  ['He met his teacher at the station.', 'At the station he met his teacher.', [], 'Tại nhà ga cậu ấy đã gặp thầy giáo. → đổi vị trí trạng từ', 'Đưa "At the station" lên đầu câu.'],
  ['Yellow leaves fall in autumn.', 'In autumn yellow leaves fall.', [], 'Lá vàng rơi vào mùa thu. → đổi vị trí trạng từ', 'Đưa "In autumn" lên đầu câu.'],
  ['They cleaned the room yesterday.', 'Yesterday they cleaned the room.', [], 'Hôm qua họ đã dọn phòng. → đổi vị trí trạng từ', 'Đưa "Yesterday" lên đầu câu.'],
  ['We will start the meeting now.', 'Now we will start the meeting.', [], 'Bây giờ chúng ta sẽ bắt đầu cuộc họp. → đổi vị trí trạng từ', 'Đưa "Now" lên đầu câu.'],
  ['He bought a new bike last month.', 'Last month he bought a new bike.', [], 'Tháng trước cậu ấy đã mua một chiếc xe đạp mới. → đổi vị trí trạng từ', 'Đưa "Last month" lên đầu câu.'],
  ['She draws pictures in her room.', 'In her room she draws pictures.', [], 'Trong phòng của mình cô bé vẽ tranh. → đổi vị trí trạng từ', 'Đưa "In her room" lên đầu câu.'],
  ['We watched a comedy last night.', 'Last night we watched a comedy.', [], 'Tối qua chúng tôi đã xem một bộ phim hài. → đổi vị trí trạng từ', 'Đưa "Last night" lên đầu câu.'],
  ['Flowers bloom in spring.', 'In spring flowers bloom.', [], 'Hoa nở vào mùa xuân. → đổi vị trí trạng từ', 'Đưa "In spring" lên đầu câu.'],
  ['He solved the puzzle easily.', 'Easily he solved the puzzle.', [], 'Cậu ấy đã giải câu đố một cách dễ dàng. → đổi vị trí trạng từ', 'Đưa "Easily" lên đầu câu.'],
  ['They go to church on Sunday.', 'On Sunday they go to church.', [], 'Vào Chủ nhật họ đi lễ nhà thờ. → đổi vị trí trạng từ', 'Đưa "On Sunday" lên đầu câu.'],
  ['We celebrate Tet in spring.', 'In spring we celebrate Tet.', [], 'Vào mùa xuân chúng tôi đón Tết. → đổi vị trí trạng từ', 'Đưa "In spring" lên đầu câu.']
];

wordOrderData.forEach(([pEn, ans, alt, vi, pVi]) => {
  addRewrite('word-order', pEn, ans, alt, vi, pVi, 'Đổi vị trí trạng từ/trạng ngữ lên đầu câu mà vẫn giữ nguyên nghĩa.');
});

console.log(`Checking C3 rewrites count... Total rewrites: ${rewrites.length}`);
if (rewrites.length !== 200) {
  throw new Error(`Expected 200 rewrites, got ${rewrites.length}`);
}

fs.writeFileSync(path.join(DATA_DIR, 'C3.rewrites.json'), JSON.stringify(applyContentReviewV4('C3.rewrites.json', rewrites), null, 2), 'utf-8');
console.log(`✅ Generated C3.rewrites.json with ${rewrites.length} pairs (target ≥ 200).`);

// =========================================================================
// 4. TẠO C3.theory.json
// =========================================================================
const theory = {
  id: 'theory-C3',
  level: 'C3',
  topic: 'reading-rewrite',
  title: 'Kỹ năng Đọc hiểu & Viết lại câu (Reading Comprehension & Sentence Rewrite)',
  summary: 'Phát triển toàn diện kỹ năng đọc hiểu văn bản tiếng Anh tiểu học (60–90 từ) và thuần thục 6 phương pháp viết lại câu cốt lõi giúp diễn đạt linh hoạt mà không làm thay đổi ngữ nghĩa.',
  formulas: [
    {
      name: 'Chiến lược Đọc hiểu 3 Bước (Skimming - Scanning - Evidence Checking)',
      pattern: 'Bước 1: Đọc lướt nắm ý chính (Skim) -> Bước 2: Quét từ khóa trong câu hỏi (Scan) -> Bước 3: Đối chiếu chứng cứ trong bài (Verify)',
      examples: [
        'Xác định từ để hỏi (Who, Where, When, What, Why, How)',
        'Tìm câu chứa thông tin then chốt trong đoạn văn',
        'So sánh dữ kiện để trả lời MCQ, True/False hoặc Short Answer'
      ]
    },
    {
      name: '6 Dạng Viết lại câu Cốt lõi (Sentence Transformation)',
      pattern: '1. Khẳng định ↔ Phủ định | 2. Trần thuật ↔ Nghi vấn Yes/No | 3. Dạng Đầy đủ ↔ Rút gọn | 4. Viết lại Đồng nghĩa | 5. Đổi vị trí Trạng ngữ',
      examples: [
        'She is a doctor. ↔ She isn\'t a doctor.',
        'They play football. ↔ Do they play football?',
        'She will not come. ↔ She won\'t come.',
        'The film is very good. ↔ The film is great.',
        'She woke up early yesterday. ↔ Yesterday she woke up early.'
      ]
    }
  ],
  sections: [
    {
      id: 'sec-reading-skills',
      title: '1. Kỹ năng Đọc hiểu Đoạn văn (Reading Comprehension Skills)',
      content: 'Để làm tốt bài đọc hiểu tiếng Anh:\n- Luôn đọc lướt qua tiêu đề và toàn bài để hiểu chủ đề chính (gia đình, trường học, kỳ nghỉ, thiên nhiên).\n- Đọc kỹ câu hỏi và gạch chân các từ khóa quan trọng.\n- Với câu hỏi trắc nghiệm (MCQ): loại bỏ các phương án có thông tin sai lệch so với bài đọc.\n- Với câu hỏi Đúng/Sai (True/False): "True" khi toàn bộ thông tin hoàn toàn trùng khớp với bài đọc; "False" khi có chi tiết trái ngược.\n- Với câu hỏi trả lời ngắn (Short Answer): chỉ viết từ hoặc cụm từ được yêu cầu, chú ý chính tả.',
      exampleIds: ['C3-p-0001', 'C3-p-0002', 'C3-p-0003', 'C3-p-0004', 'C3-p-0005']
    },
    {
      id: 'sec-rewrite-techniques',
      title: '2. Phương pháp Viết lại câu (Sentence Transformation Techniques)',
      content: 'Viết lại câu là kỹ năng biến đổi cấu trúc ngữ pháp nhưng vẫn giữ nguyên nghĩa gốc:\n- Khẳng định sang Phủ định: thêm trợ động từ phù hợp (do/does/did/will/can) + not, hoặc thêm not sau to be. Nhớ đưa động từ chính về dạng nguyên mẫu.\n- Trần thuật sang Câu hỏi: đảo to be/modal verb lên đầu câu, hoặc mượn trợ động từ Do/Does/Did đặt trước chủ ngữ và thêm dấu hỏi chấm (?).\n- Rút gọn (Contraction): kết hợp đại từ và to be (I am -> I\'m, She is -> She\'s) hoặc trợ động từ với not (do not -> don\'t, did not -> didn\'t, will not -> won\'t).\n- Đồng nghĩa (Synonym): thay thế tính từ, động từ bằng từ có ý nghĩa tương đương (very good -> great, very big -> huge, simple -> easy).\n- Vị trí trạng từ (Word order): đưa trạng ngữ chỉ thời gian, nơi chốn hoặc thể cách lên đầu câu để nhấn mạnh.',
      exampleIds: ['C3-r-0001', 'C3-r-0036', 'C3-r-0071', 'C3-r-0106', 'C3-r-0141', 'C3-r-0171']
    }
  ],
  commonMistakes: [
    {
      wrong: 'She doesn\'t likes apples.',
      right: 'She doesn\'t like apples.',
      why: 'Khi đã dùng trợ động từ "doesn\'t", động từ chính phải trở về dạng nguyên mẫu "like", không thêm "s".'
    },
    {
      wrong: 'Did he watched TV yesterday?',
      right: 'Did he watch TV yesterday?',
      why: 'Trong câu hỏi quá khứ với "Did", động từ chính phải ở dạng nguyên mẫu "watch", không chia đuôi "-ed".'
    },
    {
      wrong: 'Yesterday, she wake up early.',
      right: 'Yesterday she woke up early. (hoặc: Yesterday, she woke up early.)',
      why: 'Dù đổi trạng từ "Yesterday" lên đầu câu, động từ chính vẫn phải chia đúng thì quá khứ đơn "woke".'
    },
    {
      wrong: 'Will you not come? -> You won\'t come?',
      right: 'Will you come? (câu hỏi Yes/No khẳng định)',
      why: 'Khi đổi câu trần thuật sang câu hỏi Yes/No, không tự ý biến câu thành phủ định trừ khi đề bài yêu cầu.'
    }
  ],
  tips: [
    'Khi đọc bài, chú ý các từ nối (First, Next, Then, Finally) để nắm rõ trình tự các sự việc.',
    'Nhớ cặp rút gọn đặc biệt: "will not" rút gọn thành "won\'t", không phải "willn\'t".',
    'Khi viết lại câu đồng nghĩa, luôn kiểm tra xem các từ xung quanh có cần thay đổi mạo từ a/an hay không (ví dụ: a good idea -> an excellent idea).',
    'Với câu hỏi Short Answer, trả lời đúng trọng tâm cụm từ được hỏi, không chép cả câu dài.'
  ]
};

fs.writeFileSync(path.join(DATA_DIR, 'C3.theory.json'), JSON.stringify(applyContentReviewV4('C3.theory.json', theory), null, 2), 'utf-8');
console.log('✅ Saved C3.theory.json');
