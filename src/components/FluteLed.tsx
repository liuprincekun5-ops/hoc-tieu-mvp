import type { HoleState, TieuMap } from '../types/tieu';
import './FluteLed.css';

interface Props {
  map: TieuMap;
  holes: HoleState[] | null;
  blowing?: boolean;
}

const HOLE_TOPS = [92, 118, 158, 198, 250, 290, 330, 370]; // px for holes 8..1

export function FluteLed({ map, holes, blowing = false }: Props) {
  const states = holes ?? [0, 0, 0, 0, 0, 0, 0, 0];
  const order = map.holeOrder; // [8,7,6,5,4,3,2,1]

  return (
    <div className="stage">
      <div className="side left">
        <b>Mặt sau</b>
        Lỗ 8
        <br />
        Ngón cái
        <br />
        tay trái
      </div>
      <div className="flute-wrap">
        <div className="flute" aria-label="Mô hình tiêu 8 lỗ">
          <div className={`blow${blowing ? ' pulse' : ''}`} />
          {order.map((holeNum, i) => {
            const closed = states[i] === 1;
            const isThumb = holeNum === 8;
            return (
              <div
                key={holeNum}
                className={`hole${isThumb ? ' thumb' : ''} ${closed ? 'closed' : 'open'}`}
                style={{ top: HOLE_TOPS[i] }}
                title={map.holeMeta[String(holeNum)]?.labelVi ?? `Lỗ ${holeNum}`}
              />
            );
          })}
        </div>
      </div>
      <div className="side right">
        <b>Tay trái trên</b>
        Lỗ 7 trỏ
        <br />
        Lỗ 6 giữa
        <br />
        Lỗ 5 áp út
        <br />
        <br />
        <b>Tay phải dưới</b>
        Lỗ 4 trỏ
        <br />
        Lỗ 3 giữa
        <br />
        Lỗ 2 áp út
        <br />
        Lỗ 1 út
      </div>
    </div>
  );
}
