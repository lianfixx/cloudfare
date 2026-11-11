// Aviso interno por Telegram. A los clientes no se les envía nada de forma automática.

export function telegramConfigurado(env) {
  return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
}

// Nunca lanza error: un aviso fallido no debe tirar el registro que ya se guardó.
export async function avisar(env, texto, fetchFn = fetch) {
  if (!telegramConfigurado(env)) return false;
  try {
    const r = await fetchFn(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: texto.slice(0, 4000), disable_web_page_preview: true }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
