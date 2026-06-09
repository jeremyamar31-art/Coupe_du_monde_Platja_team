const players = ["Jérémy", "Ludo", "Quentin", "Xavien", "Vincent"];
const startCapital = 20;
const stake = 3;

/* =========================
   🏆 CALENDRIER
   ========================= */
const matchCalendar = [
  { date: "2026-06-11", label: "Ouverture" },
  { date: "2026-06-12", label: "Phase de groupes" },
  { date: "2026-06-13", label: "Phase de groupes" },
  { date: "2026-06-14", label: "Phase de groupes" },
  { date: "2026-06-15", label: "Phase de groupes" },
  { date: "2026-06-16", label: "Phase de groupes" },
  { date: "2026-06-17", label: "Phase de groupes" },
  { date: "2026-06-18", label: "Phase de groupes" },
  { date: "2026-06-19", label: "Phase de groupes" },
  { date: "2026-06-20", label: "Phase de groupes" },
  { date: "2026-06-21", label: "Phase de groupes" },
  { date: "2026-06-22", label: "Phase de groupes" },
  { date: "2026-06-23", label: "Phase de groupes" },
  { date: "2026-06-24", label: "Phase de groupes" },
  { date: "2026-06-25", label: "Phase de groupes" },
  { date: "2026-06-26", label: "Phase de groupes" },

  { date: "2026-06-27", label: "Huitièmes" },
  { date: "2026-06-28", label: "Huitièmes" },
  { date: "2026-06-29", label: "Huitièmes" },
  { date: "2026-06-30", label: "Huitièmes" },

  { date: "2026-07-03", label: "Quarts" },
  { date: "2026-07-04", label: "Quarts" },
  { date: "2026-07-05", label: "Quarts" },
  { date: "2026-07-06", label: "Quarts" },

  { date: "2026-07-09", label: "Demi-finale" },
  { date: "2026-07-10", label: "Demi-finale" },

  { date: "2026-07-13", label: "Petite finale" },
  { date: "2026-07-14", label: "Finale" }
];

/* =========================
   🔁 UPDATE
   ========================= */
function update(player, day) {
  const val = document.getElementById(`${player}-${day}`).value || 0;

  db.collection("days").doc(day).set({
    [player]: {
      value: Number(val)
    }
  }, { merge: true });
}

/* =========================
   💰 CALCUL STABLE
   ========================= */
function compute(data) {
  const result = {};
  players.forEach(p => result[p] = startCapital);

  Object.values(data).forEach(day => {
    players.forEach(p => {
      const d = day?.[p];
      if (!d) return;

      result[p] -= stake;
      result[p] += Number(d.value ?? 0);
    });
  });

  return result;
}

/* =========================
   📈 COURBE D’ÉVOLUTION
   ========================= */
let chart;

function renderChart(data) {
  const days = matchCalendar.map(m => m.date);

  const datasets = players.map(p => ({
    label: p,
    data: days.map((_, i) => {
      let value = startCapital;

      for (let j = 0; j <= i; j++) {
        const day = data[days[j]];
        if (!day) continue;

        const d = day[p];
        if (!d) continue;

        value -= stake;
        value += Number(d.value ?? 0);
      }

      return value;
    }),
    borderWidth: 2,
    tension: 0.3
  }));

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: days.map(d =>
        new Date(d).toLocaleDateString("fr-FR")
      ),
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "white" } }
      },
      scales: {
        x: { ticks: { color: "white" } },
        y: { ticks: { color: "white" } }
      }
    }
  });
}

/* =========================
   🎨 RENDER
   ========================= */
function render(snapshot) {
  const data = {};

  snapshot.forEach(doc => {
    data[doc.id] = doc.data();
  });

  const capital = compute(data);

  /* ===== classement ===== */
  document.getElementById("ranking").innerHTML =
    Object.entries(capital)
      .sort((a, b) => b[1] - a[1])
      .map(([p, v], i) =>
        `<p>${i + 1}. ${p} : ${v}€</p>`
      ).join("");

  /* ===== tableau ===== */
  const days = matchCalendar.map(m => m.date);

  let html = "<table><tr><th>Joueur</th>";

  days.forEach(d => {
    const m = matchCalendar.find(x => x.date === d);

    html += `
      <th>
        ${new Date(d).toLocaleDateString("fr-FR")}
        <br><small>${m.label}</small>
      </th>`;
  });

  html += "</tr>";

  players.forEach(p => {
    html += `<tr><td>${p}</td>`;

    days.forEach(d => {
      const val = data[d]?.[p]?.value ?? "";

      html += `
        <td>
          <input type="number" id="${p}-${d}" value="${val}">
          <button onclick="update('${p}','${d}')">✓</button>
        </td>`;
    });

    html += "</tr>";
  });

  html += "</table>";

  document.getElementById("table").innerHTML = html;

  /* ===== COURBE SOUS TABLE ===== */
  renderChart(data);
}

/* =========================
   🔥 FIRESTORE LIVE
   ========================= */
db.collection("days").onSnapshot(render);
