// Configuración del Worker para el CLI `cf` (beta). Formato tomado de
// developers.cloudflare.com/cf/projects/cloudflare-config/ (leído el 11-nov-2026).
// `cf` está en beta: si un campo cambia, `cf deploy --dry-run` lo señala antes de publicar.
import { bindings, defineConfig, triggers } from "cf/config";
import * as entrypoint from "./src/index.js" with { type: "cf-worker" };

export default defineConfig({
  worker: {
    name: "milla-backend",
    compatibilityDate: "2026-10-01",
    entrypoint,
    observability: { enabled: true },
    env: {
      // Base de datos (se crea una vez con `cf d1 create --name milla-backend`).
      DB: bindings.d1({ name: "milla-backend" }),
      // Workers AI para el asistente. Plan gratis: 10,000 neuronas al día.
      AI: bindings.ai(),

      // Valores públicos (no son secretos).
      ORIGENES_PERMITIDOS: bindings.text("https://millabogados.com,https://www.millabogados.com"),
      MODELO_IA: bindings.text("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
      // "si" obliga a validar Turnstile. Solo se pone "no" en pruebas locales.
      TURNSTILE_OBLIGATORIO: bindings.text("si"),

      // Secretos: nunca van en el código. Se suben con `cf deploy --secrets-file`.
      ADMIN_PASSWORD: bindings.secret(),
      SESSION_SECRET: bindings.secret(),
      TURNSTILE_SECRET: bindings.secret(),
      TELEGRAM_BOT_TOKEN: bindings.secret(),
      TELEGRAM_CHAT_ID: bindings.secret(),
    },
    // Resumen diario por Telegram. Cron en UTC: 14:00 UTC = 8:00 en Ciudad de México.
    triggers: [triggers.scheduled({ schedule: "0 14 * * *" })],
  },
});
