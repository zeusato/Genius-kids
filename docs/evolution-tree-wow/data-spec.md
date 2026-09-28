# Cây Tiến Hóa mới — Đặc tả dữ liệu (GĐ0)

Ngày 28/09/2026. Đi kèm [../evolution-tree-wow-plan.md](../evolution-tree-wow-plan.md).
Mọi quyết định khoa học đã chốt ở đây. Người code GĐ0 **chỉ chép và kiểm**, không tự sửa cây, không tự đổi số liệu.
Thấy chỗ nào mâu thuẫn thì dừng lại, ghi vào mục "Câu hỏi mở" cuối file rồi hỏi người dùng.

## A. Nguồn chuẩn (thứ tự ưu tiên khi mâu thuẫn)

| File | Vai trò |
| --- | --- |
| `target-tree.txt` | **Cấu trúc cây đích** (251 node, 116 ngọn, sâu tối đa 28). Thụt 2 dấu cách = 1 cấp. `*` = node mới, `X` = đã tuyệt chủng. |
| `times.json` | Thời gian của 75 node rẽ nhánh (`splits`), 8 nhóm tuyệt chủng (`extinct`), thời điểm xuất hiện để hiển thị của 3 ngọn (`leafFirst`). |
| `check-times.mjs` | Kiểm tra `times.json` với cây đích. Ở GĐ0 chuyển thành test vitest đọc dữ liệu TS thật. |
| `prototype-layout.mjs` | Thuật toán bố cục tham chiếu đã chạy trên dữ liệu thật. Ảnh kết quả: `sketch-v2.webp`. |
| File này | Nhãn, mô tả, lớp phủ, sự kiện, hình ảnh, trò chơi, văn cho bé. |

Kiểm đối chiếu đã chạy lúc viết spec: `total 251, leaves 116, splits 75, removed 23, newLeaves 19, newInternal 23`, không trùng id.
Thời gian: đủ 75 node rẽ nhánh, con luôn trẻ hơn cha. 59 node chuỗi (một con) được nội suy.

## B. Nguyên tắc sửa cây (áp dụng nếu phát sinh node mới về sau)

1. Mỗi node vẽ trên cây phải là **một nhánh trọn vẹn** (gồm tổ tiên và *mọi* hậu duệ) ở độ phân giải đang vẽ.
2. Nhóm "gộp" theo SGK không phải một nhánh (Không xương sống, Cá, Nguyên sinh vật, Tảo, Giun…) thì **rời khỏi cây**, chuyển thành **lớp phủ** tô màu (mục G).
3. Một cha có nhiều con cùng lúc (polytomy) nghĩa là "chưa vẽ chi tiết", **không phải sai** → giữ nguyên. Lược bớt nhóm cũng không sai.
4. Lá "ví dụ gộp" mà các loài bên trong không cùng một nhánh (Đậu/Hoa hồng/Hướng dương…) thì gộp vào node cha thành **bộ sưu tập** (`gallery`).
5. Lá vẫn là nhóm gộp nhưng cần giữ để kể chuyện (Giáp xác, Sên trần…) thì gắn cờ `grade: true` kèm ghi chú. **Không dùng trong trò đố họ hàng.**
6. **Giữ id cũ** vì `infographicUrl` và sổ tay gắn theo id. Chỉ đổi cha, nhãn hoặc mô tả.

## C. Thao tác trên `src/data/evolution/*.ts` (làm theo thứ tự)

### C1. Rời khỏi cây, trở thành lớp phủ SGK (12 node)
`protists_simple, protozoa_simple, algae_simple, funguslike_protists, molds_simple, mushrooms_simple, yeasts_simple, invertebrates, radiata, worms_simple, fish_simple, hoofed_mammals`
Chép nguyên `label, englishLabel, color, description, traits, infographicUrl` của từng node sang `overlays.ts` (mục G) **trước khi** xóa.

### C2. Rời khỏi cây, trở thành bộ sưu tập (11 node)
| Node bị xóa | Vào `gallery` của | Tiêu đề gallery |
| --- | --- | --- |
| asconoid, syconoid_calc, leuconoid_calc | calcarea | Kiểu cấu trúc |
| leuconoid_demo | demospongiae | Kiểu cấu trúc |
| syconoid_hex, leuconoid_hex | hexactinellida | Kiểu cấu trúc |
| leuconoid_homo | homoscleromorpha | Kiểu cấu trúc |
| rice_corn_wheat_examples, orchids_lilies_examples | flowering_plants_monocots | Ví dụ quen thuộc |
| beans_roses_sunflowers_examples, apple_mango_orange_examples | flowering_plants_dicots | Ví dụ quen thuộc |

Mỗi mục gallery giữ `label, englishLabel, description, infographicUrl` của node cũ.

### C3. Đổi cha (42 node, sinh tự động từ đối chiếu)
```
delta_epsilon_proteobacteria: proteobacteria -> bacteria
eukarya: luca -> asgard_archaea_simple
amoebas: protozoa_simple -> amoebozoa
slime_molds: funguslike_protists -> amoebozoa
fungi_simple: eukarya -> opisthokonta
zygomycetes_simple: molds_simple -> fungi_simple
ascomycota_simple: molds_simple -> dikarya
baker_yeast_example: yeasts_simple -> ascomycota_simple
basidiomycota_simple: mushrooms_simple -> dikarya
animalia: eukarya -> opisthokonta
porifera: invertebrates -> animalia
eumetazoa: invertebrates -> animalia
cnidaria: radiata -> eumetazoa
flatworms: worms_simple -> spiralia
segmented_worms: worms_simple -> spiralia
mollusca: protostomes -> spiralia
roundworms: worms_simple -> ecdysozoa
arthropoda: protostomes -> ecdysozoa
crustaceans: arthropoda -> pancrustacea
insects: arthropoda -> pancrustacea
vertebrates: animalia -> deuterostomes
jawless_fish: fish_simple -> vertebrates
cartilaginous_fish: fish_simple -> gnathostomes
bony_fish: fish_simple -> gnathostomes
tetrapods: vertebrates -> rhipidistia
primates: placental_mammals -> euarchontoglires
rodents: placental_mammals -> euarchontoglires
bats: placental_mammals -> laurasiatheria
carnivores: placental_mammals -> laurasiatheria
whales_dolphins: placental_mammals -> even_toed
red_algae: algae_simple -> archaeplastida
green_algae: algae_simple -> viridiplantae
plantae_simple: eukarya -> viridiplantae
ferns: land_plants -> vascular_plants
gymnosperms: land_plants -> seed_plants
angiosperms: land_plants -> seed_plants
brown_algae: algae_simple -> stramenopiles
diatoms: algae_simple -> stramenopiles
water_molds: funguslike_protists -> stramenopiles
ciliates: protozoa_simple -> alveolates
sporozoans: protozoa_simple -> alveolates
flagellates: protozoa_simple -> eukarya
```
Tổ chức file sau khi sửa (gợi ý):
- `prokaryotes.ts`: bacteria, archaea. Nhánh `asgard_archaea_simple` import `eukarya` từ file mới `eukaryotes.ts`.
- `eukaryotes.ts`: eukarya và các nhánh amorphea, archaeplastida, sar, flagellates.
- Các file `protists.ts, plants.ts, fungi.ts, animals.ts` giữ các cây con tương ứng.
- `evolutionData.ts`: `life_origin → luca → [bacteria, archaea]`.

### C4. Cờ `grade: true` (lá còn là nhóm gộp) kèm ghi chú đưa vào mô tả
| id | Ghi chú thêm vào `description` |
| --- | --- |
| crustaceans | Côn trùng thật ra mọc ra từ bên trong nhóm giáp xác, nên "giáp xác" không phải một nhánh trọn vẹn. |
| slugs | Sên trần tiến hóa từ ốc nhiều lần, mỗi lần mất vỏ theo một cách khác nhau. |
| polychaetes | Giun đất và đỉa mọc ra từ bên trong nhóm giun nhiều tơ. |
| early_synapsids | Nhóm tổ tiên: thú về sau mọc ra từ những họ hàng của chúng. |
| green_algae_plants | Thực vật trên cạn mọc ra từ bên trong nhóm tảo này. |

## D. 42 node mới

Quy ước:
- `type`: nhánh không có bậc riêng dùng `clade`; có bậc thì dùng bậc đó.
- `color`: màu dữ liệu (Tailwind 400–600). Khi vẽ, cành lấy màu **sector** ở mục J.
- `traits`: 2 mục, ngắn.
- `era` (cho view cũ): tên đại/kỷ tính từ thời gian (mục F4).
- `kid`: câu cho bé, đưa vào `kid.ts`.

