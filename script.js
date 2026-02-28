// ===============================
// LISTA DE MESTRES (DESAFIANTES)
// ===============================
const MESTRES = [
  { nome: "Rebeca sabe tudo", frase: "Quer avançar? Primeiro precisa me vencer!", img: "./rebeca.png" },
  { nome: "Izadora inteligente", frase: "Mostre que tem coragem... ou desista!", img: "./izadora.png" },
  { nome: "Isabela rápida", frase: "Você vai ter que ser MUITO rápido pra me vencer!", img: "./isabela.png" },
  { nome: "Lúcia esperta", frase: "Vamos ver se você é bom mesmo!", img: "./lucia.png" },
  { nome: "Carla veloz", frase: "Duvido você me derrotar!", img: "./carla.png" },
  { nome: "Lucas mestre", frase: "Mostre o que você aprendeu!", img: "./lucas.png" },
  { nome: "Bruno ágil", frase: "Isso não vai ser fácil!", img: "./bruno.png" },
  { nome: "André o sábio", frase: "Está pronto para um desafio de verdade?", img: "./andre.png" },
  { nome: "Felipe especialista", frase: "Você aguenta a pressão?", img: "./felipe.png" },
  { nome: "Roberto o gênio", frase: "Eu sou o gênio… prove o contrário!", img: "./roberto.png" }
];

// =======================
// AVATAR DO ALUNO
// =======================
let avatarAluno = "./avatar1.png";
const AVATARES_ALUNO = ["./avatar1.png", "./avatar2.png", "./avatar3.png"];

function safeAvatarSrc(src) {
  return (src && typeof src === "string" && src.trim()) ? src : "./avatar1.png";
}

function setImgSafe(imgEl, src, fallback = "./avatar1.png") {
  if (!imgEl) return;
  const finalSrc = safeAvatarSrc(src);
  imgEl.src = finalSrc;
  imgEl.style.display = "block";

  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = fallback;
    imgEl.style.display = "block";
  };
}

window.setAvatarAluno = function (src) {
  avatarAluno = safeAvatarSrc(src);
  const fotoAluno = document.getElementById("dueloAlunoFoto");
  if (fotoAluno) setImgSafe(fotoAluno, avatarAluno, "./avatar1.png");
};

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
const cartaDireita = document.getElementById("cartaDireita");
const numEsquerda = document.getElementById("numEsquerda");
const numDireita = document.getElementById("numDireita");

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

/*
  ✅ PONTO EXATO DO "syncKeypadState"
  Fica AQUI, logo depois do const keypad = ...
*/
function syncKeypadState() {
  if (!keypad) return;
  const aberto = !keypad.classList.contains("hidden");
  document.body.classList.toggle("keypad-on", !!aberto);
}

// sincroniza ao carregar
syncKeypadState();

// observa mudanças na classe do keypad (abre/fecha)
if (keypad) {
  const obs = new MutationObserver(syncKeypadState);
  obs.observe(keypad, { attributes: true, attributeFilter: ["class"] });
}

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
  setKeypadLayoutFlags();
  syncKeypadState(); // ✅ garante body.keypad-on correto
}

