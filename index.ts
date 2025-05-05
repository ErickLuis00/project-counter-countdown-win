import { appendFileSync } from 'node:fs'; // For logging

const LOG_FILE_PATH = './debug.log';

// Simple file logger
function logToFile(message: string) {
    try {
        const timestamp = new Date().toISOString();
        appendFileSync(LOG_FILE_PATH, `[${timestamp}] [Main] ${message}\\n`);
    } catch (e) {
        // Fallback if logging fails
        console.error("[Main] Failed to write to log file:", e);
    }
}

logToFile("Main process started.");

// Start the server worker
logToFile("Attempting to start worker...");
let worker: Worker | null = null;
try {
    worker = new Worker("worker.ts");
    logToFile("Worker object created using simple path 'worker.ts'.");
    worker.onerror = (err) => {
        logToFile(`WORKER UNCAUGHT ERROR: ${err.message}`);
    };
    worker.onmessageerror = (err) => {
        logToFile(`WORKER MESSAGE ERROR: ${JSON.stringify(err)}`);
    };
} catch (error) {
    logToFile(`FATAL: Failed to create worker: ${error instanceof Error ? error.message : String(error)}`);
    // Consider exiting or showing an error immediately if worker creation fails catastrophically
    process.exit(1); // Exit if worker creation fails
}

import { Webview } from "webview-bun"

