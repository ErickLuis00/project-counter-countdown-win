# TIMER COM PRAZO PARA ENTREGA DE PROJETOS
![image](https://github.com/user-attachments/assets/f72470e8-6d36-4b81-8777-615c10ffc2fb)


A simple webview application built with Bun and webview-bun. 


## Prerequisites


* Bun: [Install Bun](https://bun.sh/docs/installation)
* PNPM: `npm install -g pnpm`
* **Windows:** [Microsoft Edge WebView2 runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section) (usually pre-installed on Windows 11).

## Setup


1. Install dependencies:

   ```bash
   pnpm install
   ```

## Running the Application (Development)

This command starts the webview, which in turn starts the background server worker.

```bash
pnpm start
```

Or directly:

```bash
bun run index.ts
```

## Building a Single Executable

This compiles both the main application (`index.ts`) and the server worker (`worker.ts`) into a single executable.

```bash
pnpm run build
```

Or directly:

```bash
bun build --compile --minify --sourcemap ./index.ts ./worker.ts --outfile project-counter-ui
```

### Hiding the Console Window (Windows)


1. Download `hidecmd.bat` from the [webview-bun repository](https://github.com/tr1ckydev/webview-bun).
2. Run `hidecmd.bat` and provide the path to your generated `.exe` file when prompted.


# OPEN AUTOMATICALLY WHEN WINDOWS OPEN


1. Windows Startup Folder Path: The path varies slightly depending on the Windows version and user profile, but it's typically accessed via environment variables:

* For the current user: %APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup


* For all users (requires admin): %ALLUSERSPROFILE%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup


