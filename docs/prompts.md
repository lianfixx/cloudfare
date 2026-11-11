# Prompts

Los de la guía de Santi Muñoz, ajustados a los proyectos de Emi. Todos terminan con la misma regla:
explicar cada paso y preguntar antes de gastar o borrar.

## 0. Preparar el agente (una sola vez, en la Mac)

```text
Quiero usar Cloudflare desde aquí. Explícame cada paso en palabras simples.
1. Revisa si tengo Node.js 22.18 o superior. Si no, dime cómo instalarlo.
2. Instala el CLI de Cloudflare con: npm install --global cf
3. Agrega esta línea a mi archivo CLAUDE.md (o AGENTS.md) de usuario: "When interacting with
   Cloudflare, use the cf CLI unless the project has a Wrangler configuration file."
4. Corre cf auth login y avísame para que yo apruebe el acceso en el navegador. Después confirma
   con cf auth whoami.
Regla para todo lo que hagamos: pregúntame antes de hacer cualquier cosa que cueste dinero o que
borre algo.
```

## 1. Publicar el backend de MILLA

```text
Lee CLAUDE.md y docs/puesta-en-marcha.md de este repo. Vamos a publicar milla-backend en mi cuenta
de Cloudflare siguiendo esos pasos, uno por uno.
Antes de cada comando de cf: búscalo con cf cli search, revisa su --help y ensáyalo con --dry-run.
Enséñame el ensayo y espera mi visto bueno. No crees nada de pago. Yo lleno secretos.json en mi
editor; no me pidas las claves en el chat.
Si cf dev o cf deploy marcan un error en cloudflare.config.ts, consulta la documentación con
cf docs search, corrige y dime qué cambiaste y por qué.
```

## 2. Conectar el formulario del sitio

```text
En el repo millabogados, lee sus reglas (CLAUDE.md e ia/REGLAS.md) y luego
docs/conectar-sitio-milla.md del repo cloudfare. Conecta solo el Buzón Jurídico al backend
publicado en [dirección]. Trabaja en una rama, no cambies el diseño y enséñame el diff antes de
subir nada. Prueba con una consulta marcada como PRUEBA y confirma que aparece en el panel.
```

## 3. Consultar la base sin abrir el panel

```text
Con cf, consulta la base D1 milla-backend y dime cuántas consultas hay pendientes y cuántas
llegaron esta semana, por materia. Solo lectura: no modifiques ni borres nada. No pegues en el
chat nombres, correos ni mensajes; dame solo conteos.
```

## 4. Enlace temporal para enseñar un avance (videos, sitios)

```text
Tengo un proyecto abierto en mi computadora en http://localhost:[3000]. Quiero mandarle a alguien
un link temporal para que lo vea desde su celular, sin publicarlo todavía.
Usa un Quick Tunnel de Cloudflare (instala cloudflared si hace falta, pidiéndome permiso antes),
dame el link y explícame cómo apagarlo cuando terminemos.
```

No requiere cuenta. Es solo para pruebas y se apaga al cerrar el comando. No lo uses con nada que
tenga datos de clientes: el enlace es público mientras esté abierto.

## 5. Enlace corto para una campaña

Ya está en el panel (`/admin` → Enlaces cortos). No necesita prompt.

## 6. Un sitio nuevo desde cero

```text
Quiero una página web sencilla para [proyecto], que se vea bien en el celular, con [secciones].
Publícala con Cloudflare como sitio estático y dame el link.
Usa el CLI de Cloudflare (cf). Explícame cada paso en palabras simples y pregúntame antes de hacer
cualquier cosa que cueste dinero o que borre algo. No inventes textos, teléfonos ni direcciones:
si falta un dato, pregúntamelo.
```
