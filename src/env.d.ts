/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_TAROT_AI_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
