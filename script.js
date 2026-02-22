// ===============================
// LISTA DE MESTRES (DESAFIANTES)
// ===============================
const MESTRES = [
  { nome: "Rebeca sabe tudo", frase: "Quer avançar? Primeiro precisa me vencer!" },
  { nome: "Izadora inteligente", frase: "Mostre que tem coragem... ou desista!" },
  { nome: "Isabela rápida", frase: "Você vai ter que ser MUITO rápido pra me vencer!" },
  { nome: "Lúcia esperta", frase: "Vamos ver se você é bom mesmo!" },
  { nome: "Carla veloz", frase: "Duvido você me derrotar!" },
  { nome: "Lucas mestre", frase: "Mostre o que você aprendeu!" },
  { nome: "Bruno ágil", frase: "Isso não vai ser fácil!" },
  { nome: "André o sábio", frase: "Está pronto para um desafio de verdade?" },
  { nome: "Felipe especialista", frase: "Você aguenta a pressão?" },
  { nome: "Roberto o gênio", frase: "Eu sou o gênio… prove o contrário!" }
];

// =======================
// ESTADO DO JOGO
// =======================
let tabuada = 1;
let numeroAtual = 1;

let fase = "facil";
let meta = 20;

let etapa = "normal"; // "normal" ou "aleatorio"

let tempo = 60;
let intervalo = null;

let acertos = 0;
let erros = 0;

let jogoAtivo = false;
let cronometroAtivo = false;

let aguardandoDecisao = false;
let tabuadaAtual = 1;
let faseAtual = "facil";

let modalArmedAt = 0; // trava Enter logo após abrir modal

// =======================
// ELEMENTOS
// =======================
const faseSelect = document.getElementById("faseSelect");
const tabuadaSelect = document.getElementById("tabuadaSelect");

const cartaEsquerda = document.getElementById("cartaEsquerda");
const cartaDireita  = document.getElementById("cartaDireita");
const numEsquerda   = document.getElementById("numEsquerda");
const numDireita    = document.getElementById("numDireita");

const respostaInput = document.getElementById("respostaInput");
const tempoSpan = document.getElementById("tempo");
const acertosSpan = document.getElementById("acertos");
const errosSpan = document.getElementById("erros");
const fimJogoDiv = document.getElementById("fimJogo");

const pilhaDireita = document.getElementById("pilhaDireita");
const contadorCartas = document.getElementById("contadorCartas");
const pilhaZerouMsg = document.getElementById("pilhaZerouMsg");
const labelTabuada = document.getElementById("labelTabuada");

const modal = document.getElementById("modal");
const modalTitulo = document.getElementById("modalTitulo");
const modalTexto = document.getElementById("modalTexto");
const btnSim = document.getElementById("btnSim");
const btnNao = document.getElementById("btnNao");

const fxCanvas = document.getElementById("fxCanvas");
const fxCtx = fxCanvas ? fxCanvas.getContext("2d") : null;

// =======================
// TECLADO VIRTUAL (MOBILE)
// =======================
const keypad = document.getElementById("keypad");

function isMobileLike() {
  const byPointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const byTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
  return byPointer || byTouch;
}

function setKeypadLayoutFlags() {
  document.body.classList.toggle("is-mobile", isMobileLike());
}

function showKeypad() {
  if (!keypad) return;
  keypad.classList.remove("hidden");
  keypad.setAttribute("aria-hidden", "false");
  document.body.classList.add("keypad-on");
  setKeypadLayoutFlags();
}

function hideKeypad() {
  if (!keypad) return;
  keypad.classList.add("hidden");
  keypad.setAttribute("aria-hidden", "true");
  document.body.classList.remove("keypad-on");
  setKeypadLayoutFlags();
}

function focusRespostaSeguro() {
  if (!respostaInput) return;
  if (isMobileLike()) {
    respostaInput.blur();
    showKeypad();
  } else {
    respostaInput.focus();
  }
}

let inputHooks = false;

function ensureMobileInputMode() {
  if (!respostaInput) return;

  if (isMobileLike()) {
    respostaInput.disabled = true;
    respostaInput.setAttribute("inputmode", "none");
    respostaInput.setAttribute("autocomplete", "off");
    if (respostaInput.type !== "text") respostaInput.type = "text";
    showKeypad();

    if (!inputHooks) {
      const block = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showKeypad();
      };
      respostaInput.addEventListener("touchstart", block, { passive: false });
      respostaInput.addEventListener("click", block);
      inputHooks = true;
    }
  } else {
    respostaInput.disabled = false;
    respostaInput.removeAttribute("readonly");
    respostaInput.setAttribute("inputmode", "numeric");
    if (respostaInput.type !== "number") respostaInput.type = "number";
    hideKeypad();
  }
}

