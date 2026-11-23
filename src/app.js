/* app.js — formularul de ofertă, caruselele și panoul de configurare pentru prezentări.
   Datele vin din window.ATELIER (generate de build.js). */
(function () {
  var D = window.ATELIER || { setari: {}, texte: {}, categorii: [], profiluri: [] };
  var S = D.setari, T = D.texte;
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lista(n) { return n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' ' + (T.si || 'și') + ' ' + n[n.length - 1]; }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- carusele ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rail]');
    if (b) { var r = $(b.dataset.rail); if (r) r.scrollBy({ left: r.clientWidth * 0.9 * (+b.dataset.dir), behavior: reduce ? 'auto' : 'smooth' }); }
    var k = e.target.closest('[data-colectie]');
    if (k) { var t = document.querySelector('#quoteForm [name=mesaj]'); if (t) t.value = 'Ne place colecția „' + k.dataset.colectie + '”. '; }
    var c = e.target.closest('[data-cat-oferta]');
    if (c) { var x = document.querySelector('#quoteForm input[value="' + c.dataset.catOferta + '"]'); if (x) x.checked = true; }
  });

  /* ---------- trimiterea cererii ---------- */
  function trimite(date) {
    if (S.metoda === 'netlify' && document.documentElement.dataset.site === 'live') {
      date['form-name'] = 'oferta';
      return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(date).toString() })
        .then(function (r) { if (!r.ok) throw new Error(r.status); });
    }
    if (S.metoda === 'endpoint' && S.endpoint) {
      return fetch(S.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(date) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); });
    }
    return new Promise(function (ok) { setTimeout(ok, 400); }); // „whatsapp”: clientul trimite mesajul pe WhatsApp
  }
  var f = $('quoteForm');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(f), err = $('formError');
    var lipsa = [['nume', 'numele'], ['telefon', 'telefonul'], ['data', 'data nunții']].filter(function (c) { return !String(d.get(c[0]) || '').trim(); }).map(function (c) { return c[1]; });
    if (lipsa.length) { err.hidden = false; err.textContent = 'Completează ' + lista(lipsa) + '.'; return; }
    err.hidden = true;
    var interes = d.getAll('interes');
    var dataTxt = new Date(d.get('data') + 'T12:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
    var date = { nume: d.get('nume'), telefon: d.get('telefon'), data: dataTxt, invitati: d.get('invitati') || '', interes: interes.join(', '), mesaj: d.get('mesaj') || '' };
    var rezumat = 'Cerere de ofertă\nNume: ' + date.nume + '\nTelefon: ' + date.telefon + '\nData nunții: ' + dataTxt + (date.invitati ? '\nInvitați: ' + date.invitati : '') + (date.interes ? '\nNe interesează: ' + date.interes : '') + (date.mesaj ? '\nDetalii: ' + date.mesaj : '');
    var b = f.querySelector('button'); b.disabled = true; b.textContent = 'Se trimite…';
    var doarWa = S.metoda === 'whatsapp';
    trimite(date).then(function () {
      f.innerHTML = '<div class="done"><h3>' + (doarWa ? 'Mai e un pas' : 'Mulțumim, ' + esc(date.nume) + '!') + '</h3><p>' +
        (doarWa ? 'Apăsați butonul de mai jos ca să ne trimiteți cererea pe WhatsApp.' : 'Am primit cererea pentru nunta din ' + esc(dataTxt) + '. Vă răspundem în cel mult 24 de ore.') +
        '</p><a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(rezumat) + '">' + (doarWa ? 'Trimite pe WhatsApp' : 'Trimite și pe WhatsApp') + '</a></div>';
    }).catch(function () {
      b.disabled = false; b.textContent = T.f_trimite; err.hidden = false;
      err.textContent = 'Cererea nu a plecat. Verificați conexiunea și încercați din nou, sau sunați-ne la ' + S.telefon + '.';
    });
  });

  /* ---------- panoul de configurare (doar pentru prezentări) ---------- */
  if (!D.panou) return;
  var CHEIE = 'atelier-demo';
  var stare = {};
  D.categorii.forEach(function (c) { stare[c.id] = { activa: c.activa, pret: c.pret }; });
  try { var salvat = JSON.parse(sessionStorage.getItem(CHEIE) || 'null'); if (salvat) Object.keys(salvat).forEach(function (k) { if (stare[k]) stare[k] = salvat[k]; }); } catch (e) {}
  function salveaza() { try { sessionStorage.setItem(CHEIE, JSON.stringify(stare)); } catch (e) {} }
  function aplica() {
    document.querySelectorAll('[data-cat]').forEach(function (el) { var s = stare[el.dataset.cat]; if (s) el.hidden = !s.activa; });
    document.querySelectorAll('[data-pc]').forEach(function (el) { var s = stare[el.dataset.pc]; if (s && !el.hasAttribute('data-fix')) el.classList.toggle('off', !s.pret); });
    var active = D.categorii.filter(function (c) { return stare[c.id].activa; });
    var ht = $('heroText');
    if (ht && ht.hasAttribute('data-auto')) ht.textContent = (T.lucram_de_mana || '{lista}').replace('{lista}', lista(active.map(function (c) { return c.scurt.toLowerCase(); })));
    var hero = $('hero'), inv = D.categorii.filter(function (c) { return c.desen === 'invitatii'; })[0];
    var cuInv = !!(inv && stare[inv.id].activa && document.querySelector('.invite'));
    if (hero) hero.classList.toggle('no-invite', !cuInv);
    var hp = $('heroPh');
    if (hp && active[0]) hp.innerHTML = (cuInv ? '' : '<svg viewBox="0 0 100 100" style="width:34%;max-width:190px" aria-hidden="true"><use href="#i-' + active[0].desen + '"/></svg>') + '<span>Fotografie principală</span>';
    deseneazaPanou();
  }
  function deseneazaPanou() {
    $('toggles').innerHTML = '<div class="thead"><span>Categoria</span><span>Activă</span><span>Preț</span></div>' + D.categorii.map(function (c) {
      var s = stare[c.id];
      return '<div class="trow"><span>' + esc(c.nume) + '</span><input type="checkbox" class="switch" aria-label="' + esc(c.nume) + ': activă" data-act="' + c.id + '"' + (s.activa ? ' checked' : '') + '><input type="checkbox" class="switch" aria-label="' + esc(c.nume) + ': arată prețul" data-pret="' + c.id + '"' + (s.pret ? ' checked' : '') + (s.activa ? '' : ' disabled') + '></div>';
    }).join('');
  }
  $('presets').innerHTML = D.profiluri.map(function (p, i) { return '<button type="button" data-p="' + i + '">' + esc(p.nume) + '</button>'; }).join('');
  $('presets').addEventListener('click', function (e) {
    var b = e.target.closest('[data-p]'); if (!b) return; var p = D.profiluri[+b.dataset.p];
    D.categorii.forEach(function (c) { stare[c.id].activa = p.categorii.indexOf(c.id) > -1; });
    salveaza(); aplica();
  });
  $('toggles').addEventListener('change', function (e) {
    var a = e.target.closest('[data-act]'), pr = e.target.closest('[data-pret]');
    if (pr) { stare[pr.dataset.pret].pret = pr.checked; }
    if (a) {
      var nrActive = D.categorii.filter(function (c) { return stare[c.id].activa; }).length;
      if (!a.checked && nrActive === 1) { a.checked = true; return; }
      stare[a.dataset.act].activa = a.checked;
    }
    salveaza(); aplica();
  });
  var btn = $('cfgBtn'), panou = $('cfg');
  btn.addEventListener('click', function () { panou.hidden = !panou.hidden; btn.setAttribute('aria-expanded', !panou.hidden); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panou.hidden) { panou.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
  aplica();
})();
