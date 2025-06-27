// controle-notas-noah/js/script.js - Código Completo e Corrigido

// Configurações globais
const debug = true;
const MEDIA_MINIMA = 7.0;
const materias = [
  "LÍNGUA PORTUGUESA", "MATEMÁTICA", "GEOGRAFIA", "HISTÓRIA",
  "CIÊNCIAS", "ARTES", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA",
  "ENSINO RELIGIOSO", "METODOLOGIA", "FÍSICA", "QUÍMICA"
];

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZHN8midySi4NG0ZxNY2GQU_gRtTL6cWA",
  authDomain: "controle-notas-noah.firebaseapp.com",
  projectId: "controle-notas-noah",
  storageBucket: "controle-notas-noah.appspot.com",
  messagingSenderId: "1072700126154",
  appId: "1:1072700126154:web:8cc319774f01ce5555d533"
};

// Inicialização do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Utilitários
function log(message) {
  if (debug) {
    console.log(message);
    const statusElement = document.getElementById('load-status');
    if (statusElement) statusElement.textContent = message;
  }
}

function handleError(message, error, showToUser = false) {
  console.error(message, error);
  if (showToUser) {
    updateFirebaseStatus(message, true);
    document.getElementById('loading').innerHTML = `
      <div style="text-align: center; color: red;">
        <h2>Erro no aplicativo</h2>
        <p>${message}</p>
        <button onclick="location.reload()">Recarregar</button>
      </div>
    `;
  }
}

function updateFirebaseStatus(message, isError = false) {
  log(message);
  const errorElement = document.getElementById('firebase-error');
  const errorTextElement = document.getElementById('firebase-error-text');
  
  if (isError && errorElement && errorTextElement) {
    errorElement.style.display = 'block';
    errorTextElement.textContent = message;
  }
}

// Funções de manipulação de dados (REVISADO)
function coletarDadosMateria(index) {
  const dados = {
    principal: { vi: 0, ve: 0, vc: 0 },
    extras: { vi: [], ve: [], vc: [] },
    totais: { vi: 0, ve: 0, vc: 0 }
  };

  // Coleta notas principais (CORREÇÃO: tratamento mais robusto)
  ['vi', 've', 'vc'].forEach(tipo => {
    const input = document.getElementById(`${tipo}-${index}`);
    const value = parseFloat(input?.value);
    dados.principal[tipo] = !isNaN(value) ? value : 0;
  });

  // Coleta atividades extras (CORREÇÃO: tratamento de descrições vazias)
  ['vi', 've', 'vc'].forEach(tipo => {
    const area = document.getElementById(`extras-${tipo}-${index}`);
    if (area) {
      const itens = area.querySelectorAll('.extra-item');
      itens.forEach(item => {
        const valorInput = item.querySelector('input[type="number"]');
        const descricaoInput = item.querySelector('input[type="text"]');
        
        if (valorInput) {
          const valor = parseFloat(valorInput.value) || 0;
          const descricao = descricaoInput?.value.trim() || "";
          
          dados.extras[tipo].push({
            valor: valor,
            descricao: descricao
          });
        }
      });
    }
  });

  // Calcula totais (CORREÇÃO: verificação mais rigorosa)
  ['vi', 've', 'vc'].forEach(tipo => {
    const somaExtras = dados.extras[tipo].reduce((sum, extra) => {
      return sum + (extra?.valor || 0);
    }, 0);
    
    const notaPrincipal = dados.principal[tipo] || 0;
    const total = notaPrincipal + somaExtras;
    dados.totais[tipo] = Math.min(Math.max(0, total), 10); // Garante entre 0 e 10
  });

  return dados;
}

// Funções de UI (CORRIGIDO)
function criarLinhaMateria(index, materia) {
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
  return tr;
}

