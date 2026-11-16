// Builds the static site into ./dist  (run: node build.mjs). No dependencies.
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const S = read('content/settings.json');
const SITE = (process.env.SITE_URL || S.site_url || '').replace(/\/+$/, '');
const V = Date.now().toString(36);

const farms = fs.readdirSync('content/farms').filter((f) => f.endsWith('.json'))
  .map((f) => ({ ...read(`content/farms/${f}`), file: f.slice(0, -5) }))
  .map((f) => ({ ...f, slug: f.slug || f.file }))
  .filter((f) => !f.hidden)
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

const LANGS = ['ar', 'ku', 'en'];
const PREFIX = { ar: '', ku: '/ku', en: '/en' };
const AREA = { merkaban: { ar: 'ميركبان', ku: 'مێرگەپان', en: 'Merkaban' }, sitak: { ar: 'سيتك', ku: 'سێتەک', en: 'Sitak' } };
const T = {
  ar: { dir: 'rtl', html: 'ar', og: 'ar_IQ', title: 'دليل مزارع السليمانية', managed: 'بإدارة', exp: 'تجربة لازم تعيشها',
    feat: 'مسابح وألعاب أطفال وإطلالة علي الجبال والطبيعة، وخصوصية كاملة لعائلتك', book: 'وإحجز مباشرة بالواتساب', enter: 'ادخل',
    farms: 'المزارع', pick: 'اختر الشاليه اللي يعجبك واحجز مباشرة', loc: 'الموقع', iqd: 'د.ع / الليلة',
    disc: 'قابل للتخفيض إذا أكثر من ليلتين', wa: 'احجز عبر واتساب', soon: 'الصور والفيديو قريباً', mute: 'كتم الصوت', unmute: 'تشغيل الصوت',
    back: 'رجوع للقائمة', swipe: 'اسحب للأعلى لباقي الصور', map: 'الخريطة', mapSub: 'المزارع على خرائط Google',
    openG: (a) => `افتح ${a} في خرائط Google`, openW: (a) => `افتح ${a} في Waze`, n: (n) => `${n} مزارع`,
    msg: (n) => `السلام عليكم، أريد أستفسر عن ${n}، هل هي متوفرة؟`, fb: 'فيسبوك', ig: 'انستغرام', tt: 'تيك توك' },
  ku: { dir: 'rtl', html: 'ckb', og: 'ckb_IQ', title: 'ڕێبەری باخەکانی سلێمانی', managed: 'بەڕێوەبردنی', exp: 'ئەزموونێک کە پێویستە بیژیت',
    feat: 'مەلەوانگە، یاری منداڵان، دیمەنی شاخ و سروشت، و تایبەتمەندییەکی تەواو بۆ خێزانەکەت', book: 'ڕاستەوخۆ بە واتساپ حەجز بکە', enter: 'بچۆ ژوورەوە',
    farms: 'باخەکان', pick: 'ئەو باخە هەڵبژێرە کە بەدڵتە و ڕاستەوخۆ حەجز بکە', loc: 'شوێن', iqd: 'دینار / شەو',
    disc: 'ئەگەر زیاتر لە دوو شەو بێت نرخەکە کەمدەکرێتەوە', wa: 'حەجز لە واتساپ', soon: 'وێنە و ڤیدیۆ بەم زووانە', mute: 'بێدەنگ', unmute: 'دەنگ بکەرەوە',
    back: 'گەڕانەوە بۆ لیست', swipe: 'بەرەو سەرەوە ڕابکێشە بۆ وێنەکانی تر', map: 'نەخشە', mapSub: 'باخەکان لەسەر نەخشەی گووگڵ',
    openG: (a) => `${a} لە نەخشەی گووگڵ بکەرەوە`, openW: (a) => `${a} لە Waze بکەرەوە`, n: (n) => `${n} باخ`,
    msg: (n) => `سڵاو، دەمەوێت بپرسم دەربارەی ${n}، ئایا بەردەستە؟`, fb: 'فەیسبووک', ig: 'ئینستاگرام', tt: 'تیک تۆک' },
  en: { dir: 'ltr', html: 'en', og: 'en_US', title: 'Sulaymaniyah Farms Guide', managed: 'Managed by', exp: 'An experience you have to live',
    feat: "Pools, kids' play areas, mountain and nature views, and complete privacy for your family", book: 'Book directly on WhatsApp', enter: 'Enter',
    farms: 'Farms', pick: 'Pick the farm you like and book directly', loc: 'Location', iqd: 'IQD / night',
    disc: 'Discount available for more than 2 nights', wa: 'Book via WhatsApp', soon: 'Photos and video coming soon', mute: 'Mute', unmute: 'Unmute',
    back: 'Back to the list', swipe: 'Swipe up for more photos', map: 'Map', mapSub: 'Farms on Google Maps',
    openG: (a) => `Open ${a} in Google Maps`, openW: (a) => `Open ${a} in Waze`, n: (n) => `${n} farms`,
    msg: (n) => `Hello, I'd like to ask about ${n}. Is it available?`, fb: 'Facebook', ig: 'Instagram', tt: 'TikTok' },
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (l, p = '/') => PREFIX[l] + p;
const abs = (p) => (SITE ? SITE + p : p);
const money = (n) => Number(n || 0).toLocaleString('en-US');
const fname = (f, l) => f.name?.[l] || f.name?.ar || f.slug;
const hasPage = (f) => (f.videos?.length || 0) + (f.photos?.length || 0) > 0;
const owner = (l) => S.owner?.[l] || S.owner?.ar || '';

const ICON = {
  wa: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88M20.46 3.49A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42"/></svg>',
  fb: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5V13h2.8v8h3.2z"/></svg>',
  ig: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>',
  tt: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><g id="n"><path fill="#25F4EE" transform="translate(-.9 -.9)" d="M16.5 3c.3 2.2 1.6 3.6 3.8 3.8v3c-1.4 0-2.7-.4-3.8-1.1v6.1a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3.1a2.5 2.5 0 1 0 1.6 2.3V3h3z"/><path fill="#FE2C55" transform="translate(.9 .9)" d="M16.5 3c.3 2.2 1.6 3.6 3.8 3.8v3c-1.4 0-2.7-.4-3.8-1.1v6.1a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3.1a2.5 2.5 0 1 0 1.6 2.3V3h3z"/><path fill="#fff" d="M16.5 3c.3 2.2 1.6 3.6 3.8 3.8v3c-1.4 0-2.7-.4-3.8-1.1v6.1a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3.1a2.5 2.5 0 1 0 1.6 2.3V3h3z"/></g></svg>',
  star: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/></svg>',
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  vol: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path class="on" d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/><path class="off" d="M16 9l5 6M21 9l-5 6"/></svg>',
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  gem: '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#E0A24E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6"/></svg>',
  home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  map: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
};

function waLink(f, l) {
  const link = SITE && hasPage(f) ? `\n${SITE}${url(l, `/farm/${f.slug}/`)}` : '';
  return `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(T[l].msg(fname(f, l)) + link)}`;
}

function shell({ l, path: p, title, desc, image, body, cls = '' }) {
  const t = T[l];
  const alts = LANGS.map((x) => `<link rel="alternate" hreflang="${T[x].html}" href="${esc(abs(url(x, p)))}">`).join('');
  const img = image ? abs(image) : abs('/assets/bg/intro.jpg');
  return `<!doctype html>
<html lang="${t.html}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(t.title)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:locale" content="${t.og}">
${SITE ? `<meta property="og:url" content="${esc(abs(url(l, p)))}"><link rel="canonical" href="${esc(abs(url(l, p)))}">` : ''}
<meta name="twitter:card" content="summary_large_image">
${SITE ? alts : ''}
<meta name="theme-color" content="#101A20">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23E0A24E' d='M6 3h12l4 6-10 12L2 9z'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&family=Cinzel:wght@600;700&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${V}">
<script src="/assets/site.js?v=${V}" defer></script>
</head>
<body class="${cls}">
${body}
</body>
</html>
`;
}

const langs = (l, p) => `<nav class="langs" aria-label="Language">${[['ar', 'العربية'], ['ku', 'کوردی'], ['en', 'English']]
  .map(([x, n]) => `<a href="${url(x, p)}"${x === l ? ' class="on" aria-current="true"' : ''} hreflang="${T[x].html}">${n}</a>`).join('')}</nav>`;

const nav = (l, cur) => `<nav class="bnav"><a href="${url(l, '/farms/')}"${cur === 'farms' ? ' class="on"' : ''}>${ICON.home}<span>${T[l].farms}</span></a><a href="${url(l, '/map/')}"${cur === 'map' ? ' class="on"' : ''}>${ICON.map}<span>${T[l].map}</span></a></nav>`;

const video = (src, poster, extra = '') => `<video data-src="${esc(src)}" ${poster ? `poster="${esc(poster)}"` : ''} muted loop playsinline preload="none" ${extra}></video>`;

function card(f, l) {
  const t = T[l];
  const page = hasPage(f);
  const cv = f.card_video || f.videos?.[0];
  const ph = f.card_photos?.length ? f.card_photos : (f.photos || []).slice(0, 3);
  const slides = [];
  if (cv) slides.push(video(cv, f.poster));
  ph.forEach((p) => slides.push(`<img src="${esc(p)}" alt="" loading="lazy" decoding="async">`));
  const wrap = (x) => (page ? `<a class="sl" href="${url(l, `/farm/${f.slug}/`)}" aria-label="${esc(fname(f, l))}">${x}</a>` : `<div class="sl">${x}</div>`);
  const media = slides.length
    ? slides.map(wrap).join('')
    : `<div class="sl soon">${ICON.gem}<span>${t.soon}</span></div>`;
  const a = AREA[f.area]?.[l] || '';
  const g = S.areas?.[f.area]?.google;
  return `<article class="card">
<div class="media"><div class="slides" data-count="${Math.max(slides.length, 1)}">${media}</div>${slides.length > 1 ? `<span class="cnt" aria-hidden="true">1 / ${slides.length}</span>` : ''}</div>
<div class="cbody">
<div class="row"><h3>${esc(fname(f, l))}</h3>${f.vip ? `<span class="vip">${ICON.star}VIP</span>` : ''}</div>
${a ? `<p class="loc">${g ? `<a href="${esc(g)}" target="_blank" rel="noopener">` : ''}📍 ${t.loc}: ${esc(a)}${g ? '</a>' : ''}</p>` : ''}
<div class="foot"><div class="price"><strong>${money(f.price)} ${t.iqd}</strong><span>${t.disc}</span></div>
<a class="wabtn" href="${esc(waLink(f, l))}" target="_blank" rel="noopener">${t.wa}</a></div>
</div></article>`;
}

function header(l, p) {
  const t = T[l];
  return `<header class="hdr"><img class="bg" src="/assets/bg/intro.jpg" alt=""><div class="ov"></div>${langs(l, p)}<h1>${t.title}<small>${t.managed} ${esc(owner(l))}</small></h1></header>`;
}

const pages = []; // [file, html]
const put = (p, html) => pages.push([path.join('dist', p, 'index.html'), html]);

for (const l of LANGS) {
  const t = T[l];
  // intro
  const social = [['facebook', 'fb'], ['instagram', 'ig'], ['tiktok', 'tt']]
    .filter(([k]) => S.social?.[k]).map(([k, c]) => `<a class="${c}" href="${esc(S.social[k])}" target="_blank" rel="noopener" aria-label="${t[c]}">${ICON[c]}</a>`).join('');
  put(url(l, '/'), shell({
    l, path: '/', title: `${t.title} — ${owner(l)}`, desc: `${t.exp}. ${t.feat}`, cls: 'introp',
    body: `<main class="intro"><img class="bg" src="/assets/bg/intro.jpg" alt=""><div class="ov"></div>${langs(l, '/')}
<section class="hero"><div class="orn"><i></i><b></b><i></i></div><h1 class="title">${t.title}</h1>
<p class="owner"><span>${t.managed}</span> <strong class="gold">${esc(owner(l))}</strong></p>
${l !== 'en' && S.owner?.latin ? `<p class="latin gold">${esc(S.owner.latin)}</p>` : ''}
<i class="rule"></i><p class="exp gold">${t.exp}</p><p class="feat">${t.feat}</p><p class="wal">${ICON.wa}<span>${t.book}</span></p></section>
<a class="enter" href="${url(l, '/farms/')}">${t.enter}</a><div class="social">${social}</div></main>`,
  }));
  // list
  put(url(l, '/farms/'), shell({
    l, path: '/farms/', title: `${t.farms} — ${t.title}`, desc: t.pick, cls: 'listp',
    body: `<div class="app">${header(l, '/farms/')}<h2 class="h2">${t.farms}</h2><p class="m sub">${t.pick}</p><div class="list">${farms.map((f) => card(f, l)).join('')}</div>${nav(l, 'farms')}</div>`,
  }));
  // map
  const areas = Object.keys(AREA).map((k) => {
    const list = farms.filter((f) => f.area === k);
    if (!list.length) return '';
    const g = S.areas?.[k]?.google, w = S.areas?.[k]?.waze, nm = AREA[k][l];
    return `<section class="acard"><h2>${nm}</h2><p class="m">${t.n(list.length)}: ${list.map((f) => esc(fname(f, l))).join(' · ')}</p>
${g ? `<a class="b dark" href="${esc(g)}" target="_blank" rel="noopener">${t.openG(nm)}</a>` : ''}${w ? `<a class="b waze" href="${esc(w)}" target="_blank" rel="noopener">${t.openW(nm)}</a>` : ''}</section>`;
  }).join('');
  put(url(l, '/map/'), shell({
    l, path: '/map/', title: `${t.map} — ${t.title}`, desc: t.mapSub, cls: 'listp',
    body: `<div class="app">${header(l, '/map/')}<h2 class="h2">${t.map}</h2><p class="m sub">${t.mapSub}</p><div class="alist">${areas}</div>${nav(l, 'map')}</div>`,
  }));
  // farm pages
  for (const f of farms.filter(hasPage)) {
    const media = [...(f.videos || []).map((v) => `<section class="slide">${video(v, f.poster)}</section>`),
      ...(f.photos || []).map((p) => `<section class="slide"><img src="${esc(p)}" alt="" loading="lazy" decoding="async"></section>`)];
    const hasVideo = (f.videos || []).length > 0;
    put(url(l, `/farm/${f.slug}/`), shell({
      l, path: `/farm/${f.slug}/`, title: `${fname(f, l)} — ${money(f.price)} ${t.iqd}`, desc: `${AREA[f.area]?.[l] || ''} · ${t.exp}`,
      image: f.og_image || f.photos?.[0] || f.poster, cls: 'farmp',
      body: `<div class="app fp" data-count="${media.length}" data-unmute="${esc(t.unmute)}" data-mute="${esc(t.mute)}">
<a class="circ back" href="${url(l, '/farms/')}" aria-label="${t.back}">${ICON.back}</a>
${hasVideo ? `<button class="circ mute" type="button" aria-label="${t.unmute}" aria-pressed="true">${ICON.vol}</button>` : ''}
<span class="count" aria-live="polite">1 / ${media.length}</span>
<div class="feed">${media.join('')}</div>
<p class="hint">${t.swipe}</p>
<footer class="info"><div><h1>${esc(fname(f, l))}${f.vip ? `<span class="vip">${ICON.star}VIP</span>` : ''}</h1><p>${money(f.price)} ${t.iqd}</p></div>
<a class="wabtn big" href="${esc(waLink(f, l))}" target="_blank" rel="noopener">${ICON.wa}<span>${t.wa}</span></a></footer></div>`,
    }));
  }
}

// write
fs.rmSync('dist', { recursive: true, force: true });
fs.cpSync('assets', 'dist/assets', { recursive: true });
for (const [file, html] of pages) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, html); }
fs.writeFileSync('dist/_headers', '/assets/*\n  Cache-Control: public, max-age=3600\n');
fs.copyFileSync('robots.txt', 'dist/robots.txt');
if (SITE) {
  const urls = pages.map(([f]) => f.replace(/^dist/, '').replace(/index\.html$/, '').replace(/\\/g, '/'));
  fs.writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.appendFileSync('dist/robots.txt', `Sitemap: ${SITE}/sitemap.xml\n`);
}
console.log(`Built ${pages.length} pages, ${farms.length} farms.${SITE ? '' : ' (site_url is empty: link previews need it)'}`);
