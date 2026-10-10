'use strict';

// Eine Buchseite enthält immer den gesamten sichtbaren Inhalt.
// Lange Leistungskapitel sind bewusst in Kapitelauftakt und Angebotsseite unterteilt.
const pages = [
  {id:'start',chapter:'start',title:'Willkommen'},
  {id:'leistungen',chapter:'leistungen',title:'Leistungen'},
  {id:'vermittlung',chapter:'vermittlung',title:'Vermittlung'},
  {id:'vermittlung-angebot',chapter:'vermittlung',title:'Vermittlung · Leistungen'},
  {id:'verwaltung',chapter:'verwaltung',title:'Immobilienservice & Verwaltungsunterstützung'},
  {id:'verwaltung-angebot',chapter:'verwaltung',title:'Immobilienservice & Verwaltungsunterstützung · Leistungen'},
  {id:'projekte',chapter:'projekte',title:'Projekte'},
  {id:'projekte-angebot',chapter:'projekte',title:'Projekte · Leistungen'},
  {id:'ueber',chapter:'ueber',title:'Über mich'},
  {id:'ueber-weg',chapter:'ueber',title:'Über mich · Werdegang'},
  {id:'kontakt',chapter:'kontakt',title:'Kontakt'}
];
const currentPage = document.getElementById('book-current');
const leaf = document.getElementById('book-turn');
const leafFront = document.getElementById('leaf-front');
const pageFold = document.getElementById('page-fold');
const revealShade = document.getElementById('page-reveal-shade');
const castShadow = document.getElementById('page-cast-shadow');
const corner = document.getElementById('page-corner');
const book = document.getElementById('book');
const bookStage = document.querySelector('.book-stage');
const leftPage = document.getElementById('book-left');
const nextButton = document.getElementById('next');
const prevButton = document.getElementById('prev');
const chapterName = document.getElementById('chapter-name');
const pageNumber = document.getElementById('page-number');
const navLinks = [...document.querySelectorAll('.chapter-nav [data-chapter]')];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let current = Math.max(0,pages.findIndex(p=>p.id===decodeURIComponent(location.hash.slice(1))));
let animating = false;
let pending = null;
let gestureStart = null;
let activeAnimations = [];
const A='assets/';
function image(name,alt){ return `<img src="${A}${name}.jpg" alt="${alt}" draggable="false">`; }
function navAction(id,text,klass='simple-link'){return `<a href="#${id}" data-chapter="${id}" class="${klass}">${text} <span aria-hidden="true">↗</span></a>`;}
function page(content,index,extra='') {
  const pageNum = index+1;
  return `<article class="page ${extra}" aria-label="Buchseite ${pageNum} von ${pages.length}"><div class="page-body">${content}</div><div class="folio"><span>MUHR IMMOBILIEN <b>·</b> PLANEN · KOORDINIEREN · UMSETZEN</span><b>${String(pageNum).padStart(2,'0')}</b></div></article>`;
}
const serviceDetail = {
  vermittlung:{kicker:'01 / IMMOBILIENVERMITTLUNG · (Coming Soon!)',title:'Immobilien-<br>vermittlung',hand:'Mit Gefühl und Verstand.',lead:'Die Immobilienvermittlung ist in Vorbereitung und wird derzeit noch nicht angeboten.',features:['Verkauf von Immobilien','Vermietung von Wohn- und Gewerbeimmobilien','Marktgerechte Bewertung','Zielgerichtete Vermarktung','Persönliche Begleitung bis zum Abschluss'],file:'wohnen',alt:'Heller Wohnraum mit beigem Sofa und Pflanzen',photoTitle:'Räume für<br>neue Geschichten.'},
  verwaltung:{kicker:'02 / IMMOBILIENSERVICE & VERWALTUNGSUNTERSTÜTZUNG',title:'Immobilienservice &<br>Verwaltungs&shy;unterstützung',hand:'Werte erhalten.',lead:'Gute Verwaltung bedeutet, sich zuverlässig um Details zu kümmern – und dabei den Menschen und die Immobilie im Blick zu behalten.',features:['Unterstützung bei der Verwaltung und Bewirtschaftung von Wohnimmobilien','Transparente Abrechnung','Zuverlässige Betreuung von Eigentümern und Mietern','Werterhalt Ihrer Immobilie','Strukturierte und nachvollziehbare Prozesse'],file:'villa',alt:'Gepflegtes weißes Wohnhaus im Garten',photoTitle:'Mit Weitblick<br>verwalten.'},
  projekte:{kicker:'03 / IMMOBILIEN-PROJEKTMANAGEMENT',title:'Immobilien-<br>projektmanagement',hand:'Ideen werden Wirklichkeit.',lead:'Ob Sanierung oder Modernisierung: Ich behalte Termine, Abläufe und Beteiligte im Blick – von der ersten Idee bis zur erfolgreichen Umsetzung.',features:['Planung und Koordination','Begleitung von Sanierungs- und Modernisierungsprojekten','Schnittstellenmanagement mit Handwerkern, Behörden und Dienstleistern','Wirtschaftliche und nachhaltige Umsetzung','Persönliche Projektbegleitung'],file:'planung',alt:'Architekturpläne und Stift auf einem Schreibtisch',photoTitle:'Ein guter Plan<br>verbindet alles.'}
};
function serviceIntro(key){
 const d=serviceDetail[key];
 return `<div class="service-intro"><div class="service-intro-image">${image(d.file,d.alt)}<div class="service-quote">${d.photoTitle}</div></div><div class="service-intro-copy ${key==='verwaltung'?'service-intro-admin':''}"><span class="eyebrow">${d.kicker}</span><h2 class="chapter-heading">${d.title}</h2><p class="hand-title">${d.hand}</p><span class="rule"></span><p class="lead">${d.lead}</p>${navAction(key+'-angebot',key==='vermittlung'?'Geplante Leistungen ansehen':'Unsere Leistungen im Überblick','btn')}</div></div>`;
}
function serviceOffer(key){
 const d=serviceDetail[key];
 return `<div class="service-offer"><div class="offer-top"><span class="eyebrow">${d.kicker} · IM ÜBERBLICK</span><h2 class="chapter-heading">${key==='vermittlung'?'Für später<br><span class="hand-title">vorgesehen.</span>':'Das kann ich<br><span class="hand-title">für Sie tun.</span>'}</h2><p class="copy">${key==='vermittlung'?'Diese Leistungen sind geplant, aber derzeit noch nicht verfügbar.':key==='verwaltung'?'Klar organisiert. Transparent betreut.':'Sorgfältig geplant. Zuverlässig umgesetzt.'}</p></div><ul class="offer-list">${d.features.map((f,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><strong>${f}</strong></li>`).join('')}</ul><div class="offer-bottom">${key==='vermittlung'?'<span class="offer-unavailable">(Coming Soon!) – derzeit keine Beauftragung möglich.</span>':navAction('kontakt','Persönlich beraten lassen','btn')}<span>REGIONAL · PERSÖNLICH · VERLÄSSLICH</span></div></div>`;
}
function markup(index){
 const id=pages[index].id;
 if(id==='start') return page(`<div class="single-hero"><div class="single-hero-image">${image('haus','Einladendes weißes Haus mit Garten und Hortensien')}<div class="hero-brand-seal"><img src="assets/muhr-logo.webp" alt="Original-Logo MUHR Immobilien" loading="eager"></div><span class="image-caption">REGIONAL · PERSÖNLICH · VERLÄSSLICH</span></div><div class="single-hero-copy"><span class="eyebrow">MUHR IMMOBILIEN · HERZLICH WILLKOMMEN</span><h1 class="serif-title">Mehr als<br>Immobilien.</h1><div class="hand-title">Zuhause weiterdenken.</div><span class="rule"></span><p class="copy">Immobilien sind mehr als Objekte. Sie sind Lebensräume. Mit Erfahrung und einem klaren Blick fürs Wesentliche begleite ich Sie von der ersten Idee bis zur Umsetzung.</p>${navAction('leistungen','Leistungen entdecken','btn')}</div></div>`,index);
 if(id==='leistungen') return page(`<div class="single-services"><div class="service-head"><span class="eyebrow">WAS ICH FÜR SIE TUN KANN</span><h2 class="chapter-heading">Eine Ansprechpartnerin.<br><span class="hand-title">Viele Möglichkeiten.</span></h2><p class="copy">Persönliche Unterstützung rund um Ihre Immobilie – die Vermittlung folgt später.</p></div><div class="service-tiles"><a class="service-tile" href="#vermittlung" data-chapter="vermittlung"><div class="tile-photo">${image('wohnen','Heller Wohnraum')}</div><span>01 / IMMOBILIEN</span><h3>Vermittlung <small class="coming-soon-inline">(Coming Soon!)</small></h3><p>Derzeit noch nicht im Angebot.</p><b aria-hidden="true">↗</b></a><a class="service-tile service-tile-admin" href="#verwaltung" data-chapter="verwaltung"><div class="tile-photo">${image('villa','Gepflegtes Haus')}</div><span>02 / IMMOBILIENSERVICE</span><h3>Immobilienservice &amp;<br>Verwaltungs&shy;unterstützung</h3><p>Transparent und persönlich betreut.</p><b aria-hidden="true">↗</b></a><a class="service-tile" href="#projekte" data-chapter="projekte"><div class="tile-photo">${image('planung','Architekturplan')}</div><span>03 / IMMOBILIEN</span><h3>Projektmanagement</h3><p>Planen, koordinieren, umsetzen.</p><b aria-hidden="true">↗</b></a></div></div>`,index);
 for(const key of Object.keys(serviceDetail)){
  if(id===key) return page(serviceIntro(key),index);
  if(id===key+'-angebot') return page(serviceOffer(key),index);
 }
 if(id==='ueber') return page(`<div class="single-about about-redesign about-biography"><div class="single-about-picture about-portrait"><img src="assets/Foto.jpeg" alt="Porträt von Jennifer Muhr, Inhaberin von MUHR Immobilien" draggable="false"><span>Mit Herz und Weitblick.</span></div><div class="single-about-copy about-story about-story-bio"><span class="eyebrow">ÜBER MICH · JENNIFER MUHR</span><h2 class="chapter-heading">Hallo, ich bin<br><em>Jennifer Muhr.</em></h2><span class="rule" aria-hidden="true"></span><p class="copy">Ich wurde 1984 in Stolberg im Rheinland geboren und bin meiner Heimat bis heute eng verbunden.</p><p class="copy">Nach meinem Abitur im Jahr 2003 studierte ich bis 2008 Germanistik, Geschichte und Geografie an den Universitäten Hamburg und Köln. Im Anschluss entschied ich mich, meine Leidenschaft für Immobilien zum Beruf zu machen, und absolvierte von 2008 bis 2010 meine Ausbildung zur Immobilienkauffrau.</p>${navAction('ueber-weg','Mehr über meinen Weg','btn')}</div></div>`,index);
 if(id==='ueber-weg') return page(`<div class="about-career"><div class="about-career-heading"><span class="eyebrow">ÜBER MICH · MEIN WERDEGANG</span><h2 class="chapter-heading">Mein Weg.<br><em>Meine Erfahrung.</em></h2><span class="rule" aria-hidden="true"></span></div><div class="career-entries"><div class="career-entry"><span class="career-year">2010 – 2023</span><p>Von 2010 bis 2023 war ich als angestellte Immobilienkauffrau tätig und konnte in dieser Zeit umfassende praktische Erfahrungen sammeln.</p></div><div class="career-entry"><span class="career-year">Seit 2024</span><p>Seit 2024 gehe ich mit MUHR Immobilien meinen eigenen Weg in die Selbstständigkeit.</p></div></div><div class="career-focus"><h3>Mein fachlicher Schwerpunkt</h3><p>Mein fachlicher Schwerpunkt liegt in der Mietverwaltung, der Begleitung von Modernisierungs- und Sanierungsvorhaben, der Immobilienvermittlung sowie im Projektmanagement. Dabei verbinde ich langjährige Erfahrung mit einem geschulten Blick für Details, wirtschaftlichem Denken und kreativen Lösungsansätzen.</p></div><div class="career-foot"><p class="career-caveat">Immobilienvermittlung: <strong>(Coming Soon!)</strong> – derzeit noch nicht im Angebot.</p>${navAction('kontakt','Kontakt aufnehmen','btn')}</div></div>`,index);
 if(id==='kontakt') return page(`<div class="single-contact"><div class="single-contact-copy"><span class="eyebrow">LASSEN SIE UNS INS GESPRÄCH KOMMEN</span><h2 class="chapter-heading">Lassen Sie uns<br>sprechen.</h2><div class="hand-title">Ganz persönlich.</div><span class="rule"></span><p class="copy">Sie haben Fragen, Pläne oder eine konkrete Idee? Ich freue mich darauf, von Ihnen zu hören.</p><div class="contact-options"><a href="tel:+491632513195"><b aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.91.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.25a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92Z"/></svg></b>0163-2513195</a><a href="mailto:info@muhr-immobilien.de"><b aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg></b>info@muhr-immobilien.de</a><a href="https://www.google.de/maps/dir//Hamicher+Weg+31,+52224+Stolberg+(Rheinland)-Gressenich/@50.7762467,6.2991409,17z/data=!4m18!1m8!3m7!1s0x47bf616a6fd9b60b:0xc52910fc8f63899b!2sHamicher+Weg+31,+52224+Stolberg+(Rheinland)-Gressenich!3b1!8m2!3d50.7762468!4d6.3040118!16s%2Fg%2F11c5mdpmn0!4m8!1m0!1m5!1m1!1s0x47bf616a6fd9b60b:0xc52910fc8f63899b!2m2!1d6.3040118!2d50.7762468!3e0?entry=ttu&g_ep=EgoyMDI2MTAwNy4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer"><b aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></b>Hier finden Sie mich</a><a href="https://www.instagram.com/muhr.immobilien/" target="_blank" rel="noopener noreferrer"><b aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></b>@muhr.immobilien</a></div><a class="btn" href="mailto:info@muhr-immobilien.de?subject=Anfrage%20%C3%BCber%20die%20Webseite">E-Mail schreiben <span aria-hidden="true">↗</span></a></div><div class="single-contact-picture">${image('hortensien','Blaue Hortensien in einer Vase')}</div></div>`,index);
 return page('',index);
}
function updatePaperLayers(index) {
  // Rechter Stapel: 10 Blätter am Anfang, null auf der letzten Buchseite.
  const remaining = Math.max(0, pages.length - index - 1);
  const stackWidth = remaining === 0 ? 0 :
    Math.round(5 + 13 * remaining / Math.max(1, pages.length - 1));
  book.classList.toggle('has-right-pages', remaining > 0);
  book.style.setProperty('--remaining-stack-width', `${stackWidth}px`);
  // Die erste Seite ist geschlossen und zentriert. Erst beim ersten
  // Umblättern öffnet sich das links sichtbare beige Rückseitenblatt.
  bookStage.classList.toggle('is-cover', index === 0);
  leftPage.dataset.turned = String(index);
}
function paint(index){
  book.dataset.chapter=pages[index].chapter;
  currentPage.innerHTML=markup(index);
  updatePaperLayers(index);
}
function syncControls(){
 chapterName.textContent=pages[current].title;
 pageNumber.textContent=`${String(current+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;
 prevButton.disabled=current===0;nextButton.disabled=current===pages.length-1;corner.disabled=current===pages.length-1;
 navLinks.forEach(link=>{
  if(link.dataset.chapter===pages[current].chapter)link.setAttribute('aria-current','page');
  else link.removeAttribute('aria-current');
 });
}
function finish(target,changeHistory){
 current=target;paint(current);leaf.hidden=true;leaf.className='turn-leaf';leafFront.innerHTML='';pageFold.hidden=true;book.classList.remove('is-turning');animating=false;
 activeAnimations.forEach(a=>a.cancel());activeAnimations=[];revealShade.style.opacity='0';castShadow.style.opacity='0';syncControls();
 if(changeHistory && location.hash!==`#${pages[current].id}`) history.pushState({page:pages[current].id},'',`#${pages[current].id}`);
 if(pending!==null){const next=pending;pending=null;if(next.index!==current)goTo(next.index,next.changeHistory);}
}
async function goTo(target,changeHistory=true){
 if(!Number.isInteger(target)||target<0||target>=pages.length)return;
 if(animating){pending={index:target,changeHistory};return;}
 if(target===current)return;
 if(prefersReducedMotion.matches){finish(target,changeHistory);return;}
 const forward=target>current;
 animating=true;

 // Die erste Seite wird zuerst aufgeschlagen. Die seitliche Bewegung
 // ist fertig, BEVOR die eigentliche Seite umblättert – so werden Bilder
 // und Überschriften nicht während der Bewegung gequetscht.
 if(current===0 && target>0){
   bookStage.classList.remove('is-cover');
   await new Promise(resolve=>setTimeout(resolve,window.innerWidth<=650?220:870));
 }

 // Das alte Blatt bleibt als Overlay stehen; die neue Seite liegt von
 // Anfang an unverzerrt dahinter. Nur die Sichtbarkeit der Vorderseite
 // und eine feine beige Falzkante bewegen sich.
 leafFront.innerHTML=markup(current);
 leaf.hidden=false;
 leaf.className=`turn-leaf ${forward?'turn-forward':'turn-backward'}`;
 pageFold.hidden=false;
 book.classList.add('is-turning');
 book.dataset.chapter=pages[target].chapter;
 currentPage.innerHTML=markup(target);
 if(target!==0){
   updatePaperLayers(target);
 }else{
   // Beim Zurückblättern auf das Deckblatt bleibt das Buch offen,
   // bis die Animation abgeschlossen ist. Danach schließt es sich.
   book.classList.add('has-right-pages');
   book.style.setProperty('--remaining-stack-width','18px');
 }

 const duration=940;
 const easing='cubic-bezier(.55,.06,.17,1)';
 const frontFrames=forward?[
   {clipPath:'inset(0 0% 0 0%)',opacity:1,offset:0},
   {clipPath:'inset(0 9% 0 0%)',opacity:1,offset:.15},
   {clipPath:'inset(0 51% 0 0%)',opacity:1,offset:.54},
   {clipPath:'inset(0 91% 0 0%)',opacity:1,offset:.89},
   {clipPath:'inset(0 100% 0 0%)',opacity:1,offset:1}
 ]:[
   {clipPath:'inset(0 0% 0 0%)',opacity:1,offset:0},
   {clipPath:'inset(0 0% 0 9%)',opacity:1,offset:.15},
   {clipPath:'inset(0 0% 0 51%)',opacity:1,offset:.54},
   {clipPath:'inset(0 0% 0 91%)',opacity:1,offset:.89},
   {clipPath:'inset(0 0% 0 100%)',opacity:1,offset:1}
 ];
 const foldFrames=forward?[
   {left:'calc(100% - 28px)',opacity:0,offset:0},
   {left:'calc(91% - 28px)',opacity:.9,offset:.15},
   {left:'calc(49% - 28px)',opacity:.93,offset:.54},
   {left:'calc(9% - 28px)',opacity:.7,offset:.89},
   {left:'-27px',opacity:0,offset:1}
 ]:[
   {left:'-3px',opacity:0,offset:0},
   {left:'calc(9% - 3px)',opacity:.82,offset:.15},
   {left:'calc(51% - 3px)',opacity:.92,offset:.54},
   {left:'calc(91% - 3px)',opacity:.74,offset:.89},
   {left:'calc(100% - 3px)',opacity:0,offset:1}
 ];
 const turn=leaf.animate(frontFrames,{duration,fill:'both',easing});
 const fold=pageFold.animate(foldFrames,{duration,fill:'both',easing});
 const underShade=revealShade.animate([
   {opacity:0,offset:0},{opacity:.20,offset:.38},
   {opacity:.30,offset:.67},{opacity:0,offset:1}
 ],{duration,fill:'both',easing:'ease-in-out'});
 const cast=castShadow.animate([
   {opacity:0,offset:0},{opacity:.11,offset:.43},
   {opacity:.16,offset:.72},{opacity:0,offset:1}
 ],{duration,fill:'both',easing:'ease-in-out'});
 activeAnimations=[turn,fold,underShade,cast];
 try{await turn.finished;}catch(_){/* Animation wurde abgebrochen. */}
 finish(target,changeHistory);
}
function indexFromHash(){const id=decodeURIComponent(location.hash.slice(1));const index=pages.findIndex(p=>p.id===id);return index<0?0:index;}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[data-chapter]');
 if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
 const index=pages.findIndex(p=>p.id===link.dataset.chapter);
 if(index<0)return;
 event.preventDefault();goTo(index);
});
prevButton.addEventListener('click',()=>goTo(current-1));
nextButton.addEventListener('click',()=>goTo(current+1));
corner.addEventListener('click',()=>goTo(current+1));
document.addEventListener('keydown',event=>{
 if(event.altKey||event.ctrlKey||event.metaKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 if(event.key==='ArrowRight'){event.preventDefault();goTo(current+1);}
 if(event.key==='ArrowLeft'){event.preventDefault();goTo(current-1);}
});
book.addEventListener('touchstart',event=>{
 if(event.touches.length!==1||animating)return;
 gestureStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
},{passive:true});
book.addEventListener('touchend',event=>{
 if(!gestureStart||event.changedTouches.length!==1)return;
 const dx=event.changedTouches[0].clientX-gestureStart.x;
 const dy=event.changedTouches[0].clientY-gestureStart.y;
 gestureStart=null;
 if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)goTo(current+(dx<0?1:-1));
},{passive:true});
window.addEventListener('popstate',()=>goTo(indexFromHash(),false));
window.addEventListener('hashchange',()=>goTo(indexFromHash(),false));
document.getElementById('year').textContent=new Date().getFullYear();
paint(current);syncControls();
