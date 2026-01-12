/// <reference types="vite/client" />

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: { client_id: string; callback: (response: { credential: string }) => void }) => void
          renderButton: (
            parent: HTMLElement,
            opts?: { theme?: string; size?: string; text?: string; shape?: string; width?: number },
          ) => void
          prompt: () => void
        }
      }
    }
  }
}

export {}
