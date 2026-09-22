// Editorial corrections from fix-list 11. Run after schema normalization.
// Only the named fields are replaced; other sections and references survive.
const doubling = 'Khi thêm đuôi bắt đầu bằng nguyên âm, thường gấp đôi phụ âm cuối nếu trước nó là một chữ nguyên âm trong âm tiết được nhấn: stop → stopped/stopping. Không gấp đôi w, x, y: snow → snowing, fix → fixed, play → playing. Với từ nhiều âm tiết, xét trọng âm: prefer → preferred, begin → beginning, nhưng visit → visited, open → opening. Đây là quy tắc cơ bản; tra từ điển khi gặp ngoại lệ hoặc khác biệt Anh–Anh/Anh–Mỹ.';

export const theoryEdits = {
  A2: {
    formulas: { 0: {
      pattern: 'a / an + cụm danh từ đếm được số ít; chọn theo âm đầu của từ ngay sau mạo từ',
      example: 'an honest boy / a university teacher / a red apple',
    } },
    sections: {
      0: {
        body: 'A và an dùng với cụm danh từ đếm được số ít khi nói về một người/vật chưa xác định. Chọn theo âm đầu của từ ngay sau mạo từ: a trước âm phụ âm, an trước âm nguyên âm. Không chỉ nhìn chữ cái đầu hoặc danh từ ở cuối cụm.\nVí dụ: an honest boy (h không phát âm), a university teacher (âm đầu /j/), a red apple (từ ngay sau mạo từ là red). Các chữ a, e, i, o, u không tương ứng một-một với các âm nguyên âm.',
        table: { columns: ['Mạo từ','Âm đầu của từ ngay sau','Ví dụ'], rows: [
          ['a','Âm phụ âm','a cat, a university teacher, a red apple'],
          ['an','Âm nguyên âm','an apple, an honest boy, an old church'],
        ] },
        exampleIds: ['A2-s-0019','A2-s-0025','A2-s-0027'],
      },
      1: {
        body: 'Danh từ đếm được có dạng số nhiều khi nói về nhiều hơn một người/vật. Hầu hết thêm -s: book → books. Nhiều từ tận cùng bằng ch, sh, s, x, z thêm -es: watch → watches, box → boxes. Phụ âm + y thường đổi y thành -ies: baby → babies; nguyên âm + y thêm -s: toy → toys.\nVới đuôi -o, phải học theo từng từ: tomato → tomatoes, potato → potatoes, nhưng piano → pianos, photo → photos. Không áp dụng “phụ âm + o luôn thêm -es”.',
        table: { columns: ['Đuôi danh từ','Cách biến đổi','Ví dụ'], rows: [
          ['Thông thường','Thêm -s','book → books, cat → cats'],
          ['ch, sh, s, x, z (các từ đang học)','Thường thêm -es','watch → watches, dish → dishes, bus → buses'],
          ['Phụ âm + y','Đổi y thành -ies','baby → babies, candy → candies'],
          ['Nguyên âm + y','Thêm -s','toy → toys, boy → boys'],
          ['o','Học dạng số nhiều của từng từ','tomato → tomatoes; piano → pianos; photo → photos'],
        ] },
      },
    },
    tips: [
      'Đọc âm đầu của từ ngay sau a/an; an honest boy nhưng a university teacher và a red apple.',
      'Số nhiều không chỉ phụ thuộc chữ cuối: học tomato → tomatoes cùng piano → pianos và photo → photos.',
      'There is đi với danh từ số ít hoặc không đếm được; There are đi với danh từ số nhiều.',
    ],
  },
  B1: {
    sections: { 3: {
      body: 'Câu hỏi với động từ thường ở hiện tại đơn dùng Do/Does + chủ ngữ + động từ nguyên thể. Trả lời ngắn phải khớp người được hỏi: Do you like apples? → Yes, I do. / No, I don’t. Does he play soccer? → Yes, he does. / No, he doesn’t. Khi hỏi một nhóm bằng you, có thể trả lời bằng we tùy ngữ cảnh.',
      exampleIds: ['B1-s-0131','B1-s-0132','B1-s-0133','B1-s-0151','B1-s-0152','B1-s-0153'],
    } },
  },
  B2: {
    formulas: { 1: { example: 'I am not sleeping. (Lúc này tôi không ngủ.)' } },
    sections: {
      0: {
        body: 'Hiện tại tiếp diễn diễn tả hành động đang xảy ra lúc nói hoặc hoạt động tạm thời quanh thời điểm nói; không nhất thiết đang ở ngay trước mắt. Cấu trúc cơ bản: am/is/are + V-ing.\nĐối chiếu: I read every evening. (Thói quen.) / I am reading now. (Đang đọc lúc này.) Với nghĩa trạng thái như biết hoặc thích, thường dùng hiện tại đơn: I know the answer now.',
      },
      1: {
        body: 'I đi với am. He, she, it và danh từ số ít đi với is. We, they và danh từ số nhiều đi với are. You dùng are dù nói với một người hay nhiều người.\nPhủ định: am not, is not/isn’t, are not/aren’t. Ví dụ: You are reading. có thể nói với một bạn hoặc cả nhóm.',
        exampleIds: ['B2-s-0001','B2-s-0011','B2-s-0021','B2-s-0031'],
      },
      2: {
        heading: '3. Các quy tắc cơ bản khi thêm -ing',
        body: 'Thông thường thêm -ing: read → reading. Với nhiều từ tận cùng bằng e câm, bỏ e: write → writing, dance → dancing; các từ như see giữ e: see → seeing. Giữ y khi thêm -ing: play → playing, study → studying.\n' + doubling,
        exampleIds: ['B2-s-0151','B2-s-0152','B2-s-0162','B2-s-0171'],
      },
      3: {
        heading: '4. Dấu hiệu thời gian và ngữ cảnh',
        exampleIds: ['B2-s-0191','B2-s-0192','B2-s-0195','B2-s-0196','B2-s-0199','B2-s-0200'],
        body: 'Now, right now, at the moment hoặc lời gọi Look!/Listen! có thể gợi ý hành động đang xảy ra, nhưng không tự quyết định thì. Hãy xét nghĩa của động từ và điều người nói muốn diễn đạt.\nI am drawing now. diễn tả hành động đang xảy ra. I know the answer now. diễn tả trạng thái biết nên dùng hiện tại đơn. Today is Monday. cũng dùng hiện tại đơn. Today có thể chỉ một thời điểm trong ngày hoặc cả ngày; không mặc định chọn tiếp diễn.\nĐối chiếu thói quen và hiện tại: She plays tennis every Sunday. / She is playing tennis at the moment.',
      },
    },
    tips: [
      'Với hành động đang diễn ra trong bài này, kiểm tra đủ dạng be phù hợp và V-ing.',
      'Từ chỉ thời gian là gợi ý. Đọc cả câu để phân biệt hành động đang xảy ra, thói quen và trạng thái.',
      'Gấp đôi phụ âm cần xét chữ đứng trước, phụ âm cuối và trọng âm; không gấp đôi w/x/y. Begin → beginning cho thấy quy tắc không chỉ dành cho từ một âm tiết.',
    ],
  },
  B3: {
    sections: {
      1: {
        body: 'Trong câu kể quá khứ đơn, I, he, she, it và danh từ số ít dùng was; we, they và danh từ số nhiều dùng were. You dùng were khi nói với một người hoặc nhiều người. Phủ định: was not/wasn’t, were not/weren’t.\nVí dụ: You were at home yesterday. có thể nói với một bạn hoặc cả nhóm. Câu hỏi đảo: Were you at home yesterday?',
        exampleIds: ['B3-s-0025','B3-s-0026','B3-s-0027','B3-s-0028','B3-s-0029','B3-s-0030','B3-s-0036','B3-s-0037','B3-s-0038'],
      },
      2: {
        body: 'Động từ có quy tắc thường thêm -ed: watch → watched, clean → cleaned. Tận cùng e thì thêm -d: live → lived. Phụ âm + y đổi y thành i rồi thêm -ed: study → studied; nguyên âm + y giữ y: play → played.\n' + doubling + '\nQuy tắc gấp đôi chỉ hướng dẫn chính tả khi thêm đuôi; quá khứ của động từ bất quy tắc vẫn phải học riêng: begin → began, không phải beginned.',
      },
      3: { body: 'Động từ bất quy tắc không tạo quá khứ theo quy tắc thêm -ed. Một số đổi dạng, một số giữ cách viết nhưng có thể đổi cách đọc:\n- go → went; eat → ate; drink → drank; see → saw\n- have → had; do → did; make → made; buy → bought\n- write → wrote; swim → swam; run → ran\n- read → read: giữ cách viết, dạng quá khứ đọc /red/\n- cut → cut; put → put: giữ nguyên dạng.' },
    },
    tips: [
      'Trong câu hỏi/phủ định với did/didn’t, động từ chính dùng dạng nguyên thể: Did she go? / She didn’t go.',
      'I/he/she/it dùng was; we/they dùng were. You dùng were ở cả số ít và số nhiều.',
      'Yesterday, last week hoặc ago thường gợi một thời điểm đã qua. Xét toàn câu và sự việc đã kết thúc khi chọn quá khứ đơn.',
      'Gấp đôi phụ âm cần xét trọng âm; không gấp đôi w/x/y. Prefer → preferred nhưng visit → visited. Động từ bất quy tắc có dạng quá khứ riêng.',
    ],
  },
  B4: {
    formulas: { 1: {
      pattern: 'Khẳng định: S + am/is/are + going to + V(base) | Phủ định: S + am/is/are + not + going to + V(base) | Nghi vấn: Am/Is/Are + S + going to + V(base)?',
      example: 'She is not going to cook dinner tomorrow. / Is she going to cook dinner tomorrow?',
    } },
    sections: {
      2: {
        body: 'Be going to diễn tả dự định có trước hoặc dự đoán dựa trên bằng chứng. Chọn am/is/are theo chủ ngữ; động từ sau going to ở dạng nguyên thể.\nPhủ định: đặt not ngay sau am/is/are. She is not going to cook dinner tomorrow.\nCâu hỏi: đưa am/is/are lên trước chủ ngữ. Is she going to cook dinner tomorrow? Không thêm do/does.\nKhi luyện các câu dự định trong nhóm này, hiểu rằng người nói đang hỏi hoặc thông báo kế hoạch đã có.',
        exampleIds: ['B4-s-0116','B4-s-0117','B4-s-0133','B4-s-0134','B4-s-0135','B4-s-0136','B4-s-0143','B4-s-0144'],
      },
      3: { body: 'Tomorrow, next week, soon, later hoặc someday gợi thời gian tương lai. Tonight tùy ngữ cảnh có thể nói về việc sắp xảy ra hoặc việc đã xảy ra trong tối nay. Các cụm thời gian không tự quyết định cấu trúc.\nTrong phạm vi bài: dùng will cho lời hứa, quyết định lúc nói hoặc dự đoán; dùng be going to cho dự định có trước hoặc dự đoán dựa trên bằng chứng. Tiếng Anh còn có các cách diễn đạt tương lai khác, chẳng hạn hiện tại đơn cho lịch trình: The train leaves tomorrow.' },
      4: {
        heading: '5. Chọn thì theo ý nghĩa và ngữ cảnh',
        body: 'Trước hết xác định sự việc là thói quen/trạng thái, hành động đang diễn ra, việc đã kết thúc hay việc sắp xảy ra; sau đó đối chiếu mốc thời gian.\n- Thói quen: She plays tennis every Sunday.\n- Đang diễn ra: She is playing tennis now.\n- Đã kết thúc: She played tennis yesterday.\n- Lời hứa: I will help you tomorrow.\n- Dự định có trước: I am going to visit my aunt tomorrow.\nTừ chỉ thời gian chỉ là gợi ý: I know the answer now. và Today is Monday. vẫn dùng hiện tại đơn. Tomorrow cũng có thể đi với lịch trình ở hiện tại đơn: The train leaves tomorrow. Không chọn thì chỉ bằng một từ khóa.',
      },
    },
    tips: [
      'Sau will/won’t trong các cấu trúc đang học, dùng động từ nguyên thể: will play, won’t go.',
      'Will không đổi theo ngôi của chủ ngữ.',
      'Đọc ý nghĩa và mốc thời gian trước khi chọn thì; tomorrow hoặc next week không tự quyết định dùng will hay be going to.',
    ],
  },
};

export function applyTheoryReview(theory) {
  const edits = theoryEdits[theory.level];
  if (!edits) return theory;
  const result = structuredClone(theory);
  for (const field of ['sections','formulas']) for (const [index, patch] of Object.entries(edits[field] || {})) {
    if (!result[field][index]) throw new Error(`${theory.level}: missing ${field}[${index}] for review 11.`);
    Object.assign(result[field][index], structuredClone(patch));
  }
  if (edits.tips) result.tips = [...edits.tips];
  if (result.level === 'B1') result.sections[0].table.rows[0][2] = 'plays, reads, eats, drinks, runs, cleans, cooks';
  if (result.level === 'B3') result.sections[1].body += '\nTrả lời ngắn phải khớp câu hỏi: Was he tired yesterday? → Yes, he was. / No, he wasn’t. Were you happy yesterday? → Yes, I was. / No, I wasn’t. Ở ví dụ cuối, you hỏi một người nên người trả lời dùng I; nếu hỏi cả nhóm, câu trả lời có thể dùng we were.';
  return result;
}
