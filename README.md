# Học tiêu 8 lỗ hơi G · MVP

Ứng dụng web học tiêu (xiao) 8 lỗ hơi G — cầm **trái trên**. Dữ liệu lấy từ gói giấy `tieu-pack` (catalog, map, 16 bài, piece demo).

## Chạy local

```bash
cd /workspace/hoc-tieu-mvp
npm install
npm run dev
```

Mở URL Vite in ra (thường `http://localhost:5173`).

Build production:

```bash
npm run build
npm run preview
```

## Màn hình

| Tab | Việc |
|---|---|
| **Nhà** | Tổng quan khóa 16 bài theo 4 tầng, tiến độ localStorage, mở bài đã unlock |
| **Học** | Chọn bài tuần tự (`unlockRule: sequential`), xem ngón từ `xiao_g_8.map.json`, chuỗi nốt từ `Lxx.json` |
| **Phòng LED** | Chỉ phát `tieu.piece.v1` — LED lỗ + synth Web Audio (port từ `tieu-hoc-thu.html`). Nguồn: bài học hoặc `jobs/job_demo_01.exported.json` |
| **Sau bài** | Ghi chú theo `after-template.json` / `tieu.after.v1`, lưu localStorage; xem lại đoạn LED |

## Dữ liệu

Copy trong `public/data/`:

- `catalog.json`, `xiao_g_8.map.json`, `after-template.json`
- `lessons/L01.json` … `L16.json`
- `jobs/job_demo_01.exported.json`

App **không** hardcode nội dung bài — luôn `fetch` JSON.

## Ranh giới MVP

**Có:** một nhạc cụ `xiao_g_8`, 16 bài, LED+synth, ghi chú sau bài, luyện lại bài đã mở, chỉ dữ liệu local.

**Không:** mic chấm nốt, guitar/violin, nội dung *Tiêu Cầm Khúc* 1996, vòng AMT tự động, nửa cung trong 16 bài đầu. Mục phân tích upload là stub tắt.

## Stack

Vite + React + TypeScript.
