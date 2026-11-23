# Atelier Amalia — site pentru ateliere de accesorii de nuntă

Un singur cod, două variante:

| Comandă | Ce obții | Pentru cine |
|---|---|---|
| `node build.js` (o face Netlify automat) | site cu panou de editare și cereri de ofertă pe email | clienții tăi |
| `node build.js --vanzare` | folderul `vanzare`: site HTML simplu, se deschide direct din folder | tema de vânzare |

Nu sunt necesare pachete externe: doar Node.js.

## Adaptarea la fiecare atelier

`content/categorii.json` (în panou: Atelier → Categorii și modele):
- **Categoria e activă**: oprită, categoria dispare din meniu, de pe prima pagină, din colecții, din formular și din subsol, iar pagina ei nu se mai generează;
- **Afișează prețurile**: oprit, la categorie și la modelele ei apare „Preț la cerere”. Un model fără preț arată tot „Preț la cerere”;
- se pot adăuga categorii noi; fiecare primește automat pagina ei.

## Butonul „Configurează demo-ul”

Doar pentru prezentări (`setari.json → panou_demo`). Arată clienților, pe loc, cum ar arăta site-ul doar cu categoriile lor; profilurile sunt în `content/demo.json`. Alegerea ține cât e deschis tab-ul și nu schimbă site-ul. **Pe site-ul unui client real se oprește.**

## Unde e fiecare lucru

- **content/**: `setari.json` (contact, sigiliu, cereri), `categorii.json`, `colectii.json`, `acasa.json`, `texte.json` (textele interfeței, pentru o a doua limbă), `demo.json`
- **src/**: `style.css` (culorile și fonturile în primele rânduri), `app.js`
- **admin/**: panoul de editare (Decap CMS) și transformarea automată a pozelor
- **images/uploads/**: pozele încărcate din panou

## Cererile de ofertă

`setari.json → oferta_metoda`: `netlify` (email prin Netlify Forms, formularul „oferta”), `endpoint` (serviciu de formulare), `whatsapp` (implicit în varianta de vânzare).

## Pozele

Orice poză încărcată în panou devine automat `.jpg`, micșorată și cu nume curat; pe Netlify trece prin optimizarea de imagini; fiecare poză are „Încadrarea fotografiei” (implicit centru).