### D1. Node trong (23)
| id | cha | label | englishLabel | type | color | description | traits | kid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| amorphea | eukarya | Nhánh Amip – Nấm – Động vật | Amorphea | clade | #c4b5fd | Nhánh sinh vật nhân thực gồm amip, nấm nhầy, nấm và động vật. Nghiên cứu ADN cho thấy chúng có chung một tổ tiên. | Nhân thực · Họ hàng xa của nhau | Amip, nấm và động vật nghe chẳng giống nhau, nhưng chúng tớ là họ hàng đấy! |
| amoebozoa | amorphea | Amip & nấm nhầy | Amoebozoa | clade | #c084fc | Nguyên sinh vật di chuyển bằng chân giả, gồm các loài amip và nấm nhầy. | Chân giả · Không có vỏ cứng | Tớ thò một phần cơ thể ra làm "chân giả" rồi kéo cả người theo! |
| opisthokonta | amorphea | Nhánh Nấm & Động vật | Opisthokonta | clade | #fda4af | Nấm gần với động vật hơn là với thực vật. Tế bào bơi của chúng, như tinh trùng hay bào tử nấm roi, bơi bằng một roi ở phía sau. | Roi đơn phía sau · Dị dưỡng | Cây nấm là họ hàng gần của động vật hơn là của cây xanh đấy! |
| dikarya | fungi_simple | Nấm túi & nấm đảm | Dikarya | clade | #fbbf24 | Nhóm nấm gồm nấm túi (mốc xanh, men bánh mì, nấm cục) và nấm đảm (nấm mỡ, nấm linh chi). Một tế bào của chúng có thể mang hai nhân. | Hai nhân trong một tế bào · Sợi nấm có vách ngăn | Tế bào của nhánh nấm chúng tớ có thể mang tới hai nhân! |
| spiralia | protostomes | Giun dẹp, giun đốt & thân mềm | Spiralia | clade | #fda4af | Nhánh động vật mà phôi phân chia theo kiểu xoắn ốc, gồm giun dẹp, giun đốt và thân mềm (ốc, trai, mực). | Phôi phân cắt xoắn ốc · Đối xứng hai bên | Ốc, mực và giun đất là họ hàng: lúc còn là phôi, tế bào chúng tớ xếp xoắn như cầu thang! |
| ecdysozoa | protostomes | Nhánh lột xác | Ecdysozoa | clade | #fda4af | Động vật lớn lên bằng cách lột lớp vỏ ngoài, gồm giun tròn và chân khớp (côn trùng, nhện, tôm cua). | Lột xác · Lớp vỏ ngoài | Muốn lớn, chúng tớ phải cởi bộ áo giáp cũ. Giun tròn và côn trùng đều làm vậy! |
| pancrustacea | arthropoda | Tôm cua & côn trùng | Pancrustacea | clade | #f472b6 | Côn trùng là họ hàng gần nhất của giáp xác: tổ tiên của côn trùng là một loài giống giáp xác đã lên cạn. | Chân khớp · Mắt kép | Con ong và con tôm là họ hàng gần đấy! |
| gnathostomes | vertebrates | Động vật có hàm | Gnathostomes | clade | #fb7185 | Động vật có xương sống có hàm: cá mập, cá xương và tất cả con cháu trên cạn, kể cả chúng ta. | Hàm · Vây đôi hoặc chi đôi | Nhờ có hàm, tổ tiên của tớ biết cắn và nhai. Bạn cũng được thừa hưởng cái hàm ấy! |
| rhipidistia | lobe_finned_fish | Cá phổi & động vật bốn chân | Rhipidistia | clade | #fb7185 | Cá phổi là họ hàng gần nhất còn sống của động vật bốn chân. Tổ tiên chung của chúng có vây thùy chắc khỏe và biết thở không khí. | Vây thùy có xương · Thở bằng phổi | Cá phổi là họ hàng cá gần nhất của bạn! |
| proboscidea | placental_mammals | Họ hàng nhà voi | Proboscidea | order | #fb7185 | Bộ Có vòi gồm voi châu Phi, voi châu Á và voi ma mút đã tuyệt chủng. Voi ma mút gần với voi châu Á hơn voi châu Phi. | Vòi dài · Ngà | Chúng tớ có chiếc mũi dài nhất thế giới động vật! |
| euarchontoglires | placental_mammals | Nhánh linh trưởng & gặm nhấm | Euarchontoglires | clade | #fb7185 | Một nhánh thú nhau thai gồm linh trưởng (khỉ, vượn, người), gặm nhấm (chuột, sóc) và thỏ. | Thú nhau thai · Nhiều loài sống trên cây | Chuột là họ hàng khá gần của con người đấy! |
| laurasiatheria | placental_mammals | Nhánh dơi, thú ăn thịt & móng guốc | Laurasiatheria | clade | #fb7185 | Nhánh thú nhau thai rất đa dạng: dơi, chó mèo, ngựa, bò, lợn và cả cá voi. | Thú nhau thai · Rất đa dạng | Dơi, sư tử, ngựa và cá voi chung một nhánh lớn! |
| even_toed | laurasiatheria | Guốc chẵn & cá voi | Cetartiodactyla | order | #fb7185 | Thú guốc chẵn (bò, hươu, lợn, hà mã) và cá voi. Họ hàng gần nhất của cá voi là hà mã. | Ngón chân chẵn ở loài trên cạn · Nhiều loài ăn cỏ | Tổ tiên cá voi từng đi bốn chân trên cạn, và họ hàng gần nhất của nó là hà mã! |
| simians | primates | Khỉ & vượn người | Simians | clade | #fb7185 | Linh trưởng có mặt phẳng và mắt nhìn thẳng về phía trước: khỉ châu Mỹ, khỉ châu Á – châu Phi và vượn người. | Mắt nhìn phía trước · Não lớn | Mắt chúng tớ nhìn thẳng về phía trước, y như mắt bạn! |
| great_apes | simians | Vượn người lớn | Great apes (Hominidae) | family | #fb7185 | Đười ươi, khỉ đột, tinh tinh và con người: không có đuôi và rất thông minh. | Không đuôi · Rất thông minh | Chúng tớ không có đuôi và rất thông minh. Bạn cũng là một vượn người lớn đấy! |
| hominini | great_apes | Tinh tinh & người | Chimps & humans | clade | #fda4af | Người và tinh tinh (cả tinh tinh lùn bonobo) là họ hàng gần nhất của nhau, có chung tổ tiên sống khoảng 6–7 triệu năm trước. | Chung khoảng 98–99% ADN · Sống theo nhóm | Tinh tinh là anh em họ gần nhất của bạn, chứ không phải ông tổ! |
| archaeplastida | eukarya | Nhánh thực vật & tảo đỏ | Archaeplastida | clade | #86efac | Tổ tiên của nhánh này đã "nuốt" một vi khuẩn lam và biến nó thành lục lạp. Gồm tảo đỏ, tảo lục và thực vật. | Lục lạp gốc vi khuẩn lam · Quang hợp | Lục lạp của cây xanh ngày xưa là một vi khuẩn lam sống tự do! |
| viridiplantae | archaeplastida | Thực vật xanh | Green plants (Viridiplantae) | clade | #4ade80 | Tảo lục và thực vật trên cạn đều có diệp lục a và b và dự trữ tinh bột. | Diệp lục a & b · Dự trữ tinh bột | Từ giọt tảo lục bé xíu tới cây cổ thụ khổng lồ, chúng tớ đều là thực vật xanh! |
| vascular_plants | land_plants | Thực vật có mạch | Vascular plants | clade | #22c55e | Thực vật có mạch dẫn nước và chất dinh dưỡng, nhờ đó có rễ, thân, lá thật và mọc cao được. | Mạch dẫn · Rễ, thân, lá thật | Nhờ có "ống dẫn nước" bên trong, chúng tớ mọc cao hơn rêu rất nhiều! |
| seed_plants | vascular_plants | Thực vật có hạt | Seed plants | clade | #16a34a | Thực vật sinh sản bằng hạt, một "hộp cơm" bọc cây con. Gồm hạt trần (thông) và hạt kín (cây có hoa). | Hạt · Hạt phấn | Hạt của chúng tớ giống hộp cơm mang theo cây con đi xa! |
| sar | eukarya | Nhánh SAR | SAR (Stramenopiles, Alveolata, Rhizaria) | clade | #c084fc | Một nhánh nhân thực rất đông, gồm tảo bẹ, tảo cát, nấm nước, trùng giày và ký sinh trùng sốt rét. | Rất đa dạng · Phần lớn sống dưới nước | Tảo bẹ khổng lồ và trùng giày tí hon lại chung một nhánh! |
| stramenopiles | sar | Tảo nâu, tảo cát & nấm nước | Stramenopiles | clade | #a78bfa | Tế bào bơi của nhóm này có một roi phủ đầy lông nhỏ. Gồm tảo bẹ, tảo cát và nấm nước. Nấm nước không phải nấm thật! | Roi có lông · Nhiều loài quang hợp | Nấm mốc sương hại khoai tây thật ra là họ hàng của tảo nâu, không phải nấm! |
| alveolates | sar | Trùng giày & ký sinh trùng sốt rét | Alveolata | clade | #a78bfa | Tế bào có những túi nhỏ nằm ngay dưới màng. Gồm trùng giày và ký sinh trùng sốt rét. | Túi dưới màng · Đơn bào | Trùng giày và ký sinh trùng sốt rét trông rất khác nhau nhưng là họ hàng! |