window.adicionarExtra = function(id) {
  const extrasArea = document.getElementById(`extras-${id}`);
  if (!extrasArea) return;

  const novoExtra = document.createElement('div');
  novoExtra.className = 'extra-item';
  novoExtra.innerHTML = `
    <input type="number" min="0" max="10" step="0.1" placeholder="Pontos" oninput="calcular(${id.split('-')[1]})">
    <input type="text" placeholder="Descrição (obrigatório)" required>
    <button class="btn-lixeira" onclick="this.parentElement.remove(); calcular(${id.split('-')[1]});">🗑️</button>
  `;
  
  const addButton = extrasArea.querySelector('.add-btn');
  extrasArea.insertBefore(novoExtra, addButton);
};

// Funções de cálculo (REVISADO)
window.calcular = async function(index) {
  try {
    const dados = coletarDadosMateria(index);
    
    // DEBUG: Log dos dados coletados
    console.log(`Dados coletados para ${materias[index]}:`, dados);

    // CORREÇÃO: Verificação completa dos valores
    const vi = Math.min(Math.max(0, dados.totais.vi || 0), 10);
    const ve = Math.min(Math.max(0, dados.totais.ve || 0), 10);
    const vc = Math.min(Math.max(0, dados.totais.vc || 0), 10);
    
    const media = (vi + ve + vc) / 3;

    // Atualiza UI
    atualizarTotaisUI(index, { vi, ve, vc });
    atualizarMediaUI(index, media);
    atualizarMensagensUI(index, { vi, ve, vc }, media);
    
    // Salva no Firestore
    await salvarNotasFirestore(index, {
      ...dados,
      totais: { vi, ve, vc },
      media
    });
    
  } catch (error) {
    handleError(`Erro ao calcular: ${error.message}`, error, true);
  }
};

function atualizarTotaisUI(index, totais) {
  ['vi', 've', 'vc'].forEach(tipo => {
    const elemento = document.getElementById(`total-${tipo}-${index}`);
    if (elemento) elemento.textContent = totais[tipo].toFixed(1);
  });
}

function atualizarMediaUI(index, media) {
  const elementoMedia = document.getElementById(`media-${index}`);
  if (elementoMedia) {
    elementoMedia.textContent = media.toFixed(1);
    elementoMedia.className = media >= MEDIA_MINIMA ? "media-ok" : "media-baixa";
  }
}

function atualizarMensagensUI(index, totais, media) {
  const { vi, ve, vc } = totais;
  const mensagens = {
    vi: "",
    ve: "",
    vc: "",
    recuperacao: ""
  };

  if (vi > 0 && ve === 0 && vc === 0) {
    const minimoVE = (2 * MEDIA_MINIMA - vi).toFixed(1);
    mensagens.ve = vi < MEDIA_MINIMA
      ? `Precisa de ${minimoVE} na VE para compensar`
      : `Mínimo ${minimoVE} na VE para manter 7.0`;
  }

  if (vi > 0 && ve > 0 && vc === 0) {
    const minimoVC = (3 * MEDIA_MINIMA - vi - ve).toFixed(1);
    mensagens.vc = `Precisa de ${minimoVC} na VC para 7.0`;
  }

  if (media < MEDIA_MINIMA) {
    const notaRec = (2 * MEDIA_MINIMA - media).toFixed(1);
    mensagens.recuperacao = `Precisa de ${notaRec} na Rec.`;
  }

  // Aplica mensagens na UI
  Object.keys(mensagens).forEach(tipo => {
    const elemento = document.getElementById(`${tipo}-msg-${index}`);
    if (elemento) {
      elemento.textContent = mensagens[tipo];
      if (tipo === 'recuperacao' && mensagens[tipo]) {
        elemento.className = "mensagem recuperacao";
      }
    }
  });
}

