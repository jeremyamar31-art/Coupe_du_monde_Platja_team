const players = ["Jérémy", "Ludo", "Quentin", "Xavien", "Vincent"];
const startCapital = 20;
const stake = 3;

// récup données
async function loadData() {
  const snap = await db.collection("days").get();
  const data = {};
  snap.forEach(doc => data[doc.id] = doc.data());
  return data;
}

// sauvegarde
function saveDay(day, player, value, participated) {
  db.collection("days").doc(day).set({
    [player]: { value, participated }
  }, { merge: true });
}

// calcul capital
function compute(data) {
  const result = {};
  players.forEach(p => result[p] = startCapital);

  Object.keys(data).forEach(day => {
    players.forEach(p => {
      const d = data[day][p];
      if (!d) return;

      if (d.participated) result[p] -= stake;
      result[p] += Number(d.value || 0);
    });
  });

  return result;
}

// UI tableau simple
async function render() {
  const data = await loadData();
  const capital = compute(data);

  document.getElementById("ranking").innerHTML =
    Object.entries(capital)
      .sort((a,b) => b[1]-a[1])
      .map(([p,v],i)=> `<p>${i+1}. ${p} : ${v}€</p>`)
      .join("");

  const days = Object.keys(data);

  let html = "<table><tr><th>Joueur</th>" +
    days.map(d=>`<th>${d}</th>`).join("") + "</tr>";

  players.forEach(p=>{
    html += `<tr><td>${p}</td>`;
    days.forEach(d=>{
      const val = data[d]?.[p]?.value || "";
      const part = data[d]?.[p]?.participated ? "✓" : "✗";

      html += `
      <td>
        <input type="number" id="${p}-${d}" value="${val}">
        <button onclick="update('${p}','${d}')">${part}</button>
      </td>`;
    });
    html += "</tr>";
  });

  html += "</table>";
  document.getElementById("table").innerHTML = html;
}

// update
function update(player, day) {
  const val = document.getElementById(`${player}-${day}`).value || 0;

  db.collection("days").doc(day).set({
    [player]: {
      value: Number(val),
      participated: true
    }
  }, { merge: true });

  render();
}

// init
db.collection("days").onSnapshot(render);