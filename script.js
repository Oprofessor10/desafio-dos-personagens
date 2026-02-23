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
// AVATAR DO ALUNO (por enquanto: escolha de avatar)
// =======================
let avatarAluno = "./avatar1.png"; // crie esses arquivos depois (avatar1.png, avatar2.png, avatar3.png)
const AVATARES_ALUNO = ["./avatar1.png", "./avatar2.png", "./avatar3.png"];

window.setAvatarAluno = function (src) {
  avatarAluno = src || "./avatar1.png";
  const fotoAluno = document.getElementById("dueloAlunoFoto");
  if (fotoAluno) fotoAluno.src = avatarAluno;
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

  // tempo
  duracaoMs: 10000, // ✅ TESTE: 10s (depois voltamos pra 60000)
  fimEm: 0,
  tickTimer: null,

  // mestre
  mestreTimer: null,
  mestreTentativas: 0,
  mestreMaxTentativas: 25,

  // pergunta/rodada
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
            <img id="dueloAlunoFoto" class="duelo-foto" src="${avatarAluno}" alt="">
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

  const style = document.createElement("style");
  style.textContent = `
    .duelo{ position: fixed; inset: 0; display: grid; place-items: center; z-index: 12000; pointer-events:none; }
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
    }

    .duelo-row{
      display:flex;
      align-items: stretch;
      justify-content: center;
      gap: 14px;
    }

    .duelo-card{
      flex: 1;
      min-width: 320px;
      border-radius: 16px;
      padding: 12px 14px;
      background: rgba(0,0,0,.28);
      border: 1px solid rgba(255,255,255,.10);
      font-weight: 900;
    }

    .duelo-head{
      display:flex;
      align-items:center;
      gap:12px;
      margin-bottom: 10px;
    }

    /* FOTO MAIOR (sem cortar) */
    .duelo-foto{
      width: 86px;
      height: 86px;
      border-radius: 999px;
      object-fit: contain;
      background: rgba(255,255,255,.06);
      padding: 6px;
      border: 3px solid rgba(255,255,255,.25);
      box-shadow: 0 14px 30px rgba(0,0,0,.35);
      flex: 0 0 auto;
    }

    .duelo-nome{
      font-size: 20px;
      letter-spacing: 1px;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 420px;
    }

    /* placar maior */
    .duelo-placar{
      display:flex;
      gap: 18px;
      font-size: 18px;
      opacity: 1;
      align-items:center;
      flex-wrap: wrap;
      justify-content:flex-end;
      text-align:right;
    }

    /* VS mais radical */
    .duelo-versus{
      align-self: center;
      width: 86px;
      height: 86px;
      display:grid;
      place-items:center;
      border-radius: 22px;
      background: linear-gradient(135deg, rgba(255,60,60,.35), rgba(0,255,160,.25));
      border: 2px solid rgba(255,255,255,.18);
      box-shadow: 0 18px 45px rgba(0,0,0,.35);
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      transform: rotate(-6deg);
      position: relative;
    }
    .duelo-versus::before{
      content:"⚔️";
      position:absolute;
      top: 10px;
      font-size: 20px;
      opacity: .95;
    }
    .duelo-versus::after{
      content:"RING";
      position:absolute;
      bottom: 10px;
      font-size: 12px;
      opacity: .85;
      letter-spacing: 2px;
    }

    /* mobile: empilha */
    @media (max-width: 700px){
      .duelo-row{ flex-direction: column; }
      .duelo-versus{ width: 96px; height: 72px; margin: 8px auto; transform: rotate(-3deg); }
      .duelo-card{ min-width: unset; }
      .duelo-foto{ width: 76px; height: 76px; }
      .duelo-nome{ font-size: 18px; }
      .duelo-placar{ font-size: 16px; }
    }
  `;
  document.head.appendChild(style);
}

function atualizarDueloUI() {
  // FOTO DO MESTRE
  const foto = document.getElementById("dueloMestreFoto");
  if (foto) {
    const src = (duelo.mestre && duelo.mestre.img) ? duelo.mestre.img : "";
    if (src) {
      foto.src = src;
      foto.style.display = "block";
    } else {
      foto.removeAttribute("src");
      foto.style.display = "none";
    }
  }

  // FOTO DO ALUNO
  const fotoAluno = document.getElementById("dueloAlunoFoto");
  if (fotoAluno) {
    fotoAluno.src = avatarAluno || "./avatar1.png";
    fotoAluno.style.display = "block";
  }

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

  // garante carta direita em back (mostrando número)
  if (cartaDireita) {
    cartaDireita.classList.remove("front");
    cartaDireita.classList.add("back");
  }
}

// limite máximo de respostas do mestre por fase (em 60s)
const LIMITE_MESTRE = {
  facil: 25,
  media: 40,
  dificil: 55
};

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

    if (performance.now() >= duelo.fimEm) {
      finalizarDueloTempo();
    }
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
  if (f === "facil") return 4; // ✅ TESTE (depois volta pra 20)
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
// SOM
// =======================
function beep(freq = 880, dur = 0.12, vol = 0.12) {
  try {
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
  } catch (e) { }
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

function resizeFx() {
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

function animateFx() {
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

function fogosMedios() {
  fanfarraCurta();
  for (let i = 0; i < 6; i++) setTimeout(spawnRocket, i * 140);
}

function fogosGrandes() {
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

      // invalida resposta do mestre da pergunta anterior
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















