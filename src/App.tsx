import { useCallback, useEffect, useState } from 'react';
import { Nav } from './components/Nav';
import { loadCatalog, loadMap } from './lib/data';
import { loadProgress } from './lib/storage';
import { AfterPage } from './pages/AfterPage';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { LedPage } from './pages/LedPage';
import type {
  ProgressState,
  ScreenId,
  TieuCatalog,
  TieuMap,
  TieuPiece,
} from './types/tieu';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('home');
  const [catalog, setCatalog] = useState<TieuCatalog | null>(null);
  const [map, setMap] = useState<TieuMap | null>(null);
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [ledPiece, setLedPiece] = useState<TieuPiece | null>(null);
  const [bootErr, setBootErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadCatalog(), loadMap()])
      .then(([c, m]) => {
        setCatalog(c);
        setMap(m);
        setLessonId((id) => id ?? c.lessons[0]?.id ?? null);
      })
      .catch((e: Error) => setBootErr(e.message));
  }, []);

  const openLesson = useCallback((id: string) => {
    setLessonId(id);
    setScreen('learn');
  }, []);

  const playInLed = useCallback((piece: TieuPiece) => {
    setLedPiece(piece);
    setLessonId(piece.pieceId);
    setScreen('led');
  }, []);

  const goAfter = useCallback((id: string) => {
    setLessonId(id);
    setScreen('after');
  }, []);

  const onLedFinished = useCallback((piece: TieuPiece) => {
    setLessonId(piece.pieceId);
  }, []);

  if (bootErr) {
    return (
      <div className="phone">
        <p className="error pad">{bootErr}</p>
      </div>
    );
  }

  if (!catalog || !map) {
    return (
      <div className="phone">
        <p className="muted pad">Đang tải gói giáo trình…</p>
      </div>
    );
  }

  return (
    <div className="phone">
      <main className="main">
        {screen === 'home' && (
          <HomePage
            catalog={catalog}
            progress={progress}
            onOpenLesson={openLesson}
            onGoLed={() => setScreen('led')}
          />
        )}
        {screen === 'learn' && (
          <LearnPage
            catalog={catalog}
            map={map}
            progress={progress}
            selectedId={lessonId}
            onSelect={setLessonId}
            onProgress={setProgress}
            onPlayInLed={playInLed}
            onGoAfter={goAfter}
          />
        )}
        {screen === 'led' && (
          <LedPage
            catalog={catalog}
            map={map}
            injected={ledPiece}
            onClearInjected={() => setLedPiece(null)}
            onFinished={onLedFinished}
          />
        )}
        {screen === 'after' && (
          <AfterPage
            catalog={catalog}
            lessonId={lessonId}
            onSelectLesson={setLessonId}
            onReplay={(piece) => playInLed(piece)}
          />
        )}
      </main>
      <Nav current={screen} onChange={setScreen} />
    </div>
  );
}
