// Importando as funções do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDZHN8midySi4NG0ZxNY2GQU_gRtTL6cWA",
  authDomain: "controle-notas-noah.firebaseapp.com",
  projectId: "controle-notas-noah",
  storageBucket: "controle-notas-noah.firebasestorage.app",
  messagingSenderId: "1072700126154",
  appId: "1:1072700126154:web:8cc319774f01ce5555d533",
  measurementId: "G-ZC8M34N8NQ"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Array de matérias
const materias = [
  "LÍNGUA PORTUGUESA", "MATEMÁTICA", "GEOGRAFIA", "HISTÓRIA",
  "CIÊNCIAS", "ARTES", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA",
  "ENSINO RELIGIOSO", "METODOLOGIA", "FÍSICA", "QUÍMICA"
];

document.addEventListener('DOMContentLoaded', function () {
  const tbody = document.getElementById('disciplinas');

  materias.forEach((materia, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${materia}</td>
      <td>
        <input type="number" id="vi-${index}" min="0" max="10" step="0.1" oninput="calcular(${index})">
        <div id="extras-vi-${index}" class="extras-area">
          <button class="add-btn" onclick="adicionarExtra('vi-${index}')">+ Atividade</button>
        </div>
        <div class="total-extra">Total VI: <span id="total-vi-${index}">0.0</span>/10</div>
        <div id="vi-msg-${index}" class="mensagem"></div>
      </td>
      <td>
        <input type="number" id="ve-${index}" min="0" max="10" step="0.1" oninput="calcular(${index})">
        <div id="extras-ve-${index}" class="extras-area">
          <button class="add-btn" onclick="adicionarExtra('ve-${index}')">+ Atividade</button>
        </div>
        <div class="total-extra">Total VE: <span id="total-ve-${index}">0.0</span>/10</div>
        <div id="ve-msg-${index}" class="mensagem"></div>
      </td>
      <td>
        <input type="number" id="vc-${index}" min="0" max="10" step="0.1" oninput="calcular(${index})">
        <div id="extras-vc-${index}" class="extras-area">
          <button class="add-btn" onclick="adicionarExtra('vc-${index}')">+ Atividade</button>
        </div>
        <div class="total-extra">Total VC: <span id="total-vc-${index}">0.0</span>/10</div>
        <div id="vc-msg-${index}" class="mensagem"></div>
      </td>
      <td id="media-${index}">-</td>
      <td id="recuperacao-msg-${index}" class="mensagem">-</td>
    `;
    tbody.appendChild(tr);

    // Buscar as notas salvas no Firestore para cada matéria
    buscarNotasFirestore(index);
  });
});

// Função para adicionar atividade extra
function adicionarExtra(id) {
  const extrasArea = document.getElementById(`extras-${id}`);
  const novoExtra = document.createElement('div');
  novoExtra.className = 'extra-item';
  novoExtra.innerHTML = `
    <input type="number" min="0" max="10" step="0.1" placeholder="Pontos" oninput="calcular(${id.split('-')[1]})">
    <input type="text" placeholder="Descrição">
    <button class="btn-lixeira" onclick="this.parentElement.remove(); calcular(${id.split('-')[1]});">🗑️</button>
  `;
  extrasArea.insertBefore(novoExtra, extrasArea.querySelector('.add-btn'));
}

// Função para calcular e atualizar as médias
function calcular(index) {
  const mediaMinima = 7.0;
  const totalMinimo = mediaMinima * 3;

  const totalVI = calcularNotaComExtras(`vi-${index}`);
  const totalVE = calcularNotaComExtras(`ve-${index}`);
  const totalVC = calcularNotaComExtras(`vc-${index}`);

  const soma = totalVI + totalVE + totalVC;
  const media = soma / 3;

  document.getElementById(`media-${index}`).textContent = media.toFixed(1);
  document.getElementById(`media-${index}`).className = media >= mediaMinima ? "media-ok" : "media-baixa";

  const viMsg = document.getElementById(`vi-msg-${index}`);
  const veMsg = document.getElementById(`ve-msg-${index}`);
  const vcMsg = document.getElementById(`vc-msg-${index}`);
  const recuperacaoMsg = document.getElementById(`recuperacao-msg-${index}`);

  viMsg.textContent = "";
  veMsg.textContent = "";
  vcMsg.textContent = "";
  recuperacaoMsg.textContent = "";

  if (totalVI > 0 && totalVE === 0 && totalVC === 0) {
    const minimoVE = (2 * mediaMinima - totalVI).toFixed(1);
    veMsg.textContent = totalVI < mediaMinima
      ? `Precisa de ${minimoVE} na VE para compensar`
      : `Mínimo ${minimoVE} na VE para manter 7.0`;
  }

  if (totalVI > 0 && totalVE > 0 && totalVC === 0) {
    const minimoVC = (totalMinimo - totalVI - totalVE).toFixed(1);
    vcMsg.textContent = `Precisa de ${minimoVC} na VC para 7.0`;
  }

  if (media < mediaMinima) {
    const notaRec = (2 * mediaMinima - media).toFixed(1);
    recuperacaoMsg.textContent = `Precisa de ${notaRec} na Rec.`;
    recuperacaoMsg.className = "mensagem recuperacao";
  }

  // Salvar as notas no Firestore
  salvarNotasFirestore(index, totalVI, totalVE, totalVC, media);
}

// Função para calcular a nota com atividades extras
function calcularNotaComExtras(id) {
  const notaPrincipal = parseFloat(document.getElementById(id).value) || 0;
  const extrasArea = document.getElementById(`extras-${id}`);
  const extrasInputs = extrasArea.querySelectorAll('.extra-item input[type="number"]');

  let somaExtras = 0;
  extrasInputs.forEach(input => {
    somaExtras += parseFloat(input.value) || 0;
  });

  let total = Math.min(notaPrincipal + somaExtras, 10);
  document.getElementById(`total-${id}`).textContent = total.toFixed(1);
  return total;
}

// Função para buscar as notas no Firestore
async function buscarNotasFirestore(index) {
  const notasRef = collection(db, "notas");
  const querySnapshot = await getDocs(notasRef);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.materia === materias[index]) {
      document.getElementById(`vi-${index}`).value = data.vi || 0;
      document.getElementById(`ve-${index}`).value = data.ve || 0;
      document.getElementById(`vc-${index}`).value = data.vc || 0;
      calcular(index); // Atualiza a média ao carregar as notas
    }
  });
}

// Função para salvar as notas no Firestore
async function salvarNotasFirestore(index, vi, ve, vc, media) {
  const notasRef = doc(db, "notas", materias[index]);
  await setDoc(notasRef, {
    materia: materias[index],
    vi: vi,
    ve: ve,
    vc: vc,
    media: media
  });
}