### D2. Ngọn mới (19)
| id | cha | label | englishLabel | type | color | description | traits | kid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ammonites † | cephalopods | Cúc đá | Ammonites | order | #94a3b8 | Họ hàng có vỏ xoắn ốc của mực và bạch tuộc. Từng sống khắp đại dương rồi tuyệt chủng cùng khủng long 66 triệu năm trước. | Vỏ xoắn có vách ngăn · Hóa thạch rất phổ biến | Vỏ xoắn của tớ hóa thạch đẹp như đá quý! |
| trilobites † | arthropoda | Bọ ba thùy | Trilobites | class | #94a3b8 | Chân khớp biển có vỏ chia ba thùy dọc thân, sống hơn 250 triệu năm rồi biến mất trong đại tuyệt chủng cuối kỷ Permi. | Mắt kép bằng tinh thể đá vôi · Cuộn tròn để tự vệ | Mắt tớ làm bằng tinh thể đá. Tớ là một trong những con vật có mắt sớm nhất! |
| coelacanths | lobe_finned_fish | Cá vây tay | Coelacanths | order | #fb7185 | Loài cá vây thùy cổ xưa, từng bị tưởng đã tuyệt chủng cho tới khi ngư dân bắt được một con còn sống năm 1938. | Vây thùy · "Hóa thạch sống" | Ai cũng tưởng tớ tuyệt chủng từ thời khủng long, vậy mà tớ vẫn bơi dưới biển sâu! |
| lungfish | rhipidistia | Cá phổi | Lungfish | order | #fb7185 | Cá có phổi, thở được không khí và sống sót nhiều tháng trong bùn khô. Là loài cá gần với động vật bốn chân nhất. | Thở bằng phổi · Sống ở châu Phi, Nam Mỹ, Úc | Khi hồ cạn, tớ vùi mình trong bùn ngủ chờ mưa về! |
| african_elephant | proboscidea | Voi châu Phi | African elephants | genus | #fb7185 | Động vật trên cạn lớn nhất hiện nay, tai rất to. Cả voi đực và voi cái đều có ngà. | Tai lớn · Cả hai giới đều có ngà | Tớ là động vật trên cạn to nhất thế giới hiện nay! |
| asian_elephant | proboscidea | Voi châu Á | Asian elephant | species | #fb7185 | Voi sống ở châu Á, kể cả Tây Nguyên Việt Nam. Tai nhỏ hơn voi châu Phi, thường chỉ voi đực có ngà dài. | Tai nhỏ · Họ hàng gần của voi ma mút | Tớ sống ở cả Tây Nguyên Việt Nam đấy! |
| mammoth † | proboscidea | Voi ma mút | Woolly mammoth | species | #94a3b8 | Voi lông dày sống trong Kỷ Băng hà. Những con cuối cùng sống trên đảo Wrangel và biến mất khoảng 4.000 năm trước, khi Kim tự tháp Ai Cập đã xây xong. | Lông dày · Ngà cong dài | Tớ mặc áo lông dày để sống qua Kỷ Băng hà! |
| lemurs | primates | Vượn cáo & cu li | Lemurs & lorises | suborder | #fb7185 | Linh trưởng mũi ướt như vượn cáo ở Madagascar và cu li ở Việt Nam. | Mũi ướt · Mắt to, nhiều loài sống về đêm | Cu li ở Việt Nam là họ hàng của tớ. Cả hai đều có đôi mắt to tròn! |
| new_world_monkeys | simians | Khỉ châu Mỹ | New World monkeys | clade | #fb7185 | Khỉ ở Trung và Nam Mỹ, mũi dẹt. Nhiều loài có đuôi cầm nắm được như bàn tay thứ năm. | Mũi dẹt · Đuôi cầm nắm | Cái đuôi tớ nắm cành cây chắc như một bàn tay! |
| old_world_monkeys | simians | Khỉ châu Á – châu Phi | Old World monkeys | family | #fb7185 | Khỉ vàng, khỉ đầu chó, voọc… Lỗ mũi hướng xuống. Nhóm này gần với vượn người hơn khỉ châu Mỹ. | Lỗ mũi hướng xuống · Đuôi không cầm nắm | Voọc chà vá chân nâu ở Sơn Trà là khỉ châu Á đấy! |
| orangutans | great_apes | Đười ươi | Orangutans | genus | #fb7185 | Vượn người lông đỏ sống trên cây ở rừng Borneo và Sumatra. | Sống trên cây · Tay rất dài | Tay tớ dài hơn cả chân, đu cây là giỏi nhất! |
| gorillas | great_apes | Khỉ đột | Gorillas | genus | #fb7185 | Loài linh trưởng lớn nhất, sống ở rừng châu Phi, chủ yếu ăn lá cây. | To khỏe nhất trong linh trưởng · Ăn thực vật | Tớ to khỏe nhưng hiền lành, chủ yếu ăn lá và quả! |
| chimpanzees | hominini | Tinh tinh | Chimpanzees & bonobos | genus | #fb7185 | Họ hàng gần nhất của con người. Biết dùng que để câu mối và dùng đá để đập hạt. | Dùng công cụ · Sống theo đàn | Tớ biết lấy que câu mối lên ăn, thông minh chưa! |
| humans | hominini | Người | Humans (Homo sapiens) | species | #fde68a | Loài vượn người đi thẳng bằng hai chân, có bộ não lớn và ngôn ngữ phức tạp. Chúng ta là một ngọn nhỏ mới mọc trên cây sự sống. | Đi bằng hai chân · Ngôn ngữ và chữ viết | Đây là bạn! Loài người xuất hiện khoảng 300.000 năm trước, rất mới trên cây sự sống. |
| odd_toed | laurasiatheria | Ngựa, tê giác & heo vòi | Odd-toed ungulates | order | #fb7185 | Thú móng guốc lẻ: trục chân đi qua ngón giữa. Gồm ngựa, tê giác và heo vòi. | Số ngón lẻ · Ăn cỏ | Mỗi chân ngựa chỉ còn một ngón to, và cái móng là móng chân khổng lồ! |
| cows_deer | even_toed | Bò, dê & hươu | Ruminants | suborder | #fb7185 | Thú nhai lại: dạ dày nhiều ngăn giúp tiêu hóa cỏ, ăn xong lại ợ lên nhai tiếp. | Nhai lại · Dạ dày bốn ngăn | Tớ ăn cỏ xong còn ợ lên nhai lại lần nữa! |
| pigs | even_toed | Lợn | Pigs | family | #fb7185 | Lợn nhà có tổ tiên là lợn rừng. Mõm rất thính, dùng để đào đất tìm thức ăn. | Mõm đào đất · Ăn tạp | Mũi tớ thính lắm, đào đất tìm củ ngon thoăn thoắt! |
| hippos | even_toed | Hà mã | Hippopotamuses | family | #fb7185 | Sống ở sông hồ châu Phi, ngâm mình dưới nước cả ngày. Là họ hàng còn sống gần nhất của cá voi. | Sống nửa dưới nước · Da tiết "mồ hôi đỏ" chống nắng | Cá voi là họ hàng gần nhất của tớ đấy! |
| trex † | theropods | Khủng long bạo chúa | Tyrannosaurus rex | species | #94a3b8 | Khủng long ăn thịt khổng lồ sống cuối kỷ Phấn Trắng ở Bắc Mỹ, tuyệt chủng 66 triệu năm trước. Là họ hàng khá gần của chim. | Hàm cắn cực mạnh · Hai tay ngắn | Tớ là T. rex, họ hàng của những chú chim ngày nay! |

`humans` có thêm `youAreHere: true`. Tên node tuyệt chủng không ghi dấu † (trạng thái tuyệt chủng lấy từ `EXTINCT`).

## E. Sửa nhãn và mô tả node cũ

