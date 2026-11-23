/*
  build.js — construiește site-ul atelierului din fișierele de conținut.
  Nu folosește niciun pachet extern, deci nu are nimic de actualizat.

  node build.js            → site-ul pentru Netlify (panou de editare, cereri de ofertă pe email), în "dist"
  node build.js --vanzare  → versiunea HTML simplă, pentru vânzare ca temă, în "vanzare"
*/
const fs = require('fs');
const path = require('path');

const VANZARE = process.argv.includes('--vanzare');
const OUT = path.join(__dirname, VANZARE ? 'vanzare' : 'dist');
const citeste = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'content', f), 'utf8'));
const S = citeste('setari.json');
const A = citeste('acasa.json');
const T = citeste('texte.json');
const COL = citeste('colectii.json');
const DEMO = fs.existsSync(path.join(__dirname, 'content', 'demo.json')) ? citeste('demo.json') : { profiluri: [] };

// ---------- utilitare ----------
const e = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pagina';
const POZITII = { sus: '50% 20%', centru: '50% 50%', jos: '50% 80%', stanga: '20% 50%', dreapta: '80% 50%' };
const poz = (p) => POZITII[p] || POZITII.centru;
const DESENE = ['invitatii', 'lumanari', 'flori', 'cocarde', 'pahare', 'marturii', 'decor'];
const lista = (n) => (n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' ' + T.si + ' ' + n[n.length - 1]);

// Panoul de configurare pentru prezentări: toate categoriile sunt generate, cele inactive doar ascunse
const PANOU = !!S.panou_demo;

// ---------- categoriile ----------
const folosite = {};
const TOATE = (citeste('categorii.json').lista || []).filter((c) => c.nume).map((c) => {
  let id = slug(c.nume); folosite[id] = (folosite[id] || 0) + 1; if (folosite[id] > 1) id += '-' + folosite[id];
  return { ...c, id, scurt: c.scurt || c.nume, activa: c.activa !== false, pret: c.afiseaza_pret !== false,
    desen: DESENE.includes(c.desen) ? c.desen : 'flori', culoare: c.culoare || '#E8EEF4', modele: c.modele || [], personalizare: c.personalizare || [] };
});
const ACTIVE = TOATE.filter((c) => c.activa);
const GENERATE = PANOU ? TOATE : ACTIVE;          // ce apare în HTML
const dupaNume = Object.fromEntries(TOATE.map((c) => [c.nume, c]));
const ascuns = (c) => (c.activa ? '' : ' hidden');

