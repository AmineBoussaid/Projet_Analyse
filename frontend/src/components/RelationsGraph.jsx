// frontend/src/components/RelationsGraph.js
import React from "react";
import { Bar } from "react-chartjs-2";
import 'chart.js/auto';

export default function RelationsGraph({ relations = [] }) {
  if (!relations || relations.length === 0)
    return <p className="text-muted text-center">Aucune donnée d'import disponible.</p>;

  const dates = relations.map(r => r.date);
  const counts = relations.map(r => r.count);
  const sizes = relations.map(r => r.size / 1024);
  const allTypes = Array.from(new Set(relations.flatMap(r => Object.keys(r.types))));
  
  const typeDatasets = allTypes.map(type => ({
    label: type,
    data: relations.map(r => r.types[type] || 0),
    backgroundColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
  }));

  return (
    <div className="row g-4">
      <div className="col-12 col-lg-6">
        <h6>Nombre de documents importés par date</h6>
        <Bar
          data={{
            labels: dates,
            datasets: [{ label: "Documents", data: counts, backgroundColor: "rgba(54, 162, 235, 0.7)" }]
          }}
        />
      </div>

      <div className="col-12 col-lg-6">
        <h6>Taille totale des documents importés (Ko) par date</h6>
        <Bar
          data={{
            labels: dates,
            datasets: [{ label: "Taille (Ko)", data: sizes, backgroundColor: "rgba(255, 99, 132, 0.7)" }]
          }}
        />
      </div>

      <div className="col-12 mt-4">
        <h6>Types de fichiers importés par date</h6>
        <Bar
          data={{
            labels: dates,
            datasets: typeDatasets
          }}
          options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
        />
      </div>
    </div>
  );
}