| id | Sửa |
| --- | --- |
| luca | `milestone.year` → "khoảng 4 tỷ năm trước". Thêm vào `description`: "Một nghiên cứu năm 2024 ước tính LUCA sống khoảng 4,2 tỷ năm trước." |
| eukarya | `milestone.year` → "khoảng 1,6–2 tỷ năm trước" (mốc 2,7 tỷ đã bị bác năm 2015). Thêm vào `description`: "Theo nghiên cứu mới, tổ tiên của sinh vật nhân thực là một cổ khuẩn nhóm Asgard đã \"nuốt\" một vi khuẩn, về sau vi khuẩn ấy thành ty thể." |
| archaea | Thêm vào `description`: "Sinh vật nhân thực (có cả chúng ta) mọc ra từ bên trong nhánh cổ khuẩn." |
| asgard_archaea_simple | `label` → "Cổ khuẩn Asgard". `description` → "Nhóm cổ khuẩn được phát hiện gần đây trong bùn đáy biển. Chúng là họ hàng gần nhất của mọi sinh vật có nhân." |
| delta_epsilon_proteobacteria | `label` → "Vi khuẩn Delta & Epsilon". Thêm: "Trước đây xếp trong Proteobacteria, nay được tách thành các ngành riêng." |
| alpha_proteobacteria | Thêm: "Ty thể trong tế bào của bạn ngày xưa là một vi khuẩn gần với nhóm này." |
| cyanobacteria | Thêm: "Chính vi khuẩn lam đã làm cho không khí Trái Đất có ôxi từ khoảng 2,4 tỷ năm trước; lục lạp của cây xanh cũng từng là vi khuẩn lam." |
| porifera | `englishLabel` → "Sponges (no true tissues)" (sửa lỗi gõ "tisues"). |
| bony_fish | `label` → "Cá xương & hậu duệ". Thêm: "Nhánh này gồm cả động vật bốn chân (có chúng ta) vì tổ tiên của chúng là cá vây thùy." |
| lobe_finned_fish | `label` → "Cá vây thùy & hậu duệ", `type` → clade. |
| primates | `type` → order. |
| whales_dolphins | `label` → "Cá voi & cá heo" (nhãn cũ "Cá Voi & Heo" dễ đọc thành "Cá voi & lợn"). |
| reptiles_phylo | Thêm: "Theo cây phát sinh, chim cũng thuộc nhánh bò sát, vì chim là hậu duệ của khủng long." |
| flightless_birds | `label` → "Đà điểu & họ hàng". `englishLabel` → "Ratites & tinamous (Palaeognathae)". `description` → "Đà điểu, đà điểu châu Úc, chim kiwi… Chim cánh cụt cũng không bay nhưng thuộc một nhánh khác." |
| birds_of_prey | `description` → "Đại bàng, diều hâu. Cú và chim cắt cũng săn mồi giỏi nhưng thuộc những nhánh khác." |
| flowering_plants_dicots | `englishLabel` → "Eudicots". Có thêm gallery (C2). |
| flowering_plants_monocots | Có thêm gallery (C2). |
| calcarea, demospongiae, hexactinellida, homoscleromorpha | Thành lá, có gallery "Kiểu cấu trúc" (C2). |
| `drillable` | Chỉ view cũ còn dùng. Bỏ ở node đã xóa, không gắn cho node mới. |

## F. Thời gian

### F1. Quy tắc
- **Node rẽ nhánh (≥ 2 con)**: `times.json › splits[id].ma` (triệu năm trước) là thời điểm tổ tiên chung của các con. Dùng cho bố cục.
- **Ngọn còn sống**: cành kéo tới 0 (hôm nay). **Ngọn tuyệt chủng**: cành dừng ở `extinct[id].endMa`.
- **Node chuỗi (đúng 1 con, 59 node)**: gom các node một-con liền nhau thành chuỗi. Đặt chúng **cách đều nhau theo bán kính** (trong thang "mỗi đại một vòng", `mix = 0`), giữa tổ tiên có số gần nhất và mốc kế tiếp (node rẽ nhánh kế tiếp, hoặc 0/`endMa` nếu là ngọn). Đổi ngược ra Ma bằng `maAtFrac`. Gắn cờ `approx = true`. **Không hiện con số** cho node approx. Code tham chiếu: hàm `assign` trong `prototype-layout.mjs`.
- **Gốc** `life_origin`: 4540 (Trái Đất hình thành), nằm ở tâm quạt.

### F2. Hiển thị (`formatMa`, trong `engine/timeScale.ts`)
| Điều kiện | Ví dụ |
| --- | --- |
| ma ≥ 1000 | "khoảng 1,8 tỷ năm trước" (1 chữ số thập phân, dấu phẩy) |
| 10 ≤ ma < 1000 | làm tròn tới 10: "khoảng 430 triệu năm trước" |
| 1 ≤ ma < 10 | 1 chữ số thập phân: "khoảng 6,5 triệu năm trước" |
| 0,01 ≤ ma < 1 | theo nghìn năm: "khoảng 300.000 năm trước" |
| ma < 0,01 | "khoảng 4.000 năm trước" |

Thứ tự ưu tiên: có `show` thì dùng nguyên câu `show`. Nếu không, `conf` là `cao` hoặc `tb` thì dùng `formatMa`. `conf = thap` mà không có `show` thì hiện: "Rất xa xưa. Các nhà khoa học vẫn đang tìm hiểu chính xác."

### F3. Câu hiển thị cho vài node chuỗi (`CHAIN_NOTES`, chỉ để hiển thị, không ảnh hưởng bố cục)
| id | Câu |
| --- | --- |
| cyanobacteria | Làm ra ôxi cho Trái Đất từ hơn 2,4 tỷ năm trước. |
| cynodonts | Xuất hiện khoảng 260 triệu năm trước. |
| sauropsids | Tách khỏi nhánh thú khoảng 318 triệu năm trước. |
| testudines | Rùa cổ nhất có mai sống khoảng 220 triệu năm trước. |
| insects | Côn trùng xuất hiện khoảng 480 triệu năm trước. |
| gymnosperms | Có từ hơn 300 triệu năm trước. |
| red_algae | Tảo đỏ đa bào cổ nhất (Bangiomorpha) sống khoảng 1 tỷ năm trước. |
| chytrids | Một trong những nhánh nấm cổ nhất. |

### F4. Tên địa chất tiếng Việt (dùng cho vòng thời gian và `era` của node mới)
| Từ Ma | Đến Ma | Tên | Màu vòng |
| --- | --- | --- | --- |
| 4540 | 4000 | Liên đại Hỏa Thành | #5a1e14 |
| 4000 | 2500 | Liên đại Thái Cổ | #113a44 |
| 2500 | 538,8 | Liên đại Nguyên Sinh | #1a2c52 |
| 538,8 | 251,9 | Đại Cổ Sinh | #15413a |
| 251,9 | 66 | Đại Trung Sinh | #3f3a17 |
| 66 | 0 | Đại Tân Sinh | #44301f |

Kỷ, dùng trong chữ hiển thị: Ediacara (635–538,8), Cambri (538,8–485), Ordovic (485–444), Silur (444–419), Devon (419–359), Than Đá (359–299), Permi (299–251,9), Trias (251,9–201), Jura (201–145), Phấn Trắng (145–66), Paleogen (66–23), Neogen (23–2,6), Đệ Tứ (2,6–0).

## G. Lớp phủ "Nhóm theo SGK" (`src/data/evolution/overlays.ts`)

```ts
export interface TextbookGroup {
  id: string; label: string; color: string;
  kind: 'system' | 'group';            // system = chia cả cây thành nhiều phần (3 lãnh giới, 5 giới)
  members?: string[];                  // kind 'group': gốc các cây con thuộc nhóm
  parts?: { label: string; color: string; members: string[] }[]; // kind 'system'
  description: string;                 // chép từ node cũ nếu có
  why: string;                         // vì sao không phải một nhánh
  infographicUrl?: string;             // chép từ node cũ nếu có
}
```
| id | label | Kiểu | Thành viên (gốc cây con) | Lấy description/infographic từ | why |
| --- | --- | --- | --- | --- | --- |
| domains3 | 3 lãnh giới (SGK) | system | Vi khuẩn: bacteria · Cổ khuẩn: euryarchaeota, crenarchaeota_simple, thaumarchaeota, lokiarchaeota_simple · Nhân thực: eukarya | — | Nghiên cứu mới cho thấy nhân thực mọc ra từ bên trong cổ khuẩn, nên "cổ khuẩn" theo SGK không còn là một nhánh trọn vẹn. |
| kingdoms5 | 5 giới (KHTN 6) | system | Khởi sinh: bacteria, euryarchaeota, crenarchaeota_simple, thaumarchaeota, lokiarchaeota_simple · Nguyên sinh: amoebozoa, sar, flagellates, red_algae, green_algae, algae_plants_bridge · Nấm: fungi_simple · Thực vật: land_plants · Động vật: animalia | — | Chia theo cách sống cho dễ học. "Khởi sinh" và "Nguyên sinh" gồm nhiều nhánh xa nhau. |
| invertebrates | Động vật không xương sống | group | porifera, cnidaria, protostomes, echinodermata | invertebrates | Gồm mọi động vật trừ nhánh có xương sống. Sao biển còn gần chúng ta hơn gần sứa. |
| fish | Cá | group | jawless_fish, cartilaginous_fish, ray_finned_fish, coelacanths, lungfish | fish_simple | Động vật bốn chân mọc ra từ bên trong nhóm cá, nên "cá" không phải một nhánh trọn vẹn. |
| reptiles_sgk | Bò sát (SGK) | group | testudines, lepidosauria, crocodilians, ornithischia, sauropods, trex | reptiles_phylo | Chim là hậu duệ của khủng long, nên nhóm bò sát không có chim sẽ thiếu một phần. |
| protists | Nguyên sinh vật | group | amoebozoa, sar, flagellates, red_algae, green_algae, algae_plants_bridge | protists_simple | Tên gọi chung cho sinh vật nhân thực không phải nấm, thực vật hay động vật. Chúng nằm rải rác khắp cây. Sửa câu cũ "là tổ tiên của Nấm, Thực vật và Động vật" thành "một số là họ hàng gần của nấm, cây hoặc động vật". |
| protozoa | Nguyên sinh động vật | group | amoebas, ciliates, sporozoans, flagellates | protozoa_simple | Gộp theo cách sống (săn mồi, di chuyển). Amip gần nấm hơn gần trùng giày. |
| algae | Tảo | group | red_algae, green_algae, algae_plants_bridge, brown_algae, diatoms | algae_simple | Tảo bẹ và tảo cát ở nhánh SAR, xa tảo lục và cây xanh. |
| funguslike | Nguyên sinh giống nấm | group | slime_molds, water_molds | funguslike_protists | Nấm nhầy thuộc nhánh amip, nấm nước thuộc nhánh tảo nâu. |
| worms | Giun | group | flatworms, roundworms, segmented_worms | worms_simple | Giun tròn gần côn trùng hơn gần giun đất. |
| molds | Nấm mốc | group | zygomycetes_simple, penicillium_example | molds_simple | "Mốc" là một kiểu sống, có ở nhiều nhánh nấm. |
| yeasts | Nấm men | group | baker_yeast_example | yeasts_simple | Nấm men đơn bào xuất hiện ở cả nấm túi lẫn nấm đảm. |
| mushrooms | Nấm lớn | group | basidiomycota_simple, morels_truffles_example | mushrooms_simple | Nấm cục và nấm bụng dê là nấm túi, không cùng nhánh với nấm mỡ. |
| hoofed | Thú móng guốc (SGK) | group | odd_toed, cows_deer, pigs, hippos | hoofed_mammals | Cá voi mọc ra từ bên trong nhóm guốc chẵn. |
| radial | Đối xứng tỏa tròn | group | cnidaria, echinodermata | radiata | Sao biển tỏa tròn khi lớn, nhưng ấu trùng của nó đối xứng hai bên như chúng ta. |

