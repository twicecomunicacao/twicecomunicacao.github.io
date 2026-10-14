/* TWICE | Comunicação em dobro — interações
   Sem bibliotecas. Tudo degrada bem sem JS (links e âncoras continuam funcionando). */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  const canAutoplay = !reduced && !saveData;

  /* ---------- portfólio: "ver mais" (os trabalhos vêm do painel) ---------- */
  const more = $('#more');
  more && more.addEventListener('click', () => {
    $$('.tile[hidden]').forEach(t => { t.hidden = false; observeVideo($('video', t)); revealIO && revealIO.observe(t); });
    more.parentElement.remove();
  });

  /* ---------- vídeos: carregam e tocam só quando visíveis ---------- */
  const load = v => { if (!v.src && v.dataset.src) { v.src = v.dataset.src; } };
  const vidIO = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!canAutoplay) return;               // sem autoplay: fica o poster
        if (v.closest('.svc__frame') && !v.classList.contains('is-on')) return;
        load(v); const p = v.play(); p && p.catch(() => {});
      } else if (!v.paused) v.pause();
    });
  }, { rootMargin: '120px 0px', threshold: .2 }) : null;
  const observeVideo = v => v && vidIO && vidIO.observe(v);
  $$('video.auto, .svc__frame video, .svc__media-m video').forEach(observeVideo);

  /* ---------- entradas suaves ---------- */
  let revealIO = null;
  if (!reduced && 'IntersectionObserver' in window) {
    revealIO = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.reveal').forEach(el => revealIO.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('in'));

  /* ---------- nav: fundo ao rolar, link ativo ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const links = $$('.nav__links a');
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['inicio', 'a-twice', 'servicos', 'portfolio', 'como-funciona', 'perguntas', 'contato'].forEach(id => { const s = document.getElementById(id); s && secIO.observe(s); });

  /* ---------- menu mobile ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 350); }
    updateWa();
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- serviços: lista interativa ---------- */
  const items = $$('.svc__item');
  const stageVids = $$('.svc__frame video');
  const desktop = matchMedia('(min-width: 960px)');
  const setStage = i => {
    stageVids.forEach((v, k) => {
      const on = k === i; v.classList.toggle('is-on', on);
      if (on && canAutoplay) { load(v); const p = v.play(); p && p.catch(() => {}); } else if (!on) v.pause();
    });
  };
  const toggle = (item, force) => {
    const open = force ?? !item.classList.contains('is-open');
    item.classList.toggle('is-open', open);
    $('.svc__row', item).setAttribute('aria-expanded', open);
    const mv = $('.svc__media-m video', item);
    if (open && mv && canAutoplay && !desktop.matches) { load(mv); const p = mv.play(); p && p.catch(() => {}); }
  };
  items.forEach((item, i) => {
    $('.svc__row', item).addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      items.forEach(o => o !== item && toggle(o, false));
      toggle(item, willOpen);
      if (willOpen) setStage(i);
    });
    item.addEventListener('mouseenter', () => { if (desktop.matches) setStage(i); });
  });

  /* "Quero esse" → formulário com serviço pré-selecionado */
  const form = $('#form');
  $$('[data-service]').forEach(a => a.addEventListener('click', () => {
    const r = $(`input[name="servico"][value="${a.dataset.service}"]`, form);
    if (r) { r.checked = true; clearErr('servico'); }
    form.classList.remove('is-flash'); void form.offsetWidth; form.classList.add('is-flash');
    setTimeout(() => $('#f-nome').focus({ preventScroll: true }), 700);
  }));

  /* ---------- formatos: setas ---------- */
  const rail = $('#rail');
  $$('.arrow').forEach(b => b.addEventListener('click', () => {
    const card = $('.fmt', rail); const step = card ? card.getBoundingClientRect().width + 24 : 300;
    rail.scrollBy({ left: step * Number(b.dataset.dir), behavior: reduced ? 'auto' : 'smooth' });
  }));

  /* ---------- lightbox ---------- */
  const lb = $('#lb'), lbV = $('#lbVideo'), lbCap = $('#lbCap');
  let list = [], idx = 0, lastFocus = null;
  const visiblePlays = () => $$('.play').filter(b => !b.hidden);
  const show = i => {
    idx = (i + list.length) % list.length;
    const b = list[idx];
    lbV.poster = ($('video', b) || {}).poster || '';
    lbV.src = b.dataset.full; lbCap.textContent = b.dataset.cap || '';
    lbV.muted = false; const p = lbV.play(); p && p.catch(() => {});
  };
  const openLb = btn => {
    list = visiblePlays(); lastFocus = btn;
    $$('video.auto').forEach(v => v.pause());
    lb.hidden = false; requestAnimationFrame(() => lb.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    show(list.indexOf(btn)); $('#lbClose').focus(); updateWa();
  };
  const closeLb = () => {
    lbV.pause(); lbV.removeAttribute('src'); lbV.load();
    lb.classList.remove('is-open'); setTimeout(() => { lb.hidden = true; }, 300);
    document.body.style.overflow = ''; lastFocus && lastFocus.focus({ preventScroll: true }); updateWa();
  };
  document.addEventListener('click', e => { const b = e.target.closest('.play'); if (b) { e.preventDefault(); openLb(b); } });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => show(idx - 1));
  $('#lbNext').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'Tab') { // mantém o foco dentro do lightbox
      const f = $$('button, video', lb); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let tx = null; // swipe lateral no celular
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 60) show(idx + (dx < 0 ? 1 : -1));
  });

  /* ---------- formulário → WhatsApp ---------- */
  const errs = { nome: 'Como podemos te chamar?', servico: 'Escolha uma opção (pode ser “Ainda não sei”).', projeto: 'Conta em uma ou duas frases o que você precisa.' };
  const setErr = (k, msg) => { const p = $('#e-' + k); p.textContent = msg; p.closest('.field').classList.toggle('has-err', !!msg); };
  const clearErr = k => setErr(k, '');
  ['nome', 'projeto'].forEach(k => form.elements[k].addEventListener('input', () => clearErr(k)));
  $$('input[name="servico"]', form).forEach(r => r.addEventListener('change', () => clearErr('servico')));

  const fmtDate = v => { if (!v) return ''; const [y, m, d] = v.split('-'); return `${d}/${m}/${y}`; };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = form.elements.nome.value.trim();
    const servico = (form.querySelector('input[name="servico"]:checked') || {}).value || '';
    const data = fmtDate(form.elements.data.value);
    const projeto = form.elements.projeto.value.trim();
    let firstBad = null;
    [['nome', nome], ['servico', servico], ['projeto', projeto]].forEach(([k, v]) => {
      if (!v) { setErr(k, errs[k]); firstBad = firstBad || k; } else clearErr(k);
    });
    if (firstBad) {
      const el = firstBad === 'servico' ? form.querySelector('input[name="servico"]') : form.elements[firstBad];
      el.focus(); return;
    }
    const msg = [
      form.dataset.msg,
      '',
      `Nome: ${nome}`,
      `Serviço: ${servico}`,
      `Data: ${data || 'ainda não definida'}`,
      `Projeto: ${projeto}`,
    ].join('\n');
    const url = `https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(msg)}`;
    const w = window.open(url, '_blank');
    // se o navegador bloquear a nova aba, mostra um link para tocar
    let alt = $('#waAlt');
    if (!alt) { alt = document.createElement('a'); alt.id = 'waAlt'; alt.className = 'btn btn--line btn--full'; alt.target = '_blank'; alt.rel = 'noopener'; form.appendChild(alt); }
    alt.href = url; alt.textContent = w ? 'Não abriu? Toque aqui para abrir o WhatsApp' : 'Mensagem pronta: abrir o WhatsApp';
  });

  /* ---------- WhatsApp fixo: aparece depois do hero, some no formulário ---------- */
  const wa = $('#wa') || document.createElement('a');
  let pastHero = false, formVisible = false;
  function updateWa() {
    const blocked = !menu.hidden || !lb.hidden;
    wa.classList.toggle('is-on', pastHero && !formVisible && !blocked);
    wa.setAttribute('tabindex', wa.classList.contains('is-on') ? '0' : '-1');
  }
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; updateWa(); }, { threshold: .15 }).observe($('#inicio'));
  const seen = new Set();
  const endIO = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
    formVisible = seen.size > 0; updateWa();
  }, { threshold: 0 });
  [form, $('#contato'), $('.footer')].forEach(el => el && endIO.observe(el));

})();
