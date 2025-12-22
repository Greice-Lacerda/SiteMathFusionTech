/* script.js */

// --- 1. CONFIGURAÇÃO E ESTADO GLOBAL ---

const DOM = {
    ball: document.getElementById('ball'),
    stage: document.getElementById('stage'),
    target: document.getElementById('target'),
    labels: {
        pos: document.getElementById('display-pos'),
        vel: document.getElementById('display-vel'),
        status: document.getElementById('game-status'),
        g: document.getElementById('val-gravity'),
        e: document.getElementById('val-elasticity'),
        vx: document.getElementById('val-velx')
    },
    inputs: {
        g: document.getElementById('gravityRange'),
        e: document.getElementById('elasticityRange'),
        vx: document.getElementById('velXRange')
    },
    btn: {
        reset: document.getElementById('btn-reset'), // Este botão agora serve para Lançar E Reiniciar
        pause: document.getElementById('btn-pause')
    },
    modal: {
        overlay: document.getElementById('feedback-modal'),
        content: document.querySelector('.modal-content'),
        title: document.getElementById('modal-title'),
        message: document.getElementById('modal-message')
    }
};

// Estado da aplicação
const state = {
    pos: { x: 50, y: 50 },
    vel: { x: 4, y: 0 },
    params: {
        gravity: 0.25,
        elasticity: 0.8,
        launchVelX: 4
    },
    simulation: {
        isLaunched: false, // NOVO: Controla se o lançamento já ocorreu
        isRunning: true,   // Controla o Pause
        animationId: null,
        stageWidth: 0,
        stageHeight: 0,
        ballSize: 30
    },
    target: {
        x: 0, y: 0, w: 100, h: 100, active: true
    }
};

// --- 2. MOTOR FÍSICO ---

function init() {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    setupControls();

    // Configura o estado inicial (bola parada no topo)
    resetSimulation();

    // Inicia o loop de renderização (ficará parado visualmente até clicar em Lançar)
    loop();
}

function updateDimensions() {
    state.simulation.stageWidth = DOM.stage.clientWidth;
    state.simulation.stageHeight = DOM.stage.clientHeight;
}

function updatePhysics() {
    // Só calcula física se estiver rodando (não pausado) E se já foi lançado
    if (!state.simulation.isRunning || !state.simulation.isLaunched) return;

    // 1. Aplicar Gravidade
    state.vel.y += state.params.gravity;

    // 2. Aplicar Velocidade
    state.pos.x += state.vel.x;
    state.pos.y += state.vel.y;

    // 3. Colisões com Paredes
    const maxX = state.simulation.stageWidth - state.simulation.ballSize;
    const maxY = state.simulation.stageHeight - state.simulation.ballSize;

    // Chão
    if (state.pos.y > maxY) {
        state.pos.y = maxY;
        state.vel.y *= -state.params.elasticity;

        // Atrito para estabilizar quando para
        if (Math.abs(state.vel.y) < state.params.gravity * 2) {
            state.vel.y = 0;
            state.vel.x *= 0.98;
        }
    }
    // Teto
    else if (state.pos.y < 0) {
        state.pos.y = 0;
        state.vel.y *= -state.params.elasticity;
    }

    // Paredes Laterais
    if (state.pos.x > maxX) {
        state.pos.x = maxX;
        state.vel.x *= -state.params.elasticity;
    } else if (state.pos.x < 0) {
        state.pos.x = 0;
        state.vel.x *= -state.params.elasticity;
    }

    // 4. Verificações de jogo
    checkTargetHit();

    // Detectar parada (Erro)
    if (Math.abs(state.vel.x) < 0.1 && Math.abs(state.vel.y) < 0.1 && state.pos.y >= maxY) {
        state.simulation.isRunning = false;
        analyzeMiss();
    }
}

function checkTargetHit() {
    if (!state.target.active) return;

    const ballCX = state.pos.x + (state.simulation.ballSize / 2);
    const ballCY = state.pos.y + (state.simulation.ballSize / 2);

    if (ballCX > state.target.x && ballCX < state.target.x + state.target.w &&
        ballCY > state.target.y && ballCY < state.target.y + state.target.h) {
        finishGame(true);
    }
}

// --- 3. RENDERIZAÇÃO ---

function render() {
    DOM.ball.style.transform = `translate(${state.pos.x}px, ${state.pos.y}px)`;
    DOM.labels.pos.textContent = `${state.pos.x.toFixed(0)}, ${state.pos.y.toFixed(0)}`;
    DOM.labels.vel.textContent = `${state.vel.x.toFixed(1)}, ${state.vel.y.toFixed(1)}`;
}

function loop() {
    updatePhysics();
    render();
    state.simulation.animationId = requestAnimationFrame(loop);
}

// --- 4. CONTROLES ---