// =======================
// AUTO-INICIAR
// =======================
function tabuadaSelecionadaValida() {
  return !!(tabuadaSelect && tabuadaSelect.value && tabuadaSelect.value !== "");
}

function autoStartIfNeeded() {
  if (aguardandoDecisao) return false;
  if (jogoAtivo) return false;
  if (!tabuadaSelecionadaValida()) return false;

  window.iniciarJogo(true); // sem cronômetro (cronômetro só no verificar)
  return true;
}

// =======================
// DESAFIO DOS MESTRES (POOL SEM REPETIR)
// =======================
let mestresPool = [];
let mestresAtivos = true;

function prepararMestresParaJogada(tabuadaInicial) {
  const qtd = (10 - tabuadaInicial) + 1;
  const copia = [...MESTRES];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  mestresPool = copia.slice(0, qtd);
}

function pegarProximoMestre() {
  if (!mestresPool || mestresPool.length === 0) return null;
  return mestresPool.shift();
}

// =======================
// DUELO (overlay criado via JS)
// =======================
let dueloEl = null;
let dueloAtivo = false;
let duelo = {
  mestre: null,
  pontosAluno: 0,
  pontosMestre: 0,
  errosAluno: 0,
  errosMestre: 0,
  rodadasRestantes: 0,
  cronMestreTimer: null,
  perguntaToken: 0,
  tempoMestreMs: 0
};

