# ICD CM · SMART on FHIR (Next.js)

Minimal SMART on FHIR demo built with **Next.js App Router**, **shadcn/ui (Radix)**, and **fhirclient**.  
Fetch Patient data from a SMART sandbox, record audio (Whisper), and generate GPT summaries.

> Status: WIP — interfaces and APIs may change.

---

## Features
- SMART on FHIR OAuth (PKCE): `/smart/launch` → `/smart/callback`
- Fetch **Patient** via `fhirclient` (`useSmartPatient` hook)
- Audio recording + Whisper transcription
- GPT-based summary generation
- API key input stored in browser (session/local storage)

---

## Prerequisites
- Node **18.18+** or **20.x LTS**
- npm / pnpm / yarn (examples use npm)

---

## Install & Run

```bash
# install deps
npm i

# development (webpack — recommended for this repo)
npm run dev:webpack

# production build
npm run build

# start production server
npm start
```

---
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "dev:webpack": "next dev",
    "build": "next build --turbopack",
    "start": "next start"
  }
}
```
Use `npm run dev:webpack` during development. Turbopack scripts are available if you want to try them.

---

## Use with SMART Sandbox

1. Start dev server: http://localhost:3000

2. In the SMART App Launcher (or your sandbox app registration), set:

   - Launch URL: http://localhost:3000/smart/launch
   - Redirect URL: http://localhost:3000/smart/callback
   - Client Type: Public (PKCE)
   - Client ID: my_web_app (or your registered ID)
   - Scopes: launch openid fhirUser patient/*.read online_access

3. Launch → complete auth → redirected back to the app → Patient info loads on the home page.

Don't refresh /smart/callback directly; always start from /smart/launch.

---

## 開發團隊

- **孫英洲**：團隊主持人
- **詹彥杰**：本專案開發者
- **黃凱辰**：技術支援者
- **郭宜欣**：核心程式提供者

**介紹影片：**  
https://youtu.be/5QzJXCIXmU0

**SMART Launcher：**  
https://launch.smarthealthit.org/

**App Demo Launch URL：**  
https://launch.smarthealthit.org/?launch=WzAsIiIsIiIsIlByYWN0aXRpb25lci81MjkxOTA5OS02YTdhLTQ0MmMtYjBkNS0yYjAyYzBkZDRiNzQiLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMSwiIl0&iss=https%3A%2F%2Flaunch.smarthealthit.org%2Fv%2Fr4%2Ffhir&launch_url=https%3A%2F%2Fzhanyanjie6796.github.io%2Fasus-icd-cm_smartonfhir%2Fsmart%2Flaunch%2F

---

P.S.本專案核心是使用 **郭宜欣** 醫師的「medical-note-smart-on-fhir」修改而成。

**郭宜欣專案連結：**  
https://github.com/voho0000/medical-note-smart-on-fhir/tree/master