// ---------- poze ----------
function urlPoza(img, w, pre) {
  if (!img) return '';
  if (/^https?:\/\//.test(img)) return img;
  if (VANZARE) return pre + img.replace(/^\//, '');
  return `/.netlify/images?url=${encodeURIComponent(img)}&w=${w}&q=78`;
}
function ph({ tint, desen, eticheta = T.fotografie, img = '', pozitie = 'centru', pre = '', alt = '', sizes = '50vw', mare = false }) {
  if (img) {
    const srcset = VANZARE || /^https?:/.test(img) ? '' : ` srcset="${e(urlPoza(img, 500, pre))} 500w, ${e(urlPoza(img, 900, pre))} 900w, ${e(urlPoza(img, 1500, pre))} 1500w" sizes="${sizes}"`;
    return `<div class="ph are-poza" style="--tint:${e(tint)}"><img src="${e(urlPoza(img, 1200, pre))}"${srcset} alt="${e(alt || eticheta)}" loading="lazy" style="object-position:${poz(pozitie)}"><span>${e(eticheta)}</span></div>`;
  }
  return `<div class="ph" style="--tint:${e(tint)}"><svg viewBox="0 0 100 100" aria-hidden="true"${mare ? ' style="width:30%"' : ''}><use href="#i-${desen}"/></svg><span>${e(eticheta)}</span></div>`;
}
// Preț: „de la …” sau „Preț la cerere”, comutabil din panoul demo
function pret(c, valoare, tag = 'span', cls = '') {
  const fix = !valoare;
  return `<${tag} class="price${cls ? ' ' + cls : ''}${!c.pret || fix ? ' off' : ''}" data-pc="${c.id}"${fix ? ' data-fix' : ''}>${fix ? '' : `<span class="p">${e(valoare)}</span>`}<span class="ask">${e(T.pret_la_cerere)}</span></${tag}>`;
}

// ---------- legături ----------
const idx = VANZARE ? 'index.html' : '';
const linkAcasa = (pre) => (pre || './') + idx;
const linkCat = (pre, c) => pre + c.id + '/' + idx;
const wa = (text) => `https://wa.me/${e(S.whatsapp)}?text=${encodeURIComponent(text)}`;

const SIMBOLURI = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-invitatii" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><rect x="14" y="30" width="72" height="50" rx="3"/><path d="M14 32l36 26 36-26"/><rect x="26" y="14" width="48" height="34" rx="2" fill="var(--tint,#fff)"/><path d="M34 26h32M38 34h24"/></g><circle cx="50" cy="62" r="7" fill="#7A1F3D"/></symbol>
  <symbol id="i-lumanari" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="28" y="34" width="12" height="56" rx="2"/><rect x="60" y="34" width="12" height="56" rx="2"/><path d="M34 34v-6M66 34v-6"/><path d="M34 26c-4-5 0-10 0-14 0 4 4 9 0 14zM66 26c-4-5 0-10 0-14 0 4 4 9 0 14z" fill="currentColor"/><path d="M22 52c6 4 18 4 24 0M54 52c6 4 18 4 24 0"/><circle cx="34" cy="50" r="5"/><circle cx="66" cy="50" r="5"/></g></symbol>
  <symbol id="i-flori" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M50 92V52M50 70c-10-2-16-10-16-18M50 64c10-2 16-10 16-18"/><circle cx="50" cy="34" r="9"/><circle cx="50" cy="18" r="8"/><circle cx="35" cy="30" r="8"/><circle cx="65" cy="30" r="8"/><circle cx="40" cy="47" r="8"/><circle cx="60" cy="47" r="8"/></g></symbol>
  <symbol id="i-cocarde" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="38" r="20"/><circle cx="50" cy="38" r="10"/><path d="M40 56l-8 32 12-8 6 10 4-32M60 56l8 32-12-8"/></g></symbol>
  <symbol id="i-pahare" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M22 14h24l-2 26a10 10 0 0 1-20 0zM34 50v32M26 84h16"/><path d="M58 18h22l-2 24a9 9 0 0 1-18 0zM69 51v31M61 84h16"/><path d="M25 26h18M60 30h18"/></g></symbol>
  <symbol id="i-marturii" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><rect x="22" y="44" width="56" height="42" rx="3"/><rect x="16" y="32" width="68" height="14" rx="2"/><path d="M50 32v54"/><path d="M50 32c-8-14-24-14-20-4 2 5 14 4 20 4zM50 32c8-14 24-14 20-4-2 5-14 4-20 4z"/></g></symbol>
  <symbol id="i-decor" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><rect x="18" y="20" width="64" height="48" rx="3"/><path d="M30 34h40M34 44h32M38 54h24"/><path d="M36 68l-8 20M64 68l8 20"/></g></symbol>
  <symbol id="sprig" viewBox="0 0 120 30"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M6 15h108"/><path d="M30 15c-4-6-10-8-14-6 2 5 8 7 14 6zM30 15c-4 6-10 8-14 6 2-5 8-7 14-6zM90 15c4-6 10-8 14-6-2 5-8 7-14 6zM90 15c4 6 10 8 14 6-2-5-8-7-14-6z"/><circle cx="60" cy="15" r="3" fill="currentColor"/></g></symbol>
</svg>`;
const SIGILIU = (lit) => `<svg class="seal" viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="wax" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#A2365A"/><stop offset=".6" stop-color="#7A1F3D"/><stop offset="1" stop-color="#561229"/></radialGradient></defs><path d="M60 4c9 0 13 6 21 7s14 3 18 10 2 14 6 21 8 12 6 21-9 12-12 19-3 14-10 18-15 2-22 5-13 9-22 7-12-8-19-11-15-3-19-10-1-14-4-21-9-12-7-21 9-12 11-19 3-14 10-18 14-1 21-4S51 4 60 4z" fill="url(#wax)"/><circle cx="60" cy="60" r="34" fill="none" stroke="#5A1229" stroke-width="2" opacity=".55"/><circle cx="60" cy="60" r="29" fill="none" stroke="#C25A7F" stroke-width="1" opacity=".5"/><text x="61" y="79" text-anchor="middle" font-family="Pinyon Script, cursive" font-size="54" fill="#3E0A1C">${e(lit)}</text><text x="59.5" y="77.5" text-anchor="middle" font-family="Pinyon Script, cursive" font-size="54" fill="#D98AA6" opacity=".7">${e(lit)}</text></svg>`;

// ---------- secțiunea comună: cerere de ofertă + întrebări ----------
function sectiuneOferta() {
  return `<section class="section" id="oferta">
  <div class="wrap offer">
    <aside>
      <h2>${e(T.cere_o_oferta)}</h2>
      <p>${e(A.oferta_text)}</p>
      <dl>
        <dt>${e(T.t_telefon)}</dt><dd><a href="tel:${e(S.telefon_link)}">${e(S.telefon)}</a></dd>
        <dt>${e(T.t_email)}</dt><dd><a href="mailto:${e(S.email)}">${e(S.email)}</a></dd>
        <dt>${e(T.t_atelier)}</dt><dd>${(S.adresa || []).map(e).join('<br>')}</dd>
      </dl>
    </aside>
    <form class="quote-form" id="quoteForm" novalidate>
      <div class="row">
        <label>${e(T.f_nume)}<input name="nume" autocomplete="name" required></label>
        <label>${e(T.f_telefon)}<input name="telefon" type="tel" inputmode="tel" autocomplete="tel" required></label>
      </div>
      <div class="row">
        <label>${e(T.f_data)}<input name="data" type="date" required></label>
        <label><span class="lbl">${e(T.f_invitati)} <span class="opt">${e(T.f_aprox)}</span></span><input name="invitati" type="number" min="1" inputmode="numeric" placeholder="ex. 150"></label>
      </div>
      <fieldset><legend>${e(T.f_interes)}</legend><div class="checks">${GENERATE.map((c) => `<label data-cat="${c.id}"${ascuns(c)}><input type="checkbox" name="interes" value="${e(c.scurt)}">${e(c.scurt)}</label>`).join('')}</div></fieldset>
      <label><span class="lbl">${e(T.f_mesaj)} <span class="opt">${e(T.f_optional)}</span></span><textarea name="mesaj" placeholder="${e(T.f_mesaj_exemplu)}"></textarea></label>
      <button class="btn" type="submit">${e(T.f_trimite)}</button>
      <p class="error" id="formError" hidden></p>
    </form>
  </div>
</section>
${(A.intrebari || []).length ? `<section class="section" style="padding-top:0">
  <div class="wrap center"><h2 class="big">${e(T.intrebari_titlu)}</h2></div>
  <div class="wrap faq">${A.intrebari.map((q) => `<details><summary>${e(q.intrebare)}</summary><p>${e(q.raspuns)}</p></details>`).join('')}</div>
</section>` : ''}`;
}

// ---------- șablonul comun ----------
function layout({ titlu, descriere, pre, continut, curenta }) {
  const meniu = `<li><a href="${linkAcasa(pre)}"${!curenta ? ' aria-current="page"' : ''}>${e(T.acasa)}</a></li>` +
    GENERATE.map((c) => `<li data-cat="${c.id}"${ascuns(c)}><a href="${linkCat(pre, c)}"${curenta === c.id ? ' aria-current="page"' : ''}>${e(c.scurt)}</a></li>`).join('');
  const date = {
    setari: { whatsapp: S.whatsapp, metoda: VANZARE && S.oferta_metoda === 'netlify' ? 'whatsapp' : (S.oferta_metoda || 'netlify'), endpoint: S.oferta_endpoint || '', telefon: S.telefon },
    texte: T, panou: PANOU,
    categorii: TOATE.map((c) => ({ id: c.id, nume: c.nume, scurt: c.scurt, activa: c.activa, pret: c.pret, desen: c.desen })),
    profiluri: (DEMO.profiluri || []).map((p) => ({ nume: p.nume, categorii: (p.categorii || []).map((n) => dupaNume[n] && dupaNume[n].id).filter(Boolean) })),
  };
  const formular = VANZARE ? '' : `
<form name="oferta" data-netlify="true" netlify-honeypot="bot-field" hidden><input name="bot-field"><input name="nume"><input name="telefon"><input name="data"><input name="invitati"><input name="interes"><input name="mesaj"></form>`;
  const logare = !VANZARE && !curenta ? `
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
<script>if(window.netlifyIdentity){netlifyIdentity.on('init',function(u){if(!u)netlifyIdentity.on('login',function(){location.href='/admin/';});});}</script>` : '';
  const panou = PANOU ? `
<button class="cfg-btn" id="cfgBtn" aria-expanded="false" aria-controls="cfg">Configurează demo-ul</button>
<div class="cfg" id="cfg" hidden role="dialog" aria-label="Configurare demo">
  <h2>Ce face atelierul?</h2>
  <p>Alege un profil sau pornește doar categoriile pe care le are clientul. La fiecare categorie alegi și dacă se afișează prețurile.</p>
  <div class="presets" id="presets"></div>
  <div class="toggles" id="toggles"></div>
</div>` : '';
  return `<!DOCTYPE html>
<html lang="${e(T.limba || 'ro')}"${VANZARE ? '' : ' data-site="live"'}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(titlu)}</title>
<meta name="description" content="${e(descriere)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='46' fill='%237A1F3D'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gilda+Display&family=Mulish:wght@400;500;600;700&family=Pinyon+Script&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${pre}assets/style.css">
</head>
<body>
${SIMBOLURI}
<header>
  <div class="wrap top">
    <div class="contact"><a href="tel:${e(S.telefon_link)}">${e(S.telefon)}</a><a href="${wa('Bună ziua! Aș dori detalii despre accesoriile de nuntă.')}" target="_blank" rel="noopener">${e(T.whatsapp)}</a></div>
    <a class="brand" href="${linkAcasa(pre)}"><span class="name">${e(S.nume)}</span><span class="tag">${e(S.slogan)}</span></a>
    <div class="cta"><a class="btn" href="#oferta">${e(T.cere_oferta)}</a></div>
  </div>
  <nav class="cats" aria-label="Categorii"><ul class="wrap" id="menu">${meniu}</ul></nav>
</header>
<main>
${continut}
${sectiuneOferta()}
</main>
<footer>
  <div class="wrap">
    <div class="foot">
      <div><a class="brand" href="${linkAcasa(pre)}"><span class="name">${e(S.nume)}</span><span class="tag">${e(S.slogan)}</span></a><p>${e(S.despre_scurt)}</p></div>
      <ul>${GENERATE.map((c) => `<li data-cat="${c.id}"${ascuns(c)}><a href="${linkCat(pre, c)}">${e(c.nume)}</a></li>`).join('')}</ul>
      <ul><li><a href="tel:${e(S.telefon_link)}">${e(S.telefon)}</a></li><li><a href="mailto:${e(S.email)}">${e(S.email)}</a></li><li><a href="${wa('Bună ziua! Aș dori detalii despre accesoriile de nuntă.')}" target="_blank" rel="noopener">${e(T.whatsapp)}</a></li><li><a href="#oferta">${e(T.cere_oferta)}</a></li></ul>
    </div>
    <div class="legal"><span>© ${new Date().getFullYear()} ${e(S.nume)}</span>${S.demo ? `<span>${e(T.demo_nota)}</span>` : ''}</div>
  </div>
</footer>${panou}${formular}
<script>window.ATELIER=${JSON.stringify(date).replace(/</g, '\\u003c')};</script>
<script src="${pre}assets/app.js"></script>${logare}
</body>
</html>
`;
}

// ---------- prima pagină ----------
function paginaAcasa() {
  const pre = '';
  const I = A.invitatie || {};
  const textErou = A.text || T.lucram_de_mana.replace('{lista}', lista(ACTIVE.map((c) => c.scurt.toLowerCase())));
  const invitatii = TOATE.find((c) => c.desen === 'invitatii');
  const cuInvitatie = I.arata !== false;
  const prima = ACTIVE[0] || TOATE[0];
  const fotoErou = A.foto
    ? ph({ tint: 'var(--mist)', desen: prima.desen, eticheta: 'Fotografie principală', img: A.foto, pozitie: A.foto_pozitie, pre, alt: S.nume, sizes: '(max-width:860px) 100vw, 50vw' })
    : `<div class="ph" id="heroPh" style="--tint:var(--mist)"><span>Fotografie principală</span></div>`;
  const carteInvitatie = cuInvitatie ? `<div class="invite" aria-hidden="true"${invitatii ? ` data-cat="${invitatii.id}"${ascuns(invitatii)}` : ' hidden'}>
          <svg class="sprig" viewBox="0 0 120 30"><use href="#sprig"/></svg>
          <small>${e(I.sus)}</small>
          <div class="names">${e(I.nume)}</div>
          <small>${e(I.mijloc)}</small>
          <div class="date">${e(I.data)}</div>
          <div class="place">${String(I.loc || '').split('\n').map(e).join('<br>')}</div>
        </div>` : '';
  const piese = (k) => (k.piese || []).filter((p) => dupaNume[p.categorie] && (PANOU || dupaNume[p.categorie].activa))
    .map((p) => { const c = dupaNume[p.categorie]; return `<li data-cat="${c.id}"${ascuns(c)}>${e(p.text)}</li>`; }).join('');
  const colectii = (COL.lista || []).map((k) => `<article class="collection">
      ${ph({ tint: k.fundal || '#F3EFE6', desen: prima.desen, eticheta: 'Fotografie colecție', img: k.foto, pozitie: k.foto_pozitie, pre, alt: k.nume, sizes: '(max-width:900px) 86vw, 25vw' })}
      <div class="txt"><h3>${e(k.nume)}</h3><div class="swatches">${(k.culori || []).map((x) => `<i style="background:${e(x)}"></i>`).join('')}</div><p>${e(k.text)}</p><ul>${piese(k)}</ul>
      <a class="link" href="#oferta" data-colectie="${e(k.nume)}">${e(T.vreau_colectia)}</a></div>
    </article>`).join('');
  const galerie = (A.galerie || []).length
    ? A.galerie.map((g, i) => { const img = typeof g === 'string' ? g : g && g.imagine; const c = TOATE[i % TOATE.length]; return ph({ tint: c.culoare, desen: c.desen, eticheta: 'Fotografie din nuntă', img, pozitie: (g && g.pozitie) || 'centru', pre, alt: 'Fotografie din nuntă', sizes: '(max-width:520px) 72vw, 25vw' }); }).join('')
    : [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const c = TOATE[i % TOATE.length]; return ph({ tint: c.culoare, desen: c.desen, eticheta: 'Fotografie din nuntă' }); }).join('');
  const R = A.recenzie || {};
  const continut = `<div id="home">
  <section class="wrap hero${invitatii && invitatii.activa && cuInvitatie ? '' : ' no-invite'}" id="hero">
    <div>
      <h1>${e(A.titlu)}</h1>
      <p id="heroText"${A.text ? '' : ' data-auto'}>${e(textErou)}</p>
      <div class="actions"><a class="btn" href="#oferta">${e(T.cere_o_oferta)}</a><a class="btn ghost" href="#ce-facem">${e(T.vezi_ce_facem)}</a></div>
      ${A.nota ? `<p class="note">${e(A.nota)}</p>` : ''}
    </div>
    <div class="stage">
      ${fotoErou}
      ${carteInvitatie}
      ${SIGILIU(S.monograma || S.nume.charAt(0))}
    </div>
  </section>

  <section class="section" id="ce-facem" style="padding-top:1rem">
    <div class="wrap center">
      <div class="rule"><svg viewBox="0 0 14 14"><path d="M7 0l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="currentColor"/></svg></div>
      <h2 class="big">${e(A.ce_facem_titlu)}</h2>
      <p class="lead">${e(A.ce_facem_text)}</p>
    </div>
    <div class="wrap"><div class="cats-grid">${GENERATE.map((c) => `<a class="cat" href="${linkCat(pre, c)}" data-cat="${c.id}"${ascuns(c)}>${ph({ tint: c.culoare, desen: c.desen, img: c.foto, pozitie: c.foto_pozitie, pre, alt: c.nume, sizes: '(max-width:640px) 50vw, 25vw' })}<h3>${e(c.nume)}</h3><p>${e(c.rezumat)}</p>${pret(c, c.de_la, 'span', 'from')}</a>`).join('')}</div></div>
  </section>

  ${(COL.lista || []).length ? `<section class="section collections" id="colectii">
    <div class="wrap">
      <div class="col-head">
        <div><h2 class="big">${e(T.colectii_titlu)}</h2><p>${e(COL.text)}</p></div>
        <div class="arrows"><button class="arrow" data-rail="rail" data-dir="-1" aria-label="${e(T.inapoi)}">‹</button><button class="arrow" data-rail="rail" data-dir="1" aria-label="${e(T.inainte)}">›</button></div>
      </div>
      <div class="rail" id="rail">${colectii}</div>
    </div>
  </section>` : ''}

  ${(A.pasi || []).length ? `<section class="section">
    <div class="wrap center"><h2 class="big">${e(T.pasi_titlu)}</h2><p class="lead">${e(A.pasi_text)}</p></div>
    <ol class="wrap steps">${A.pasi.map((p) => `<li><h3>${e(p.titlu)}</h3><p>${e(p.text)}</p></li>`).join('')}</ol>
  </section>` : ''}

  <section class="section" style="padding-top:0">
    <div class="wrap gal-head"><h2 class="big">${e(T.galerie_titlu)}</h2><div class="arrows"><button class="arrow" data-rail="gallery" data-dir="-1" aria-label="${e(T.inapoi)}">‹</button><button class="arrow" data-rail="gallery" data-dir="1" aria-label="${e(T.inainte)}">›</button></div></div>
    <div class="wrap gallery" id="gallery">${galerie}</div>
  </section>

  ${R.arata !== false && R.text ? `<section class="section quote"><div class="wrap">${R.semnatura ? `<span class="sig">${e(R.semnatura)}</span>` : ''}<blockquote>${e(R.text)}</blockquote><cite>${e(R.autor)}</cite></div></section>` : ''}
</div>`;
  return layout({ titlu: `${S.nume}, ${S.slogan}`, descriere: S.descriere, pre, continut, curenta: null });
}

// ---------- pagina unei categorii ----------
function paginaCategorie(c) {
  const pre = '../';
  const alte = GENERATE.filter((x) => x !== c);
  const continut = `<section class="wrap"><div class="cat-hero" style="--tint:${e(c.culoare)}">
  <div class="txt"><nav class="crumbs" aria-label="Unde ești"><a href="${linkAcasa(pre)}">${e(T.acasa)}</a></nav><h1>${e(c.nume)}</h1><p>${e(c.intro)}</p></div>
  ${ph({ tint: c.culoare, desen: c.desen, eticheta: T.fotografie, img: c.foto, pozitie: c.foto_pozitie, pre, alt: c.nume, sizes: '(max-width:760px) 100vw, 45vw', mare: true })}
</div></section>
<section class="wrap section" style="padding-bottom:1rem">
  ${c.modele.length ? `<h2 class="big">${e(T.modele)}</h2><div class="models">${c.modele.map((m) => `<article class="model">${ph({ tint: c.culoare, desen: c.desen, img: m.foto, pozitie: m.foto_pozitie, pre, alt: m.nume, sizes: '(max-width:520px) 100vw, 33vw' })}<h3>${e(m.nume)}</h3>${m.descriere ? `<p>${e(m.descriere)}</p>` : ''}<div class="meta">${pret(c, m.pret)}${m.minim ? `<span>${e(m.minim)}</span>` : ''}</div></article>`).join('')}</div>` : ''}
  ${c.personalizare.length ? `<div class="perso"><svg class="icon" viewBox="0 0 100 100" aria-hidden="true"><use href="#i-${c.desen}"/></svg><div><h3>${e(T.personalizare_titlu)}</h3><ul>${c.personalizare.map((p) => `<li>${e(p)}</li>`).join('')}</ul></div></div>` : ''}
  <div class="cat-cta"><a class="btn" href="#oferta" data-cat-oferta="${e(c.scurt)}">${e(T.cere_oferta_pentru)} ${e(c.scurt.toLowerCase())}</a>
  ${alte.length ? `<p style="margin:2.2rem 0 0;color:var(--muted)">${e(T.mai_lucram)}</p><div class="other">${alte.map((x) => `<a href="${linkCat(pre, x)}" data-cat="${x.id}"${ascuns(x)}>${e(x.scurt)}</a>`).join('')}</div>` : ''}</div>
</section>`;
  return layout({ titlu: `${c.nume} | ${S.nume}`, descriere: `${c.rezumat} ${S.nume}.`, pre, continut, curenta: c.id });
}

// ---------- scrierea fișierelor ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'src', 'style.css'), path.join(OUT, 'assets', 'style.css'));
fs.copyFileSync(path.join(__dirname, 'src', 'app.js'), path.join(OUT, 'assets', 'app.js'));
if (fs.existsSync(path.join(__dirname, 'images'))) fs.cpSync(path.join(__dirname, 'images'), path.join(OUT, 'images'), { recursive: true });
if (!VANZARE) fs.cpSync(path.join(__dirname, 'admin'), path.join(OUT, 'admin'), { recursive: true });
const scrie = (rel, html) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); console.log('✓ /' + rel.replace(/index\.html$/, '')); };
scrie('index.html', paginaAcasa());
GENERATE.forEach((c) => scrie(`${c.id}/index.html`, paginaCategorie(c)));
console.log(`Gata: ${1 + GENERATE.length} pagini în folderul ${path.basename(OUT)}.`);
