import { app, BrowserWindow, dialog, ipcMain, shell, type IpcMainInvokeEvent } from 'electron'
import { randomUUID } from 'node:crypto'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { APP_ID, APP_NAME } from './app-info'
import { createEmptyDocument } from '../core/document'
import type { OpenProjectResult, SaveProjectResult } from '../core/project-bridge'
import { readProject, writeProject } from './project-files'

const projectPaths = new Map<number, string>()
const projectFilter = { name: 'Owlframe projects', extensions: ['owlframe'] }

function owner(event: IpcMainInvokeEvent): BrowserWindow {
  return BrowserWindow.fromWebContents(event.sender)!
}

async function saveAs(event: IpcMainInvokeEvent, document: unknown): Promise<SaveProjectResult> {
  const result = await dialog.showSaveDialog(owner(event), {
    defaultPath: 'Untitled diagram.owlframe',
    filters: [projectFilter]
  })
  if (result.canceled || !result.filePath) return { canceled: true }

  const path = result.filePath.endsWith('.owlframe')
    ? result.filePath
    : `${result.filePath}.owlframe`
  await writeProject(path, document)
  projectPaths.set(event.sender.id, path)
  return { canceled: false, path }
}

ipcMain.handle('project:new', (event) => {
  projectPaths.delete(event.sender.id)
  return { document: createEmptyDocument(randomUUID(), 'Untitled diagram') }
})
ipcMain.handle('project:open', async (event): Promise<OpenProjectResult> => {
  const result = await dialog.showOpenDialog(owner(event), {
    properties: ['openFile'],
    filters: [projectFilter]
  })
  if (result.canceled || !result.filePaths[0]) return { canceled: true }

  const path = result.filePaths[0]
  const document = await readProject(path)
  projectPaths.set(event.sender.id, path)
  return { canceled: false, path, document }
})
ipcMain.handle('project:save', async (event, document: unknown): Promise<SaveProjectResult> => {
  const path = projectPaths.get(event.sender.id)
  if (!path) return saveAs(event, document)

  await writeProject(path, document)
  return { canceled: false, path }
})
ipcMain.handle('project:save-as', saveAs)

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 640,
    minHeight: 480,
    title: APP_NAME,
    backgroundColor: '#18181b',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId(APP_ID)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
