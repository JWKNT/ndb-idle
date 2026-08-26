import { useCallback, useState } from "react";
import { LaunchView, SaveSelectView } from "./features";
import {
  deleteSaveSlot,
  saveSlotSummaries,
  type SaveSlot,
} from "./game/progression";
import { Game } from "./Game";

export default function App() {
  const [screen, setScreen] = useState<"title" | "saves" | "game">("title");
  const [selectedSaveSlot, setSelectedSaveSlot] = useState<SaveSlot | null>(null);
  const [slots, setSlots] = useState(() => saveSlotSummaries());
  const hasSaves = slots.some((slot) => slot.occupied);

  const showTitle = useCallback(() => {
    setSlots(saveSlotSummaries());
    setSelectedSaveSlot(null);
    setScreen("title");
  }, []);

  const start = useCallback(() => {
    const currentSlots = saveSlotSummaries();
    setSlots(currentSlots);
    if (currentSlots.some((slot) => slot.occupied)) {
      setScreen("saves");
      return;
    }
    setSelectedSaveSlot(1);
    setScreen("game");
  }, []);

  const selectSave = useCallback((slot: SaveSlot) => {
    setSelectedSaveSlot(slot);
    setScreen("game");
  }, []);

  const handleDeleteSave = useCallback((slot: SaveSlot) => {
    deleteSaveSlot(slot);
    setSlots(saveSlotSummaries());
  }, []);

  if (screen === "title") {
    return <LaunchView hasSaves={hasSaves} onStart={start} />;
  }

  if (screen === "saves" || selectedSaveSlot === null) {
    return (
      <SaveSelectView
        slots={slots}
        onSelect={selectSave}
        onDelete={handleDeleteSave}
        onBack={showTitle}
      />
    );
  }

  return (
    <Game
      key={selectedSaveSlot}
      saveSlot={selectedSaveSlot}
      onQuitToTitle={showTitle}
    />
  );
}
