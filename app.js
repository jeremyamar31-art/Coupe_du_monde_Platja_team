const players = ["Jérémy", "Ludo", "Quentin", "Xavien", "Vincent"];
const startCapital = 20;
const stake = 3;

// update
function update(player, day) {
  const val = document.getElementById(`${player}-${day}`).value || 0;

  db.collection("days").doc(day).set({
    [player]: {
      value: Number(val),
      participated: true
    }
  }, { merge: true });
}

// calcul capital
function compute(data) {
  const result = {};
  players.forEach(p => result[p] = startCapital);

  Object.values(data).forEach(day => {
    players.forEach(p => {
      const d = day?.[p];
      if (!d) return;

      if (d.participated) result[p] -= stake;
      result[p] += Number(d.value || 0);
    });
  });

  return result;
}

// render
function render(snapshot) {
  const data = {};

  snapshot.forEach(doc => {
    data[doc.id] = doc.data();
  });

  const capital = compute(data);

  // classement
  document.getElementById("ranking").innerHTML =
    Object.entries(capital)
      .sort((a,b) => b[1] - a[1])
      .map(([p,v],i) =>
        `<p>${i+1}. ${p} : ${v}€</p>`
      ).join("");

  const days = Object.keys(data).sort();

  // tableau
  let html = "<table border='1'><tr><th>Joueur</th>";

  days.forEach(d => {
    html += `<th>${d}</th>`;
  });

  html += "</tr>";

  players.forEach(p => {
    html += `<tr><td>${p}</td>`;

    days.forEach(d => {
      const val = data[d]?.[p]?.value ?? "";
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

// realtime
db.collection("days").onSnapshot(render);