Màu lớp phủ: dùng `color` của node cũ. Nhóm không có node cũ thì dùng #fde68a (domains3/kingdoms5 lấy màu sector ở mục J cho từng phần).

## H. Cộng sinh nội bào (`SYMBIOSES`, vẽ ở GĐ4)
| id | from | to | ma | Nhãn | Câu |
| --- | --- | --- | --- | --- | --- |
| mito | alpha_proteobacteria | eukarya | 1800 | Ty thể | Một vi khuẩn bị "nuốt" nhưng ở lại sống chung và trở thành ty thể, nhà máy năng lượng trong mọi tế bào có nhân. |
| chloro | cyanobacteria | archaeplastida | 1600 | Lục lạp | Một vi khuẩn lam bị nuốt rồi trở thành lục lạp, nhờ vậy cây xanh quang hợp được. |

## I. Sự kiện của cỗ máy thời gian (`events.ts`)
| id | ma | toMa | Tiêu đề | Câu cho bé | fx |
| --- | --- | --- | --- | --- | --- |
| earth | 4540 | | Trái Đất ra đời | Trái Đất còn nóng rực, mưa sao băng liên tục. | lava |
| luca | 4200 | | Tổ tiên chung của mọi sự sống | Mọi sinh vật hôm nay đều bắt nguồn từ tổ tiên nhỏ xíu này. | spark |
| stromatolite | 3480 | | Hóa thạch cổ nhất | Vi khuẩn xây những "gò đá" dưới biển, nay vẫn còn hóa thạch. | — |
| goe | 2400 | 2000 | Ôxi xuất hiện | Vi khuẩn lam thải ôxi, không khí dần có ôxi như bây giờ. | oxygen-sky |
| eukaryote | 1800 | | Tế bào có nhân ra đời | Một cổ khuẩn "nuốt" một vi khuẩn, và ty thể ra đời! | symbiosis-mito |
| chloroplast | 1600 | | Lục lạp ra đời | Một vi khuẩn lam bị nuốt và ở lại thành lục lạp: tổ tiên cây xanh biết quang hợp! | symbiosis-chloro |
| snowball | 717 | 635 | Trái Đất quả cầu tuyết | Băng phủ gần kín Trái Đất suốt hàng chục triệu năm. | frost |
| cambrian | 538.8 | | Bùng nổ kỷ Cambri | Rất nhiều loài động vật mới xuất hiện gần như cùng lúc! | burst |
| land | 470 | | Cây lên cạn | Những cây rêu đầu tiên phủ xanh mặt đất. | green-haze |
| tetrapod | 375 | | Cá bước lên bờ | Cá vây thùy như Tiktaalik chống vây bò lên bờ. | — |
| great_dying | 251.9 | | Đại tuyệt chủng Permi | Phần lớn sinh vật biển biến mất, trong đó có bọ ba thùy. | great-dying |
| dinos | 233 | | Khủng long xuất hiện | Những con khủng long đầu tiên chạy bằng hai chân. | — |
| kpg | 66 | | Thiên thạch! | Một thiên thạch lớn lao xuống. Khủng long (trừ chim) và cúc đá biến mất. | impact |
| humans | 0.3 | | Loài người xuất hiện | Đây là chúng ta, một ngọn rất mới trên cây sự sống. | you-are-here |

Nguồn mốc: GOE ~2,4 tỷ năm, Cryogen 717–635, ranh giới Cambri 538,8 (ICS), P–T 251,9, K–Pg 66.

## J. Sector (màu cành và trọng số góc)
| sector | Node gốc (và mọi hậu duệ) | Màu phát sáng | Trọng số một ngọn |
| --- | --- | --- | --- |
| bacteria | bacteria | #38bdf8 | 1,6 |
| archaea | archaea (trừ cây con eukarya) | #cbd5e1 | 1,8 |
| protist | amoebozoa, sar, flagellates | #c084fc | 1,8 |
| fungi | fungi_simple | #fbbf24 | 1,5 |
| plant | archaeplastida | #4ade80 | 1,5 |
| animal | animalia | #fb7185 | 1,0 |
| trunk | life_origin, luca, eukarya, amorphea, opisthokonta | #e0f2fe | — |

- Hai ngọn liền nhau thuộc hai sector khác nhau thì chèn thêm khoảng hở 0,6° giữa chúng.
- Quạt trải từ π + 0,035 tới −0,035 rad.
- Kết quả đã đo: vi khuẩn 14,2%, cổ khuẩn 8,6%, protist 9,8%, nấm 8,2%, động vật 49,1%, thực vật 8,2%. Khoảng cách ngọn ở vành 21,9–39,4 đơn vị (R = 1000).
- Ngọn tuyệt chủng: màu đá #9aa3ad.
- Người: vàng #fde68a.

## K. Hình ảnh sinh vật

### K1. Pipeline `scripts/build-evo-art.mjs` (`npm run evo-art`). API PhyloPic đã thử thật ngày 28/09/2026.
1. **Số build**: `GET https://api.phylopic.org/` trả **307** với `Location: /?build=<n>` (lúc thử là 558). Đọc header này hoặc theo redirect rồi đọc `build` trong JSON. Mọi request sau phải có `build=<n>`.
2. **Tên → node**: `GET /nodes?build=<n>&filter_name=<tên khoa học viết thường>&page=0` → `_links.items[0].href` = `/nodes/<uuid>?build=…`.
3. **Ảnh trong nhánh**: `GET /images?build=<n>&filter_clade=<uuid>&filter_license_nc=false&filter_license_sa=false&embed_items=true&page=0`.
   - ⚠️ **Bẫy đã kiểm**: `=false` mới là **loại bỏ** ảnh có điều khoản đó. Gửi `filter_license_nc=true` lại chỉ lấy ảnh **có** NC (thử T. rex ra đúng một ảnh BY-NC-SA).
   - Muốn chỉ lấy CC0/PDM (không cần ghi công) thì thêm `filter_license_by=false`.
   - `filter_name` trên `/images` chỉ khớp đúng tên node, nên phải dùng `filter_clade` để lấy cả ảnh của loài con (vd `ammonoidea`: filter_name ra 0 ảnh, filter_clade ra 8 ảnh).
4. **Luôn tự kiểm** `item._links.license.href` và chỉ nhận các giấy phép sau, không tin mù bộ lọc:
   - `creativecommons.org/publicdomain/zero/1.0/`
   - `creativecommons.org/publicdomain/mark/1.0/`
   - `creativecommons.org/licenses/by/3.0/`
   - `creativecommons.org/licenses/by/4.0/`
5. **Chọn ảnh**, theo thứ tự ưu tiên:
   1. `specificNode.title` trùng tên đang hỏi;
   2. CC0/PDM trước CC BY 4.0, rồi CC BY 3.0;
   3. hòa nhau thì lấy ảnh đầu tiên.
   Ghi lựa chọn vào `scripts/evo-art/chosen.json` (commit file này). Chạy lại thì dùng `chosen.json`, trừ khi có `--refresh`. Muốn ép chọn ảnh khác thì ghi `scripts/evo-art/overrides.json` `{ id: uuid }`.
