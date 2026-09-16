# BUILD_NOTES · hoc-tieu-mvp

## Đã làm

- Scaffold Vite + React + TS tại `/workspace/hoc-tieu-mvp`.
- Copy nguyên gói JSON vào `public/data/` (catalog, map, after-template, L01–L16, job_demo_01.exported).
- 4 tab: Nhà / Học / Phòng LED / Sau bài — UI tiếng Việt, mobile-first.
- Unlock tuần tự theo `catalog.unlockRule` + `completedIds` trong localStorage.
- Fingering LED: `holes[8…1]` từ `xiao_g_8.map.json` (`taughtIn16`).
- Player LED: lịch theo `tBeat`, BPM chỉnh ±4, synth sine+lowpass như `tieu-hoc-thu.html`.
- Sau bài: slots từ `after-template.json`, seed gợi ý từ `piece.after`, persist `tieu.afterNotes.v1`.
- Stub “Phân tích file” trên Phòng LED — không implement AMT.

## Khoảng trống / quyết định từ pack

1. **Lesson = piece:** Mỗi `Lxx.json` đã là `tieu.piece.v1` (không schema lesson riêng). Màn Học đọc goal/keys/events; Phòng LED phát cùng object.
2. **Fi / Re2:** Có trong map `taughtIn16` và L11/L16 — HTML thử cũ thiếu Fi/Re2; MVP dùng freqHz từ map.
3. **job_demo_01.exported:** Event `tBeat` không đều (0.4…21.6) — player dùng delta beat thật, không giả định 2 beat cố định.
4. **Analyze job:** `job_demo_01.analyze.json` không copy vào runtime UI (chỉ exported piece). Upload/AMT = stub.
5. **Tiêu Cầm Khúc:** Không đưa nội dung/HTML afterHtml bài mẫu bản quyền từ `tieu-hoc-thu.html` lesson 7.
6. **Replay 2–4 beat:** Nút “Xem lại” mở lại toàn piece trong LED (MVP đơn giản); chưa cắt segment hẹp theo atBeat.
7. **giao-trinh markdown:** Không render trong app — nội dung kỹ thuật đã nằm trong JSON bài + map.

## Kiểm tra

```bash
cd /workspace/hoc-tieu-mvp && npm install && npm run build
```
