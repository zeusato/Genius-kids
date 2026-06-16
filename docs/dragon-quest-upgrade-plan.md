# Phương án nâng cấp & refactor game "Đại Chiến Rồng Thần" (DragonQuest)

> Tổng hợp ngày 16/06/2026. **Trạng thái: ĐÃ TRIỂN KHAI.** Refactor toàn diện theo
> đúng pattern 3 tầng của GearsGame (engine thuần / hook điều phối / component render).
> Giữ NGUYÊN luật chơi & cân bằng cũ (50 ô, phân bố 40/20/15%, 3 mạng, công thức buff/boss).

---

## 1. Bối cảnh

Bản cũ gộp toàn bộ state machine + timing trong 1 component `DragonQuestGame.tsx` (~490 dòng);
3 modal (Combat/Buff/Boss) lặp `renderVisual`/`renderInput`; timing là magic-number ghép tay
(parent đợi 1700ms để khớp animation 1500ms của DiceRoll); `generateMap` dùng `Math.random`
(không test được); `endGame(victory)` bỏ qua tham số (suy ra thắng/thua ngầm); nhánh boss
trả lời sai dùng `playerHP` cũ (stale closure). Responsive yếu (ô 40px, bàn cờ không cuộn
theo nhân vật, modal Combat/Buff thiếu `overflow-y-auto`). Hiệu ứng & thoại nghèo, chưa có TTS.

## 2. Kiến trúc đích (đã làm)

```
games/DragonQuest/
├── engine/        # THUẦN, không React, tất định, seeded — test được
│   ├── constants.ts   # NGUỒN SỰ THẬT DUY NHẤT: MAP_LENGTH, phân bố ô, HP, cap buff,
│   │                  #   SCORE, mốc thời gian (DICE_MS/STEP_MS/FEEDBACK_MS/TELEPORT_MS), DUCK/MUSIC_VOLUME, BOARD
│   ├── types.ts       # TileType/BuffType/MapTile/PlayerBuffs/Phase/FxState/GameState/Action
│   ├── rng.ts         # mulberry32 (mượn GearsGame)
│   ├── map.ts         # generateMap(rng) seeded
│   ├── mechanics.ts   # rollDice/calculateTeleport/getRandomBuff/calculateBossQuestions (nhận rng)
│   ├── buffs.ts       # addBuff thuần + metadata tên/mô tả/icon
│   ├── dialogue.ts    # mọi pool thoại + pickDialogue(rng) + questionToSpeech(q)
│   ├── reducer.ts     # (state,action)=>state — TRÁI TIM, thuần & đồng bộ; getMedal/initialState
│   └── engine.test.ts # vitest (23 test)
├── hooks/
│   ├── useDragonQuest.ts  # useReducer + điều phối timer (roll→step→arrive) + sinh RNG/câu hỏi
│   └── useGameTTS.ts      # voiceSpeak/voiceSequence/voiceCancel (DUCKING) + tự đọc theo phase
├── components/
│   ├── GameBoard.tsx (camera bám nhân vật + tiến độ "Ô X/50" + nút căn camera)
│   ├── GameHeader.tsx (responsive, chip gọn) · DiceRoll.tsx (mặt chấm bi, parent điều khiển)
│   ├── QuestionPanel.tsx (renderVisual+renderInput DÙNG CHUNG) · EventModal.tsx (vỏ combat/buff/boss + feedback + timer boss)
│   ├── TeleportOverlay.tsx · VoiceButton.tsx · fx/GameFx.tsx · fx/Confetti.tsx
└── DragonQuestGame.tsx  # MỎNG: ghép hook + render 3 màn intro/playing/gameover
```

**Tách timing/RNG để test:** reducer thuần — mọi giá trị ngẫu nhiên (xúc xắc, câu hỏi, thoại,
buff, teleport) do hook giải sẵn và truyền qua payload action. ⇒ test toàn bộ luật chơi không
cần fake timer/random. **Sửa bug khi viết lại:** thắng/thua tường minh (`result`), boss dùng HP
hiện tại trong state (hết stale closure), medal tính thuần.

## 3. Ba điểm nâng cấp theo yêu cầu

1. **Responsive + camera bám nhân vật:** `GameBoard` bọc scroll container, mỗi khi đổi ô tự
   `scrollTo` căn nhân vật vào giữa; ô lớn hơn trên mobile (BOARD.mobile/desktop); header
   `flex-wrap` chip gọn; modal `max-h-[100dvh]` + `overflow-y-auto`, 1 cột trên mobile (nhân vật
   `order-first`). Tôn trọng `prefers-reduced-motion`.
2. **Hiệu ứng + thoại:** feedback đúng/sai trong modal (✓/✗ + `soundManager` + TTS động viên)
   trước khi đóng; `GameFx` điểm bay +N / flash trúng đòn / nhận buff; `Confetti` khi thắng;
   xúc xắc mặt chấm bi; nhân vật nhảy từng ô. Thoại mở rộng: WIN/LOSE/CORRECT/WRONG/BUFF_AWARD/TELEPORT.
3. **TTS (tự đọc + nghe lại + ducking):** `useGameTTS` tự đọc thoại+câu hỏi khi vào ô sự kiện;
   `VoiceButton` để nghe lại; **ducking** giảm nhạc nền còn `DUCK_VOLUME` khi đọc, khôi phục
   `MUSIC_VOLUME` (0.4) khi xong — qua `musicManager.setVolume`. MỌI lời nói đi qua voiceSpeak/
   voiceCancel để không kẹt âm lượng (gọi speak() thô sẽ huỷ onEnd → nhạc kẹt mức giảm).
   Dùng cơ chế `src/utils/speech.ts` sẵn có (thiết bị → MP3 → Google).

## 4. Tương thích
Giữ tên export `DragonQuestGame` + props `{difficulty,onBack,onComplete}` ⇒ `games/GamesMenu.tsx`
không phải sửa. Xoá `dragonQuestEngine.ts` cũ và 4 modal cũ (Combat/Buff/Boss/Teleport).

## 5. Kiểm thử (đã chạy)
- `npm test` → 87 pass (23 test DragonQuest: map/dice/teleport/boss/cap buff/chuỗi reducer thắng-thua/seed).
- `tsc --noEmit` → 0 lỗi toàn dự án. `npm run build` → exit 0.
- Preview thủ công: intro/board/roll→move→camera-follow→buff modal→trả lời đúng→feedback "Chính xác!"
  →+15 điểm + nhận buff; responsive 375px (header 1 hàng, bàn cờ phủ đủ chiều cao + cuộn nội bộ); 0 console error.
- Lưu ý: preview tab ẩn throttle timer/rAF; TTS audio cần thiết bị thật để nghe trọn (giống các mục khác).