6. **File** (mỗi ảnh có sẵn):
   - `vectorFile.href` (SVG);
   - `rasterFiles[]` (PNG, rộng 512 tới 1536);
   - `thumbnailFiles[]` (64/128/192, vuông);
   - `attribution` (tên tác giả).
7. **Không tìm thấy**: thử tên kế tiếp trong danh sách ở K3. Hết tên thì dùng glyph vẽ bằng code theo sector (mục K2). Script in báo cáo `found / fallback / glyph` cho từng id.
8. **Đầu ra**:
   - `public/evolution/atlas.webp`: 2048×2048, ô 128 px, 16×16 ô, hình bóng trắng trên nền trong suốt, căn giữa, chừa 6 px; `sharp(...).webp({ lossless: true })`.
   - `public/evolution/atlas.json`: `{ size: 2048, cell: 128, cols: 16, items: { [id]: { i, aspect } } }`.
   - `public/evolution/svg/<id>.svg`: vector gốc cho thẻ thông tin (glyph code cũng xuất ra SVG).
   - `public/evolution/credits.json`: `[{ id, source: 'phylopic' | 'procedural', uuid?, taxon?, attribution?, license?, licenseUrl?, pageUrl? }]`, với `pageUrl = https://www.phylopic.org/images/<uuid>`.
   - `scripts/evo-art/contact-sheet.png` (không đưa lên web): lưới mọi ô kèm id, để **người xem duyệt** sau khi chạy.
9. **Cache**: `scripts/evo-art/cache/` (thêm vào `.gitignore`). Chạy lại không tải lại.

### K2. Glyph vẽ bằng code (cho mọi vi khuẩn, cổ khuẩn và phương án dự phòng)
Tất cả là SVG trắng trong khung 128×128, nét tròn, không chữ:
| glyph | Mô tả hình |
| --- | --- |
| rod | viên nang 70×28, bo tròn hai đầu |
| rod-flagella | rod + 6 roi lượn sóng quanh thân |
| rod-polar | rod + 1 roi dài lượn sóng ở một đầu |
| rod-chain | 3 viên nang ngắn nối thành hàng, hở nhẹ |
| rod-spore | rod + một bầu dục (bào tử) ở giữa |
| rod-spore-end | rod + bào tử tròn phình ở một đầu (hình dùi trống) |
| rod-thin | viên nang mảnh 90×14 |
| coccobacillus | bầu dục ngắn 44×30 |
| coccus-cluster | khối 3×3 hình tròn (kiểu Sarcina) |
| filament | chuỗi 7 hạt, có một hạt to hơn (tế bào dị hình) |
| hyphae | sợi phân nhánh như cây, đầu sợi có chuỗi bào tử nhỏ |
| spirochete | đường xoắn lò xo dài, dày 8 |
| vibrio | viên nang cong hình dấu phẩy + 1 roi |
| lobed | khối tròn méo có 4–5 thùy |
| tentacled | thân tròn nhỏ + 6–8 xúc tu mảnh phân nhánh (kiểu Prometheoarchaeum) |
| amoeba | khối mềm có 4 chân giả + chấm nhân |
| chytrid | cầu + rễ giả sợi mảnh + 1 roi phía sau |
| sporangia | 3 cuống mảnh, mỗi cuống có đầu tròn |
| conidiophore | cuống có chùm nhánh dạng chổi |
| truffle | cầu sần sùi |
| eukaryote-cell | tròn + nhân + một ty thể hình hạt đậu |

### K3. Ánh xạ ngọn → nguồn hình (thử lần lượt từ trái sang phải; `glyph:` là vẽ bằng code)
**Vi khuẩn và cổ khuẩn (luôn dùng glyph)**:
- rhizobium_example: rod
- ecoli_example, salmonella_example: rod-flagella
- pseudomonas_example: rod-polar
- beta_proteobacteria: coccobacillus
- delta_epsilon_proteobacteria: vibrio
- lactobacillus_example: rod-chain
- bacillus_example: rod-spore
- clostridium_example: rod-spore-end
- anabaena_example: filament
- streptomyces_example: hyphae
- bacteroides_example: rod
- borrelia_example: spirochete
- methanobrevibacter_example: coccobacillus
- methanosarcina_example: coccus-cluster
- halobacterium_example: rod
- sulfolobus_example: lobed
- thermoproteus_example, nitrosopumilus_example: rod-thin
- lokiarchaeum_example: tentacled

**Nguyên sinh**:
- amoeba_example: amoeba proteus → amoebozoa → glyph:amoeba
- physarum_example: physarum polycephalum → glyph:amoeba
- kelp_example: macrocystis → laminariales
- diatom_example: bacillariophyta → glyph:lobed
- phytophthora_example: phytophthora → oomycota → glyph:hyphae
- paramecium_example: paramecium
- plasmodium_example: plasmodium falciparum → plasmodium
- euglena_example: euglena
- red_algae_example: rhodophyta
- chlamydomonas_example: chlamydomonas
- green_algae_plants: chara → charophyta → zygnematophyceae

**Nấm**:
- chytrid_example: batrachochytrium → chytridiomycota → glyph:chytrid
- rhizopus_example: rhizopus → mucorales → glyph:sporangia
- blue_mold_example: penicillium → glyph:conidiophore
- truffle_example: tuber → pezizales → glyph:truffle
- baker_yeast_example: saccharomyces cerevisiae
- agaricus_example: agaricus → agaricales
- polypore_example: trametes → polyporales
- puffball_detail_example: calvatia gigantea → lycoperdon → agaricales

**Thực vật**:
- mosses: bryophyta → polytrichum
- ferns: polypodiopsida
- pine_spruce_fir_examples: pinus → pinaceae
- flowering_plants_monocots: oryza sativa → zea mays → poaceae
- flowering_plants_dicots: helianthus annuus → rosa → eudicotyledons

**Động vật không xương sống**:
- calcarea: calcarea
- demospongiae: demospongiae
- hexactinellida: euplectella → hexactinellida
- homoscleromorpha: homoscleromorpha
- hydrozoa: hydra → hydrozoa
- scyphozoa: aurelia aurita → scyphozoa
- anthozoa: actiniaria → anthozoa
- cubozoa: cubozoa
- planarians: tricladida
- tapeworms: taenia → cestoda
- flukes: fasciola hepatica → trematoda
- earthworms: lumbricus terrestris → lumbricidae
- leeches: hirudo medicinalis → hirudinea
- polychaetes: nereididae → polychaeta
- snails: cornu aspersum → helix pomatia → stylommatophora
- slugs: arion → limax
- clams_oysters: crassostrea → ostreidae → bivalvia
- octopuses: octopus vulgaris → octopus
- squids: loligo → teuthida
- nautilus: nautilus pompilius → nautilus
- ammonites: ammonoidea
- pinworms: enterobius vermicularis → nematoda
- hookworms: ancylostoma → nematoda
- trilobites: trilobita
- spiders_scorpions_ticks: araneae → arachnida
- centipedes_millipedes: scolopendra → chilopoda
- crabs_shrimps_lobsters: brachyura → decapoda
- butterflies_beetles_bees: apis mellifera → papilionoidea → insecta
- sea_stars: asteroidea
- sea_urchins: echinoidea
- sea_cucumbers: holothuroidea
- brittle_stars: ophiuroidea

**Động vật có xương sống**:
- jawless_fish: petromyzon marinus → petromyzontiformes
- cartilaginous_fish: carcharodon carcharias → selachimorpha
- ray_finned_fish: salmo salar → actinopterygii
- coelacanths: latimeria chalumnae
- lungfish: protopterus → neoceratodus forsteri → dipnoi
- frogs_toads: rana → anura
- salamanders_newts: salamandra salamandra → caudata
- caecilians: gymnophiona
- early_synapsids: dimetrodon
- dicynodonts: lystrosaurus → dicynodontia
- monotremes: ornithorhynchus anatinus
- marsupials: macropus → macropodidae
- african_elephant: loxodonta africana
- asian_elephant: elephas maximus
- mammoth: mammuthus primigenius
- lemurs: lemur catta → lemuriformes
- new_world_monkeys: ateles → platyrrhini
- old_world_monkeys: macaca → cercopithecidae
- orangutans: pongo
- gorillas: gorilla gorilla → gorilla
- chimpanzees: pan troglodytes
- humans: homo sapiens
- rodents: mus musculus → rodentia
- bats: pteropus → chiroptera
- carnivores: vulpes vulpes → canis lupus → carnivora (con cáo, giống ảnh bìa hub)
- odd_toed: equus → perissodactyla
- cows_deer: bos taurus → cervus → ruminantia
- pigs: sus scrofa
- hippos: hippopotamus amphibius
- whales_dolphins: megaptera novaeangliae → tursiops truncatus → cetacea
- turtles: chelonia mydas → testudines
- tuatara: sphenodon punctatus
- lizards_snakes: varanus → squamata
- crocodilians: crocodylus → crocodylia
- ornithischia: triceratops → stegosaurus → ornithischia
- sauropods: brachiosaurus → diplodocus → sauropoda
- trex: tyrannosaurus rex
- flightless_birds: struthio camelus → palaeognathae
- birds_of_prey: aquila chrysaetos → accipitridae
- songbirds: passer domesticus → passeriformes

