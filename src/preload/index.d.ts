import type { OwlframeBridge } from '../core/project-bridge'

declare global {
  interface Window {
    owlframe: OwlframeBridge
  }
}

export {}