function ensureDueloOverlay() {
  if (dueloEl) return;

  dueloEl = document.createElement("div");
  dueloEl.id = "dueloOverlay";
  dueloEl.className = "duelo hidden";
  dueloEl.innerHTML = `
    <div class="duelo-box">
      <div class="duelo-top">
        <div class="duelo-nome" id="dueloMestreNome">MESTRE</div>
        <div class="duelo-placar">
          <div>⭐ Pontos: <span id="dueloMestrePontos">0</span></div>
          <div>❌ Erros: <span id="dueloMestreErros">0</span></div>
          <div class="duelo-tempo">⏱️ <span id="dueloTempoMestre">--</span></div>
        </div>
      </div>

      <div class="duelo-mid">
        <div class="duelo-versus">VS</div>
      </div>

      <div class="duelo-bot">
        <div class="duelo-nome" id="dueloAlunoNome">VOCÊ</div>
        <div class="duelo-placar">
          <div>⭐ Pontos: <span id="dueloAlunoPontos">0</span></div>
          <div>❌ Erros: <span id="dueloAlunoErros">0</span></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(dueloEl);

  const style = document.createElement("style");
  style.textContent = `
    .duelo{ position: fixed; inset: 0; display: grid; place-items: center; z-index: 12000; pointer-events:none; }
    .duelo.hidden{ display:none; }
    .duelo-box{
      pointer-events:none;
      width: min(720px, 96vw);
      border-radius: 18px;
      padding: 10px 12px;
      background: rgba(0,0,0,.18);
      border: 1px solid rgba(255,255,255,.10);
      backdrop-filter: blur(6px);
    }
    .duelo-top, .duelo-bot{
      display:flex; align-items:center; justify-content: space-between;
      gap: 12px;
      padding: 8px 10px;
      border-radius: 14px;
      background: rgba(0,0,0,.28);
      border: 1px solid rgba(255,255,255,.08);
      font-weight: 900;
    }
    .duelo-mid{ display:flex; justify-content:center; padding: 8px 0; }
    .duelo-versus{
      width: 64px; height: 32px;
      display:grid; place-items:center;
      border-radius: 999px;
      background: rgba(255,255,255,.10);
      border: 1px solid rgba(255,255,255,.10);
      font-weight: 900;
      letter-spacing: 2px;
    }
    .duelo-nome{ font-size: 16px; text-transform: uppercase; }
    .duelo-placar{ display:flex; gap: 12px; font-size: 14px; opacity:.95; align-items:center; }
    .duelo-tempo{ opacity: .95; }
    @media (max-width: 900px){
      .duelo-box{ width: 96vw; }
      .duelo-placar{ gap: 10px; font-size: 13px; flex-wrap: wrap; justify-content:flex-end; }
    }
  `;
  document.head.appendChild(style);
}

function abrirDuelo(mestre) {
  ensureDueloOverlay();
  dueloAtivo = true;
  duelo.mestre = mestre;

  duelo.pontosAluno = 0;
  duelo.pontosMestre = 0;
  duelo.errosAluno = 0;
  duelo.errosMestre = 0;

  // usa o mesmo "monte" (meta atual) como rodadas do duelo
  duelo.rodadasRestantes = meta;

  atualizarDueloUI(true);
  dueloEl.classList.remove("hidden");
}

function fecharDuelo() {
  dueloAtivo = false;
  if (duelo.cronMestreTimer) clearTimeout(duelo.cronMestreTimer);
  duelo.cronMestreTimer = null;
  if (dueloEl) dueloEl.classList.add("hidden");
}

function atualizarDueloUI(resetTempo = false) {
  const mestreNome = document.getElementById("dueloMestreNome");
  const mestrePontos = document.getElementById("dueloMestrePontos");
  const mestreErros = document.getElementById("dueloMestreErros");
  const alunoPontos = document.getElementById("dueloAlunoPontos");
  const alunoErros = document.getElementById("dueloAlunoErros");
  const tempoMestre = document.getElementById("dueloTempoMestre");

  if (mestreNome) mestreNome.textContent = duelo.mestre ? duelo.mestre.nome : "MESTRE";
  if (mestrePontos) mestrePontos.textContent = String(duelo.pontosMestre);
  if (mestreErros) mestreErros.textContent = String(duelo.errosMestre);
  if (alunoPontos) alunoPontos.textContent = String(duelo.pontosAluno);
  if (alunoErros) alunoErros.textContent = String(duelo.errosAluno);

  if (tempoMestre) {
    if (resetTempo) tempoMestre.textContent = "--";
    else tempoMestre.textContent = (duelo.tempoMestreMs ? `${Math.round(duelo.tempoMestreMs)}ms` : "--");
  }
}

// =======================
// TEMPO DOS DESAFIANTES (por fase)
// =======================
// (ms) — ajuste livre
const TEMPO_MESTRE = {
  facil:   { min: 1200, max: 2000 },
  media:   { min: 900,  max: 1600 },
  dificil: { min: 650,  max: 1200 }
};

// ÚLTIMA resposta do mestre: 60 segundos cravado
const TEMPO_ULTIMA_RESPOSTA_MESTRE = 60000;

function configurarRodadaDuelo() {
  if (!dueloAtivo) return;

  if (duelo.rodadasRestantes === 1) {
    duelo.tempoMestreMs = TEMPO_ULTIMA_RESPOSTA_MESTRE;
  } else {
    const faixa = TEMPO_MESTRE[faseAtual] || TEMPO_MESTRE.facil;
    duelo.tempoMestreMs = Math.random() * (faixa.max - faixa.min) + faixa.min;
  }

  atualizarDueloUI(false);

  const token = ++duelo.perguntaToken;

  if (duelo.cronMestreTimer) clearTimeout(duelo.cronMestreTimer);
  duelo.cronMestreTimer = setTimeout(() => {
    if (!dueloAtivo || token !== duelo.perguntaToken) return;

    const chanceErro = (faseAtual === "facil") ? 0.12 : (faseAtual === "media") ? 0.10 : 0.08;
    const mestreErrou = Math.random() < chanceErro;

    if (mestreErrou) {
      duelo.errosMestre++;
      atualizarDueloUI(false);
      return;
    }

    // mestre acertou antes do aluno => ponto mestre
    marcarPontoDuelo("mestre");
  }, duelo.tempoMestreMs);
}

function marcarPontoDuelo(quem) {
  if (!dueloAtivo) return;

  // invalida rodada atual (para cancelar timer)
  duelo.perguntaToken++;

  if (duelo.cronMestreTimer) clearTimeout(duelo.cronMestreTimer);
  duelo.cronMestreTimer = null;

  if (quem === "aluno") duelo.pontosAluno++;
  else duelo.pontosMestre++;

  duelo.rodadasRestantes = Math.max(0, duelo.rodadasRestantes - 1);
  setPilhaDireita(duelo.rodadasRestantes);

  atualizarDueloUI(false);

  if (duelo.rodadasRestantes <= 0) {
    const vencedor =
      (duelo.pontosAluno > duelo.pontosMestre) ? "VOCÊ VENCEU! 🏆" :
      (duelo.pontosAluno < duelo.pontosMestre) ? `${duelo.mestre.nome} venceu! 😈` :
      "EMPATE! 🤝";

    const nomeMestre = duelo.mestre ? duelo.mestre.nome : "Mestre";

    fecharDuelo();

    abrirModal(
      "⚔️ Resultado do Duelo",
      `${vencedor}<br><br><b>Você:</b> ${duelo.pontosAluno} pts | <b>${nomeMestre}:</b> ${duelo.pontosMestre} pts<br><br>Quer avançar?`,
      () => { avancarParaProximaTabuadaOuFase(); },
      () => { resetTudoParaInicio(); }
    );
    return;
  }

  // Próxima pergunta do jogo
  proximoNumero();
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);
  focusRespostaSeguro();

  // Próxima rodada do mestre
  configurarRodadaDuelo();
}

function mostrarMestreAntesDeAvancar() {
  if (!mestresAtivos) {
    avancarParaProximaTabuadaOuFase();
    return;
  }

  const mestre = pegarProximoMestre();
  if (!mestre) {
    avancarParaProximaTabuadaOuFase();
    return;
  }

  abrirModal(
    `⚔️ Desafiante: ${mestre.nome}`,
    `${mestre.frase}<br><br><b>Se você vencer, avança!</b><br>Quer lutar agora?`,
    () => {
      abrirDuelo(mestre);
      configurarRodadaDuelo();
      jogoAtivo = true;       // aluno pode responder
      focusRespostaSeguro();
    },
    () => {
      resetTudoParaInicio();
    }
  );
}

// =======================
// KEYPAD
// =======================
function keypadAppend(d) {
  if (!respostaInput) return;
  if (aguardandoDecisao) return;

  autoStartIfNeeded();

  const s = (respostaInput.value || "").toString();
  if (s.length >= 4) return;

  if (s === "0") respostaInput.value = String(d);
  else respostaInput.value = s + String(d);
  atualizarPlaceholder();
}

function keypadBackspace() {
  if (!respostaInput) return;
  if (aguardandoDecisao) return;
  const s = (respostaInput.value || "").toString();
  respostaInput.value = s.slice(0, -1);
  atualizarPlaceholder();
}

function keypadClear() {
  if (!respostaInput) return;
  if (aguardandoDecisao) return;
  respostaInput.value = "";
  atualizarPlaceholder();
}

function keypadOk() {
  if (aguardandoDecisao) {
    confirmarSim();
    return;
  }
  verificar();
}

if (keypad) {
  keypad.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const k = btn.getAttribute("data-k");
    if (!k) return;

    if (respostaInput) respostaInput.blur();

    if (k === "back") return keypadBackspace();
    if (k === "clear") return keypadClear();
    if (k === "ok") return keypadOk();
    keypadAppend(k);
  });
}

function atualizarPlaceholder() {
  if (!respostaInput) return;
  respostaInput.placeholder = (respostaInput.value && respostaInput.value.length > 0) ? "" : "Digite a resposta";
}

window.addEventListener("resize", () => {
  ensureMobileInputMode();
  setKeypadLayoutFlags();
});
ensureMobileInputMode();
setKeypadLayoutFlags();

// =======================
// CARTAS
// =======================
function virarParaFrente(carta) {
  if (!carta) return;
  carta.classList.remove("back");
  carta.classList.add("front");
}
function virarParaVersoComNumero(carta, numeroDiv, valor) {
  if (!carta || !numeroDiv) return;
  carta.classList.remove("front");
  carta.classList.add("back");
  numeroDiv.textContent = String(valor);
}

// =======================
// LABEL TABUADA
// =======================
function atualizarLabelTabuada() {
  if (!labelTabuada) return;
  const v = tabuadaSelect ? tabuadaSelect.value : "";
  if (v === "") { labelTabuada.textContent = ""; return; }
  labelTabuada.textContent = `Tabuada do ${Number(v)}`;
}

// =======================
// PILHA DIREITA
// =======================
function setPilhaDireita(remaining) {
  const rest = Math.max(0, Number(remaining || 0));

  if (contadorCartas) contadorCartas.textContent = String(rest);
  if (pilhaDireita) pilhaDireita.style.setProperty("--stack", String(rest));

  if (rest <= 0) {
    if (cartaDireita) cartaDireita.classList.add("hidden");
    if (pilhaZerouMsg) pilhaZerouMsg.classList.remove("hidden");
  } else {
    if (cartaDireita) cartaDireita.classList.remove("hidden");
    if (pilhaZerouMsg) pilhaZerouMsg.classList.add("hidden");
  }
}

function atualizarPilhaPorMeta() {
  const remaining = meta - acertos;
  setPilhaDireita(remaining);
}

// =======================
// META / FASE
// =======================
function setMetaByFase(f) {
  if (f === "facil") return 4;   // 👈 TESTE RÁPIDO (depois volta pra 20)
  if (f === "media") return 40;
  return 60;
}

function syncFaseEMeta() {
  faseAtual = faseSelect ? faseSelect.value : "facil";
  fase = faseAtual;
  meta = setMetaByFase(fase);
}

if (faseSelect) {
  faseSelect.addEventListener("change", () => {
    syncFaseEMeta();
    if (!jogoAtivo) {
      acertos = 0;
      atualizarPainel();
      setPilhaDireita(meta);
    }
  });
}

// =======================
// UTIL
// =======================
function atualizarPainel() {
  if (tempoSpan) tempoSpan.textContent = String(tempo);
  if (acertosSpan) acertosSpan.textContent = String(acertos);
  if (errosSpan) errosSpan.textContent = String(erros);
  atualizarPilhaPorMeta();
}

function resetTudoParaInicio() {
  clearInterval(intervalo);
  intervalo = null;

  jogoAtivo = false;
  cronometroAtivo = false;
  aguardandoDecisao = false;

  tempo = 60;
  acertos = 0;
  erros = 0;
  etapa = "normal";
  numeroAtual = 1;

  fecharDuelo();

  if (fimJogoDiv) fimJogoDiv.innerHTML = "";

  virarParaFrente(cartaEsquerda);
  virarParaFrente(cartaDireita);
  if (numEsquerda) numEsquerda.textContent = "";
  if (numDireita) numDireita.textContent = "";

  syncFaseEMeta();
  atualizarPainel();
  setPilhaDireita(meta);

  if (labelTabuada) labelTabuada.textContent = "";

  if (respostaInput) {
    respostaInput.value = "";
    respostaInput.blur();
  }

  ensureMobileInputMode();
}

// =======================
// CRONÔMETRO
// =======================
function iniciarCronometro() {
  if (cronometroAtivo) return;
  cronometroAtivo = true;

  clearInterval(intervalo);
  intervalo = setInterval(() => {
    tempo--;
    if (tempo < 0) tempo = 0;
    if (tempoSpan) tempoSpan.textContent = String(tempo);

    if (tempo <= 0) finalizarJogoTempo();
  }, 1000);
}

function finalizarJogoTempo() {
  clearInterval(intervalo);
  jogoAtivo = false;
  cronometroAtivo = false;

  fecharDuelo();

  if (acertos < meta) {
    virarParaFrente(cartaEsquerda);
    virarParaFrente(cartaDireita);

    if (fimJogoDiv) {
      fimJogoDiv.innerHTML = ` 
        😢 Você perdeu! <br> Deseja tentar novamente? <br><br>
        <b>ENTER = SIM</b> &nbsp; | &nbsp; <b>ESC = NÃO</b>
      `;
    }

    abrirModal(
      "Você perdeu!",
      "Quer tentar novamente?",
      () => { resetTudoParaInicio(); },
      () => { resetTudoParaInicio(); }
    );
  } else {
    if (fimJogoDiv) {
      fimJogoDiv.innerHTML = `⏰ TEMPO ESGOTADO <br> Pressione ENTER para reiniciar.`;
    }
  }

  if (pilhaZerouMsg) pilhaZerouMsg.classList.add("hidden");
  if (cartaDireita) cartaDireita.classList.remove("hidden");

  virarParaFrente(cartaDireita);
  if (numDireita) numDireita.textContent = "";
}

// =======================
// MODAL
// =======================
let onSim = null;
let onNao = null;

function abrirModal(titulo, textoHtml, simCb, naoCb) {
  modalArmedAt = performance.now() + 250;
  aguardandoDecisao = true;
  onSim = simCb;
  onNao = naoCb;

  if (fimJogoDiv) {
    fimJogoDiv.innerHTML =
      `${titulo}<br>${textoHtml}<br><br><b>ENTER = SIM</b> &nbsp; | &nbsp; <b>ESC = NÃO</b>`;
  }

  if (modal && modalTitulo && modalTexto) {
    modalTitulo.textContent = titulo;
    modalTexto.innerHTML = textoHtml;
    modal.classList.remove("hidden");
    if (btnSim) btnSim.focus();
  }
}

function fecharModal() {
  if (modal) modal.classList.add("hidden");
  if (fimJogoDiv) fimJogoDiv.innerHTML = "";

  aguardandoDecisao = false;
  onSim = null;
  onNao = null;

  if (isMobileLike()) showKeypad();
}

function confirmarSim() {
  if (!aguardandoDecisao || !onSim) return;
  const cb = onSim;
  fecharModal();
  cb();
}

function confirmarNao() {
  if (!aguardandoDecisao || !onNao) return;
  const cb = onNao;
  fecharModal();
  cb();
}

if (btnSim) btnSim.addEventListener("click", (e) => {
  e.preventDefault();
  confirmarSim();
});
if (btnNao) btnNao.addEventListener("click", (e) => {
  e.preventDefault();
  confirmarNao();
});

// =======================
// ENTER / ESC (Modal)
// =======================
function isEnterKey(e){
  return (e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter" || e.keyCode === 13);
}

document.addEventListener("keydown", (e) => {
  if (!aguardandoDecisao) return;

  if (performance.now() < modalArmedAt) {
    e.preventDefault();
    return;
  }

  if (isEnterKey(e)) {
    e.preventDefault();
    confirmarSim();
    return;
  }

  if (e.key === "Escape" || e.code === "Escape" || e.keyCode === 27) {
    e.preventDefault();
    confirmarNao();
  }
}, { passive: false });

// =======================
// SOM
// =======================
function beep(freq=880, dur=0.12, vol=0.12) {
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
    o.onended = () => ctx.close();
  }catch(e){}
}
function fanfarraCurta(){
  beep(740, 0.09); setTimeout(()=>beep(880,0.09), 90);
  setTimeout(()=>beep(988,0.10), 180);
}
function fanfarraGrande(){
  beep(523,0.10); setTimeout(()=>beep(659,0.10), 110);
  setTimeout(()=>beep(784,0.10), 220);
  setTimeout(()=>beep(988,0.12), 340);
  setTimeout(()=>beep(1175,0.14), 480);
}

// =======================
// FX (FOGOS)
// =======================
let particles = [];
let rockets = [];

function resizeFx(){
  if (!fxCanvas || !fxCtx) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  fxCanvas.width = Math.floor(window.innerWidth * dpr);
  fxCanvas.height = Math.floor(window.innerHeight * dpr);
  fxCanvas.style.width = window.innerWidth + "px";
  fxCanvas.style.height = window.innerHeight + "px";
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeFx);
resizeFx();

function rand(min, max){ return Math.random() * (max - min) + min; }

function spawnRocket() {
  if (!fxCanvas) return;
  const x = rand(window.innerWidth * 0.15, window.innerWidth * 0.85);
  const y = window.innerHeight + 10;

  rockets.push({
    x, y,
    vx: rand(-1.2, 1.2),
    vy: rand(-13, -10),
    life: rand(45, 70),
    hue: Math.floor(rand(0, 360))
  });
}

function explode(x, y, hue, count = 160, power = 7.5) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(power * 0.35, power);
    particles.push({
      x, y,
      px: x, py: y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(55, 95),
      size: rand(1.6, 3.2),
      hue: (hue + rand(-18, 18) + 360) % 360
    });
  }
}

function animateFx(){
  if (!fxCtx || !fxCanvas) return;

  fxCtx.globalCompositeOperation = "source-over";
  fxCtx.fillStyle = "rgba(0,0,0,0.18)";
  fxCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  fxCtx.globalCompositeOperation = "lighter";

  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.life -= 1;

    const px = r.x, py = r.y;
    r.vy += 0.16;
    r.x += r.vx;
    r.y += r.vy;

    fxCtx.lineWidth = 2.2;
    fxCtx.strokeStyle = `hsla(${r.hue} 95% 70% / 0.95)`;
    fxCtx.beginPath();
    fxCtx.moveTo(px, py);
    fxCtx.lineTo(r.x, r.y);
    fxCtx.stroke();

    if (r.life <= 0 || r.vy > -2.5) {
      explode(r.x, r.y, r.hue, 170, 8.2);
      rockets.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 1;

    p.px = p.x;
    p.py = p.y;

    p.vy += 0.08;
    p.vx *= 0.992;
    p.vy *= 0.992;

    p.x += p.vx;
    p.y += p.vy;

    const a = Math.max(0, p.life / 95);

    fxCtx.lineWidth = 2.0;
    fxCtx.strokeStyle = `hsla(${p.hue} 100% 70% / ${0.55 * a})`;
    fxCtx.beginPath();
    fxCtx.moveTo(p.px, p.py);
    fxCtx.lineTo(p.x, p.y);
    fxCtx.stroke();

    fxCtx.fillStyle = `hsla(${p.hue} 100% 75% / ${0.95 * a})`;
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    fxCtx.fill();

    if (p.life <= 0) particles.splice(i, 1);
  }

  requestAnimationFrame(animateFx);
}
animateFx();

function fogosMedios(){
  fanfarraCurta();
  for (let i = 0; i < 6; i++) setTimeout(spawnRocket, i * 140);
}

function fogosGrandes(){
  fanfarraGrande();
  for (let i = 0; i < 16; i++) setTimeout(spawnRocket, i * 95);
}

// =======================
// TABUADA SELECT
// =======================
if (tabuadaSelect) {
  tabuadaSelect.addEventListener("change", () => {
    const v = tabuadaSelect.value;

    if (v === "") {
      tabuada = 1;
      numeroAtual = 1;
      virarParaFrente(cartaEsquerda);
      virarParaFrente(cartaDireita);
      if (numEsquerda) numEsquerda.textContent = "";
      if (numDireita) numDireita.textContent = "";
      if (labelTabuada) labelTabuada.textContent = "";
      return;
    }

    tabuada = Number(v);
    numeroAtual = 1;

    atualizarLabelTabuada();

    virarParaVersoComNumero(cartaEsquerda, numEsquerda, tabuada);
    virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);

    focusRespostaSeguro();
  });
}

// =======================
// INICIAR
// =======================
window.iniciarJogo = function iniciarJogo(preservarDigitado = false) {
  syncFaseEMeta();

  tabuadaAtual = Number((tabuadaSelect && tabuadaSelect.value) || 1);
  tabuada = tabuadaAtual;

  prepararMestresParaJogada(tabuadaAtual);

  atualizarLabelTabuada();

  etapa = "normal";
  numeroAtual = 1;

  tempo = 60;
  acertos = 0;
  erros = 0;

  jogoAtivo = true;
  cronometroAtivo = false;
  clearInterval(intervalo);

  fecharDuelo();

  if (fimJogoDiv) fimJogoDiv.innerHTML = "";
  atualizarPainel();

  setPilhaDireita(meta);

  virarParaVersoComNumero(cartaEsquerda, numEsquerda, tabuada);
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);

  if (respostaInput) {
    if (!preservarDigitado) respostaInput.value = "";
    atualizarPlaceholder();
    focusRespostaSeguro();
  }
};

// =======================
// PRÓXIMO NÚMERO
// =======================
function proximoNumero() {
  if (etapa === "normal") numeroAtual = (numeroAtual < 10) ? (numeroAtual + 1) : 1;
  else numeroAtual = Math.floor(Math.random() * 10) + 1;
}

// =======================
// TRANSIÇÕES
// =======================
function iniciarDesafioAleatorio() {
  jogoAtivo = true;
  cronometroAtivo = false;
  clearInterval(intervalo);

  etapa = "aleatorio";

  if (pilhaZerouMsg) pilhaZerouMsg.classList.add("hidden");
  if (cartaDireita) cartaDireita.classList.remove("hidden");

  meta = setMetaByFase(faseAtual);

  tempo = 60;
  acertos = 0;
  erros = 0;
  atualizarPainel();
  setPilhaDireita(meta);

  numeroAtual = Math.floor(Math.random() * 10) + 1;
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);

  if (respostaInput) {
    respostaInput.value = "";
    focusRespostaSeguro();
  }
}

function avancarParaProximaTabuadaOuFase() {
  jogoAtivo = true;
  cronometroAtivo = false;
  clearInterval(intervalo);

  fecharDuelo();

  tabuadaAtual++;

  if (tabuadaAtual > 10) {
    if (faseAtual === "facil") faseAtual = "media";
    else if (faseAtual === "media") faseAtual = "dificil";
    else {
      abrirModal(
        "🏆 Parabéns!",
        `Você completou até a tabuada 10 no <b>Difícil</b>!`,
        () => { resetTudoParaInicio(); },
        () => { resetTudoParaInicio(); }
      );
      return;
    }

    if (faseSelect) faseSelect.value = faseAtual;
    meta = setMetaByFase(faseAtual);

    tabuadaAtual = 1;
    abrirModal(
      "⬆️ Você subiu de nível!",
      `Agora você está no nível <b>${faseAtual.toUpperCase()}</b>.<br>Quer começar?`,
      () => {
        if (tabuadaSelect) tabuadaSelect.value = String(tabuadaAtual);
        window.iniciarJogo(false);
      },
      () => { resetTudoParaInicio(); }
    );
    return;
  }

  if (tabuadaSelect) tabuadaSelect.value = String(tabuadaAtual);

  tabuada = tabuadaAtual;
  fase = faseAtual;
  meta = setMetaByFase(faseAtual);

  atualizarLabelTabuada();

  etapa = "normal";
  numeroAtual = 1;

  tempo = 60;
  acertos = 0;
  erros = 0;
  atualizarPainel();
  setPilhaDireita(meta);

  virarParaVersoComNumero(cartaEsquerda, numEsquerda, tabuada);
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);

  if (respostaInput) {
    respostaInput.value = "";
    focusRespostaSeguro();
  }
}

// =======================
// BATEU META
// =======================
function bateuMetaNormal() {
  setPilhaDireita(0);

  fogosMedios();
  clearInterval(intervalo);
  cronometroAtivo = false;
  jogoAtivo = false;

  abrirModal(
    "🎉 Parabéns!",
    "Deseja continuar para o desafio aleatório?",
    () => iniciarDesafioAleatorio(),
    () => resetTudoParaInicio()
  );
}

function bateuMetaAleatorio() {
  setPilhaDireita(0);

  fogosGrandes();
  clearInterval(intervalo);
  cronometroAtivo = false;
  jogoAtivo = false;

  abrirModal(
    "🚀 Você é demais!",
    "Vamos para a próxima tabuada?",
    () => { mostrarMestreAntesDeAvancar(); },
    () => { resetTudoParaInicio(); }
  );
}

// =======================
// VERIFICAR
// =======================
function verificar() {
  if (!jogoAtivo) return;
  if (aguardandoDecisao) return;
  if (!respostaInput) return;

  const valor = respostaInput.value;
  if (valor === "") return;

  // cronômetro normal só começa quando envia a primeira resposta (fora do duelo)
  if (!dueloAtivo && !cronometroAtivo) iniciarCronometro();

  const resposta = Number(valor);
  const correta = tabuada * numeroAtual;
  const acertou = (resposta === correta);

  // DUELO
  if (dueloAtivo) {
    if (acertou) {
      marcarPontoDuelo("aluno");
    } else {
      duelo.errosAluno++;
      atualizarDueloUI(false);
      // mantém a mesma pergunta (corrida)
    }

    respostaInput.value = "";
    atualizarPlaceholder();
    focusRespostaSeguro();
    return;
  }

  // JOGO NORMAL
  if (acertou) acertos++;
  else erros++;

  respostaInput.value = "";
  atualizarPlaceholder();
  atualizarPainel();

  if (acertos >= meta) {
    if (etapa === "normal") bateuMetaNormal();
    else bateuMetaAleatorio();
    return;
  }

  proximoNumero();
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);
  focusRespostaSeguro();
}

// =======================
// PWA REGISTRO
// =======================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then((reg) => {
        console.log("PWA ativado");
        reg.update();
      })
      .catch(err => console.log("Erro PWA:", err));
  });
}

// =======================
// PC: PRIMEIRO DÍGITO INICIA
// =======================
document.addEventListener("keydown", (e) => {
  if (aguardandoDecisao) return;
  if (isMobileLike()) return;
  if (!respostaInput || respostaInput.disabled) return;

  const isDigit = /^[0-9]$/.test(e.key);
  if (!isDigit) return;

  if (!jogoAtivo && tabuadaSelecionadaValida()) {
    e.preventDefault();
    window.iniciarJogo(true);
    respostaInput.value = e.key;
    respostaInput.focus();
  }
}, { passive: false });

// Enter no input = enviar
if (respostaInput) {
  respostaInput.addEventListener("keydown", (e) => {
    if (!isEnterKey(e)) return;
    e.preventDefault();

    const digitado = respostaInput.value;
    if (!jogoAtivo) {
      if (!tabuadaSelecionadaValida()) return;
      window.iniciarJogo(true);
      respostaInput.value = digitado;
    }

    verificar();
  }, { passive: false });
}

// Enter global (fora do input)
document.addEventListener("keydown", (e) => {
  if (aguardandoDecisao) return;
  if (!isEnterKey(e)) return;

  e.preventDefault();
  if (!respostaInput) return;

  if (!respostaInput.disabled && document.activeElement !== respostaInput) {
    respostaInput.focus();
  }

  const digitado = respostaInput.value;
  if (!jogoAtivo) {
    if (!tabuadaSelecionadaValida()) return;
    window.iniciarJogo(true);
    respostaInput.value = digitado;
  }

  verificar();
}, { passive: false });


