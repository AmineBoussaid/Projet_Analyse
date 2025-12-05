import React from "react";
import { WordCloud } from "@isoterik/react-word-cloud";

export default function WordCloudChart({ words = [] }) {
  if (!words || words.length === 0)
    return <p className="text-muted text-center">Aucun mot à afficher.</p>;

  const formattedWords = words
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
    .map(([text, value]) => ({
      text,
      value: Math.max(value * 6, 300),
    }));

  return (
    <div style={{ width: "100%", height: "350px", minHeight: "350px" }}>
      <WordCloud
        words={formattedWords}
        width={700}
        height={350}
        padding={0}
        enableTooltip={true}
        rotate={(word) => {
          const rotations = [0, 15, 30, 45, -15, -30, -45, 60, -60, 90, -90];
          return rotations[Math.floor(Math.random() * rotations.length)];
        }}
      />
    </div>
  );
}