**Biểu tượng của node trong khi nhìn xa** (`REP_ICON`, mượn hình của một ngọn):
- bacteria → ecoli_example
- archaea → sulfolobus_example
- eukarya → glyph:eukaryote-cell
- amoebozoa → amoeba_example
- fungi_simple → agaricus_example
- animalia → carnivores
- porifera → hexactinellida
- cnidaria → scyphozoa
- arthropoda → butterflies_beetles_bees
- mollusca → octopuses
- echinodermata → sea_stars
- vertebrates → ray_finned_fish
- tetrapods → frogs_toads
- mammals → african_elephant
- primates → chimpanzees
- dinosaurs → trex
- birds → songbirds
- archaeplastida → red_algae_example
- plantae_simple → flowering_plants_dicots
- land_plants → ferns
- seed_plants → pine_spruce_fir_examples
- sar → kelp_example
- stramenopiles → diatom_example
- alveolates → paramecium_example

Độ phủ đã thử bằng API: macrocystis 1, rhodophyta 36, bryophyta 33, polypodiopsida 23, chiroptera 48, cubozoa 2, gymnophiona 8, homoscleromorpha 5, ammonoidea 8, homo sapiens 5, latimeria chalumnae 4, trilobita 1, mammuthus primigenius 3, paramecium 2, euglena 2, chlamydomonas 1, plasmodium falciparum 4, physarum polycephalum 2, saccharomyces cerevisiae 3. `agaricus` bị lỗi, phải lùi về agaricales.

## L. Trò chơi (`games.ts`)

### L1. "Ai là họ hàng gần nhất?" — đáp án phải đúng theo cây (test: `mrca(a, answer)` sâu hơn `mrca(a, other)`)
| # | a | lựa chọn | đáp án | Chuyện thú vị |
| --- | --- | --- | --- | --- |
| 1 | songbirds | trex / lizards_snakes | trex | Chim là khủng long còn sống sót! |
| 2 | humans | agaricus_example / flowering_plants_monocots | agaricus_example | Nấm gần với động vật hơn là với cây xanh. |
| 3 | humans | sea_stars / scyphozoa | sea_stars | Sao biển cùng nhánh "miệng thứ sinh" với chúng ta. |
| 4 | whales_dolphins | cows_deer / cartilaginous_fish | cows_deer | Cá voi là thú, họ hàng của bò và hà mã. |
| 5 | bats | rodents / songbirds | rodents | Dơi là thú biết bay, không phải chim. |
| 6 | lungfish | frogs_toads / ray_finned_fish | frogs_toads | Cá phổi gần ếch hơn là gần cá hồi! |
| 7 | butterflies_beetles_bees | crabs_shrimps_lobsters / spiders_scorpions_ticks | crabs_shrimps_lobsters | Côn trùng là họ hàng gần nhất của tôm cua. |
| 8 | pinworms | butterflies_beetles_bees / earthworms | butterflies_beetles_bees | Giun tròn và côn trùng đều lột xác để lớn. |
| 9 | humans | chimpanzees / gorillas | chimpanzees | Tinh tinh là họ hàng gần nhất của người. |
| 10 | kelp_example | phytophthora_example / flowering_plants_dicots | phytophthora_example | Tảo bẹ không phải họ hàng gần của cây xanh! |
| 11 | amoeba_example | agaricus_example / chlamydomonas_example | agaricus_example | Amip cùng một nhánh lớn với nấm và động vật. |
| 12 | crocodilians | songbirds / lizards_snakes | songbirds | Cá sấu gần chim hơn là gần thằn lằn. |
| 13 | humans | halobacterium_example / ecoli_example | halobacterium_example | Tế bào của chúng ta có "gốc" cổ khuẩn. |
| 14 | baker_yeast_example | blue_mold_example / agaricus_example | blue_mold_example | Men bánh mì và mốc xanh đều là nấm túi. |
| 15 | ferns | pine_spruce_fir_examples / mosses | pine_spruce_fir_examples | Dương xỉ và thông đều có mạch dẫn. |
| 16 | pine_spruce_fir_examples | flowering_plants_monocots / ferns | flowering_plants_monocots | Thông và lúa đều có hạt. |
| 17 | squids | octopuses / snails | octopuses | Mực và bạch tuộc đều là chân đầu. |
| 18 | humans | ray_finned_fish / cartilaginous_fish | ray_finned_fish | Cá hồi gần bạn hơn cá mập, vì cả hai cùng nhánh cá xương! |
| 19 | whales_dolphins | hippos / odd_toed | hippos | Họ hàng gần nhất của cá voi là hà mã. |
| 20 | frogs_toads | humans / ray_finned_fish | humans | Ếch và bạn đều là động vật bốn chân. |
| 21 | sea_urchins | humans / anthozoa | humans | Nhím biển là họ hàng xa của chúng ta, còn san hô thì xa hơn nữa. |
| 22 | agaricus_example | songbirds / ferns | songbirds | Nấm gần chim hơn gần dương xỉ. |

Mỗi lượt chơi bốc ngẫu nhiên 8 câu. Đúng từ 6/8 trở lên thì được huy hiệu `relatives`.
Không dùng id có `grade: true` hoặc node chuỗi approx để làm đáp án.

### L2. "Đoán xem tớ là ai?" — khóa lưỡng phân
Mỗi câu hỏi có 4 thông tin:
- `truth`: node đại diện cho câu trả lời "Có" (đúng khi mục tiêu nằm trong cây con của `truth`);
- `flyYes` = `truth`;
- `flyNo`: nơi camera bay tới khi trả lời "Không" (null = đứng yên);
- nhánh kế tiếp của Có/Không.
Test: với mỗi kết quả, đi theo khóa bằng `isAncestor(truth, target)` phải tới đúng kết quả đó.
```
Q1  green     "Nó có màu xanh lá và tự làm ra thức ăn từ ánh nắng không?"      truth viridiplantae  flyNo opisthokonta   Có→Q2   Không→Q6
Q2  vascular  "Nó có rễ, thân, lá thật với ống dẫn nước bên trong không?"      truth vascular_plants flyNo mosses       Có→Q3   Không→R mosses
Q3  seed      "Nó có tạo ra hạt không?"                                        truth seed_plants    flyNo ferns         Có→Q4   Không→R ferns
Q4  flower    "Nó có hoa và quả không?"                                        truth angiosperms    flyNo pine_spruce_fir_examples  Có→Q5  Không→R pine_spruce_fir_examples
Q5  parallel  "Lá của nó có gân song song như lá lúa không?"                   truth flowering_plants_monocots flyNo flowering_plants_dicots  Có→R flowering_plants_monocots  Không→R flowering_plants_dicots
Q6  fungus    "Nó mọc tại chỗ, không có miệng, hút thức ăn qua những sợi nhỏ li ti không?"  truth fungi_simple  flyNo animalia  Có→R agaricus_example  Không→Q7
Q7  backbone  "Nó có xương sống không?"                                        truth vertebrates    flyNo null          Có→Q12  Không→Q8
Q8  jointed   "Nó có bộ xương cứng bên ngoài và chân có nhiều khớp không?"     truth arthropoda     flyNo null          Có→Q9   Không→Q10
Q9  six       "Nó có đúng 6 chân không?"                                       truth insects        flyNo arachnids     Có→R butterflies_beetles_bees  Không→R spiders_scorpions_ticks
Q10 arms      "Quanh đầu nó có nhiều tay với giác mút không?"                  truth cephalopods    flyNo null          Có→R octopuses  Không→Q11
Q11 sting     "Nó có thân mềm như chiếc ô và xúc tu biết chích không?"         truth cnidaria       flyNo echinodermata Có→R scyphozoa  Không→R sea_stars
Q12 limbs     "Nó có bốn chi (chân hoặc cánh) không?"                          truth tetrapods      flyNo gnathostomes  Có→Q14  Không→Q13
Q13 cartilage "Bộ xương của nó bằng sụn dẻo (giống sụn tai của bạn) không?"    truth cartilaginous_fish flyNo ray_finned_fish  Có→R cartilaginous_fish  Không→R ray_finned_fish
Q14 tadpole   "Nó có da ẩm và lúc bé là nòng nọc sống dưới nước không?"        truth amphibians     flyNo amniotes      Có→R frogs_toads  Không→Q15
Q15 feathers  "Nó có lông vũ không?"                                           truth birds          flyNo null          Có→R songbirds  Không→Q16
Q16 milk      "Nó có lông mao và bú sữa mẹ khi còn nhỏ không?"                 truth mammals        flyNo lepidosauria  Có→Q17  Không→R lizards_snakes
Q17 trunk     "Nó có chiếc vòi thật dài không?"                                truth proboscidea    flyNo hominini      Có→R asian_elephant  Không→R humans
```
Tên hiển thị của 18 bí ẩn (dòng "Tớ là…" khi lật đáp án): Rêu, Dương xỉ, Cây thông, Cây lúa, Hoa hướng dương, Nấm mỡ, Con ong, Con nhện, Bạch tuộc, Con sứa, Sao biển, Cá mập, Cá hồi, Con ếch, Chim sẻ, Thằn lằn, Con voi, và **Người** ("Đó chính là bạn!").
Trả lời sai thì không phạt: bé đã biết mục tiêu, nên hiện lời nhắc nhẹ (vd "Ồ, tớ có xương sống đấy! Thử lại nhé") rồi cho chọn lại.
Giải được 6 bí ẩn thì nhận huy hiệu `key`.

