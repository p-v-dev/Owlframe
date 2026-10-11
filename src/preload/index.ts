import { contextBridge, ipcRenderer } from 'electron'
import type { OwlframeBridge } from '../core/project-bridge'

const owlframe: OwlframeBridge = {
  new: () => ipcRenderer.invoke('project:new'),
  open: () => ipcRenderer.invoke('project:open'),
  save: (document) => ipcRenderer.invoke('project:save', document),
  saveAs: (document) => ipcRenderer.invoke('project:save-as', document)
}

contextBridge.exposeInMainWorld('owlframe', owlframe)