function hideKeypad() {
  if (!keypad) return;
  keypad.classList.add("hidden");
  keypad.setAttribute("aria-hidden", "true");
  setKeypadLayoutFlags();
  syncKeypadState(); // ✅ garante body.keypad-on correto
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

  window.iniciarJogo(true);
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
// DUELO (overlay criado via JS) - POR TEMPO
// =======================
let dueloEl = null;
let dueloAtivo = false;

let duelo = {
  mestre: null,
  pontosAluno: 0,
  pontosMestre: 0,
  errosAluno: 0,
  errosMestre: 0,

  duracaoMs: 10000, // teste 10s
  fimEm: 0,
  tickTimer: null,

  mestreTimer: null,
  mestreTentativas: 0,
  mestreMaxTentativas: 25,

  perguntaToken: 0,
  chanceErro: 0.12
};

function ensureDueloOverlay() {
  if (dueloEl) return;

  dueloEl = document.createElement("div");
  dueloEl.id = "dueloOverlay";
  dueloEl.className = "duelo hidden";
  dueloEl.innerHTML = `
    <div class="duelo-box">
      <div class="duelo-row">
        <div class="duelo-card">
          <div class="duelo-head">
            <img id="dueloMestreFoto" class="duelo-foto" src="" alt="">
            <div class="duelo-nome" id="dueloMestreNome">MESTRE</div>
          </div>

          <div class="duelo-placar">
            <div>⭐ <span id="dueloMestrePontos">0</span></div>
            <div>❌ <span id="dueloMestreErros">0</span></div>
            <div class="duelo-tempo">⏱️ <span id="dueloTempoMestre">--</span></div>
          </div>
        </div>

        <div class="duelo-versus">VS</div>

        <div class="duelo-card duelo-card-aluno">
          <div class="duelo-head">
            <img id="dueloAlunoFoto" class="duelo-foto" src="${safeAvatarSrc(avatarAluno)}" alt="">
            <div class="duelo-nome" id="dueloAlunoNome">VOCÊ</div>
          </div>

          <div class="duelo-placar">
            <div>⭐ <span id="dueloAlunoPontos">0</span></div>
            <div>❌ <span id="dueloAlunoErros">0</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(dueloEl);

  function updateDueloOffset() {
    const box = dueloEl?.querySelector(".duelo-box");
    if (!box) return;
    const h = Math.ceil(box.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--dueloH", `${h}px`);
  }
  window.addEventListener("resize", updateDueloOffset, { passive: true });
  window.addEventListener("orientationchange", updateDueloOffset);
  setTimeout(updateDueloOffset, 0);

  const style = document.createElement("style");
  style.textContent = `
    .duelo{
  position: fixed;
  inset: 0;
  display: grid;
  place-items: start center; /* ✅ fica no topo */
  padding-top: calc(10px + env(safe-area-inset-top));
  z-index: 12000;
  pointer-events: none;
}
    .duelo.hidden{ display:none; }
    .duelo-box{
      pointer-events:none;
      width: min(980px, 96vw);
      border-radius: 18px;
      padding: 12px 14px;
      background: rgba(0,0,0,.18);
      border: 1px solid rgba(255,255,255,.10);
      backdrop-filter: blur(6px);
      box-shadow: 0 22px 70px rgba(0,0,0,.35);
      max-height: 92svh;
      overflow: hidden;
    }
    .duelo-row{ display:flex; align-items: stretch; justify-content: center; gap: 14px; }
    .duelo-card{
      flex: 1; min-width: 0; width: 100%;
      border-radius: 16px; padding: 12px 14px;
      background: rgba(0,0,0,.28);
      border: 1px solid rgba(255,255,255,.10);
      font-weight: 900; overflow: hidden;
    }
    .duelo-head{ display:flex; align-items:center; gap:12px; margin-bottom: 10px; min-width: 0; }
    .duelo-foto{
      width: 86px; height: 86px; border-radius: 999px;
      object-fit: contain; background: rgba(255,255,255,.06); padding: 6px;
      border: 3px solid rgba(255,255,255,.25);
      box-shadow: 0 14px 30px rgba(0,0,0,.35); flex: 0 0 auto;
    }
    .duelo-nome{
      font-size: 20px; letter-spacing: 1px; text-transform: uppercase;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; max-width: 100%;
    }
    .duelo-placar{
      display:flex; gap: 18px; font-size: 18px; align-items:center;
      flex-wrap: wrap; justify-content:flex-end; text-align:right;
    }
    .duelo-versus{
      align-self: center; width: 86px; height: 86px; display:grid; place-items:center;
      border-radius: 22px;
      background: linear-gradient(135deg, rgba(255,60,60,.35), rgba(0,255,160,.25));
      border: 2px solid rgba(255,255,255,.18);
      box-shadow: 0 18px 45px rgba(0,0,0,.35);
      font-weight: 900; letter-spacing: 1px; text-transform: uppercase;
      transform: rotate(-6deg); position: relative; flex: 0 0 auto;
    }
    .duelo-versus::before{ content:"⚔️"; position:absolute; top: 10px; font-size: 20px; opacity: .95; }
    .duelo-versus::after{ content:"RING"; position:absolute; bottom: 10px; font-size: 12px; opacity: .85; letter-spacing: 2px; }

    @media (max-width: 520px){
      .duelo{ place-items: start center; padding-top: 10px; }
      .duelo-box{
        width: min(94vw, 560px);
        overflow:auto;
        -webkit-overflow-scrolling: touch;
        backdrop-filter: none;
        background: rgba(0,0,0,.35);
      }
      .duelo-row{ flex-direction: column; gap: 10px; }
      .duelo-versus{ width: 96px; height: 72px; margin: 6px auto; transform: rotate(-3deg); }
      .duelo-foto{ width: 70px; height: 70px; }
      .duelo-nome{ font-size: 16px; }
      .duelo-placar{ font-size: 14px; justify-content: space-between; }
    }
  `;
  document.head.appendChild(style);

  const alunoFoto = document.getElementById("dueloAlunoFoto");
  if (alunoFoto) setImgSafe(alunoFoto, avatarAluno, "./avatar1.png");
}

function atualizarDueloUI() {
  const foto = document.getElementById("dueloMestreFoto");
  if (foto) {
    const src = (duelo.mestre && duelo.mestre.img) ? duelo.mestre.img : "";
    if (src) setImgSafe(foto, src, "");
    else {
      foto.removeAttribute("src");
      foto.style.display = "none";
    }
  }

  const fotoAluno = document.getElementById("dueloAlunoFoto");
  if (fotoAluno) setImgSafe(fotoAluno, avatarAluno, "./avatar1.png");

  const mestreNome = document.getElementById("dueloMestreNome");
  const mestrePontos = document.getElementById("dueloMestrePontos");
  const mestreErros = document.getElementById("dueloMestreErros");
  const alunoPontos = document.getElementById("dueloAlunoPontos");
  const alunoErros = document.getElementById("dueloAlunoErros");
  const tempoEl = document.getElementById("dueloTempoMestre");

  if (mestreNome) mestreNome.textContent = duelo.mestre ? duelo.mestre.nome : "MESTRE";
  if (mestrePontos) mestrePontos.textContent = String(duelo.pontosMestre);
  if (mestreErros) mestreErros.textContent = String(duelo.errosMestre);
  if (alunoPontos) alunoPontos.textContent = String(duelo.pontosAluno);
  if (alunoErros) alunoErros.textContent = String(duelo.errosAluno);

  if (tempoEl) {
    const restMs = Math.max(0, duelo.fimEm - performance.now());
    const restS = Math.ceil(restMs / 1000);
    tempoEl.textContent = `${restS}s`;
  }

  const box = dueloEl?.querySelector(".duelo-box");
  if (box) {
    const h = Math.ceil(box.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--dueloH", `${h}px`);
  }
}

function fecharDuelo() {
  dueloAtivo = false;

  if (duelo.mestreTimer) clearTimeout(duelo.mestreTimer);
  duelo.mestreTimer = null;

  if (duelo.tickTimer) clearInterval(duelo.tickTimer);
  duelo.tickTimer = null;

  if (dueloEl) dueloEl.classList.add("hidden");
  document.body.classList.remove("modo-duelo");
}

function prepararUIParaDuelo() {
  if (pilhaZerouMsg) pilhaZerouMsg.classList.add("hidden");
  if (cartaDireita) cartaDireita.classList.remove("hidden");

  setModoJogoCartas();

  if (cartaDireita) {
    cartaDireita.classList.remove("front");
    cartaDireita.classList.add("back");
  }
}

const LIMITE_MESTRE = { facil: 25, media: 40, dificil: 55 };

function tempoMestrePorRespostaMs() {
  const max = LIMITE_MESTRE[faseAtual] ?? 25;
  const base = 60000 / max;
  const min = base * 0.70;
  const maxMs = base * 1.30;
  return Math.random() * (maxMs - min) + min;
}

function configurarDueloPorFase() {
  duelo.mestreMaxTentativas = LIMITE_MESTRE[faseAtual] ?? 25;
  duelo.chanceErro =
    (faseAtual === "facil") ? 0.12 :
    (faseAtual === "media") ? 0.10 :
    0.08;
}

function gerarPerguntaDueloNova() {
  numeroAtual = Math.floor(Math.random() * 10) + 1;
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);
}

function iniciarTickDuelo() {
  if (duelo.tickTimer) clearInterval(duelo.tickTimer);
  duelo.tickTimer = setInterval(() => {
    if (!dueloAtivo) return;
    atualizarDueloUI();
    if (performance.now() >= duelo.fimEm) finalizarDueloTempo();
  }, 150);
}

function abrirDuelo(mestre) {
  document.body.classList.add("modo-duelo");

  ensureDueloOverlay();
  dueloAtivo = true;
  duelo.mestre = mestre;

  duelo.pontosAluno = 0;
  duelo.pontosMestre = 0;
  duelo.errosAluno = 0;
  duelo.errosMestre = 0;

  duelo.mestreTentativas = 0;
  configurarDueloPorFase();

  duelo.fimEm = performance.now() + duelo.duracaoMs;

  prepararUIParaDuelo();

  duelo.perguntaToken++;
  gerarPerguntaDueloNova();

  atualizarDueloUI();
  dueloEl.classList.remove("hidden");

  iniciarTickDuelo();
  agendarRespostaMestre();

  jogoAtivo = true;
  focusRespostaSeguro();
}

function finalizarDueloTempo() {
  if (!dueloAtivo) return;

  const mestreNome = duelo.mestre ? duelo.mestre.nome : "Mestre";
  const a = duelo.pontosAluno;
  const m = duelo.pontosMestre;

  const voceVenceu = a > m;
  const titulo = `⚔️ Resultado do Duelo (${Math.round(duelo.duracaoMs / 1000)}s)`;
  const linhaVencedor =
    (a > m) ? "VOCÊ VENCEU! 🏆" :
    (a < m) ? `${mestreNome} venceu! 😈` :
    "EMPATE! 🤝";

  const mestreAtual = duelo.mestre;

  fecharDuelo();

  if (voceVenceu) {
    abrirModal(
      titulo,
      `${linhaVencedor}<br><br><b>Você:</b> ${a} pts | <b>${mestreNome}:</b> ${m} pts<br><br>Quer avançar?`,
      () => { avancarParaProximaTabuadaOuFase(); },
      () => { resetTudoParaInicio(); }
    );
  } else {
    abrirModal(
      titulo,
      `${linhaVencedor}<br><br><b>Você:</b> ${a} pts | <b>${mestreNome}:</b> ${m} pts<br><br><b>Você perdeu.</b><br>Quer desafiar novamente?`,
      () => { abrirDuelo(mestreAtual); },
      () => { resetTudoParaInicio(); }
    );
  }
}

function agendarRespostaMestre() {
  if (!dueloAtivo) return;
  if (duelo.mestreTentativas >= duelo.mestreMaxTentativas) return;

  const restMs = duelo.fimEm - performance.now();
  if (restMs <= 0) return;

  const token = duelo.perguntaToken;
  const delay = Math.min(tempoMestrePorRespostaMs(), restMs);

  if (duelo.mestreTimer) clearTimeout(duelo.mestreTimer);
  duelo.mestreTimer = setTimeout(() => {
    if (!dueloAtivo) return;

    if (token !== duelo.perguntaToken) {
      agendarRespostaMestre();
      return;
    }

    if (performance.now() >= duelo.fimEm) {
      finalizarDueloTempo();
      return;
    }

    if (duelo.mestreTentativas >= duelo.mestreMaxTentativas) return;

    duelo.mestreTentativas++;

    const mestreErrou = Math.random() < duelo.chanceErro;

    if (mestreErrou) {
      duelo.errosMestre++;
      atualizarDueloUI();
      agendarRespostaMestre();
      return;
    }

    duelo.pontosMestre++;
    atualizarDueloUI();

    duelo.perguntaToken++;
    gerarPerguntaDueloNova();

    if (respostaInput) {
      respostaInput.value = "";
      atualizarPlaceholder();
    }
    focusRespostaSeguro();

    agendarRespostaMestre();
  }, delay);
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

  const thumbs = AVATARES_ALUNO.map((a) => `
    <img src="${a}" style="
      width:68px;height:68px;border-radius:18px;object-fit:contain;
      background:rgba(255,255,255,.06);padding:8px;cursor:pointer;
      border:2px solid rgba(255,255,255,.14);
      box-shadow: 0 10px 22px rgba(0,0,0,.25);
    " onclick="window.setAvatarAluno('${a}')"/>
  `).join("");

  abrirModal(
    `⚔️ Desafiante: ${mestre.nome}`,
    `
      <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
        ${mestre.img ? `<img src="${mestre.img}" style="
          width:190px;height:190px;
          border-radius:26px;
          object-fit:contain;
          background: rgba(255,255,255,.06);
          padding: 10px;
          border:2px solid rgba(255,255,255,.18);
          box-shadow: 0 14px 34px rgba(0,0,0,.35);
        ">` : ""}
        <div style="font-size:18px; font-weight:900;">${mestre.frase}</div>

        <div style="margin-top:4px; font-size:14px; opacity:.95;">
          Escolha seu avatar:
        </div>
        <div style="display:flex; gap:12px; justify-content:center; margin-top:10px; flex-wrap:wrap;">
          ${thumbs}
        </div>

        <div style="margin-top:6px;"><b>Duelo de ${Math.round(duelo.duracaoMs / 1000)}s (teste)!</b><br>Quem fizer mais pontos vence.</div>
      </div>
    `,
    () => { abrirDuelo(mestre); },
    () => { resetTudoParaInicio(); }
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
  if (typeof window.verificar === "function") window.verificar();
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

// ✅ resize mais leve
let _resizeRaf = 0;
window.addEventListener("resize", () => {
  if (_resizeRaf) cancelAnimationFrame(_resizeRaf);
  _resizeRaf = requestAnimationFrame(() => {
    ensureMobileInputMode();
    setKeypadLayoutFlags();
    resizeFx();
  });
}, { passive: true });

ensureMobileInputMode();
setKeypadLayoutFlags();

// =======================
// CARTAS
// =======================
function virarParaFrente(carta) {
  if (!carta) return;
  carta.classList.remove("back", "back-prof");
  carta.classList.add("front");
}

function virarParaVersoComNumero(carta, numeroDiv, valor) {
  if (!carta || !numeroDiv) return;
  carta.classList.remove("front", "back-prof");
  carta.classList.add("back");
  numeroDiv.textContent = String(valor);
}

function setModoEscolhaCartas() {
  if (cartaEsquerda) {
    cartaEsquerda.classList.remove("front", "back");
    cartaEsquerda.classList.add("back-prof");
  }
  if (cartaDireita) {
    cartaDireita.classList.remove("front", "back");
    cartaDireita.classList.add("back-prof");
  }

  if (numEsquerda) numEsquerda.textContent = "";
  if (numDireita) numDireita.textContent = "";
}

function setModoJogoCartas() {
  if (cartaEsquerda) {
    cartaEsquerda.classList.remove("front", "back-prof");
    cartaEsquerda.classList.add("back");
  }
  if (cartaDireita) {
    cartaDireita.classList.remove("front", "back-prof");
    cartaDireita.classList.add("back");
  }
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
  if (f === "facil") return 4;   // teste
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

  syncFaseEMeta();
  atualizarPainel();
  setPilhaDireita(meta);

  if (labelTabuada) labelTabuada.textContent = "";

  if (respostaInput) {
    respostaInput.value = "";
    respostaInput.blur();
  }

  if (tabuadaSelect) tabuadaSelect.value = "";
  setModoEscolhaCartas();

  ensureMobileInputMode();
}

// =======================
// CRONÔMETRO (JOGO NORMAL)
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

  setModoEscolhaCartas();
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

    const isOprofessor = (titulo || "").includes("Mestre dos Mestres");
    modal.classList.toggle("op-epico", isOprofessor);

    document.body.classList.add("modal-open");
    hideKeypad();

    modal.classList.remove("hidden");
    if (btnSim) btnSim.focus();
  }
}

function fecharModal() {
  if (modal) modal.classList.remove("op-epico");
  if (modal) modal.classList.add("hidden");
  if (fimJogoDiv) fimJogoDiv.innerHTML = "";

  aguardandoDecisao = false;
  onSim = null;
  onNao = null;

  document.body.classList.remove("modal-open");
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
function isEnterKey(e) {
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
// SOM (reutiliza AudioContext)
// =======================
let _audioCtx = null;
function getAudioCtx() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (_audioCtx && _audioCtx.state !== "closed") return _audioCtx;
  _audioCtx = new AudioCtx();
  return _audioCtx;
}

function beep(freq = 880, dur = 0.12, vol = 0.12) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
    o.onended = () => {
      try { o.disconnect(); g.disconnect(); } catch (e) {}
    };
  } catch (e) {}
}

function fanfarraCurta() {
  beep(740, 0.09); setTimeout(() => beep(880, 0.09), 90);
  setTimeout(() => beep(988, 0.10), 180);
}
function fanfarraGrande() {
  beep(523, 0.10); setTimeout(() => beep(659, 0.10), 110);
  setTimeout(() => beep(784, 0.10), 220);
  setTimeout(() => beep(988, 0.12), 340);
  setTimeout(() => beep(1175, 0.14), 480);
}

// =======================
// FX (FOGOS)
// =======================
let particles = [];
let rockets = [];

let fxRunning = false;
let fxRaf = 0;
let fxLastFrame = 0;
let fxIdleSince = 0;

function fxIsMobileQuality() {
  return isMobileLike() || (window.innerWidth <= 900);
}

function fxConfig() {
  const mobile = fxIsMobileQuality();
  return {
    dprCap: mobile ? 1.5 : 3,
    fps: mobile ? 30 : 60,
    fade: mobile ? 0.24 : 0.18,
    rocketLine: mobile ? 1.6 : 2.2,
    particleLine: mobile ? 1.3 : 2.0,
    explodeCount: mobile ? 80 : 170,
    explodePower: mobile ? 6.2 : 8.2,
    rocketsMedios: mobile ? 4 : 6,
    rocketsGrandes: mobile ? 10 : 16,
    rocketIntervalMedios: mobile ? 170 : 140,
    rocketIntervalGrandes: mobile ? 115 : 95
  };
}

function resizeFx() {
  if (!fxCanvas || !fxCtx) return;
  const cfg = fxConfig();
  const dpr = Math.max(1, Math.min(cfg.dprCap, window.devicePixelRatio || 1));
  fxCanvas.width = Math.floor(window.innerWidth * dpr);
  fxCanvas.height = Math.floor(window.innerHeight * dpr);
  fxCanvas.style.width = window.innerWidth + "px";
  fxCanvas.style.height = window.innerHeight + "px";
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeFx();

function rand(min, max) { return Math.random() * (max - min) + min; }

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

function explode(x, y, hue, count, power) {
  const cfg = fxConfig();
  const c = (typeof count === "number") ? count : cfg.explodeCount;
  const pwr = (typeof power === "number") ? power : cfg.explodePower;

  for (let i = 0; i < c; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(pwr * 0.35, pwr);
    particles.push({
      x, y,
      px: x, py: y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(50, 90),
      size: rand(cfg.explodeCount <= 100 ? 1.2 : 1.6, cfg.explodeCount <= 100 ? 2.6 : 3.2),
      hue: (hue + rand(-18, 18) + 360) % 360
    });
  }
}

function startFxLoop() {
  if (fxRunning) return;
  fxRunning = true;
  fxLastFrame = 0;
  fxIdleSince = 0;
  fxRaf = requestAnimationFrame(animateFx);
}

function stopFxLoop() {
  fxRunning = false;
  if (fxRaf) cancelAnimationFrame(fxRaf);
  fxRaf = 0;
  fxLastFrame = 0;
  fxIdleSince = 0;

  if (fxCtx) {
    fxCtx.setTransform(1,0,0,1,0,0);
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    resizeFx();
  }
}

function animateFx(ts) {
  if (!fxCtx || !fxCanvas) { stopFxLoop(); return; }

  const cfg = fxConfig();
  const minDt = 1000 / cfg.fps;
  if (fxLastFrame && (ts - fxLastFrame) < minDt) {
    fxRaf = requestAnimationFrame(animateFx);
    return;
  }
  fxLastFrame = ts;

  if (rockets.length === 0 && particles.length === 0) {
    if (!fxIdleSince) fxIdleSince = ts;
    if (ts - fxIdleSince > 850) {
      stopFxLoop();
      return;
    }
  } else {
    fxIdleSince = 0;
  }

  fxCtx.globalCompositeOperation = "source-over";
  fxCtx.fillStyle = `rgba(0,0,0,${cfg.fade})`;
  fxCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  fxCtx.globalCompositeOperation = "lighter";

  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.life -= 1;

    const px = r.x, py = r.y;
    r.vy += 0.16;
    r.x += r.vx;
    r.y += r.vy;

    fxCtx.lineWidth = cfg.rocketLine;
    fxCtx.strokeStyle = `hsla(${r.hue} 95% 70% / 0.95)`;
    fxCtx.beginPath();
    fxCtx.moveTo(px, py);
    fxCtx.lineTo(r.x, r.y);
    fxCtx.stroke();

    if (r.life <= 0 || r.vy > -2.5) {
      explode(r.x, r.y, r.hue);
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

    fxCtx.lineWidth = cfg.particleLine;
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

  if (fxRunning) fxRaf = requestAnimationFrame(animateFx);
}

function fogosMedios() {
  fanfarraCurta();
  const cfg = fxConfig();
  startFxLoop();
  for (let i = 0; i < cfg.rocketsMedios; i++) setTimeout(spawnRocket, i * cfg.rocketIntervalMedios);
}

function fogosGrandes() {
  fanfarraGrande();
  const cfg = fxConfig();
  startFxLoop();
  for (let i = 0; i < cfg.rocketsGrandes; i++) setTimeout(spawnRocket, i * cfg.rocketIntervalGrandes);
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
      tabuadaAtual = 1;

      if (labelTabuada) labelTabuada.textContent = "";
      setModoEscolhaCartas();

      jogoAtivo = false;
      cronometroAtivo = false;
      clearInterval(intervalo);

      return;
    }

    tabuada = Number(v);
    tabuadaAtual = tabuada;
    numeroAtual = 1;

    jogoAtivo = false;
    cronometroAtivo = false;
    clearInterval(intervalo);

    tempo = 60;
    acertos = 0;
    erros = 0;
    etapa = "normal";

    prepararMestresParaJogada(tabuadaAtual);

    syncFaseEMeta();
    atualizarPainel();
    setPilhaDireita(meta);

    atualizarLabelTabuada();

    setModoJogoCartas();
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

  if (!tabuadaSelecionadaValida()) {
    abrirModal(
      "Escolha a tabuada",
      "Selecione uma tabuada (1 a 10) para começar.",
      () => { if (tabuadaSelect) tabuadaSelect.focus(); },
      () => { if (tabuadaSelect) tabuadaSelect.focus(); }
    );
    return;
  }

  tabuadaAtual = Number(tabuadaSelect.value);
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

  setModoJogoCartas();
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

  setModoJogoCartas();
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);

  if (respostaInput) {
    respostaInput.value = "";
    focusRespostaSeguro();
  }
}

// =======================
// OPROFESSOR
// =======================
const OPROFESSOR = { nome: "Oprofessor 🐾 (Pantera)", img: "./oprofessor.png" };

const OP_RULES = {
  facil:   { alunoMin: 25, opMax: 24 },
  media:   { alunoMin: 45, opMax: 44 },
  dificil: { alunoMin: 60, opMax: 59 }
};

function iniciarDesafioOprofessor60s(onVenceu, onPerdeu) {
  const rules = OP_RULES[faseAtual] || OP_RULES.facil;

  let pontosAluno = 0;
  let pontosOp = 0;

  jogoAtivo = true;
  cronometroAtivo = false;
  clearInterval(intervalo);

  if (typeof setModoJogoCartas === "function") setModoJogoCartas();

  function novaPerguntaGlobal() {
    tabuada = Math.floor(Math.random() * 10) + 1;
    numeroAtual = Math.floor(Math.random() * 10) + 1;

    if (tabuadaSelect) tabuadaSelect.value = String(tabuada);
    atualizarLabelTabuada();

    virarParaVersoComNumero(cartaEsquerda, numEsquerda, tabuada);
    virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);

    if (respostaInput) respostaInput.value = "";
    atualizarPlaceholder();
    focusRespostaSeguro();
  }

  let acabou = false;
  let t0 = performance.now();
  let tick = null;

  function setTempoTela(valor) {
    tempo = Math.max(0, Math.floor(valor));
    if (tempoSpan) tempoSpan.textContent = String(tempo);
  }

  function iniciarTempoRegressivo() {
    setTempoTela(60);
    if (tick) clearInterval(tick);
    tick = setInterval(() => {
      if (acabou) return;
      const elapsed = (performance.now() - t0) / 1000;
      const rest = 60 - elapsed;
      setTempoTela(rest);
      if (rest <= 0) finalizar();
    }, 120);
  }

  let opTimers = [];

  function agendarOprofessor() {
    opTimers.forEach(clearTimeout);
    opTimers = [];

    const base = 60000 / Math.max(1, rules.opMax);
    for (let i = 1; i <= rules.opMax; i++) {
      const ideal = i * base;
      const jitter = (Math.random() * 0.35 - 0.175) * base;
      const when = Math.max(80, Math.min(60000, ideal + jitter));

      opTimers.push(setTimeout(() => {
        if (acabou) return;
        if (pontosOp < rules.opMax) pontosOp++;
      }, when));
    }
  }

  function finalizar() {
    if (acabou) return;
    acabou = true;

    if (tick) clearInterval(tick);
    tick = null;

    opTimers.forEach(clearTimeout);
    opTimers = [];

    const alunoBateuMin = pontosAluno >= rules.alunoMin;
    const alunoGanhouNoPlacar = pontosAluno > pontosOp;
    const venceu = alunoBateuMin && alunoGanhouNoPlacar;

    const placar = `<b>Você:</b> ${pontosAluno} | <b>${OPROFESSOR.nome}:</b> ${pontosOp}`;

    if (venceu) {
      if (typeof fogosGrandes === "function") fogosGrandes();

      setTimeout(() => {
        abrirModal(
          "👑 Mestre dos Mestres!",
          `Você se tornou o <b>MESTRE DOS MESTRES</b> na fase <b>${faseAtual.toUpperCase()}</b>!<br><br>${placar}<br><br>Quer subir de nível?`,
          () => onVenceu(),
          () => onPerdeu()
        );
      }, 650);
    } else {
      abrirModal(
        "🐾 Oprofessor venceu!",
        `${placar}<br><br>😈 Você perdeu.<br>Quer tentar novamente?`,
        () => onPerdeu(),
        () => onPerdeu()
      );
    }
  }

  const verificarOriginal = window.verificar;

  window.verificar = function () {
    if (acabou) return;
    if (!respostaInput) return;

    const v = respostaInput.value;
    if (v === "") return;

    const resposta = Number(v);
    const correta = tabuada * numeroAtual;

    if (resposta === correta) {
      pontosAluno++;
      novaPerguntaGlobal();
    } else {
      respostaInput.value = "";
      atualizarPlaceholder();
      focusRespostaSeguro();
    }
  };

  const restore = () => { window.verificar = verificarOriginal; };

  t0 = performance.now();
  iniciarTempoRegressivo();
  agendarOprofessor();
  novaPerguntaGlobal();

  setTimeout(() => { restore(); }, 60500);
}

// =======================
// AVANÇAR
// =======================
function avancarParaProximaTabuadaOuFase() {
  jogoAtivo = true;
  cronometroAtivo = false;
  clearInterval(intervalo);

  fecharDuelo();

  if (tabuadaSelecionadaValida()) {
    tabuadaAtual = Number(tabuadaSelect.value);
  }

  tabuadaAtual++;

  if (tabuadaAtual > 10) {
    const proximoNivel =
      (faseAtual === "facil") ? "media" :
      (faseAtual === "media") ? "dificil" :
      null;

    if (!proximoNivel) {
      abrirModal(
        "👑 Mestre dos Mestres!",
        `Você me venceu e se tornou o <b>MESTRE DOS MESTRES</b>!<br><br>${OPROFESSOR.nome} se rende diante de você! 🐾🔥`,
        () => resetTudoParaInicio(),
        () => resetTudoParaInicio()
      );
      return;
    }

    abrirModal(
      "🐾 Mestre dos Mestres",
      `
        <div class="op-stage">
          <div class="op-card3d">
            <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
              ${OPROFESSOR.img ? `<img class="op-img" src="${OPROFESSOR.img}" style="
                width:230px;height:230px;border-radius:26px;object-fit:contain;
                background: rgba(255,255,255,.06); padding: 10px;
                border:2px solid rgba(255,255,255,.18);
              ">` : ""}

              <div class="op-title" style="font-size:22px; font-weight:1000; letter-spacing:1px; text-align:center;">
                🐾 OPROFESSOR CHEGOU
              </div>

              <div class="op-sub" style="font-size:18px; font-weight:900; line-height:1.35; text-align:center;">
                Você acha que é bom? Agora vamos ver.<br>
                Te desafio a um duelo de verdade!<br>
                Está pronto para parar de brincar e enfrentar alguém bom de verdade?
              </div>

              <div class="op-sub" style="margin-top:6px; font-size:14px; opacity:.95; text-align:center;">
                Duelo regressivo de <b>60 segundos</b>. Tabuadas alternadas.
              </div>
            </div>
          </div>
        </div>
      `,
      () => {
        iniciarDesafioOprofessor60s(
          () => {
            faseAtual = proximoNivel;
            if (faseSelect) faseSelect.value = faseAtual;

            meta = setMetaByFase(faseAtual);
            tabuadaAtual = 1;

            abrirModal(
              "⬆️ Você subiu de nível!",
              `Agora você está no nível <b>${faseAtual.toUpperCase()}</b>.<br>Quer começar do 1?`,
              () => {
                if (tabuadaSelect) tabuadaSelect.value = String(tabuadaAtual);
                window.iniciarJogo(false);
              },
              () => resetTudoParaInicio()
            );
          },
          () => resetTudoParaInicio()
        );
      },
      () => resetTudoParaInicio()
    );

    return;
  }

  if (tabuadaSelect) tabuadaSelect.value = String(tabuadaAtual);

  tabuada = tabuadaAtual;
  fase = faseAtual;
  meta = setMetaByFase(faseAtual);

  prepararMestresParaJogada(tabuadaAtual);

  atualizarLabelTabuada();

  etapa = "normal";
  numeroAtual = 1;

  tempo = 60;
  acertos = 0;
  erros = 0;
  atualizarPainel();
  setPilhaDireita(meta);

  setModoJogoCartas();
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
    "Vamos para a próxima tabuada? (antes precisa vencer o desafiante)",
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

  const resposta = Number(valor);
  const correta = tabuada * numeroAtual;
  const acertou = (resposta === correta);

  // ====== DUELO ======
  if (dueloAtivo) {
    if (performance.now() >= duelo.fimEm) {
      finalizarDueloTempo();
      return;
    }

    if (acertou) {
      duelo.pontosAluno++;
      atualizarDueloUI();

      duelo.perguntaToken++;
      gerarPerguntaDueloNova();

      respostaInput.value = "";
      atualizarPlaceholder();
      focusRespostaSeguro();

      agendarRespostaMestre();
      return;
    }

    duelo.errosAluno++;
    atualizarDueloUI();

    respostaInput.value = "";
    atualizarPlaceholder();
    focusRespostaSeguro();
    return;
  }

  // ====== JOGO NORMAL ======
  if (!cronometroAtivo) iniciarCronometro();

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
  setModoJogoCartas();
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);
  focusRespostaSeguro();
}

window.verificar = verificar;

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

    if (typeof window.verificar === "function") window.verificar();
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

  if (typeof window.verificar === "function") window.verificar();
}, { passive: false });

// =======================
// ✅ ESTADO INICIAL
// =======================
(function initEstadoInicial() {
  syncFaseEMeta();
  atualizarPainel();

  if (tabuadaSelect && tabuadaSelect.value === "") {
    setModoEscolhaCartas();
  } else if (tabuadaSelecionadaValida()) {
    atualizarLabelTabuada();
    setModoJogoCartas();
    virarParaVersoComNumero(cartaEsquerda, numEsquerda, Number(tabuadaSelect.value));
    virarParaVersoComNumero(cartaDireita, numDireita, 1);
  } else {
    setModoEscolhaCartas();
  }
})();




























