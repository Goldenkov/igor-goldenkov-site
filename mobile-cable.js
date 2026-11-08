"use strict";
(() => {
  const mobile=matchMedia('(max-width: 720px)');
  const rails=[...document.querySelectorAll('.timeline,.story-steps')].map(node=>({
    node,fill:node.querySelector('.timeline-fill,.story-rail-fill'),
    tip:node.querySelector('.timeline-cable-tip,.story-cable-tip')
  })).filter(rail=>rail.fill&&rail.tip);
  const promises=[...document.querySelectorAll('.aligned-story .promise-stage')].map(node=>({
    node,phrase:node.querySelector('.promise-phrase')
  })).filter(stage=>stage.phrase);
  if(!rails.length&&!promises.length)return;
  let cleanup=()=>{};

  function setup(){
    cleanup();
    // Direct scroll progress is also useful with reduced motion. No timed reveal,
    // easing or autonomous movement: the cable stops whenever scrolling stops.
    if(!mobile.matches)return;
    let active=true,frame=null,dirty=true;
    const segments=rails.map(rail=>({...rail,top:0,height:0,lastLength:-1}));
    const stages=promises.map(stage=>({...stage,top:0,height:0}));
    let viewportWidth=innerWidth,viewportHeight=innerHeight;
    let pixelRatio=Math.max(1,window.devicePixelRatio||1);
    function paint(){
      frame=null;
      if(!active)return;
      if(dirty){
        segments.forEach(rail=>{
          rail.top=rail.node.getBoundingClientRect().top+scrollY;
          rail.height=rail.node.offsetHeight;
        });
        stages.forEach(stage=>{
          stage.top=stage.node.getBoundingClientRect().top+scrollY;
          stage.height=stage.node.offsetHeight;
        });
        dirty=false;
      }
      const anchor=scrollY+viewportHeight*.65;
      segments.forEach(rail=>{
        const distance=Math.max(0,Math.min(rail.height,anchor-rail.top));
        const length=Math.min(rail.height,Math.round(distance*pixelRatio)/pixelRatio);
        if(length===rail.lastLength)return;
        rail.lastLength=length;
        // Every segment uses the same native scroll clock in both directions.
        rail.fill.style.height=length+'px';
        rail.tip.style.top=length+'px';
        rail.tip.style.opacity=length>0?'1':'0';
      });
      // On phones the promises precede the list, rather than sharing its rows.
      // Light each visible phrase itself; waiting for the list misses the reader.
      stages.forEach(stage=>stage.phrase.classList.toggle('promise-lit',
        stage.top<scrollY+viewportHeight*.82&&stage.top+stage.height>scrollY));
    }
    function schedule(){if(active&&frame===null)frame=requestAnimationFrame(paint);}
    function layout(){if(!active)return;dirty=true;schedule();}
    function resize(){
      // Safari's collapsing toolbar changes height during a gesture, not layout.
      // Keep the scroll anchor stable; remeasure on rotation or a substantial resize.
      if(Math.abs(innerWidth-viewportWidth)>1||Math.abs(innerHeight-viewportHeight)>viewportHeight*.25){
        viewportWidth=innerWidth;viewportHeight=innerHeight;
        pixelRatio=Math.max(1,window.devicePixelRatio||1);layout();
      }
    }
    const observer='ResizeObserver' in window?new ResizeObserver(layout):null;
    if(observer){
      segments.forEach(rail=>observer.observe(rail.node));
      stages.forEach(stage=>observer.observe(stage.node));
    }
    const main=document.querySelector('main');
    if(main&&observer)observer.observe(main);
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',resize,{passive:true});
    addEventListener('load',layout,{once:true});
    addEventListener('pageshow',layout);
    addEventListener('resume:language-restored',layout);
    const fontsReady=document.fonts&&document.fonts.ready;
    if(fontsReady&&typeof fontsReady.then==='function')fontsReady.then(layout);
    paint();
    cleanup=()=>{
      active=false;if(frame!==null)cancelAnimationFrame(frame);
      if(observer)observer.disconnect();
      removeEventListener('scroll',schedule);removeEventListener('resize',resize);
      removeEventListener('load',layout);removeEventListener('resume:language-restored',layout);
      removeEventListener('pageshow',layout);
      segments.forEach(({fill,tip})=>{
        fill.style.removeProperty('height');tip.style.removeProperty('top');tip.style.removeProperty('opacity');
      });
      stages.forEach(({phrase})=>phrase.classList.remove('promise-lit'));
    };
  }
  // iOS Safari before MediaQueryList.addEventListener still has addListener.
  if(typeof mobile.addEventListener==='function')mobile.addEventListener('change',setup);
  else if(typeof mobile.addListener==='function')mobile.addListener(setup);
  setup();
})();