function setupControls() {
    // Sliders
    DOM.inputs.g.addEventListener('input', (e) => {
        state.params.gravity = parseFloat(e.target.value);
        DOM.labels.g.textContent = state.params.gravity;
    });

    DOM.inputs.e.addEventListener('input', (e) => {
        state.params.elasticity = parseFloat(e.target.value);
        DOM.labels.e.textContent = state.params.elasticity;
    });

    DOM.inputs.vx.addEventListener('input', (e) => {
        state.params.launchVelX = parseFloat(e.target.value);
        DOM.labels.vx.textContent = state.params.launchVelX;
    });

    // Botão Principal (Lançar / Reiniciar)
    // Mudamos para chamar uma função que decide o que fazer
    DOM.btn.reset.addEventListener('click', handleMainButton);

    // Botão Pause
    DOM.btn.pause.addEventListener('click', () => {
        if (!state.simulation.isLaunched) return; // Não pausa se nem começou
        state.simulation.isRunning = !state.simulation.isRunning;
        DOM.btn.pause.textContent = state.simulation.isRunning ? "Pausar" : "Continuar";
        DOM.btn.pause.classList.toggle('secondary-btn');
    });
}

// Função inteligente do botão principal
function handleMainButton() {
    if (state.simulation.isLaunched) {
        // Se já foi lançado, o botão funciona como "Reiniciar" (volta pro início e para)
        resetSimulation();
    } else {
        // Se não foi lançado, o botão funciona como "Lançar"
        launchBall();
    }
}

function launchBall() {
    state.simulation.isLaunched = true;
    state.simulation.isRunning = true;
    DOM.btn.reset.textContent = "Reiniciar"; // Muda texto para permitir resetar
    DOM.labels.status.textContent = "Em movimento...";
    DOM.labels.status.style.color = "#eee";
}

function resetSimulation() {
    // 1. Volta variáveis para o início
    state.pos.x = 0;
    state.pos.y = 0;
    state.vel.x = state.params.launchVelX; // Prepara a velocidade (mas não aplica ainda)
    state.vel.y = 0;

    // 2. Trava o movimento
    state.simulation.isLaunched = false;
    state.simulation.isRunning = true;

    // 3. Reseta Interface
    DOM.btn.reset.textContent = "Lançar"; // Convida o usuário a lançar
    DOM.btn.pause.textContent = "Pausar";
    DOM.btn.pause.classList.remove('secondary-btn');

    spawnTarget(); // Novo alvo
    render(); // Força renderização imediata na posição 0,0
}

function spawnTarget() {
    const maxX = state.simulation.stageWidth - 100;
    const maxY = state.simulation.stageHeight - 100;

    state.target.x = Math.random() * (maxX - 200) + 200;
    state.target.y = Math.random() * (maxY - 100) + 50;
    state.target.active = true;

    DOM.target.style.left = state.target.x + 'px';
    DOM.target.style.top = state.target.y + 'px';
    DOM.target.style.width = state.target.w + 'px';
    DOM.target.style.height = state.target.h + 'px';
    DOM.target.textContent = "ALVO";
    DOM.target.style.backgroundColor = "rgba(78, 204, 163, 0.3)";

    DOM.labels.status.textContent = "Ajuste e clique em LANÇAR";
}

// --- 5. LÓGICA DE FIM DE JOGO ---

function finishGame(win) {
    state.simulation.isRunning = false;
    state.target.active = false;

    DOM.target.style.backgroundColor = win ? "#4ecca3" : "#ff5f6d";
    DOM.target.textContent = win ? "SUCESSO!" : "FALHA";
    DOM.labels.status.textContent = win ? "Vitória!" : "Falha";

    if (win) {
        showModal(true, "Parabéns!",
            "Você encontrou o equilíbrio perfeito! A velocidade horizontal constante (<i>v<sub>x</sub></i>) combinada com a aceleração da gravidade (<i>g</i>) criou uma parábola exata até as coordenadas do alvo.");
    }
}

function analyzeMiss() {
    const ballCX = state.pos.x + (state.simulation.ballSize / 2);
    const targetCX = state.target.x + (state.target.w / 2);

    let title = "Errou!";
    let explanation = "";

    if (ballCX < targetCX) {
        explanation = "A bola parou <b>antes</b>. Faltou energia cinética! Tente <u>aumentar a velocidade inicial</u> (<i>v<sub>x</sub></i>) ou diminuir o atrito/gravidade para que ela alcance uma distância maior.";
    } else {
        explanation = "A bola foi <b>longe demais</b>. O impulso inicial foi muito forte. Tente <u>diminuir a velocidade de lançamento</u> ou aumentar a gravidade para que ela caia mais cedo.";
    }

    showModal(false, title, explanation);
}

function showModal(isSuccess, title, text) {
    const { overlay, content, title: titleEl, message } = DOM.modal;
    content.className = "modal-content " + (isSuccess ? "success" : "fail");
    titleEl.textContent = title;
    message.innerHTML = text;
    overlay.classList.remove('hidden');
}

function closeModal() {
    DOM.modal.overlay.classList.add('hidden');
    resetSimulation(); // Ao fechar, reseta e espera novo lançamento
}

init();