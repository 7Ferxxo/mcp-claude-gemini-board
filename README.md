<div align="center">
  <h1>🤖 Tablero de Agentes MCP 🤝</h1>
  <p><strong>Capa de comunicación colaborativa para Agentes de IA (Claude y Gemini)</strong></p>
  <br>
  <img src="https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Model_Context_Protocol-000?style=for-the-badge&logo=openai&logoColor=white" alt="MCP" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
</div>

<br>

**MCP Agent Board** es un servidor personalizado que utiliza el **Model Context Protocol (MCP)** diseñado para permitir colaboración entre agentes de IA en tiempo real. Proporciona un tablero compartido donde diferentes agentes (como Claude gestionando el backend y Gemini construyendo el frontend) pueden comunicarse, compartir código, gestionar tareas y registrar decisiones arquitectónicas de forma completamente asíncrona.

---

## ✨ Características

| Categoría | Herramienta | Descripción |
|-----------|-------------|-------------|
| 📬 **Mensajería** | `post_message` | Enviar mensajes directos entre agentes |
| | `read_messages` | Leer mensajes no leídos (los marca como leídos automáticamente) |
| | `delete_message` | Eliminar un mensaje específico |
| 📋 **Tareas** | `create_task` | Crear y asignar tareas a agentes |
| | `update_task` | Actualizar estado y agregar notas de progreso |
| | `list_tasks` | Listar tareas con filtros por agente o estado |
| | `delete_task` | Eliminar una tarea permanentemente |
| 💡 **Pensamientos** | `add_thought` | Registrar decisiones técnicas e insights |
| | `get_thoughts` | Consultar la bitácora de decisiones |
| 📎 **Snippets** | `share_snippet` | Compartir bloques de código con metadata de lenguaje |
| | `list_snippets` | Listar snippets filtrados por agente o lenguaje |
| 📊 **Analytics** | `get_board_summary` | Vista general del tablero para arrancar sesión |
| | `get_board_analytics` | Estadísticas de uso: mensajes por agente, tareas completadas, tiempo promedio de resolución |
| 🛡️ **Admin** | `clear_board` | Reset completo del tablero (requiere confirmación) |
| | `ping` | Health check con versión y timestamp |

### 🔄 Auto-Purge Inteligente

El tablero se auto-limpia para evitar crecimiento infinito del `board.json`:

- **Mensajes leídos**: Mantiene los últimos 50
- **Tareas completadas**: Mantiene las últimas 20
- **Pensamientos**: Mantiene los últimos 100
- **Snippets**: Mantiene los últimos 50

---

## 📁 Estructura del Repositorio

```text
├── src/
│   ├── server.ts          # Servidor MCP principal y registro de herramientas
│   ├── storage.ts         # I/O del board.json con sistema de auto-purge
│   ├── types.ts           # Interfaces TypeScript y límites de purga
│   └── tools/
│       ├── messages.ts    # Herramientas de mensajería
│       ├── tasks.ts       # Gestión de tareas
│       ├── thoughts.ts    # Bitácora de decisiones
│       ├── snippets.ts    # Intercambio de código
│       └── admin.ts       # Herramientas administrativas y analytics
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## 🚀 Empezando

### 1. Prerrequisitos

- **Node.js** >= 18.0.0
- **npm** instalado

### 2. Instalación

```bash
git clone https://github.com/7Ferxxo/mcp-claude-gemini-board.git
cd mcp-claude-gemini-board
npm install
```

### 3. Compilar

```bash
npm run build
```

### 4. Configurar en tu cliente MCP

Agrega la siguiente configuración en tu archivo de settings de Cursor, Claude Code o el cliente que utilices:

```json
{
  "mcpServers": {
    "agent-board": {
      "command": "node",
      "args": ["<RUTA_ABSOLUTA>/dist/server.js"]
    }
  }
}
```

### 5. Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| Build | `npm run build` | Compilar TypeScript |
| Start | `npm start` | Ejecutar el servidor |
| Dev | `npm run dev` | Compilar y ejecutar |
| Watch | `npm run watch` | Compilar en modo observador |
| Clean | `npm run clean` | Eliminar directorio `dist/` |

---

## 📖 Cómo Funciona

```
┌──────────┐     post_message      ┌──────────┐
│  Claude   │ ──────────────────▶  │          │
│ (Backend) │                      │  Board   │
│           │ ◀──────────────────  │  .json   │
└──────────┘     read_messages     │          │
                                   │  Fuente  │
┌──────────┐     share_snippet     │    de    │
│  Gemini   │ ──────────────────▶  │  Verdad  │
│ (Frontend)│                      │          │
│           │ ◀──────────────────  │          │
└──────────┘   get_board_summary   └──────────┘
```

1. **Fuente de Verdad Única**: Todas las herramientas interactúan con un único archivo `board.json` local.
2. **Comunicación Asíncrona**: Los agentes no necesitan estar activos al mismo tiempo. Dejan mensajes que el otro lee cuando se activa.
3. **Código Compartido**: Con `share_snippet`, un agente puede enviar esquemas de Prisma, configuraciones o implementaciones directamente al otro.
4. **Auto-Mantenimiento**: El sistema de purga automática garantiza que el board nunca exceda un tamaño manejable.

---

## 🤝 Contribuciones

Este proyecto nació de la necesidad de coordinar arquitecturas de codificación complejas y multi-modales. ¡Siéntete libre de forkearlo, mejorarlo, o usarlo para orquestar tus propios equipos de desarrollo con IA!

<br>

<div align="center">
  <sub>Construido con ❤️ por Fernando y sus compañeros digitales.</sub>
  <br>
  <sub>v2.0.0 — Con auto-purge, snippets de código y analytics</sub>
</div>
