import { GameContainer } from "./components/game/GameContainer";
import { RankingPage } from "./components/game/RankingPage";
import { ModeSelector } from "./components/header/ModeSelector";
import { GameOverModal } from "./components/modals/GameOverModal";
import { useGameStore } from "./stores/gameStore";

function App() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const currentPage = useGameStore((s) => s.currentPage);
  const openRankingPage = useGameStore((s) => s.openRankingPage);

  return (
    <div className="flex flex-col items-center h-dvh overflow-hidden">
      <header className="w-full py-3 px-4 text-center border-b border-border shrink-0">
        <button
          type="button"
          onClick={openRankingPage}
          className="text-xl font-bold tracking-wide text-text cursor-pointer"
        >
          テトリスREN練習
        </button>
      </header>

      {currentPage === "ranking" ? (
        <RankingPage />
      ) : gameStatus === "idle" ? (
        <ModeSelector />
      ) : (
        <GameContainer />
      )}

      {gameStatus === "gameover" && <GameOverModal />}
    </div>
  );
}

export default App;
