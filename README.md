# Spilfabrikken

Første prototype til GitHub og Vercel. To spilformer, ni trin i byggeprocessen, gem og åbn design og valgfri Gemini forbindelse. Ingen database eller betalte pakker er nødvendige for demoerne.

## Udgiv på Vercel

1. Læg hele projektet i et GitHub repository.
2. Importér dette repository som et nyt projekt i Vercel. Vælg **Other** som framework. Projektmappen er roden. Ingen installationskommando eller buildkommando er nødvendig; outputmappen er `public`.
3. Tilføj disse Environment Variables i Vercel:

| Navn | Værdi |
| --- | --- |
| `ACCESS_CODE` | Din selvvalgte fælles adgangskode, mindst 10 tegn |
| `SESSION_SECRET` | En tilfældig hemmelighed på mindst 32 tegn |
| `GEMINI_API_KEY` | Valgfri. Din API nøgle fra Google til AI bygning |
| `GEMINI_MODEL` | Valgfri modelbetegnelse; standard er `gemini-2.5-flash` |

Generér en sessionshemmelighed på din egen computer med `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Indsæt værdien direkte i Vercel. Gem aldrig adgangskode eller nøgler i GitHub eller chatten.

4. Udgiv projektet. Uden adgangskode og sessionshemmelighed er siden lukket. Uden AI nøgle virker demoerne stadig.
5. Fremtidige ændringer i den tilknyttede produktionsgren kan udgives via Vercels Git forbindelse. Efter ændring af miljøvariabler skal der udgives igen.

## Lokal kørsel

Kræver Node.js 22 eller nyere. Der er ingen npm afhængigheder.

Kopiér `.env.example` til `.env.local`, og udfyld `ACCESS_CODE` og `SESSION_SECRET` privat. Kør `npm start`, og åbn `http://localhost:3000`. Test med `npm test`.

## Filer

- `server/page.html`: brugerflade og spilmotorer.
- `server/app.js`: AI forbindelse og serverens sider.
- `server/auth.js`: kodekontrol og signerede sessioner.
- `server/handler.js`: fælles adgangskontrol for sider og API.
- `api/router.js`: Vercel adapter. Alle forespørgsler går gennem denne funktion.
- `lokal-server.mjs`: lokal server med samme adgangskontrol.
- `tests/access.test.mjs`: test af adgangskontrol og Vercel adapter.

## Adgang

Der er én fælles kode. Login gælder i 12 timer med en signeret cookie (HttpOnly, SameSite=Lax og Secure på HTTPS). Udskiftning af adgangskoden eller sessionshemmeligheden ugyldiggør eksisterende sessioner. Svar caches ikke. Selve siden og AI API kræver begge en gyldig session. Log ud rydder browserens cookie.

Der er en simpel begrænsning på loginforsøg pr. serverinstans. Den er ikke en global begrænsning på tværs af Vercels instanser. Før bred offentlig skolebrug bør vi tilføje delt begrænsning af loginforsøg og AI forbrug.

## Nuværende omfang

2D samlespil og en enkel labyrint med raycasting. Demoindhold i dansk og matematik. JSON eksport gemmer design og spilindhold; det er ikke et selvstændigt offline spil. AI kan udfylde de to motorers indhold, men bygger ikke vilkårlige nye spilmekanikker. Lærer skal gennemgå fagligt indhold før undervisning. Den fulde Phaser/Babylon løsning fra specifikationen er endnu ikke implementeret.

GitHub repository og Vercel projekt er ikke oprettet af denne pakke. Ingen adgangskoder eller API nøgler medfølger.
