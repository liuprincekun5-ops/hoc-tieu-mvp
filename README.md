# Học tiêu 8 lỗ hơi G · MVP (A+B+C)

Ứng dụng web học tiêu (xiao) 8 lỗ hơi G — cầm **trái trên**. Dữ liệu từ gói giấy `tieu-pack` (catalog, map, 16 bài, piece/analyze demo).

## Chạy local

```bash
cd /workspace/hoc-tieu-mvp
npm install
npm run dev
```

Mở URL Vite in ra (thường `http://localhost:5173/hoc-tieu-mvp/`).

Build production:

```bash
npm run build
npm run preview
```

`base: '/hoc-tieu-mvp/'` trong `vite.config.ts` — giữ nguyên khi deploy GitHub Pages.

## Màn hình

| Tab | Việc |
|---|---|
| **Nhà** | 16 bài / 4 tầng, tiến độ localStorage, mở khóa tuần tự |
| **Học** | Ngón từ map, chuỗi nốt, **Đánh dấu hoàn thành bài**, mic “chấm gần đúng” (tùy chọn) |
| **LED** | Phát `tieu.piece.v1` (LED + synth). Hỗ trợ **replay cửa sổ beat** (atBeat−1…atBeat+2) |
| **Phân tích** | Upload audio (IndexedDB local), vòng locked/unsure/empty (stub), `lock_song` → LED |
| **Sau bài** | Ghi chú theo template; nút phát lại 2–4 beat quanh `atBeat` |

## A — Polish học

- Replay chỉ cửa sổ quanh `atBeat` (không phát cả bài).
- Nút **Đánh dấu hoàn thành bài** rõ trên Học/LED; mở bài tiếp mượt.
- Empty state / copy tiếng Việt, mobile-first.
- Ranh giới: một nhạc cụ `xiao_g_8`, 16 bài, không nửa cung, tiến độ/ghi chú chỉ localStorage.

## B — Phân tích upload (stub)

- Chọn file audio bạn sở hữu → metadata + ArrayBuffer trong **IndexedDB** (không cloud).
- Đoạn: locked / unsure / empty; người điều khiển vòng lặp.
- `rerun_segment` tối đa 3 lần / đoạn.
- `lock_song` chỉ khi hết empty & unsure → xuất `tieu.piece.v1` → Phòng LED.
- Stub: placeholder theo duration hoặc nạp `job_demo_01.analyze.json`. **Gắn nhãn rõ “thử nghiệm / stub”** — không nhận dạng thật.

## C — Mic chấm gần đúng

- Web Audio AnalyserNode + autocorrelation.
- So với `freqHz` trên map: gần đúng / hơi lệch / lệch xa.
- Tùy chọn; từ chối quyền mic vẫn học bình thường.
- Không phải máy chấm điểm bài.

## Ranh giới

**Có:** tiêu 8 lỗ hơi G, 16 bài, LED+synth, sau bài, phân tích stub local, mic helper.

**Không:** AMT thật, guitar/violin, nội dung *Tiêu Cầm Khúc* / nhạc phim 1996, nửa cung trong 16 bài đầu.

## Dữ liệu

- Bundled: `src/data/catalog.json`, `xiao-g-8.json`, `after-template.json`
- Fetch bài: `${import.meta.env.BASE_URL}data/...` (string concat — **không** `new URL(..., BASE_URL)`)
- `public/data/lessons/L01…L16`, `public/data/jobs/job_demo_01.*.json`

## Stack

Vite + React + TypeScript.
