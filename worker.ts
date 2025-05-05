import { existsSync, appendFileSync } from 'node:fs';

const LOG_FILE_PATH = './debug.log';
const STATE_FILE_PATH = './counter-state.json';

// --- State Structure ---
interface DeliveredProject {
    name: string;
    startedAt: string; // ISO 8601 string
    deliveredAt: string; // ISO 8601 string
}
interface ActiveProject {
    name: string;
    startedAt: string; // ISO 8601 string
    deadlineDays: number;
}
interface AppState {
    activeProject: ActiveProject | null;
    deliveredProjects: DeliveredProject[];
}

// Default state
const defaultAppState: AppState = {
    activeProject: null,
    deliveredProjects: []
};

let state: AppState = defaultAppState; // In-memory state

// Simple file logger
function logToFile(message: string) {
    try {
        const timestamp = new Date().toISOString();
        appendFileSync(LOG_FILE_PATH, `[${timestamp}] [Worker] ${message}\n`);
    } catch (e) {
        // Fallback if logging fails
        console.error("[Worker] Failed to write to log file:", e);
    }
}

// --- Persistence Functions ---

async function loadStateFromFile(): Promise<AppState> {
    logToFile("Attempting to load state from file...");
    try {
        const file = Bun.file(STATE_FILE_PATH);
        if (await file.exists()) {
            const data = await file.json();
            logToFile(`Loaded state from ${STATE_FILE_PATH}: ${JSON.stringify(data)}`);
            // Basic validation - check if main keys exist and deliveredProjects is array
            if (data && typeof data.activeProject !== 'undefined' && Array.isArray(data.deliveredProjects)) {
                // TODO: Add deeper validation of activeProject and deliveredProjects array contents if needed
                return { activeProject: data.activeProject, deliveredProjects: data.deliveredProjects };
            } else {
                logToFile("Invalid data format in state file. Using default state.");
                return { ...defaultAppState }; // Return a copy
            }
        } else {
            logToFile(`State file ${STATE_FILE_PATH} not found. Initializing with default state.`);
            return { ...defaultAppState }; // Return a copy
        }
    } catch (error) {
        logToFile(`Error loading state from file: ${error instanceof Error ? error.message : String(error)}. Using default state.`);
        return { ...defaultAppState }; // Return a copy
    }
}

async function saveStateToFile(currentState: AppState): Promise<void> {
    logToFile(`Attempting to save state: ${JSON.stringify(currentState)}`);
    try {
        const data = JSON.stringify(currentState, null, 2); // Pretty print JSON
        await Bun.write(STATE_FILE_PATH, data);
        logToFile(`Saved state to ${STATE_FILE_PATH}`);
    } catch (error) {
        logToFile(`Error saving state to file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// --- Initialization ---

logToFile("Worker starting...");

// Load initial state when worker starts
state = await loadStateFromFile();
logToFile(`Initial state loaded. Active: ${state.activeProject?.name || 'None'}, Delivered: ${state.deliveredProjects.length}`);

// --- Server Logic ---

const server = Bun.serve({
    port: 3001, // Use a specific port for the API
    async fetch(req) {
        const url = new URL(req.url);
        logToFile(`Received request: ${req.method} ${url.pathname}`);

        // Enable CORS for all origins (for simplicity in this example)
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // Handle CORS preflight requests
        if (req.method === "OPTIONS") {
            logToFile("Responding to OPTIONS preflight");
            return new Response(null, { headers: corsHeaders });
        }

        // GET /state - Retrieve current state
        if (req.method === "GET" && url.pathname === "/state") {
            logToFile(`Sending state. Active: ${state.activeProject?.name || 'None'}, Delivered: ${state.deliveredProjects.length}`);
            return new Response(JSON.stringify(state), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // POST /start-project - Start a new project
        if (req.method === "POST" && url.pathname === "/start-project") {
            try {
                const body: any = await req.json(); // Explicitly type as any or use a more specific interface
                const projectName = body?.name;
                const deadlineDays = body?.deadlineDays;

                if (!projectName || typeof projectName !== 'string' || projectName.trim() === '') {
                    return new Response(JSON.stringify({ error: "Project name is required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
                // Ensure deadlineDays is treated as number after validation
                if (typeof deadlineDays !== 'number' || !Number.isInteger(deadlineDays) || deadlineDays <= 0) {
                    return new Response(JSON.stringify({ error: "Valid positive integer for deadlineDays is required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
                // Optional: Check if a project is already active
                if (state.activeProject) {
                    logToFile(`Warning: Overwriting active project ${state.activeProject.name} with ${projectName.trim()}`);
                }

                state.activeProject = {
                    name: projectName.trim(),
                    startedAt: new Date().toISOString(),
                    deadlineDays: Number(deadlineDays), // Ensure it's a number
                };

                logToFile(`Started new project: ${state.activeProject.name}, Deadline: ${deadlineDays} days.`);
                await saveStateToFile(state);
                return new Response(JSON.stringify(state), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

            } catch (error) {
                logToFile(`Error processing POST /start-project: ${error instanceof Error ? error.message : String(error)}`);
                return new Response(JSON.stringify({ error: "Failed to process request." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
        }

        // POST /deliver-project - Mark active project as delivered
        if (req.method === "POST" && url.pathname === "/deliver-project") {
            if (!state.activeProject) {
                logToFile("Bad request: No active project to mark as delivered.");
                return new Response(JSON.stringify({ error: "No active project to deliver." }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            try {
                const delivered: DeliveredProject = {
                    name: state.activeProject.name,
                    startedAt: state.activeProject.startedAt,
                    deliveredAt: new Date().toISOString(),
                };

                state.deliveredProjects.push(delivered);
                const prevActiveName = state.activeProject.name;
                state.activeProject = null;

                logToFile(`Marked project '${prevActiveName}' as delivered. Total delivered: ${state.deliveredProjects.length}`);
                await saveStateToFile(state);
                return new Response(JSON.stringify(state), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

            } catch (error) {
                logToFile(`Error processing POST /deliver-project: ${error instanceof Error ? error.message : String(error)}`);
                return new Response(JSON.stringify({ error: "Failed to process delivery." }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // POST /reset-state - Reset all data
        if (req.method === "POST" && url.pathname === "/reset-state") {
            try {
                logToFile("Resetting application state...");
                state = { ...defaultAppState }; // Reset in-memory state to a copy of default
                await saveStateToFile(state); // Save the empty state
                logToFile("State reset successfully.");
                return new Response(JSON.stringify(state), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            } catch (error) {
                logToFile(`Error processing POST /reset-state: ${error instanceof Error ? error.message : String(error)}`);
                return new Response(JSON.stringify({ error: "Failed to reset state." }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        logToFile(`Route not found: ${url.pathname}`);
        return new Response("Not Found", { status: 404, headers: corsHeaders });
    },
    error(error) {
        logToFile(`Server error: ${error instanceof Error ? error.message : String(error)}`);
        return new Response("Internal Server Error", { status: 500 });
    }
});

logToFile(`Project tracker server listening on http://localhost:${server.port}`); 