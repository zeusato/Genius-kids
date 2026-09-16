export const LEARN_STORIES = [
    { id:'sun', title:'Đánh thức mặt trời', guide:'Kéo đám mây sang phải để đánh thức một mặt trời nhé.', action:'Kéo mây sang phải', noun:'mặt trời', complete:'Một mặt trời đã thức dậy!', art:'s-sun' },
    { id:'flowers', title:'Hai bông hoa khát nước', guide:'Chạm bình tưới, rồi chạm từng bông hoa để tưới nước nhé.', action:'Tưới bông hoa', noun:'bông hoa', complete:'Hai bông hoa đã nở thật đẹp!', art:'orchard' },
    { id:'balloons', title:'Bữa tiệc bóng bay', guide:'Chạm làm vỡ từng quả bóng bay và cùng đếm nhé.', action:'Chọc bóng bay', noun:'quả bóng', complete:'Ba quả bóng đã nổ tí tách!', art:'playground' },
    { id:'leaves', title:'Bốn chiếc lá bí mật', guide:'Chạm từng chiếc lá trên cây. Lá đã đếm sẽ có một con số nhé.', action:'Đếm chiếc lá', noun:'chiếc lá', complete:'Bé đã tìm đủ bốn chiếc lá!', art:'g-goat' },
    { id:'fish', title:'Bữa sáng của đàn cá', guide:'Chạm hộp thức ăn, rồi chạm từng bạn cá để cho ăn nhé.', action:'Cho cá ăn', noun:'bạn cá', complete:'Năm bạn cá đã ăn no rồi!', art:'f-fish' },
    { id:'eggs', title:'Sáu chú gà chào đời', guide:'Gõ hai lần vào mỗi quả trứng. Cùng đếm những chú gà vừa nở nhé.', action:'Gõ quả trứng', noun:'chú gà', complete:'Sáu chú gà đã chào đời!', art:'n-nest' },
    { id:'stars', title:'Nối chòm sao của bé', guide:'Chạm ngôi sao đang sáng. Nối bảy ngôi sao thành một chòm sao nhé.', action:'Thắp ngôi sao', noun:'ngôi sao', complete:'Bảy ngôi sao đã sáng trên bầu trời!', art:'k-kite' },
    { id:'blocks', title:'Tòa tháp tám tầng', guide:'Chạm từng khối gỗ để xếp một tòa tháp tám tầng nhé.', action:'Xếp khối gỗ', noun:'tầng tháp', complete:'Tòa tháp của bé có tám tầng!', art:'hideaway' },
    { id:'butterflies', title:'Xưởng vẽ cánh bướm', guide:'Chọn một màu, rồi chạm từng cánh bướm để tô màu nhé.', action:'Tô cánh bướm', noun:'cánh bướm', complete:'Chín cánh bướm đã có áo mới!', art:'u-umbrella' },
    { id:'rockets', title:'Mười chuyến bay nhỏ', guide:'Giữ tay trên từng tên lửa cho đến khi bay lên. Cùng phóng mười tên lửa nhé.', action:'Phóng tên lửa', noun:'tên lửa', complete:'Mười tên lửa đã cất cánh!', art:'j-juice' },
] as const;

export const STORY_FINISH_GUIDE = 'Bé có thể ngắm lại thành quả. Khi sẵn sàng, chạm nút Tập tô số nhé.';
export const storyFor = (value:number) => LEARN_STORIES[value-1] || LEARN_STORIES[0];
