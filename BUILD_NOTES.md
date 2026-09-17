# BUILD_NOTES · hoc-tieu-mvp (A+B+C)

## Đã làm

### A — Polish MVP học
- `usePiecePlayer.playWindow({ atBeat, before=1, after=2 })` — chỉ phát ~2–4 beat.
- `LedInject` / Sau bài / LED: truyền `atBeat` → tự phát cửa sổ.
- UX: **Đánh dấu hoàn thành bài** (Học + LED), toast mở bài tiếp, empty state Nhà/Học.
- Giữ ranh giới: `xiao_g_8`, 16 bài, localStorage tiến độ/ghi chú.

### B — Module phân tích (stub)
- Tab **Phân tích**: upload → IndexedDB (`idbAudio.ts`).
- Workflow `tieu.analyze.v1`: select / rerun (max 3) / enter note / skip / lock segment / lock song.
- Stub từ duration hoặc `job_demo_01.analyze.json`; nhãn stub rõ.
- `lockSong` → `tieu.piece.v1` → Phòng LED.

### C — Mic helper
- `PitchCheck` + `usePitchCheck` (autocorrelation).
- Gắn trên Học & LED; graceful khi từ chối mic.

### Kỹ thuật
- `base: '/hoc-tieu-mvp/'` giữ nguyên.
- Fetch lesson: `BASE_URL + 'data/...'` string — không `new URL`.
- Catalog/map bundled qua import JSON.
- `npm run build` phải xanh.

## Cách kiểm tra

### A — Replay cửa sổ
1. Học → mở bài có `after.items` → LED nghe hết → Sau bài.
2. Bấm “Xem lại quanh beat X” → LED chỉ chạy vài nốt quanh X (toast cửa sổ beat).
3. Đánh dấu hoàn thành → Nhà thấy ✓ và bài tiếp mở.

### B — Phân tích stub
1. Tab Phân tích → “Nạp demo gói giấy” hoặc chọn file audio của bạn.
2. Chọn đoạn unsure/empty → Chạy lại (≤3) / Nhập nốt / Khóa đoạn.
3. Khi hết empty+unsure → **Khóa bài → Phòng LED**.
4. DevTools → Application → IndexedDB thấy audio local.

### C — Mic
1. Học hoặc LED → Bật micro → thổi nốt đang chọn.
2. Thấy Gần đúng / Hơi lệch / Lệch xa / Chưa nghe thấy.
3. Từ chối quyền → vẫn học; hiện thông báo nhẹ.

## Khoảng trống / quyết định
1. Analyze là **stub** — không claim độ chính xác AMT.
2. Replay cửa sổ theo `tBeat`; nếu không khớp float thì lấy nearest ±1..+2 event.
3. Mic helper không lưu điểm, không chặn hoàn thành bài.
4. Không thêm instrument khác; UI ghi “chỉ tiêu 8 lỗ hơi G”.

## UI redesign (warm paper / MASTER.md)

- Tokens from `design-system/hoc-tieu/MASTER.md`: warm paper `#FFFBEB`, amber wood primary `#B45309`, teal secondary `#0F766E`, soft clay cards (18px radius + gentle shadow).
- Typography: Google Fonts **Be Vietnam Pro** (+ Noto Sans fallback); body 16px / lh 1.55.
- Bottom nav: SVG icons + Vietnamese labels, ≥44px targets, safe-area inset, fixed bar with content padding.
- Lesson rows: lock / done / open via SVG + color + label (not color-only / not emoji-only).
- Motion: ~200ms ease-out press `scale(0.98)`; `prefers-reduced-motion` honored globally.
- Focus rings on interactive controls; contrast-friendly muted text `#57534E`.
- Kept all features (Nhà/Học/Phòng LED/Sau bài/Phân tích, mic, analyze). `vite` base `/hoc-tieu-mvp/` unchanged.
