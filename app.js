const players = ["Jérémy", "Ludo", "Quentin", "Xavien ou bien", "Vincent Balek"];
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
  { date: "2026-06-27", label: "Phase de groupes" },
  { date: "2026-06-28", label: "Seizième" },
  { date: "2026-06-29", label: "Seizième" },
  { date: "2026-06-30", label: "Seizième" },
  { date: "2026-07-01", label: "Seizième" },
  { date: "2026-07-02", label: "Seizième" },
  { date: "2026-07-03", label: "Seizième" },
  { date: "2026-07-04", label: "Huitième" },
  { date: "2026-07-05", label: "Huitième" },
  { date: "2026-07-06", label: "Huitième" },
  { date: "2026-07-07", label: "Huitième" },
  { date: "2026-07-09", label: "Quarts" },
  { date: "2026-07-10", label: "Quarts" },
  { date: "2026-07-11", label: "Quarts" },
  { date: "2026-07-14", label: "Demi-finale" },
  { date: "2026-07-15", label: "Demi-finale" },
  { date: "2026-07-18", label: "Petite finale" },
  { date: "2026-07-19", label: "Finale" }
];

/* =========================
   GLOBAL STATE
========================= */
let playersComments = {};
let chart;

/* =========================
   UPDATE SCORE
========================= */
function update(player, day) {
  const val = document.getElementById(`${player}-${day}`).value || 0;

  db.collection("days").doc(day).set({
    [player]: { value: Number(val) }
  }, { merge: true });
}

/* =========================
   💬 COMMENTAIRES GLOBAUX
========================= */
function addComment() {
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;

  db.collection("comments").add({
    name: "Anonyme",
    text,
    createdAt: Date.now()
  });

  input.value = "";
}

function listenComments() {
  db.collection("comments")
    .orderBy("createdAt")
    .onSnapshot(snapshot => {
      const container = document.getElementById("comments");
      if (!container) return;

      container.innerHTML = "";

      snapshot.forEach(doc => {
        const c = doc.data();
        container.innerHTML += `
          <div class="comment">
            <b>${c.name}</b><br>
            ${c.text}<br>
            <small>${new Date(c.createdAt).toLocaleString("fr-FR")}</small>
          </div>
        `;
      });
    });
}

/* =========================
   COMMENTAIRES JOUEURS (FIX FIABLE)
========================= */
function updatePlayerComment(player, value) {
  return db.collection("playersMeta").doc("main").set({
    [player]: value
  }, { merge: true });
}

/* =========================
   CALCUL
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
   COURBE
========================= */
function getCompletedDays(data) {
  return Object.keys(data).sort();
}

function renderChart(data) {
  const completedDays = getCompletedDays(data);

  const datasets = players.map(p => ({
    label: p,
    data: completedDays.map((_, i) => {
      let value = startCapital;

      for (let j = 0; j <= i; j++) {
        const day = data[completedDays[j]];
        if (!day) continue;

        const d = day[p];
        if (!d) continue;

        value -= stake;
        value += Number(d.value ?? 0);
      }

      return value;
    }),
    borderWidth: 2,
    tension: 0
  }));

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: completedDays.map(d =>
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
   RANKING (FIX FINAL)
========================= */
function renderRanking(capital) {
  document.getElementById("ranking").innerHTML =
    Object.entries(capital)
      .sort((a, b) => b[1] - a[1])
      .map(([p, v]) => `
        <p>
          <span class="player-name">${p}</span>
          <span class="player-score">${v}€</span>

          <input
            class="player-comment"
            value="${playersComments[p] || ''}"
            placeholder="Quoi de beau ?"
            oninput="updatePlayerComment('${p}', this.value)"
          />
        </p>
      `).join("");
}

/* =========================
   TABLE
========================= */
function renderTable(data) {
  const days = matchCalendar.map(m => m.date);

  let html = "<table><tr><th>Joueur</th>";

  days.forEach(d => {
    const m = matchCalendar.find(x => x.date === d);
    html += `<th>${m.label}</th>`;
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
}

/* =========================
   MAIN RENDER
========================= */
function render(snapshot) {
  const data = {};

  snapshot.forEach(doc => {
    data[doc.id] = doc.data();
  });

  const capital = compute(data);

  renderRanking(capital);
  renderTable(data);
  renderChart(data);
}

/* =========================
   FIRESTORE
========================= */
db.collection("days").onSnapshot(render);

listenComments();

db.collection("playersMeta").doc("main")
  .onSnapshot(doc => {
    playersComments = doc.data() || {};
  });