### L3. "Hành trình về tổ tiên"
- Điểm dừng là các tổ tiên của ngọn đã chọn, thuộc tập `JOURNEY_STOPS`: luca, archaea, asgard_archaea_simple, eukarya, opisthokonta, animalia, bilateria, deuterostomes, vertebrates, gnathostomes, bony_fish, rhipidistia, tetrapods, amniotes, synapsids, mammals, placental_mammals, primates, simians, great_apes, hominini, reptiles_phylo, archosauria, dinosaurs, theropods, birds, arthropoda, pancrustacea, spiralia, ecdysozoa, mollusca, cnidaria, fungi_simple, dikarya, archaeplastida, viridiplantae, land_plants, vascular_plants, seed_plants, angiosperms, sar, bacteria, proteobacteria, amoebozoa.
- Câu đọc ở mỗi điểm dừng: `Lùi về ${hiển-thị-thời-gian} — ${JOURNEY[id] ?? KID[id].line}`.
- `JOURNEY` (câu riêng cho hai hành trình chính là Người và Chim):

| id | Câu |
| --- | --- |
| hominini | tổ tiên chung của bạn và tinh tinh sống trong rừng châu Phi. |
| great_apes | tổ tiên vượn người không đuôi đu mình trên cây. |
| simians | tổ tiên khỉ và vượn có đôi mắt nhìn thẳng về phía trước. |
| primates | một con vật nhỏ sống trên cây, bàn tay biết cầm nắm. |
| placental_mammals | tổ tiên thú nhau thai nhỏ như con chuột, sống cùng thời khủng long. |
| mammals | những con thú đầu tiên có lông và cho con bú sữa. |
| synapsids | tổ tiên của thú trông giống thằn lằn nhưng không phải thằn lằn. |
| amniotes | trứng có vỏ giúp tổ tiên sống hẳn trên cạn. |
| tetrapods | cá vây thùy bò lên bờ, vây dần thành chân. |
| rhipidistia | tổ tiên có phổi, họ hàng với cá phổi. |
| bony_fish | một loài cá có bộ xương cứng. |
| gnathostomes | những con cá đầu tiên có hàm. |
| vertebrates | một sinh vật nhỏ như con cá, lần đầu có xương sống. |
| bilateria | một con vật nhỏ xíu có đầu và đuôi, bò trên đáy biển. |
| animalia | những động vật đầu tiên còn rất nhỏ và mềm. |
| opisthokonta | tổ tiên chung của bạn và cây nấm, một tế bào bơi bằng một chiếc roi. |
| eukarya | một tế bào có nhân, bên trong đã có ty thể. |
| asgard_archaea_simple | một cổ khuẩn tí hon, tổ tiên xa của mọi tế bào có nhân. |
| luca | LUCA, tổ tiên chung của mọi sinh vật. Mọi sinh vật đều là họ hàng! |
| theropods | khủng long chân thú chạy bằng hai chân. |
| dinosaurs | những con khủng long đầu tiên. |
| archosauria | tổ tiên chung của chim và cá sấu. |
| reptiles_phylo | tổ tiên bò sát có da vảy. |

Đi hết một hành trình thì nhận huy hiệu `journey`.

## M. Văn cho bé (`kid.ts`)

```ts
export const KID: Record<string, { line: string; aliases?: string[]; fact?: string }>;
```
**Cách viết `line`**:
- Ngọn và loài xưng "tớ", nhóm xưng "chúng tớ". Tối đa 25 chữ, một câu chính và nhiều nhất một câu phụ.
- Có một chi tiết gần gũi: đồ ăn, đồ vật, nơi chốn ở Việt Nam. Không dùng thuật ngữ khi không cần.
- Chỉ dùng thông tin có sẵn trong `description`, `traits` hoặc trong file này. **Không tự thêm dữ kiện mới.**
- Không viết "người tiến hóa từ khỉ" (đúng ra là có chung tổ tiên). Không mô tả gây sợ: ký sinh trùng nói nhẹ nhàng, tập trung vào việc rửa tay và giữ vệ sinh.
- Câu mẫu: xem cột `kid` ở mục D. Thêm vài câu cho node cũ:
  - ecoli_example: "Tớ sống trong ruột bạn, phần lớn anh em tớ vô hại và còn giúp làm vitamin K!"
  - anabaena_example: "Tớ xếp thành chuỗi hạt, vừa làm ra ôxi vừa bắt đạm từ không khí nuôi cây lúa!"
  - baker_yeast_example: "Tớ ăn đường, thở ra khí làm bánh mì nở phồng!"
  - songbirds: "Chim sẻ ngoài sân nhà bạn chính là họ hàng xa của khủng long!"
- Phải có đủ 251 id (test kiểm).

**`aliases`** (dùng cho tìm kiếm, không phân biệt dấu):
- cartilaginous_fish: cá mập, cá đuối
- ray_finned_fish: cá hồi, cá chép, cá vàng, cá ngừ, cá rô
- jawless_fish: cá mút đá
- coelacanths: latimeria
- carnivores: chó, mèo, hổ, sư tử, cáo, gấu, sói
- rodents: chuột, sóc, nhím
- bats: dơi
- odd_toed: ngựa, tê giác, lừa, ngựa vằn
- cows_deer: bò, trâu, dê, cừu, hươu, nai, hươu cao cổ
- pigs: heo, lợn rừng
- hippos: hà mã
- whales_dolphins: cá voi, cá heo
- humans: người, con người, bạn, em, bé
- chimpanzees: bonobo
- old_world_monkeys: khỉ, khỉ vàng, voọc, khỉ đầu chó
- new_world_monkeys: khỉ nhện, khỉ mũ
- lemurs: vượn cáo, cu li
- african_elephant, asian_elephant: voi
- monotremes: thú mỏ vịt
- marsupials: chuột túi, kangaroo, gấu túi, koala
- songbirds: chim sẻ, chim sâu, họa mi, chào mào, quạ
- birds_of_prey: đại bàng, diều hâu, ưng
- flightless_birds: đà điểu, kiwi
- crocodilians: cá sấu
- lizards_snakes: thằn lằn, rắn, tắc kè, kỳ đà, rồng komodo
- turtles: rùa, ba ba
- trex: t rex, tyrannosaurus
- sauropods: khủng long cổ dài
- ornithischia: khủng long ba sừng, triceratops, stegosaurus
- frogs_toads: ếch, cóc, nhái
- salamanders_newts: kỳ giông, sa giông
- butterflies_beetles_bees: bướm, ong, kiến, bọ rùa, muỗi, ruồi, gián, châu chấu
- spiders_scorpions_ticks: nhện, bọ cạp, ve
- crabs_shrimps_lobsters: tôm, cua, ghẹ, tôm hùm
- centipedes_millipedes: rết, cuốn chiếu
- octopuses: bạch tuộc
- squids: mực
- nautilus: ốc anh vũ
- snails: ốc, ốc sên
- slugs: sên
- clams_oysters: trai, hàu, sò, nghêu
- earthworms: giun đất
- leeches: đỉa
- tapeworms: sán
- pinworms: giun kim
- scyphozoa: sứa
- anthozoa: san hô, hải quỳ
- sea_stars: sao biển
- sea_urchins: nhím biển, cầu gai
- flowering_plants_monocots: lúa, ngô, lúa mì, tre, chuối, dừa, hoa lan
- flowering_plants_dicots: hoa hồng, đậu, táo, cam, xoài, hướng dương, cà chua
- pine_spruce_fir_examples: thông, vân sam
- ferns: dương xỉ
- mosses: rêu
- basidiomycota_simple: nấm rơm, nấm hương, nấm linh chi
- agaricus_example: nấm mỡ
- baker_yeast_example: men, men nở
- blue_mold_example: mốc xanh, penicillin
- ecoli_example: e coli
- lactobacillus_example: sữa chua, lợi khuẩn
- plasmodium_example: sốt rét
- paramecium_example: trùng giày
- amoeba_example: amip
- kelp_example: tảo bẹ, rong biển
- diatom_example: tảo cát
- euglena_example: trùng roi

## N. Câu hỏi mở
(Người code ghi vào đây nếu gặp mâu thuẫn. Không tự quyết.)
