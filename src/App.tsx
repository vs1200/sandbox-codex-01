import { GameContainer } from "./components/game/GameContainer";
import { ModeSelector } from "./components/header/ModeSelector";
import { GameOverModal } from "./components/modals/GameOverModal";
import { useGameStore } from "./stores/gameStore";

function App() {
  const gameStatus = useGameStore((s) => s.gameStatus);

  return (
    <div className="flex flex-col items-center min-h-dvh">
      <header className="w-full py-3 px-4 text-center border-b border-border">
        <h1 className="text-xl font-bold tracking-wide text-text">
          テトリスREN練習
        </h1>
      </header>

      {gameStatus === "idle" ? <ModeSelector /> : <GameContainer />}

      {gameStatus === "gameover" && <GameOverModal />}
    </div>
  );
}

export default App;
