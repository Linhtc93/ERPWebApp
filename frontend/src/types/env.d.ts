/*************************************************
 Ambient env types to ensure import.meta.env works
 both locally and on Vercel without relying on
 vite/client type package availability at build.
**************************************************/

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
