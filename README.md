# Azure DevOps Mermaid Viewer

Visor mejorado de diagramas Mermaid para Azure DevOps Wiki, Boards y Pull Requests con zoom, panorámica, pantalla completa y descarga.

## Características

- **Barra de herramientas flotante** — Aparece al pasar el ratón sobre cualquier diagrama Mermaid con botones de zoom in/out, reset (100%) y pantalla completa
- **Zoom y Panorámica** — `Ctrl/Cmd + Scroll` para hacer zoom, clic y arrastrar para mover, doble clic para restablecer
- **Modal a pantalla completa** — Abre el diagrama en un modal dedicado con barra de herramientas completa (zoom, reset, descargar SVG, cerrar)
- **Detección de código fuente** — Botón "Ver Diagrama" en bloques de código Mermaid sin renderizar (abre el diagrama renderizado en pantalla completa)
- **Atajos de teclado**:
  - `Alt + M` — Reescanear la página en busca de nuevos diagramas
  - `Esc` — Cerrar modal a pantalla completa
  - `+` / `=` — Zoom in (en modal)
  - `-` — Zoom out (en modal)
  - `0` — Restablecer zoom (en modal)
- **Tema automático** — Modo claro/oscuro sigue la preferencia del sistema o el tema de Azure DevOps
- **Detección automática** — MutationObserver + IntersectionObserver detectan diagramas añadidos dinámicamente (navegación AJAX, actualizaciones de PR, etc.)
- **Descargar SVG** — Exportar cualquier diagrama como SVG desde el modal a pantalla completa
- **Carga perezosa** — Mermaid.js se carga solo cuando es necesario

## Instalación

### Desde GitHub Releases (Recomendado)