// Funções do Firestore (REVISADO)
async function buscarNotasFirestore(index) {
  try {
    log(`Buscando notas para ${materias[index]}...`);
    const docRef = doc(db, "notas", materias[index]);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Carrega notas principais
      ['vi', 've', 'vc'].forEach(tipo => {
        const input = document.getElementById(`${tipo}-${index}`);
        if (input && data[tipo] !== undefined) {
          input.value = data[tipo];
        }
      });

      // Carrega atividades extras (CORREÇÃO: melhor tratamento de dados)
      if (data.extras) {
        ['vi', 've', 'vc'].forEach(tipo => {
          const area = document.getElementById(`extras-${tipo}-${index}`);
          if (area && Array.isArray(data.extras[tipo])) {
            area.innerHTML = '<button class="add-btn" onclick="adicionarExtra(\'' + tipo + '-' + index + '\')">+ Atividade</button>';
            
            data.extras[tipo].forEach(extra => {
              if (extra && typeof extra === 'object') {
                const novoExtra = document.createElement('div');
                novoExtra.className = 'extra-item';
                novoExtra.innerHTML = `
                  <input type="number" value="${extra.valor || 0}" min="0" max="10" step="0.1" oninput="calcular(${index})">
                  <input type="text" value="${extra.descricao || ''}" placeholder="Descrição" required>
                  <button class="btn-lixeira" onclick="this.parentElement.remove(); calcular(${index});">🗑️</button>
                `;
                area.appendChild(novoExtra);
              }
            });
          }
        });
      }

      // Dispara cálculo inicial (CORREÇÃO: timeout para garantir renderização)
      setTimeout(() => calcular(index), 100);
    }
  } catch (error) {
    handleError(`Erro ao buscar notas: ${error.message}`, error, true);
  }
}

async function salvarNotasFirestore(index, dados) {
  try {
    log(`Salvando notas para ${materias[index]}...`);
    
    // CORREÇÃO: Garante que todos os valores sejam números válidos
    const vi = !isNaN(dados.totais.vi) ? dados.totais.vi : 0;
    const ve = !isNaN(dados.totais.ve) ? dados.totais.ve : 0;
    const vc = !isNaN(dados.totais.vc) ? dados.totais.vc : 0;
    const media = (vi + ve + vc) / 3;

    // CORREÇÃO: Formata os dados antes de salvar
    const dadosParaSalvar = {
      materia: materias[index],
      vi: parseFloat(dados.principal.vi.toFixed(1)),
      ve: parseFloat(dados.principal.ve.toFixed(1)),
      vc: parseFloat(dados.principal.vc.toFixed(1)),
      extras: {
        vi: dados.extras.vi.map(extra => ({
          valor: parseFloat(extra.valor.toFixed(1)),
          descricao: extra.descricao || ""
        })),
        ve: dados.extras.ve.map(extra => ({
          valor: parseFloat(extra.valor.toFixed(1)),
          descricao: extra.descricao || ""
        })),
        vc: dados.extras.vc.map(extra => ({
          valor: parseFloat(extra.valor.toFixed(1)),
          descricao: extra.descricao || ""
        }))
      },
      totais: {
        vi: parseFloat(vi.toFixed(1)),
        ve: parseFloat(ve.toFixed(1)),
        vc: parseFloat(vc.toFixed(1))
      },
      media: parseFloat(media.toFixed(1)),
      ultimaAtualizacao: new Date()
    };

    await setDoc(doc(db, "notas", materias[index]), dadosParaSalvar);
    
    // DEBUG: Log dos dados salvos
    console.log(`Dados salvos para ${materias[index]}:`, dadosParaSalvar);
    
  } catch (error) {
    handleError(`Erro ao salvar notas: ${error.message}`, error, true);
  }
}

// Inicialização da aplicação (MANTIDO)
async function loadApp() {
  try {
    log("Carregando disciplinas...");
    const tbody = document.getElementById('disciplinas');
    if (!tbody) throw new Error("Elemento 'disciplinas' não encontrado");

    // Limpa loading e mostra o app
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';

    // Cria linhas para cada matéria
    materias.forEach((materia, index) => {
      tbody.appendChild(criarLinhaMateria(index, materia));
      buscarNotasFirestore(index).catch(e => console.error(e));
    });

    log("Aplicação carregada com sucesso!");
  } catch (error) {
    handleError(`Erro ao carregar aplicação: ${error.message}`, error, true);
  }
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', () => {
  log("DOM carregado, iniciando aplicação...");
  loadApp().catch(error => {
    handleError(`Erro ao iniciar aplicação: ${error.message}`, error, true);
  });
});















<input type="text" value="" placeholder="Descrição" required=""></input>