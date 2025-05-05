# Rastreador de Projetos com Prazo

 ![image](https://github.com/user-attachments/assets/f72470e8-6d36-4b81-8777-615c10ffc2fb)

Uma aplicação simples com webview feita com Bun e webview-bun para rastrear o tempo restante para a entrega de projetos.

## Pré-requisitos

* **Bun:** [Instalar Bun](https://bun.sh/docs/installation)
* **PNPM:** `npm install -g pnpm`
* **Windows:** [Runtime Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section) (geralmente pré-instalado no Windows 11).

## Configuração


1. Instale as dependências:

   ```bash
   bun install
   ```

## Executando a Aplicação (Desenvolvimento)

Este comando inicia a aplicação em modo de desenvolvimento com recarregamento automático (`nodemon`).

```bash
bun dev
```

## Compilando o Executável (.exe)

Este comando compila a aplicação principal (`index.ts`) e o worker do servidor (`worker.ts`) em um único executável `.exe`. Ele também esconde a janela do console e adiciona o ícone (`icon.ico`) automaticamente (requer `rcedit-x64.exe` na pasta `exe_enhancement`).

```bash
bun run build
```

Após a compilação, o arquivo `project-counter-ui.exe` estará na pasta raiz do projeto.

## Abrir Automaticamente ao Iniciar o Windows

Para fazer a aplicação iniciar automaticamente quando você ligar o computador, siga estes passos:


1. **Encontre o Executável:** Localize o arquivo `project-counter-ui.exe` que foi gerado pelo comando `pnpm run build`.
2. **Crie um Atalho:** Clique com o botão direito no arquivo `project-counter-ui.exe` e selecione "Criar atalho".
3. **Abra a Pasta de Inicialização:**
   * Pressione as teclas `Win` + `R` juntas para abrir a caixa "Executar".
   * Digite `shell:startup` e pressione Enter. Isso abrirá a pasta de inicialização do seu usuário atual.
     *(Opcional: Para todos os usuários, digite* `shell:common startup`, mas isso requer permissão de administrador).
4. **Mova o Atalho:** Arraste ou recorte e cole o atalho que você criou no passo 2 para dentro da pasta de inicialização que você abriu no passo 3.

Pronto! Na próxima vez que você iniciar o Windows, a aplicação `project-counter-ui` deverá abrir automaticamente.