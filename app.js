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
   STATE
========================= */
let playersComments = {};
let chart;

/* =========================
   SAFE ID
========================= */
function safeId(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");
}

/* =========================
   UPDATE SCORE
========================= */
function update(player, day) {
  const val = document.getElementById(`${safeId(player)}-${day}`).value || 0;

  const num = Number(val);
  if (isNaN(num)) return;

  db.collection("days").doc(day).set({
    [player]: { value: num }
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
   💬 COMMENTAIRE JOUEUR (OPTIONNEL CONSERVÉ)
========================= */
function updatePlayerComment(player) {
  const value = document.getElementById(`c-${player}`).value || "";

  db.collection("playersMeta").doc("main").set({
    [player]: value
  }, { merge: true });
}

/* =========================
   CALCUL CAPITAL
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
   HOT PLAYER (DERNIÈRE JOURNÉE)
========================= */
function getHotPlayer(data) {
  const days = Object.keys(data).sort();
  const lastDay = days[days.length - 1];
  if (!lastDay) return "-";

  const dayData = data[lastDay];
  if (!dayData) return "-";

  let bestPlayer = "-";
  let bestValue = -Infinity;

  players.forEach(p => {
    const val = dayData?.[p]?.value ?? 0;
    if (val > bestValue) {
      bestValue = val;
      bestPlayer = p;
    }
  });

  return bestPlayer;
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
    }
  });
}

/* =========================
   RANKING
========================= */
function renderRanking(capital) {
  document.getElementById("ranking").innerHTML =
    Object.entries(capital)
      .sort((a, b) => b[1] - a[1])
      .map(([p, v]) => `
        <p>
          <span class="player-name">${p}</span>
          <span class="player-score">${v}€</span>
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
          <input type="number" id="${safeId(p)}-${d}" value="${val}">
          <button onclick="update('${p}','${d}')">✓</button>
        </td>`;
    });

    html += "</tr>";
  });

  html += "</table>";

  document.getElementById("table").innerHTML = html;
}

/* =========================
   PRONOSTIC DU JOUR (FIREBASE)
========================= */
function saveDailyBet() {
  const value = document.getElementById("dailyBetInput").value || "";

  db.collection("meta").doc("global").set({
    dailyBet: value
  }, { merge: true });
}

db.collection("meta").doc("global")
  .onSnapshot(doc => {
    const data = doc.data() || {};
    const el = document.getElementById("dailyBetInput");
    if (el) el.value = data.dailyBet || "";
  });

/* =========================
   MAIN
========================= */
function render(snapshot) {
  const data = {};

  snapshot.forEach(doc => {
    data[doc.id] = doc.data();
  });

  const capital = compute(data);

  // 🔥 joueur en forme
  document.getElementById("hotPlayer").innerText = getHotPlayer(data);

  // 💰 pot total
  const pot = Object.values(capital).reduce((a, b) => a + b, 0);
  document.getElementById("potValue").innerText = pot + "€";

  renderRanking(capital);
  renderTable(data);
  renderChart(data);
}

/* =========================
   FIREBASE
========================= */
db.collection("days").onSnapshot(render);

listenComments();

db.collection("playersMeta").doc("main")
  .onSnapshot(doc => {
    playersComments = doc.data() || {};
  });