const html = `
<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rastreador de Projetos</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"/>
    <style>
        :root {
            /* Adjust font size for mobile if needed */
            /* --pico-font-size: 0.9rem; */
        }
        body {
            display: flex;
            flex-direction: column; /* Stack countdown and main content */
            align-items: center;
          
            min-height: 100vh;
        }
        main {
            width: 100%; /* Full width on mobile */
            max-width: 500px; /* Max width for larger screens */
            display: flex; /* Use flex for main area */
            flex-direction: column;
            align-items: center;
            gap: 1rem; /* Space between elements */
        }

        /* Countdown - Top and Prominent */
        #countdown {
             width: 100%; /* Take full width */
             order: -1; /* Place it first visually */
             margin-bottom: 1rem;
             padding: 1.5rem 1rem; /* More padding */
             background-color: var(--pico-primary-background);
             border: 1px solid var(--pico-primary-border);
             text-align: center; /* Ensure text is centered */
        }
        #countdown figcaption {
             font-size: 1em; /* Larger caption */
             color: var(--pico-primary-focus);
             margin-bottom: 0.5rem;
         }
        #countdown strong {
            color: var(--pico-primary);
            font-size: 2em; /* Significantly larger timer */
            font-variant-numeric: tabular-nums;
            line-height: 1.1;
            display: block; /* Ensure block for centering */
        }
         #countdown.inactive strong {
             color: var(--pico-muted-foreground);
             font-style: italic;
             font-size: 1.5em; /* Still large but less prominent */
        }

        /* Main content area */
        article#main-content {
             position: relative;
             min-height: 150px;
             padding: 1rem; /* Reduced padding */
             margin-bottom: 0; /* Remove bottom margin */
             width: 100%; /* Full width */
             border: 1px solid var(--pico-card-border-color);
             box-shadow: var(--pico-card-box-shadow);
        }
         /* Active project styling */
         #active-project-section {
             padding: 1rem;
             border: 1px solid var(--pico-secondary-border);
             border-radius: var(--pico-border-radius);
             margin-bottom: 1rem;
             background-color: var(--pico-secondary-background);
             text-align: center;
        }
        #active-project-section hgroup h3 {
             margin-bottom: 0.25rem;
             color: var(--pico-secondary);
             font-size: 1.1em;
         }
         #active-project-section hgroup p strong {
              font-size: 1.2em;
         }
         #active-project-section button { width: 100%; margin-top: 0.5rem; }

        /* Stats grid - already stacks by default */
        #stats-grid figure {
             margin: 0.25rem 0;
             padding: 0.75rem;
             text-align: center;
        }
         #stats-grid figure figcaption { font-size: 0.8em; }
         #stats-grid figure strong { font-size: 1.3em; }

        /* Start Project Form */
         #start-project-form { margin-top: 1.5rem; }
         #start-project-form h4 { text-align: center; margin-bottom: 1rem; }
         #start-project-form label { margin-bottom: 0.1rem; font-size: 0.9em; text-align: left; display: block; }
         #start-project-form input { margin-bottom: 0.5rem; }
         #start-project-form button { width: 100%; margin-top: 0.5rem; }

        /* Spinner Styles */
        .spinner {
            border: 4px solid var(--pico-secondary-background);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: var(--pico-primary);
            animation: spin 1s ease infinite;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: none;
        }
        .spinner.visible { display: block; }
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        /* Visibility Control */
        #main-content.loading #content-area { visibility: hidden; }
        #main-content:not(.loading) .spinner { display: none; }

        /* Table styles */
        article#project-list-container { width: 100%; padding: 0; }
        #project-list-table { margin-top: 0; font-size: 0.9em; }
        #project-list-table th, #project-list-table td { padding: 0.5rem 0.75rem; }
        #project-list-table th { text-align: left; }
        #project-list-table td { vertical-align: middle; }

        /* Error Log Area */
        #error-log {
            margin-top: 1rem;
            padding: 0.75rem;
            background-color: var(--pico-secondary-background);
            border: 1px solid var(--pico-secondary-border);
            border-radius: var(--pico-border-radius);
            max-height: 100px;
            overflow-y: auto;
            font-size: 0.8em;
            color: var(--pico-muted-foreground);
            width: 100%;
        }
         #error-log p {
            margin-bottom: 0.25rem;
            border-bottom: 1px dashed var(--pico-secondary-border);
            padding-bottom: 0.25rem;
        }
         #error-log p:last-child {
             margin-bottom: 0;
             border-bottom: none;
             padding-bottom: 0;
        }

        /* Hide sections initially */
        #active-project-section,
        #project-list-container {
            display: none;
        }
        /* Reset Button */
        #reset-button {
            margin-top: 1.5rem;
            /* Use outline secondary for less prominence */
            --pico-color: var(--pico-secondary);
            --pico-border-color: var(--pico-secondary);
            width: 100%;
        }
        #reset-button:hover {
             --pico-color: var(--pico-secondary-hover-color);
             --pico-background-color: var(--pico-secondary-hover);
             --pico-border-color: var(--pico-secondary-hover);
        }
    </style>
</head>
<body>
    <main>
        <!-- Countdown Timer (Moved to Top) -->
        <figure id="countdown">
            <figcaption style="font-size: 0.8em; color: white;">Tempo Restante 🚀</figcaption>
            <strong id="countdown-timer">--:--:--:--</strong>
         </figure>

        <article id="main-content">
            <div class="spinner" id="loading-spinner"></div>
            <div id="content-area">
                <!-- Active Project Section (Hidden Initially) -->
                <section id="active-project-section">
                    <hgroup>
                         <h3>Em Desenvolvimento</h3>
                         <p><strong id="active-project-name"></strong></p>
                    </hgroup>
                    <button id="deliver-active-button" class="contrast outline">Marcar como Entregue</button>
                </section>

                <!-- Stats Grid -->
                <div class="grid" id="stats-grid">
                    <figure>
                        <figcaption>Total Entregues</figcaption>
                        <strong id="total-projects">-</strong>
                    </figure>
                    <figure>
                        <figcaption>Entregues Este Mês (${new Date().toLocaleString('pt-BR', { month: 'long' }).toUpperCase()})</figcaption>
                        <strong id="monthly-projects">-</strong>
                    </figure>
                </div>

                 <!-- Start Project Form -->
                 <form id="start-project-form" action="javascript:void(0);">
                     <h4>Iniciar Novo Projeto</h4>
                     <label for="project-name">Nome do Projeto:</label>
                     <input type="text" id="project-name" placeholder="Digite o nome" required>

                     <label for="deadline-days">Prazo (Dias):</label>
                     <input type="number" id="deadline-days" placeholder="ex: 30" min="1" required>

                     <button type="submit" id="start-button">Iniciar Projeto</button>
                 </form>
            </div>
        </article>

        <!-- Project List Table (Hidden Initially) -->
        <article id="project-list-container">
             <h4 style="margin-bottom: 0.5rem;">Histórico de Entregas</h4>
             <div class="overflow-auto">
                <table id="project-list-table">
                    <thead>
                        <tr>
                            <th scope="col">Projeto</th>
                            <th scope="col">Entregue Em</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="2">Carregando histórico...</td></tr>
                    </tbody>
                </table>
             </div>
        </article>

        <!-- Error Log Area -->
        <div id="error-log">
            <p>Log de Debug Iniciado.</p>
        </div>

        <!-- Reset Button Area -->
        <button id="reset-button" class="outline secondary">Resetar Estado da Aplicação</button>

    </main>

    <script>
        // --- Element References ---
        const errorLogElement = document.getElementById('error-log');
        const countdownTimerElement = document.getElementById('countdown-timer');
        const countdownFigure = document.getElementById('countdown');
        const totalProjectsElement = document.getElementById('total-projects');
        const monthlyProjectsElement = document.getElementById('monthly-projects');
        const projectNameInput = document.getElementById('project-name');
        const deadlineDaysInput = document.getElementById('deadline-days');
        const startButton = document.getElementById('start-button');
        const startProjectForm = document.getElementById('start-project-form');
        const projectListTableBody = document.querySelector('#project-list-table tbody');
        const projectListContainer = document.getElementById('project-list-container');
        const mainContentArticle = document.getElementById('main-content');
        const spinner = document.getElementById('loading-spinner');
        const contentArea = document.getElementById('content-area');
        const activeProjectSection = document.getElementById('active-project-section');
        const activeProjectNameElement = document.getElementById('active-project-name');
        const deliverActiveButton = document.getElementById('deliver-active-button');
        const resetButton = document.getElementById('reset-button');

        // --- Config & State ---
        const apiUrl = 'http://localhost:3001';
        const defaultAppState = { activeProject: null, deliveredProjects: [] }; // Define default state
        let currentAppState = { ...defaultAppState }; // Use a copy
        let countdownInterval = null;

        // --- UI Logging Function ---
        function logErrorToUI(message) {
            try {
                 const timestamp = new Date().toLocaleTimeString('pt-BR');
                 const p = document.createElement('p');
                 p.textContent = timestamp + ": " + message;
                 if (errorLogElement.firstChild) {
                     errorLogElement.insertBefore(p, errorLogElement.firstChild);
                 } else {
                     errorLogElement.appendChild(p);
                 }
                 console.error("[UI LOG] " + message);
            } catch(e) {
                 console.error("Error logging to UI: ", e);
            }
        }

        // --- API & Retry Logic ---
        const MAX_RETRIES = 5;
        const INITIAL_DELAY_MS = 200;

        function setLoadingState(isLoading) {
            mainContentArticle.classList.toggle('loading', isLoading);
            contentArea.style.visibility = isLoading ? 'hidden' : 'visible';
            spinner.style.display = isLoading ? 'block' : 'none';
            startButton.disabled = isLoading;
            projectNameInput.disabled = isLoading;
            deadlineDaysInput.disabled = isLoading;
            deliverActiveButton.disabled = isLoading;
        }

        function renderErrorState(message) {
            const fullMessage = "Estado de Erro: " + message;
            logErrorToUI(fullMessage);
            console.error("[Frontend] " + fullMessage);
            const errorDisplay = document.createElement('p');
            errorDisplay.textContent = "Erro: " + (message || 'Falha ao carregar dados');
            errorDisplay.style.color = 'var(--pico-color-red-500)';
            contentArea.innerHTML = '';
            contentArea.appendChild(errorDisplay);
            setLoadingState(false);
        }

        // --- Countdown Timer ---
        function updateCountdown() {
            if (!currentAppState.activeProject) {
                countdownTimerElement.textContent = "Nenhum Projeto Ativo";
                countdownFigure.classList.add('inactive');
                if (countdownInterval) clearInterval(countdownInterval);
                countdownInterval = null;
                return;
            }
            countdownFigure.classList.remove('inactive');

            const startedAt = new Date(currentAppState.activeProject.startedAt);
            const deadlineMillis = startedAt.getTime() + currentAppState.activeProject.deadlineDays * 24 * 60 * 60 * 1000;
            const deadlineDate = new Date(deadlineMillis);
            const now = new Date();
            const diff = deadlineDate.getTime() - now.getTime();

            if (diff <= 0) {
                countdownTimerElement.textContent = "Prazo Expirado!";
                countdownTimerElement.style.color = 'var(--pico-color-red-500)';
                if (countdownInterval) clearInterval(countdownInterval);
                return;
            }
            countdownTimerElement.style.color = 'var(--pico-primary)';

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            countdownTimerElement.textContent =
                days + "d " +
                hours.toString().padStart(2, '0') + "h " +
                minutes.toString().padStart(2, '0') + "m " +
                seconds.toString().padStart(2, '0') + "s";
        }

        // --- UI Rendering Functions ---
        function renderUI(newState) {
             currentAppState = newState;

             // Render Active Project Section
             if (newState.activeProject) {
                 activeProjectNameElement.textContent = newState.activeProject.name;
                 activeProjectSection.style.display = 'block';
                 deliverActiveButton.disabled = false;
             } else {
                 activeProjectSection.style.display = 'none';
             }

             // Render Stats (based on delivered projects)
             renderStats(newState.deliveredProjects);

             // Render Delivered Project List
             renderProjectList(newState.deliveredProjects);

             // Update Countdown (will handle null active project)
             updateCountdown();
             if (newState.activeProject && !countdownInterval) {
                 countdownInterval = setInterval(updateCountdown, 1000);
             } else if (!newState.activeProject && countdownInterval) {
                 clearInterval(countdownInterval);
                 countdownInterval = null;
             }
        }

        function renderStats(deliveredList) {
             const total = deliveredList.length;
             totalProjectsElement.textContent = total;
             const now = new Date();
             const currentMonth = now.getMonth();
             const currentYear = now.getFullYear();
             const monthlyCount = deliveredList.filter(p => {
                 const deliveredDate = new Date(p.deliveredAt);
                 return deliveredDate.getMonth() === currentMonth && deliveredDate.getFullYear() === currentYear;
             }).length;
             monthlyProjectsElement.textContent = monthlyCount;
        }

         function renderProjectList(deliveredList) {
             projectListTableBody.innerHTML = '';
             if (deliveredList.length === 0) {
                 projectListTableBody.innerHTML = '<tr><td colspan="2">Nenhum projeto entregue ainda.</td></tr>';
                 projectListContainer.style.display = 'none';
                 return;
             }
             projectListContainer.style.display = 'block';
             const sortedProjects = [...deliveredList].sort((a, b) =>
                 new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime()
             );
             sortedProjects.forEach(project => {
                 const row = projectListTableBody.insertRow();
                 const nameCell = row.insertCell();
                 const dateCell = row.insertCell();
                 nameCell.textContent = project.name;
                 const deliveredDate = new Date(project.deliveredAt);
                 dateCell.textContent = deliveredDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
                                        deliveredDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
             });
         }

        // --- API Call Functions ---
        async function callApi(endpoint, method = 'GET', body = null) {
            logErrorToUI("Chamando API: " + method + " " + endpoint + (body ? " com corpo" : ""));
            try {
                const options = {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: body ? JSON.stringify(body) : undefined
                };
                const response = await fetch(apiUrl + endpoint, options);

                if (!response.ok) {
                    let errorMsg = "Erro HTTP " + response.status;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (parseError) {
                        logErrorToUI("Resposta de erro não-JSON do servidor. Status: " + response.status);
                    }
                    throw new Error(errorMsg);
                }
                const responseData = await response.json();
                 logErrorToUI("Chamada API com Sucesso: " + method + " " + endpoint);
                 return responseData;

            } catch (error) {
                 const errorMessage = "Falha na Chamada API: " + method + " " + endpoint + " - " + (error instanceof Error ? error.message : String(error));
                 logErrorToUI(errorMessage);
                 console.error(errorMessage, error);
                 throw error;
            }
        }

         async function startProject() {
             logErrorToUI("Função startProject chamada.");
             const projectName = projectNameInput.value.trim();
             const deadlineDays = parseInt(deadlineDaysInput.value, 10);

             if (!projectName) {
                 logErrorToUI("Validação falhou: Nome do projeto faltando.");
                 alert("Por favor, digite um nome para o projeto.");
                 projectNameInput.focus();
                 return;
             }
             if (isNaN(deadlineDays) || deadlineDays <= 0) {
                 logErrorToUI("Validação falhou: Prazo em dias inválido.");
                 alert("Por favor, digite um número válido de dias para o prazo.");
                 deadlineDaysInput.focus();
                 return;
             }

             startButton.disabled = true;
             startButton.setAttribute("aria-busy", "true");
             logErrorToUI("Tentando iniciar projeto via API: " + projectName);

             try {
                 const newState = await callApi("/start-project", 'POST', { name: projectName, deadlineDays });
                 logErrorToUI("Chamada API startProject bem-sucedida. Renderizando UI.");
                 renderUI(newState);
                 startProjectForm.reset();
                 logErrorToUI("Projeto iniciado com sucesso.");
             } catch (error) {
                 const errorMsg = error instanceof Error ? error.message : String(error);
                 logErrorToUI("Erro ao iniciar projeto: " + errorMsg);
                 console.error("[Frontend] Erro ao iniciar projeto:", error);
                 alert("Falha ao iniciar projeto: " + errorMsg);
             } finally {
                  startButton.disabled = false;
                  startButton.removeAttribute("aria-busy");
             }
         }

         async function markProjectDelivered() {
             logErrorToUI("Função markProjectDelivered chamada.");
             if (!currentAppState.activeProject) {
                  logErrorToUI("Nenhum projeto ativo selecionado para entregar.");
                  alert("Nenhum projeto ativo selecionado.");
                  return;
             }

             // Add confirmation dialog
             if (!confirm("Tem certeza que deseja marcar o projeto '" + currentAppState.activeProject.name + "' como entregue?")) {
                  logErrorToUI("Marcação como entregue cancelada pelo usuário.");
                  return; // Abort if user cancels
             }

             deliverActiveButton.disabled = true;
             deliverActiveButton.setAttribute("aria-busy", "true");
             logErrorToUI("Tentando entregar projeto via API: " + currentAppState.activeProject.name);

             try {
                 const newState = await callApi("/deliver-project", 'POST');
                 logErrorToUI("deliverProject API call successful. Rendering UI.");
                 renderUI(newState);
                 logErrorToUI("Projeto marcado como entregue com sucesso.");
             } catch (error) {
                  const errorMsg = error instanceof Error ? error.message : String(error);
                  logErrorToUI("Erro ao entregar projeto: " + errorMsg);
                  console.error("[Frontend] Erro ao entregar projeto:", error);
                  alert("Falha ao entregar projeto: " + errorMsg);
                  deliverActiveButton.disabled = false;
                  deliverActiveButton.removeAttribute("aria-busy");
             }
         }

        // --- Reset State Logic ---
        async function resetAppState() {
            logErrorToUI("Função resetAppState chamada.");

            // Confirmation dialog
            if (!confirm("Tem certeza que deseja resetar TODOS os dados? Esta ação não pode ser desfeita.")) {
                 logErrorToUI("Reset cancelado pelo usuário.");
                 return; // Abort if user cancels
            }

            logErrorToUI("Tentando resetar estado via API...");
            resetButton.disabled = true;
            resetButton.setAttribute("aria-busy", "true");

            try {
                const newState = await callApi("/reset-state", 'POST');
                logErrorToUI("resetState API call successful. Rendering UI.");
                renderUI(newState);
                logErrorToUI("Estado resetado com sucesso.");
                alert("Estado da aplicação resetado com sucesso!");
            } catch (error) {
                 const errorMsg = error instanceof Error ? error.message : String(error);
                 logErrorToUI("Erro ao resetar estado: " + errorMsg);
                 console.error("[Frontend] Erro ao resetar estado:", error);
                 alert("Falha ao resetar estado: " + errorMsg);
            } finally {
                 resetButton.disabled = false;
                 resetButton.removeAttribute("aria-busy");
            }
        }

        // --- Initial Load Logic ---
        async function fetchStateWithRetry(retryCount = 0) {
            logErrorToUI("Tentativa fetchState " + (retryCount + 1));
            setLoadingState(true);

            try {
                const data = await callApi("/state");
                logErrorToUI("Chamada API fetchState bem-sucedida.");
                 if (!data || typeof data.activeProject === 'undefined' || !Array.isArray(data.deliveredProjects)) {
                     logErrorToUI("Formato de estado inválido recebido do servidor.");
                     throw new Error("Formato de estado inválido recebido do servidor");
                 }
                renderUI(data);
                setLoadingState(false);
                logErrorToUI("Busca de estado inicial bem-sucedida!");
                return;

            } catch (error) {
                 const errorMsg = error instanceof Error ? error.message : String(error);
                 logErrorToUI("Erro ao buscar estado (Tentativa " + (retryCount + 1) + "/" + MAX_RETRIES + "): " + errorMsg);
                 console.error("[Frontend] Erro ao buscar estado (Tentativa " + (retryCount + 1) + "/" + MAX_RETRIES + "):", error);
                 if (retryCount < MAX_RETRIES - 1) {
                     const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount);
                     logErrorToUI("Repetindo busca de estado em " + delay + "ms...");
                     setTimeout(() => fetchStateWithRetry(retryCount + 1), delay);
                 } else {
                     logErrorToUI("Máximo de tentativas alcançado. Não foi possível buscar estado.");
                     console.error("[Frontend] Máximo de tentativas alcançado. Não foi possível buscar estado.");
                     renderErrorState("Falha ao carregar estado inicial da aplicação");
                 }
            }
        }

        // --- Event Listeners ---
        startProjectForm.addEventListener('submit', startProject);
        deliverActiveButton.addEventListener('click', markProjectDelivered);
        resetButton.addEventListener('click', resetAppState);

        // --- Initialize ---
        logErrorToUI("Inicializando UI...");
        fetchStateWithRetry();

    </script>
</body>
</html>
`; // End of template literal

logToFile("HTML content updated for PT-BR, Mobile-First, Dark Theme.");

logToFile("Attempting to create webview...");
let webview: Webview | null = null;
try {
    webview = new Webview();
    logToFile("Webview object created.");

    logToFile("Setting webview HTML...");
    webview.setHTML(html);
    logToFile("Webview HTML set.");

    logToFile("Running webview...");
    webview.run();
    logToFile("Webview run() finished/closed.");

} catch (error) {
    logToFile("FATAL: Error during webview creation / run: " + (error instanceof Error ? error.message : String(error)));
    if (worker) {
        logToFile("Terminating worker due to webview error.");
        worker.terminate();
    }
    process.exit(1);
}

logToFile("Main process ending normally after webview close.");
if (worker) {
    logToFile("Terminating worker normally after webview close.");
    worker.terminate();
} 