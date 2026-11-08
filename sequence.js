"use strict";
(() => {
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(min-width: 900px) and (pointer: fine)');
  const $=(selector,within=document)=>within.querySelector(selector);
  const $$=(selector,within=document)=>[...within.querySelectorAll(selector)];
  // Fit the complete sticky introduction, then center its measured height.
  const experiencePanel=$('#experience .sticky-heading');
  if(experiencePanel){
    let fitFrame;
    const fitIntroduction=()=>{
      if(!matchMedia('(min-width:721px)').matches){
        experiencePanel.style.removeProperty('--intro-fit');
        experiencePanel.style.removeProperty('--intro-top');
        return;
      }
      const viewport=window.innerHeight,available=Math.max(160,viewport-48);
      let fit=1;
      experiencePanel.style.setProperty('--intro-fit','1');
      for(let step=0;step<5&&experiencePanel.offsetHeight>available;step++){
        fit*=available/experiencePanel.offsetHeight*.98;
        experiencePanel.style.setProperty('--intro-fit',String(fit));
      }
      experiencePanel.style.setProperty('--intro-top',`${Math.max(24,(viewport-experiencePanel.offsetHeight)/2)}px`);
    };
    const scheduleFit=()=>{cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(fitIntroduction);};
    if('ResizeObserver' in window)new ResizeObserver(scheduleFit).observe(experiencePanel.parentElement);
    addEventListener('resize',scheduleFit,{passive:true});
    document.fonts?.ready.then(scheduleFit);
    scheduleFit();
  }
  const counters=[];
  $$('.proof-number:not(.proof-first .proof-number)').forEach(node=>{
    const original=node.firstChild,value=Number(original.textContent.trim());
    if(!Number.isFinite(value))return;
    const span=document.createElement('span');span.className='counter-value';span.textContent=String(value);
    span.setAttribute('aria-hidden','true');node.setAttribute('aria-label',node.textContent);node.setAttribute('role','img');
    original.replaceWith(span);counters.push({node:span,value});
  });
  function settleNumbers(){counters.forEach(({node,value})=>{node.textContent=String(value);});}
  const headings=$$('.section-heading h2,.digital-heading h2,.contact-section h2');
  headings.filter(heading=>heading.id!=="experience-title").forEach(heading=>{
    // BR boundaries need a space; do not merge two Russian words.
    const clone=heading.cloneNode(true);$$('br',clone).forEach(br=>br.replaceWith(' '));
    const words=clone.textContent.trim().split(/\s+/);heading.setAttribute('aria-label',words.join(' '));heading.textContent='';
    const accentWords=(heading.dataset.accentPhrase||'').trim().split(/\s+/).filter(Boolean);
    const accentStart=accentWords.length?words.findIndex((_,index)=>accentWords.every((word,offset)=>words[index+offset]===word)):-1;
    words.forEach((word,index)=>{
      const mask=document.createElement('span'),text=document.createElement('span');
      const accented=(heading.hasAttribute('data-accent-from')&&index>=Number(heading.dataset.accentFrom))||(accentStart>=0&&index>=accentStart&&index<accentStart+accentWords.length);
      mask.className='word-mask'+(accented?' accent-word':'');mask.setAttribute('aria-hidden','true');text.className='word-motion';text.textContent=word;mask.append(text);heading.append(mask);
      if(index<words.length-1)heading.append(document.createTextNode(' '));
    });
  });
  $$('.section-heading .eyebrow,.digital-heading .eyebrow').forEach(node=>{node.textContent=node.textContent.replace(/^0\d\s*\/\s*/,'');});
  $$('#cases .case').forEach(card=>{
    const shell=document.createElement('div');shell.className='case-shell';
    if(card.classList.contains('case-featured')||card.classList.contains('case-dark'))shell.classList.add('case-wide');
    card.before(shell);shell.append(card);
  });
  function addDecoration(parent,className){if(!parent)return null;const existing=parent.querySelector('.'+className);if(existing)return existing;const node=document.createElement('i');node.className=className;node.setAttribute('aria-hidden','true');parent.prepend(node);return node;}
  addDecoration($('.timeline'),'timeline-fill');
  addDecoration($('.timeline'),'timeline-cable-tip');
  $$('.story-steps').forEach(steps=>{addDecoration(steps,'story-rail-fill');addDecoration(steps,'story-cable-tip');});
  addDecoration($('.contract-path'),'contract-line');
  addDecoration($('.deal-flow'),'deal-track');
  addDecoration($('.digital-section'),'digital-plane');
  if(!window.gsap||!window.ScrollTrigger)return;
  const {gsap,ScrollTrigger}=window;gsap.registerPlugin(ScrollTrigger);
  const scenes=new Map();let intro,returnToolCleanup=()=>{};
  const media=gsap.matchMedia();
  function scene(target){
    const tl=gsap.timeline({paused:true,defaults:{duration:.75,ease:'power3.out'}});
    if(target)scenes.set(target,tl);return tl;
  }
  media.add('(prefers-reduced-motion: no-preference)',()=>{
    root.classList.add('motion-v3');
    if(!window.resumeLanguageNavigation){
      intro=gsap.timeline({defaults:{duration:.95,ease:'power3.out'}});
      intro.from('.topbar',{autoAlpha:0,duration:.6,ease:'sine.out'},0)
        .from('.hero .eyebrow',{y:20,autoAlpha:0},.25)
        .from('.name-word',{yPercent:115,rotation:2,stagger:.1,duration:1.1},.3)
        .from('.hero-lead,.hero-description',{y:22,autoAlpha:0,stagger:.13},.6)
        .from('.hero-actions',{autoAlpha:0,duration:.7},.9)
        .from('.sectors>.sector-item',{autoAlpha:0,stagger:.07},1.05)
        .from('.hero-bottom',{y:12,autoAlpha:0},1.05);
    }
    gsap.to('.reading-progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
    headings.filter(heading=>heading.id!=="experience-title").forEach(heading=>{
      const parent=heading.closest('.section-heading,.digital-heading,.contact-section');
      scene(parent).from($$('.word-motion',heading),{yPercent:112,rotation:2,stagger:.07,duration:1.1},0)
        .from($$('.eyebrow',parent),{y:16,autoAlpha:0,duration:.7},0);
    });
    const experienceCopy=$('#experience .sticky-heading');
    if(experienceCopy){
      // Preserve text and semantic highlights while animating every word.
      const walker=document.createTreeWalker(experienceCopy,NodeFilter.SHOW_TEXT);
      const nodes=[];while(walker.nextNode()){if(!walker.currentNode.parentElement.closest('.experience-motion-word'))nodes.push(walker.currentNode);}
      nodes.forEach(node=>{
        const fragment=document.createDocumentFragment();
        node.textContent.split(/(\s+)/).filter(Boolean).forEach(part=>{
          if(/\s/.test(part))fragment.append(document.createTextNode(part));
          else{const word=document.createElement('span');word.className='experience-motion-word';word.textContent=part;fragment.append(word);}
        });
        node.replaceWith(fragment);
      });
      const words=$$('.experience-motion-word',experienceCopy);
      const pulse=gsap.timeline({scrollTrigger:{trigger:'#experience',start:'top 65%',end:'bottom 65%',scrub:true},defaults:{ease:'sine.inOut'}});
      words.forEach((word,index)=>{
        const at=index*.22;
        pulse.fromTo(word,{scale:1,y:0},{scale:1.08,y:-1.5,duration:.55,immediateRender:false},at)
          .to(word,{scale:1,y:0,duration:.55},at+.55);
      });
    }
    $$('#cases .case').forEach(card=>{
      scene(card).from($$('.case-top,h3,.case-company,.big-result',card),{y:32,autoAlpha:0,stagger:.09},0)
        .from($$('p:not(.case-company)',card).filter(node=>node.parentNode===card),{y:22,autoAlpha:0,stagger:.12},.3);
    });
    scene($('.deal-flow')).from('.deal-track',{scaleX:0,duration:1.4},0)
      .from('.deal-flow>div',{y:20,autoAlpha:0,stagger:.3},.1)
      .from('.deal-flow>span',{x:-20,autoAlpha:0},.35);
    scene($('.oem-diagram')).from('.ring-caption',{y:12,autoAlpha:0,stagger:.18,duration:.8},.55);
    scene($('.contract-path')).from('.contract-line',{scaleY:0,duration:1.6,ease:'power2.inOut'},0)
      .from('.contract-path li',{x:45,autoAlpha:0,stagger:.3,duration:1},.15)
      .from('.contract-path li>span',{y:12,autoAlpha:0,stagger:.3,duration:.85,ease:'power3.out'},.15);
    // Mobile cable progress is painted from native scrolling in mobile-cable.js.
    // Its repeating braid is revealed at its original size, never stretched.
    $$('.job').forEach(job=>{
      scene(job).from(job,{x:38,autoAlpha:0},0);
      ScrollTrigger.create({trigger:job,start:'top 70%',end:'bottom 35%',toggleClass:'active-chapter'});
    });
    $$('.job-proof').forEach(proof=>scene(proof).from($$('h4,.job-proof-metrics>div,p,.job-proof-scope',proof),{y:22,autoAlpha:0,stagger:.1,duration:.9},0).from($$('.plan-months i',proof),{scale:.72,autoAlpha:0,transformOrigin:'center',stagger:.045,duration:.65},.2));
    $$('.skill-story').forEach(story=>{
      const heading=$('.story-heading',story),proof=$('.story-proof',story),steps=$('.story-steps',story);
      if(proof&&!heading.contains(proof))heading.append(proof);
      // Cable reveal follows native mobile scroll independently of text entrances.
      const animation=scene(story).from($$('h3,.story-heading>p:not(.story-proof),.promise-phrase',story),{y:24,autoAlpha:0,stagger:.12,duration:.85},0);
      $$('li',steps).forEach((step,index)=>animation.from(step,{x:18,autoAlpha:0,duration:.85},.25+index*.55));
      if(proof)animation.from(proof,{y:18,autoAlpha:0,duration:.9},1.9);
      if(proof?.classList.contains('partner-proof'))animation.from($$('.partner-proof-label,strong,.partner-proof-unit,.partner-proof>p',proof),{y:12,autoAlpha:0,stagger:.1,duration:.7},2);
    });
    $$('.job-metrics').forEach(metrics=>scene(metrics).from($$('b',metrics),{y:14,autoAlpha:0,stagger:.16,duration:.85,ease:'power3.out'},.15));
    const toolWindow=$('.work-tools'),toolTrack=$('.work-apps'),toolStage=$('.tools-scene')||toolWindow;
    toolWindow.classList.add('tools-swiper');
    // Scroll the actual ribbon width, not six viewport-sized pages. No idle gaps.
    const toolTravel=()=>Math.max(0,toolTrack.scrollWidth-toolWindow.clientWidth);
    const toolMotion=gsap.timeline({scrollTrigger:{trigger:toolStage,start:()=>`top ${Math.max(24,Math.round((innerHeight-toolStage.offsetHeight)/2))}px`,end:()=>'+='+Math.max(innerHeight*1.2,toolTravel()*.8),pin:true,scrub:true,invalidateOnRefresh:true}});
    gsap.set(toolTrack,{xPercent:0,x:0});
    toolMotion.fromTo(toolTrack,{x:0},{x:()=>-toolTravel(),duration:1,ease:'none'});
    // Keep the last tools readable before releasing the pinned scene.
    const toolFinishHold=.16;
    toolMotion.to({}, {duration:toolFinishHold});
    const toolTrigger=toolMotion.scrollTrigger;
    const focusTool=event=>{
      const item=event.target.closest('.dock-item');
      if(!item||!toolTravel())return;
      const bounds=item.getBoundingClientRect(),panel=toolWindow.getBoundingClientRect();
      if(bounds.left>=panel.left+16&&bounds.right<=panel.right-16)return;
      const center=bounds.left+bounds.width/2-panel.left-Number(gsap.getProperty(toolTrack,'x')||0);
      const progress=Math.max(0,Math.min(1,(center-toolWindow.clientWidth/2)/toolTravel()));
      scrollTo({top:toolTrigger.start+(toolTrigger.end-toolTrigger.start)*progress/(1+toolFinishHold),behavior:'instant'});
    };
    toolWindow.addEventListener('focusin',focusTool);
    returnToolCleanup=()=>{toolWindow.removeEventListener('focusin',focusTool);toolWindow.classList.remove('tools-swiper');};
    scene($('.digital-copy')).from('.digital-lead,.digital-uses>div,.digital-note',{y:20,autoAlpha:0,stagger:.1,duration:.85},0);
    scene($('.job-distribution')).from('.job-distribution h3,.job-distribution .big-result,.job-distribution>p',{y:24,autoAlpha:0,stagger:.1,duration:.9},0);
    scene($('.oem-role')).from('.oem-role li',{y:22,autoAlpha:0,stagger:.22,duration:.9},0);
    const oemRole=$('.oem-role'),oemNodes=oemRole?$$('.journey-index',oemRole):[];
    if(oemRole&&oemNodes.length){
      gsap.set(oemNodes,{scale:1,backgroundColor:'#174ed9',color:'#ffffff'});
      const nodePulse=gsap.timeline({scrollTrigger:{trigger:oemRole,start:'top 90%',end:'bottom 55%',scrub:true,invalidateOnRefresh:true},defaults:{duration:1,ease:'sine.inOut'}});
      oemNodes.forEach(node=>nodePulse.to(node,{scale:1.3,backgroundColor:'#baff5b',color:'#183b36'}).to(node,{scale:1.3,duration:.8}).to(node,{scale:1,backgroundColor:'#174ed9',color:'#ffffff'}));
    }
    scene($('.distribution-depth')).from('.depth-layer',{opacity:0,stagger:.15,duration:1.2},0).from('.depth-facts',{y:18,autoAlpha:0,duration:1},.15);
    scene($('.distribution-work')).from('.distribution-work',{y:18,autoAlpha:0,duration:.85},0);
    $$('.project-grid article').forEach(project=>{
      scene(project).from($$('h3,p,.project-label',project),{y:26,autoAlpha:0,stagger:.12},0);
    });
    scene($('.education-content')).from('.education-entry',{y:26,autoAlpha:0,stagger:.18,duration:.9},0);
    scene($('.learning-studio')).from('.learning-studio>h3',{y:12,autoAlpha:0,duration:.7},0).from('.learning-directions>div',{y:24,autoAlpha:0,stagger:.18,duration:.9},.15);
    scene($('.contact-links')).from('.contact-links a',{y:45,autoAlpha:0,stagger:.15,duration:1.1},0);
    // A percentage of a long career chapter can exceed the entire viewport.
    // Reveal on entry instead, regardless of the chapter's total height.
    const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
      entries.forEach(({target,isIntersecting})=>{if(isIntersecting){scenes.get(target)?.play();observer.unobserve(target);}});
    },{threshold:0,rootMargin:'0px 0px -48px 0px'}):null;
    for(const [target,animation]of scenes){
      if(observer)observer.observe(target);
      else ScrollTrigger.create({trigger:target,start:'top 88%',once:true,onEnter:()=>animation.play()});
    }
    return()=>{observer?.disconnect();settleNumbers();scenes.clear();returnToolCleanup();$$('.promise-lit').forEach(node=>node.classList.remove('promise-lit'));root.classList.remove('motion-v3');};
  });
  media.add('(min-width: 721px) and (prefers-reduced-motion: no-preference)',()=>{
    // Only desktop aligns promises with list rows. Mobile owns its visible phrases.
    $$('.skill-story').forEach(story=>{
      const stages=$$('.promise-stage',story),steps=$$('.story-steps li',story);
      if(!stages.length||!steps.length)return;
      stages.forEach((stage,index)=>{
        const phrase=$('.promise-phrase',stage);
        const first=Math.min(steps.length-1,Math.max(0,Number(stage.dataset.step)||0));
        const next=stages[index+1];
        const last=next?Math.min(steps.length-1,Math.max(first,Number(next.dataset.step)-1)):steps.length-1;
        if(phrase)ScrollTrigger.create({trigger:steps[first],endTrigger:steps[last],start:'top 75%',end:'bottom 35%',onToggle:self=>phrase.classList.toggle('promise-lit',self.isActive)});
      });
    });
    const main=$('#main'),timeline=$('.timeline'),stories=$$('.story-steps');
    if(!main||!timeline||!stories.length)return;
    const rail=document.createElement('div'),fill=document.createElement('i');
    rail.className='continuous-career-rail';rail.setAttribute('aria-hidden','true');
    const tip=document.createElement('span');tip.className='career-cable-tip';
    const anchors=$$('.timeline .job,.story-steps li').map(node=>{
      const collar=document.createElement('span');collar.className='career-cable-collar';rail.append(collar);return{node,collar};
    });
    const mechanism=document.createElement('div');mechanism.className='career-cable-mechanism';
    mechanism.innerHTML=`<svg viewBox="0 0 150 154" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <defs><linearGradient id="reel-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e1e6e9"/><stop offset=".32" stop-color="#77838c"/><stop offset=".58" stop-color="#edf0f1"/><stop offset="1" stop-color="#56626c"/></linearGradient><radialGradient id="reel-dark"><stop stop-color="#39434a"/><stop offset="1" stop-color="#141b21"/></radialGradient></defs>
      <path d="M40 102L30 133H95L85 102" fill="#49555e"/><path d="M26 134H101" stroke="url(#reel-metal)" stroke-width="7" stroke-linecap="round"/>
      <path d="M110 64V154" stroke="#252d34" stroke-width="8"/><path d="M108 64V154" stroke="#727d84" stroke-width="1"/>
      <circle cx="64" cy="64" r="49" fill="url(#reel-dark)" stroke="url(#reel-metal)" stroke-width="4"/>
      <g fill="none" stroke="#78838b" stroke-width="1" opacity=".65"><circle cx="64" cy="64" r="43"/><circle cx="64" cy="64" r="39"/><circle cx="64" cy="64" r="35"/><circle cx="64" cy="64" r="31"/></g>
      <g class="cable-reel-rotor" stroke="url(#reel-metal)" stroke-width="5" fill="none"><circle cx="64" cy="64" r="46"/><path d="M64 21V48M101 86L78 72M27 86L50 72"/><circle cx="64" cy="64" r="15"/></g>
      <circle cx="64" cy="64" r="8" fill="url(#reel-metal)"/><circle cx="64" cy="64" r="3" fill="#25323c"/>
      <rect x="93" y="108" width="34" height="25" rx="7" fill="url(#reel-metal)"/><g class="cable-guide-rotor"><circle cx="110" cy="120" r="10" fill="#273139" stroke="#c7d0d5" stroke-width="2"/><path d="M110 113V127" stroke="#a6b2ba" stroke-width="2"/></g>
    </svg>`;
    rail.append(fill,tip,mechanism);main.append(rail);
    const rotor=mechanism.querySelector('.cable-reel-rotor'),guide=mechanism.querySelector('.cable-guide-rotor');
    root.classList.add('continuous-career');
    let top=0,bottom=0;
    const measure=()=>{
      const parent=main.getBoundingClientRect(),first=timeline.getBoundingClientRect(),last=stories.at(-1).getBoundingClientRect();
      top=first.top+scrollY;bottom=last.bottom+scrollY;
      rail.style.left=(first.left-parent.left)+'px';rail.style.top=(first.top-parent.top)+'px';rail.style.height=Math.max(1,bottom-top)+'px';
      anchors.forEach(({node,collar})=>{
        const bounds=node.getBoundingClientRect(),offset=node.matches('.job')?40:13;
        collar.style.top=(bounds.top-first.top-Number(gsap.getProperty(node,'y')||0)+offset)+'px';
      });
    };
    measure();ScrollTrigger.addEventListener('refreshInit',measure);
    const motion={progress:0};
    const paint=()=>{fill.style.height=(motion.progress*100)+'%';tip.style.top=(motion.progress*100)+'%';tip.style.opacity=motion.progress>.001?'1':'0';const travel=motion.progress*(bottom-top),angle=travel/46*180/Math.PI;rotor.setAttribute('transform',`rotate(${angle} 64 64)`);guide.setAttribute('transform',`rotate(${-angle*2} 110 120)`);};
    gsap.to(motion,{progress:1,ease:'none',onUpdate:paint,scrollTrigger:{start:()=>top-innerHeight*.65,end:()=>bottom-innerHeight*.65,scrub:true,invalidateOnRefresh:true}});
    paint();
    document.fonts?.ready.then(()=>ScrollTrigger.refresh());
    return()=>{ScrollTrigger.removeEventListener('refreshInit',measure);root.classList.remove('continuous-career');rail.remove();};
  });
  media.add('(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',()=>{
    gsap.to('.hero-atmosphere',{y:230,scale:1.15,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.hero-copy',{y:-55,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.hero-proof',{y:65,rotationY:3,rotationX:-2,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.fromTo('#cases',{y:65},{y:0,ease:'none',scrollTrigger:{trigger:'#cases',start:'top bottom',end:'top 20%',scrub:true}});
    gsap.to('.digital-plane',{y:-170,x:70,ease:'none',scrollTrigger:{trigger:'.digital-section',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.from('.contact-section .wrap',{y:40,transformPerspective:1200,ease:'none',scrollTrigger:{trigger:'.contact-section',start:'top bottom',end:'top 30%',scrub:true}});
  });
  // Pointer moves update one animation frame; geometry is read on entry only.
  $$('#cases .case').forEach(card=>{
    let bounds,frame;
    card.addEventListener('pointerenter',()=>{bounds=card.getBoundingClientRect();});
    addEventListener('scroll',()=>{bounds=null;},{passive:true});
    card.addEventListener('pointermove',event=>{
      if(!fine.matches||reduced.matches||event.pointerType==='touch')return;
      if(!bounds)bounds=card.getBoundingClientRect();
      const x=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width)),y=Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height));
      cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
        card.style.setProperty('--tilt-x',`${(y-.5)*-3}deg`);card.style.setProperty('--tilt-y',`${(x-.5)*4}deg`);
        card.style.setProperty('--pointer-x',`${x*100}%`);card.style.setProperty('--pointer-y',`${y*100}%`);
      });
    });
    card.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});
  });
  const button=$('.hero-actions .button');
  document.addEventListener('focusin',event=>{
    if(event.target===button)intro?.progress(1);
    for(const [target,animation]of scenes){if(target.contains(event.target))animation.progress(1);}
  });
  addEventListener('resume:language-restored',()=>{
    intro?.progress(1);
    for(const [target,animation]of scenes){
      const bounds=target.getBoundingClientRect();
      if(bounds.bottom>0&&bounds.top<innerHeight)animation.progress(1);
    }
  });
  function refresh(){ScrollTrigger.refresh();}
  document.fonts?.ready.then(refresh);
  addEventListener('beforeprint',()=>{intro?.progress(1);scenes.forEach(animation=>animation.progress(1));settleNumbers();});
  addEventListener('afterprint',refresh);
})();
