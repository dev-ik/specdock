/// <reference types="vite/client" />

interface Window {
  specdockDesktop?: {
    getInfo: () => Promise<{
      apiBaseUrl?: string;
      version: string;
    }>;
  };
}
