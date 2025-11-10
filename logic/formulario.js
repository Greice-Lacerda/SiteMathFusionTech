/*
 * LÓGICA DO FORMULÁRIO DE INSCRIÇÃO (Versão Google Sheets API)
 * Este script envia os dados do formulário de inscrição para o Google Apps Script.
 */

// --- 1. CONFIGURAÇÃO ---

// URL DA API (JÁ PREENCHIDA COM A SUA URL)
// Esta é a URL da sua implantação do Google Apps Script para o formulário de INSCRIÇÃO.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJDLLzj5PDyi_Gkxb62bveYROCemgJ5a9lqrduBeBPBj3hV3Hj-bMjCt9REw_2WSZ0/exec";


// --- 2. SELETORES DO DOM ---

// Seleciona os elementos da página
const form = document.getElementById('form-inscricao');
const btnEnviar = document.getElementById('btn-enviar-inscricao');
const btnText = document.getElementById('btn-text');
const btnLoader = document.getElementById('btn-loader');
const statusMessage = document.getElementById('status-message');
const ocupacaoOutroInput = document.getElementById('ocupacao-outro');

// --- 3. INICIALIZAÇÃO ---

if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("COLE_A_URL_AQUI")) { // Verificação corrigida para o placeholder
    console.error("Erro: A URL do Google Script não foi configurada em /scripts/inscricao.js");
    
    // Se a URL estivesse errada (vazia ou com placeholder):
    if (!GOOGLE_SCRIPT_URL.includes("https://script.google.com/macros/s/")) {
        alert("ERRO DE CONFIGURAÇÃO: A URL do script do Google não foi definida no arquivo /scripts/inscricao.js");
        if (btnEnviar) {
            btnEnviar.disabled = true;
            btnText.textContent = "Erro de Configuração";
        }
    } else {
        // Se a URL estiver OK, anexa os listeners ao formulário e aos botões de rádio
        setupFormListener();
        setupRadioListeners();
    }

} else {
    // Se a URL estiver OK, anexa os listeners ao formulário e aos botões de rádio
    setupFormListener();
    setupRadioListeners();
}


// --- 4. LÓGICA DE EXIBIÇÃO DO CAMPO "OUTRO" ---

function setupRadioListeners() {
    // Seleciona todos os botões de rádio com o nome 'ocupacao'
    const ocupacaoRadios = document.querySelectorAll('input[name="ocupacao"]');

    ocupacaoRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            // Se o valor do rádio selecionado for "Outro", mostra o campo de texto.
            // Caso contrário, esconde-o.
            if (radio.value === "Outro") {
                ocupacaoOutroInput.style.display = 'block';
                ocupacaoOutroInput.setAttribute('required', 'true'); // Torna obrigatório
            } else {
                ocupacaoOutroInput.style.display = 'none';
                ocupacaoOutroInput.removeAttribute('required'); // Deixa de ser obrigatório
                ocupacaoOutroInput.value = ''; // Limpa o campo
            }
        });
    });
}


// --- 5. ENVIO DO FORMULÁRIO (Salvar na Planilha) ---

function setupFormListener() {
    if (!form) return; // Garante que o formulário exista

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        // Desabilita o botão e mostra o loader
        setLoading(true);

        // --- Coleta de Dados ---
        const formData = new FormData(form);

        // 1. Pega todos os dados simples
        const payload = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            naturalidade: formData.get('naturalidade'),
            municipio: formData.get('municipio'),
            ocupacao: formData.get('ocupacao'),
            ocupacao_outro: formData.get('ocupacao-outro') || '', // Pega o campo "outro"
            instituicao: formData.get('instituicao'),
            tecnologia: formData.get('tecnologia'),
            programacao: formData.get('programacao'),
            interesse: formData.get('interesse'),
            expectativas: formData.get('expectativas'),
            disponibilidade_texto: formData.get('disponibilidade-texto'),
        };

        // 2. Coleta os checkboxes de disponibilidade (horários)
        const horariosSelecionados = [];
        const checkboxes = form.querySelectorAll('input[name="disponibilidade-horario"]:checked');
        checkboxes.forEach((checkbox) => {
            horariosSelecionados.push(checkbox.value);
        });

        // Converte o array de horários em uma única string separada por vírgula
        payload.disponibilidade_horarios = horariosSelecionados.join(', ');

        // --- Envio para a API ---
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

            console.log("Dados de inscrição enviados para o Google Sheets.");

            // *** LINHA ALTERADA CONFORME SOLICITADO ***
            showStatus("SEJA BEM-VINDO AO PROJETO! INSCRIÇÃO REALIZADA COM SUCESSO!", "success");

            form.reset(); // Limpa o formulário

            // Esconde o campo "Outro" após o reset
            if (ocupacaoOutroInput) {
                ocupacaoOutroInput.style.display = 'none';
            }

        } catch (error) {
            console.error("Erro ao enviar inscrição:", error);
            showStatus("Erro ao enviar sua inscrição. Por favor, tente novamente.", "error");
        } finally {
            // Reabilita o botão e esconde o loader
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
    statusMessage.className = `status-message ${type}`; // 'success' ou 'error'
    statusMessage.style.display = 'block';

    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 6000); // Esconde a mensagem após 6 segundos
}