1. Ve a la [página de Releases](https://github.com/manuelcarrascal/ado-mermaid-viewer/releases](https://github.com/ManuelCarrascalPragma/ado-mermaid-viewer/releases))
2. Descarga el último archivo `ado-mermaid-viewer-vX.Y.Z.zip`
3. Extrae el ZIP a una carpeta en tu computadora
4. Abre Chrome y ve a `chrome://extensions/`
5. Activa **Modo desarrollador** (interruptor en la esquina superior derecha)
6. Haz clic en **Cargar descomprimida** y selecciona la carpeta extraída
7. El icono de la extensión aparecerá en tu barra de herramientas — ¡listo!

### Desde el código fuente (Desarrollo)

```bash
# Clonar el repositorio
git clone https://github.com/manuelcarrascal/ado-mermaid-viewer.git
cd ado-mermaid-viewer

# Instalar dependencias
npm install

# Compilar para producción (salida en dist/)
npm run build

# Cargar la carpeta dist/ como extensión descomprimida en Chrome
```

## Uso

1. Navega a cualquier página de Azure DevOps que contenga diagramas Mermaid:
   - **Páginas Wiki** (markdown con bloques de código Mermaid)
   - **Elementos de trabajo / Boards** (campos de descripción con Mermaid)
   - **Pull Requests** (descripción, comentarios con Mermaid)
2. Los diagramas obtienen automáticamente una barra de herramientas flotante al hacer hover
3. Usa los botones de la barra o atajos de teclado para interactuar
4. Haz clic en **pantalla completa** (⛶) para vista inmersiva con opción de descarga
5. Para bloques de código Mermaid sin renderizar, haz clic en el botón **"Ver Diagrama"**

## Tipos de diagramas soportados

Todos los tipos de diagramas Mermaid soportados por la versión incluida de Mermaid.js:
- Diagramas de flujo (`graph`, `flowchart`)
- Diagramas de secuencia
- Diagramas de clases
- Diagramas de estados
- Gráficos de pastel
- Diagramas de Gantt
- Git Graphs
- User Journey
- Timeline
- Mindmap
- Quadrant Chart
- Diagramas de requerimientos
- Diagramas ER
- Diagramas C4 (Contexto, Contenedor, Componente, Dinámico)
- Diagramas de bloques (`block-beta`)

## Desarrollo

### Comandos

```bash
npm run dev      # Modo watch - recompila al detectar cambios
npm run build    # Build de producción (minificado, salida en dist/)
npm run lint     # Ejecutar ESLint en src/
npm run format   # Formatear código con Prettier
npm run test     # Ejecutar tests con Vitest
```

### Estructura del proyecto

```
├── src/
│   ├── background/
│   │   └── index.js        # Service worker (Manifest V3)
│   ├── content/
│   │   ├── ui/
│   │   │   ├── Toolbar.js      # Barra de herramientas flotante en diagramas
│   │   │   ├── Modal.js        # Modal a pantalla completa
│   │   │   ├── PanZoom.js      # Lógica de zoom/panorámica
│   │   │   └── SourceViewButton.js
│   │   ├── utils/
│   │   │   ├── dom.js          # Helpers de DOM
│   │   │   ├── icons.js        # Iconos SVG Lucide
│   │   │   ├── events.js       # Helpers de eventos
│   │   │   └── html.js         # Sanitización HTML
│   │   └── storage/
│   │       └── SettingsStore.js # Sincronización Chrome storage
│   └── shared/
│       ├── constants.js    # Selectores, patrones, configuración
│       ├── messages.js     # Tipos de mensaje para comunicación runtime
│       └── version.js      # Utilidad de versión
├── styles/
│   ├── main.css           # Design tokens + todos los componentes
│   ├── toolbar.css        # Estilos de la barra de herramientas
│   ├── modal.css          # Estilos del modal
│   ├── buttons.css        # Estilos de botones
│   ├── icons.css          # Estilos de iconos
│   └── responsive.css     # Estilos móvil/impresión
├── lib/
│   └── mermaid.min.js     # Mermaid.js incluido (carga perezosa)
├── dist/                  # Build de producción (gitignored)
├── manifest.json          # Manifest de la extensión (Manifest V3)
├── esbuild.config.js      # Configuración de build
└── package.json
```

## Cómo funciona

### Content Script (`content.js` / `src/content/`)

1. **Inicialización** — Configura MutationObserver (cambios DOM) e IntersectionObserver (entrada en viewport)
2. **Detección** — Escanea en busca de:
   - SVGs pre-renderizados (`svg[id^="mermaid-diagram"]`, `svg[aria-roledescription]`)
   - Bloques de código Mermaid (`pre code.language-mermaid`, `[data-mermaid]`, `::: mermaid :::`)
3. **Mejora** — Inyecta barra de herramientas en contenedores de diagramas, botón "Ver Diagrama" en bloques de código
4. **Carga perezosa de Mermaid** — Descarga `lib/mermaid.min.js` solo al renderizar desde código fuente
5. **PanZoom** — Maneja transform de zoom/panorámica en elementos SVG (ratón, tacto, rueda)

### Background Service Worker (`background.js`)

- Escucha clic en el icono de la extensión
- Envía mensaje `RESCAN` al content script para disparar re-escaneo
- Inyecta content script/CSS si no están cargados

### Comunicación

| Mensaje | Dirección | Propósito |
|---------|-----------|-----------|
| `RESCAN` | Background → Content | Disparar re-escaneo completo de página |
| `GET_VERSION` | Content → Background | Obtener versión de la extensión |

## Permisos

| Permiso | Propósito |
|---------|-----------|
| `activeTab` | Acceder a la pestaña actual al hacer clic en el icono |
| `scripting` | Inyectar content script/CSS bajo demanda |
| `storage` | Sincronizar ajustes de usuario (auto-scan, barra visible, tema, atajos) |
| `host_permissions` | Acceder a `dev.azure.com` y `*.visualstudio.com` |

**Privacidad**: Sin telemetría, sin peticiones externas, sin recolección de datos. Todo el procesamiento ocurre localmente en tu navegador.

## Configuración

Los ajustes se guardan en `chrome.storage.sync` y se sincronizan entre dispositivos:

| Ajuste | Por defecto | Descripción |
|--------|-------------|-------------|
| `autoScan` | `true` | Escanear automáticamente diagramas en cambios de página |
| `showToolbar` | `true` | Mostrar barra de herramientas flotante en diagramas |
| `theme` | `'auto'` | `'auto'` \| `'light'` \| `'dark'` — Tema de la UI |
| `keyboardShortcuts` | `true` | Habilitar atajos de teclado (`Alt+M`, etc.) |

Acceso vía popup de la extensión (futuro) o programáticamente:

```javascript
// En consola del navegador en una página ADO
chrome.runtime.sendMessage({ type: 'GET_VERSION' }, console.log);
```

## Solución de problemas

| Problema | Solución |
|----------|----------|
| La barra no aparece | Refresca la página, o clic en icono de extensión → "Rescan" |
| Diagramas no detectados | Verifica que estés en `dev.azure.com` o `*.visualstudio.com` |
| Modal no abre | Revisa consola del navegador por errores; prueba `Alt+M` para reescanear |
| Tema no cambia | ADO puede sobrescribir; la extensión sigue `prefers-color-scheme` |
| Extensión no carga | Verifica que `dist/` tenga `manifest.json`, `content.js`, `styles.css`, `lib/mermaid.min.js` |

## Crear un Release

Etiqueta una versión y haz push — GitHub Actions compila y crea el release automáticamente:

```bash
git tag v1.0.1
git push origin v1.0.1
```

El workflow (`.github/workflows/release.yml`):
1. Hace checkout del código
2. Ejecuta `npm ci && npm run build`
3. Comprime la carpeta `dist/` en ZIP
4. Crea GitHub Release con el ZIP adjunto

## Contribuir

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Licencia MIT — ver [LICENSE](LICENSE) para detalles.

## Autor

**Manuel Carrascal** — [GitHub](https://github.com/manuelcarrascal)

---

*Esta extensión no está afiliada con Microsoft o Azure DevOps.*
