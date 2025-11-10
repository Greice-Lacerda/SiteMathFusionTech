/*
 * LÓGICA DO FORMULÁRIO DE CONTATO (Versão Google Sheets API)
 * Este script envia os dados do formulário para o Google Apps Script.
 */

// --- 1. CONFIGURAÇÃO ---

// URL da sua API do Google Apps Script (JÁ PREENCHIDA)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzPr2_1Nh8imoiBjou7ovxEseLUE1GFCi6hlDuXe0Xm4Z2wbRVJdcjnFjM5xavHJfSTNg/exec";


// --- 2. SELETORES DO DOM ---
const form = document.getElementById('form-contato');
const nomeInput = document.getElementById('nome-contato');
const comentarioInput = document.getElementById('comentario-contato');
const btnEnviar = document.getElementById('btn-enviar');
const btnText = document.getElementById('btn-text');
const btnLoader = document.getElementById('btn-loader');
const statusMessage = document.getElementById('status-message');

// Seletores da Lista de Comentários
const comentariosLista = document.getElementById('comentarios-lista');
const loaderComentarios = document.getElementById('loader-comentarios');


// --- 3. INICIALIZAÇÃO ---

// Verifica se a URL foi preenchida
if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("COLE_A_URL")) {
    console.error("Erro: A URL do Google Script não foi configurada em /scripts/contato.js");
    alert("ERRO DE CONFIGURAÇÃO: A URL do script do Google não foi definida no arquivo /scripts/contato.js");
    if (btnEnviar) btnEnviar.disabled = true;
    if (loaderComentarios) loaderComentarios.textContent = "Erro de configuração da API.";
} else {
    // Se a URL estiver OK, anexa os listeners

    // 1. Prepara o formulário de ENVIO
    setupFormListener();

    // 2. Carrega os comentários APROVADOS assim que a página abre
    // O 'DOMContentLoaded' garante que o HTML foi carregado antes do script rodar
    document.addEventListener('DOMContentLoaded', loadApprovedComments);
}


// --- 4. FUNÇÃO DE LEITURA (GET) ---

async function loadApprovedComments() {
    if (!comentariosLista) return; // Se a lista não existir, para

    console.log("Buscando comentários aprovados...");

    try {
        // Envia uma requisição GET para a nossa API
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'GET', // O padrão já é GET, mas é bom ser explícito
            cache: 'no-cache' // Pede ao navegador para não guardar a lista antiga
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP! Status: ${response.status}`);
        }

        const comentarios = await response.json();

        // Limpa a lista (remove o "Carregando...")
        comentariosLista.innerHTML = '';

        if (comentarios.result === "error") {
            // Erro vindo da API (ex: script falhou)
            throw new Error(comentarios.message);
        }

        if (comentarios.length === 0) {
            comentariosLista.innerHTML = '<p>Ainda não há comentários aprovados. Seja o primeiro!</p>';
            return;
        }

        // Inverte a lista para mostrar os mais RECENTES primeiro
        comentarios.reverse();

        // Constrói os cards de comentário
        comentarios.forEach(data => {
            const comentarioCard = document.createElement('div');
            comentarioCard.className = 'comentario-card';

            const blockquote = document.createElement('blockquote');
            blockquote.textContent = data.comentario;

            const cite = document.createElement('cite');
            cite.textContent = `- ${data.nome}`;

            comentarioCard.appendChild(blockquote);
            comentarioCard.appendChild(cite);
            comentariosLista.appendChild(comentarioCard);
        });

    } catch (error) {
        console.error("Erro ao carregar comentários:", error);
        loaderComentarios.className = "error-message"; // Usa a classe de erro
        loaderComentarios.innerHTML = `Não foi possível carregar os comentários. Tente recarregar a página. (Erro: ${error.message})`;
    }
}


// --- 5. FUNÇÃO DE ESCRITA (POST) ---

function setupFormListener() {
    if (!form) return; // Garante que o formulário exista

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = nomeInput.value.trim();
        const comentario = comentarioInput.value.trim();

        if (!nome || !comentario) {
            showStatus("Por favor, preencha todos os campos.", "error");
            return;
        }

        setLoading(true);

        const payload = {
            nome: nome,
            comentario: comentario
        };

        try {
            // Envia os dados (POST) para a URL do Google Apps Script
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Essencial para o Google Script
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            console.log("Dados enviados para o Google Sheets.");
            showStatus("Obrigado! Seu comentário foi enviado com sucesso.", "success");
            form.reset(); // Limpa o formulário

        } catch (error) {
            console.error("Erro ao enviar para o Google Sheets:", error);
            showStatus("Erro ao enviar seu comentário. Tente novamente.", "error");
        } finally {
            setLoading(false);
        }
    });
}


// --- 6. FUNÇÕES AUXILIARES (UI) ---

function setLoading(isLoading) {
    if (isLoading) {
        btnEnviar.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
    } else {
        btnEnviar.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
    }
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';

    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}