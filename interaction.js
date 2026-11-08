"use strict";
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const desktop=matchMedia('(min-width: 900px) and (pointer: fine)');
  const format=new Intl.NumberFormat(document.documentElement.lang==='en'?'en-US':'ru-RU',{maximumFractionDigits:1});
  const frames=new Map();let printing=false;
  // Data animation is independent of the spatial GSAP choreography.
  document.querySelectorAll('.proof-number:not(.proof-first .proof-number)').forEach(parent=>{
    if(parent.querySelector('.counter-value'))return;
    const original=parent.firstChild,value=Number(original.textContent.trim());
    if(!Number.isFinite(value))return;
    const node=document.createElement('span');node.className='counter-value';node.textContent=String(value);
    node.setAttribute('aria-hidden','true');parent.setAttribute('aria-label',parent.textContent);parent.setAttribute('role','img');original.replaceWith(node);
  });
  const numbers=[...document.querySelectorAll('.counter-value,.metric-number')].map(node=>({node,value:Number(node.dataset.counter??node.textContent.replace(/\s/g,''))})).filter(item=>Number.isFinite(item.value));
  function settle(){frames.forEach(cancelAnimationFrame);frames.clear();numbers.forEach(({node,value})=>{node.textContent=format.format(value);});}
  function count(item){
    cancelAnimationFrame(frames.get(item.node));
    if(reduced.matches){item.node.textContent=format.format(item.value);frames.delete(item.node);return;}
    const duration=reduced.matches?600:2300,start=performance.now()+120;
    const tick=now=>{
      if(printing||document.hidden){item.node.textContent=format.format(item.value);frames.delete(item.node);return;}
      const p=Math.max(0,Math.min(1,(now-start)/duration));
      item.node.textContent=format.format(Number((item.value*(1-Math.pow(1-p,3))).toFixed(Number.isInteger(item.value)?0:1)));
      if(p<1)frames.set(item.node,requestAnimationFrame(tick));else frames.delete(item.node);
    };
    frames.set(item.node,requestAnimationFrame(tick));
  }
  if('IntersectionObserver' in window){
    const lookup=new Map(numbers.map(item=>[item.node,item]));
    const counterObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
      if(isIntersecting&&!printing){count(lookup.get(target));if(target.dataset.countOnce)counterObserver.unobserve(target);}
    }),{threshold:.25});
    numbers.forEach(({node})=>counterObserver.observe(node));
    const diagramObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
      if(!isIntersecting||printing)return;
      target.classList.remove('diagram-playing');
      requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!printing)target.classList.add('diagram-playing');}));
    }),{threshold:.2});
    document.querySelectorAll('.growth-chart,.oem-diagram,.networks-chart').forEach(node=>diagramObserver.observe(node));
  }else{
    numbers.forEach(count);
    document.querySelectorAll('.growth-chart,.oem-diagram,.networks-chart').forEach(node=>node.classList.add('diagram-playing'));
  }
  addEventListener('beforeprint',()=>{printing=true;settle();});
  addEventListener('afterprint',()=>{printing=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
  reduced.addEventListener('change',settle);

  const english=document.documentElement.lang==='en';
  const track=document.querySelector('.project-grid');
  if(track){
    track.setAttribute('tabindex','0');track.setAttribute('role','region');track.setAttribute('aria-label',english?'Digital projects carousel':'Карусель цифровых проектов');
    let stage=track.closest('.project-drum');
    if(!stage){stage=document.createElement('div');stage.className='project-drum';track.before(stage);stage.append(track);}
    const controls=document.createElement('div');controls.className='drum-controls';
    const makeArrow=(label,previous)=>{const button=document.createElement('button');button.type='button';button.className='drum-arrow';button.setAttribute('aria-label',label);button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${previous?'M14.5 5L7.5 12L14.5 19':'M9.5 5L16.5 12L9.5 19'}"/></svg>`;return button;};
    const previous=makeArrow(english?'Previous project':'Предыдущий проект',true),next=makeArrow(english?'Next project':'Следующий проект',false),status=document.createElement('div');status.className='drum-caption';
    const indexLabel=document.createElement('span'),meta=document.createElement('div'),name=document.createElement('span'),rail=document.createElement('span');
    indexLabel.className='drum-index';name.className='drum-name';rail.className='drum-rail';rail.setAttribute('aria-hidden','true');
    track.querySelectorAll('article').forEach(()=>rail.append(document.createElement('i')));meta.append(name,rail);status.append(indexLabel,meta);
    controls.append(previous,status,next);stage.append(controls);
    const cards=[...track.querySelectorAll('article')];let positions=[],renderFrame,drag,moveAnimation;
    const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
    const index=()=>positions.length?positions.reduce((best,card,i)=>Math.abs(card.center-track.scrollLeft-track.clientWidth/2)<Math.abs(positions[best].center-track.scrollLeft-track.clientWidth/2)?i:best,0):0;
    function render(){
      renderFrame=undefined;const center=track.scrollLeft+track.clientWidth/2,width=Math.max(1,track.clientWidth);
      const active=index();indexLabel.textContent=String(active+1).padStart(2,'0');name.textContent=cards[active]?.querySelector('h3')?.textContent??'';
      status.setAttribute('aria-label',english?`Project ${active+1} of ${cards.length}: ${name.textContent}`:`Проект ${active+1} из ${cards.length}: ${name.textContent}`);
      [...rail.children].forEach((segment,i)=>segment.classList.toggle('active',i===active));
      previous.disabled=active===0;next.disabled=active===cards.length-1;
    }
    function requestRender(){if(renderFrame===undefined)renderFrame=requestAnimationFrame(render);}
    function measure(){const bounds=track.getBoundingClientRect();positions=cards.map(node=>{const rect=node.getBoundingClientRect();return{node,center:rect.left-bounds.left+track.scrollLeft+rect.width/2};});requestRender();}
    function go(i){
      i=clamp(i,0,cards.length-1);if(!positions[i])return;moveAnimation?.kill();
      const left=clamp(positions[i].center-track.clientWidth/2,0,track.scrollWidth-track.clientWidth);
      if(window.gsap&&!reduced.matches)moveAnimation=gsap.to(track,{scrollLeft:left,duration:.6,ease:'power3.out',overwrite:'auto',onUpdate:requestRender});
      else{track.scrollTo({left,behavior:reduced.matches?'auto':'smooth'});requestRender();}
    }
    previous.addEventListener('click',()=>go(index()-1));next.addEventListener('click',()=>go(index()+1));
    track.addEventListener('scroll',requestRender,{passive:true});
    track.addEventListener('pointerdown',event=>{
      // Let the browser own touch scrolling, inertia and scroll snapping.
      // Capturing a touch pointer fights Safari's native swipe cancellation.
      moveAnimation?.kill();
      if(event.pointerType!=='mouse'||event.button!==0)return;
      drag={x:event.clientX,y:event.clientY,left:track.scrollLeft,start:index(),id:event.pointerId,moved:false};
      track.setPointerCapture(event.pointerId);track.classList.add('dragging');
    });
    track.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.moved&&Math.abs(dy)>Math.abs(dx)+6){drag=null;track.classList.remove('dragging');return;}
      if(Math.abs(dx)>6){drag.moved=true;track.setPointerCapture(event.pointerId);track.classList.add('dragging');}
      if(drag.moved)track.scrollLeft=clamp(drag.left-dx,0,track.scrollWidth-track.clientWidth);
    });
    function release(event){
      if(!drag||event.pointerId!==drag.id)return;const state=drag;drag=null;track.classList.remove('dragging');
      if(track.hasPointerCapture(event.pointerId))track.releasePointerCapture(event.pointerId);
      if(state.moved&&event.type!=='pointercancel'){
        const dx=event.clientX-state.x;
        go(clamp(Math.abs(dx)>40?state.start+(dx<0?1:-1):index(),state.start-1,state.start+1));
      }else if(state.moved)go(index());
    }
    track.addEventListener('lostpointercapture',()=>{drag=null;track.classList.remove('dragging');});
    track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);
    track.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();
      go(event.key==='Home'?0:event.key==='End'?cards.length-1:index()+(event.key==='ArrowRight'?1:-1));
    });
    addEventListener('resize',measure,{passive:true});document.fonts?.ready.then(measure);
    reduced.addEventListener('change',()=>{moveAnimation?.kill();requestRender();});measure();
    addEventListener('beforeprint',()=>moveAnimation?.kill());
    addEventListener('afterprint',measure);
  }

  let layerContext,resizeTimer;
  function layers(){
    layerContext?.revert();layerContext=undefined;
    const shells=[...document.querySelectorAll('.case-shell')];shells.forEach(node=>node.classList.remove('stackable'));
    if(!desktop.matches||reduced.matches)return;
    shells.forEach(node=>{if(node.offsetHeight<innerHeight-150)node.classList.add('stackable');});
    if(window.gsap&&window.ScrollTrigger){
      layerContext=gsap.context(()=>{
        shells.slice(0,-1).forEach((node,index)=>{
          if(!node.classList.contains('stackable'))return;
          gsap.to(node,{scale:.965,y:-10,opacity:.78,ease:'none',scrollTrigger:{trigger:shells[index+1],start:'top 78%',end:'top 92px',scrub:true}});
        });
      });
      ScrollTrigger.refresh();
    }
  }
  const scheduleLayers=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(layers,150);};
  addEventListener('resize',scheduleLayers,{passive:true});
  document.fonts?.ready.then(layers);desktop.addEventListener('change',scheduleLayers);reduced.addEventListener('change',scheduleLayers);
  layers();
})();
