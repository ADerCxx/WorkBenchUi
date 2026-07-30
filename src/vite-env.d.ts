/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.less' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.global.less' {
  const css: string
  export default css
}
