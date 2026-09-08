'use strict';
(() => {
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const config=window.SITE_CONFIG||{};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 $$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
 // Mobile navigation: native links, Escape, focus restoration, no focus traps on nonmodal navigation.
 $$('.menu-toggle').forEach(toggle=>{
  const nav=document.getElementById(toggle.getAttribute('aria-controls'));
  if(!nav)return;
  const close=(restore=false)=>{nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');if(restore)toggle.focus();};
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
  $$('a',nav).forEach(a=>a.addEventListener('click',()=>close()));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true')close(true);});
  document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target))close();});
  matchMedia('(min-width: 651px)').addEventListener('change',()=>close());
 });
 // Content is visible without JavaScript; effects are enhancement only.
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.1});
  $$('.reveal').forEach(el=>observer.observe(el));
 }
 if(matchMedia('(hover: hover) and (pointer: fine)').matches){
  $$('[data-tilt]').forEach(el=>{
   let frame=0;
   el.addEventListener('pointermove',e=>{if(reduced.matches||document.hidden)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=el.getBoundingClientRect();el.style.setProperty('--tiltX',`${((e.clientX-r.left)/r.width-.5)*5}deg`);el.style.setProperty('--tiltY',`${-((e.clientY-r.top)/r.height-.5)*4}deg`);});});
   el.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);el.style.setProperty('--tiltX','0deg');el.style.setProperty('--tiltY','0deg');});
  });
 }
 // Keyboard-operable range input + direct dragging on comparison.
 const slider=$('#comparison-slider'), comparison=$('.comparison');
 if(slider&&comparison){
  const update=()=>{comparison.style.setProperty('--split',`${slider.value}%`);$('#comparison-value').textContent=`${slider.value}% before`;slider.setAttribute('aria-valuetext',`${slider.value} percent before, ${100-Number(slider.value)} percent after`);};
  slider.addEventListener('input',update);update();
  let drag=false;
  const position=e=>{const r=comparison.getBoundingClientRect();slider.value=Math.round(Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)));update();};
  comparison.style.touchAction='pan-y';
  comparison.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag=true;comparison.setPointerCapture(e.pointerId);position(e);});
  comparison.addEventListener('pointermove',e=>{if(drag)position(e);});
  comparison.addEventListener('pointerup',()=>drag=false);comparison.addEventListener('pointercancel',()=>drag=false);
 }
 // Dialogs have native focus containment and return focus to their invoker.
 $$('dialog').forEach(dialog=>{
  $('.dialog-close',dialog)?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  $$('a',dialog).forEach(a=>a.addEventListener('click',()=>dialog.close()));
 });
 const contactDialog=$('#contact-dialog');
 const unavailable=e=>{e.preventDefault();contactDialog?.showModal();};
 const validEmail=typeof config.email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email);
 const validPhone=typeof config.whatsapp==='string'&&/^[1-9]\d{7,14}$/.test(config.whatsapp);
 $$('[data-email]').forEach(a=>{if(validEmail){a.href=`mailto:${config.email}?subject=${encodeURIComponent('Website project enquiry — WEB DESIGNS')}`;a.setAttribute('aria-label',`Email WEB DESIGNS at ${config.email}`);}else{a.dataset.unconfigured='true';a.addEventListener('click',unavailable);}});
 $$('[data-whatsapp]').forEach(a=>{if(validPhone){a.href=['https:','','wa.me',config.whatsapp].join('/')+'?text='+encodeURIComponent("Hi Web Designs, I'd like to discuss a website project.");a.target='_blank';a.rel='noopener noreferrer';}else{a.dataset.unconfigured='true';a.addEventListener('click',unavailable);}});
 const configNote=$('.contact-config-message');if(configNote&&(!validPhone||!validEmail))configNote.textContent='Preview: business contact details are awaiting configuration. You can prepare a brief below.';
 const form=$('#project-form');
 if(form){
  let submitting=false;
  let requestId=crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let captchaToken='';let widgetId;
  const status=$('#form-status');const submit=$('.form-submit');const notice=$('.form-mode-notice');
  const setStatus=(message,type='')=>{status.textContent=message;status.className=type;};
  if(!config.formEnabled){notice.textContent='Preview mode: enquiry delivery is not connected. Your details stay in your browser. You can validate and download a project brief; nothing will be sent.';}
  if(config.formEnabled&&config.turnstileSiteKey){
   window.onTurnstileReady=()=>{widgetId=window.turnstile.render('#captcha-container',{sitekey:config.turnstileSiteKey,theme:'dark',callback:token=>{captchaToken=token;},'expired-callback':()=>{captchaToken='';},'error-callback':()=>{captchaToken='';setStatus('The security check could not load. Please retry or use email.','error');}});};
   const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileReady&render=explicit';script.async=true;script.defer=true;document.head.append(script);
  }
  const data=()=>Object.fromEntries(new FormData(form).entries());
  const validate=()=>{for(const field of $$('input[required]:not([type=checkbox]),textarea[required]',form)){field.setCustomValidity(field.value.trim().length===0?'Please complete this field.':'');}return form.reportValidity();};
  form.addEventListener('input',e=>{if(e.target.setCustomValidity)e.target.setCustomValidity('');});
  const download=()=>{if(!validate())return;const d=data();const labels={name:'Name',business:'Business',email:'Email',country:'Country',businessType:'Industry',website:'Current website',need:'Service',budget:'Budget',details:'Project details'};const text='WEB DESIGNS — PRIVATE PROJECT BRIEF\nPrepared locally. This brief has not been sent.\n\n'+Object.entries(labels).map(([key,label])=>`${label}: ${d[key]||'Not supplied'}`).join('\n\n');const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='web-designs-project-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);setStatus('Your brief has been downloaded to your device. It has not been sent.','success');};
  $('.download-brief').addEventListener('click',download);
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(submitting||!validate())return;
   if(!config.formEnabled){setStatus('Your brief is ready. Delivery is not connected in this preview. Use “Download my brief instead” to save it privately.','success');return;}
   if(config.turnstileSiteKey&&!captchaToken){setStatus('Please complete the security check before sending.','error');return;}
   submitting=true;submit.disabled=true;submit.textContent='Sending your enquiry…';setStatus('Sending securely…');
   try{
    const response=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestId},body:JSON.stringify({...data(),captchaToken}),signal:AbortSignal.timeout(18000)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.message||'Your enquiry could not be delivered. Please retry or use email.');
    if(result.ok!==true)throw new Error('Delivery could not be confirmed. Please use email.');
    form.reset();requestId=crypto.randomUUID();setStatus('Thank you. Your enquiry has been delivered to WEB DESIGNS. We’ll use your email to continue the conversation.','success');
   }catch(error){setStatus(error.name==='TimeoutError'?'Delivery confirmation timed out. You can retry safely or contact us by email.':error.message,'error');}
   finally{submitting=false;submit.disabled=false;submit.innerHTML='Start My Project <span aria-hidden="true">↗</span>';if(window.turnstile&&widgetId!==undefined)window.turnstile.reset(widgetId);captchaToken='';}
  });
  $$('.industry-button').forEach(button=>button.addEventListener('click',()=>{form.elements.businessType.value=button.dataset.industry;$('#contact').scrollIntoView({behavior:reduced.matches?'instant':'smooth'});form.elements.businessType.focus({preventScroll:true});}));
  const concept=new URLSearchParams(location.search).get('concept');
  const names={'aurora':'AURORA','north-co':'NORTH & CO','noire':'NOIRÉ','vanta':'VANTA','forge':'FORGE','lumen':'LUMEN','casa-verde':'CASA VERDE','atlas':'ATLAS','solace':'SOLACE','monarch':'MONARCH'};
  if(concept&&names[concept]&&!form.elements.details.value)form.elements.details.value=`I like the ${names[concept]} concept direction and would like to discuss a custom website for my business. `;
 }
 // Concept enquiry demonstrations never transmit or store personal information.
 $$('.concept-demo-form').forEach(demo=>demo.addEventListener('submit',e=>{e.preventDefault();const name=demo.elements.demoName,message=demo.elements.demoMessage;name.setCustomValidity(name.value.trim()?'':'Please enter your name.');message.setCustomValidity(message.value.trim().length>=10?'':'Please enter at least 10 characters.');if(!demo.reportValidity())return;$('.demo-status',demo).textContent='Demo validated. Nothing was sent or saved. To discuss a real website, use “Discuss a website like this”.';}));
 $$('.concept-demo-form input,.concept-demo-form textarea').forEach(input=>input.addEventListener('input',()=>input.setCustomValidity('')));
 const galleryDialog=$('.concept-dialog');
 $$('.gallery-open').forEach(button=>button.addEventListener('click',()=>{if(!galleryDialog)return;$('.dialog-title',galleryDialog).textContent=button.dataset.galleryTitle;$('.dialog-description',galleryDialog).textContent=button.dataset.galleryText;galleryDialog.showModal();}));
 let bag=[];
 const showBag=()=>{if(!galleryDialog)return;$('.dialog-title',galleryDialog).textContent='Your demo ritual bag';$('.dialog-description',galleryDialog).textContent=bag.length?bag.map((x,i)=>`${i+1}. ${x}`).join(' · ')+' — This is a local interaction demo, not a real checkout.':'Your demo bag is empty. Explore the ritual collection to add an item.';galleryDialog.showModal();};
 $$('.add-ritual').forEach(button=>button.addEventListener('click',()=>{if(bag.length>=20)return;bag.push(button.dataset.product);$$('[data-cart-count]').forEach(el=>el.textContent=bag.length);button.textContent='Added to demo bag ✓';setTimeout(()=>button.textContent='Add to demo bag +',1600);showBag();}));
 $('.cart-button')?.addEventListener('click',showBag);
 $('[data-property-search]')?.addEventListener('click',()=>{const value=$('#property-style').value;let count=0;$$('.collection-item').forEach(item=>{item.hidden=value!=='all'&&item.dataset.property!==value;if(!item.hidden)count++;});$('#collection-status').textContent=`${count} fictional ${count===1?'residence':'residences'} shown. No real listings.`;$('#collection').scrollIntoView({behavior:reduced.matches?'instant':'smooth'});});
 $$('[data-course]').forEach(button=>button.addEventListener('click',()=>{const course=button.dataset.course;$$('[data-course]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$$('.concept-service').forEach((item,i)=>item.hidden=course!=='all'&&String(i)!==course);}));
 $$('[data-day]').forEach(button=>button.addEventListener('click',()=>{const days={Monday:['07:00','FOUNDATIONS / STRENGTH'],Wednesday:['18:00','SMALL GROUP / CONDITIONING'],Friday:['08:00','MOBILITY / RECOVERY']};const day=button.dataset.day;$$('[data-day]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('.schedule-result>span').textContent=`${day} / ${days[day][0]}`;$('.schedule-result>strong').textContent=days[day][1];}));
})();
