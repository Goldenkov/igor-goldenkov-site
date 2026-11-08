'use strict';
(() => {
  const language=document.documentElement.lang==='en'?'en':'ru';
  const paths={ru:'index.html',en:'en.html'};
  function languageUrl(target){
    const current=new URL(location.href),destination=new URL(paths[target],current);
    destination.search=current.search;
    return destination;
  }
  let pending;
  try {
    const preference=localStorage.getItem('resume-language');
    // Explicit EN URLs remain shareable; a stored preference applies to the root entry.
    if(language==='ru'&&preference==='en'&&!location.hash&&/\/$/.test(location.pathname)){
      location.replace(languageUrl('en'));return;
    }
  } catch (_) {}
  try{pending=JSON.parse(sessionStorage.getItem('resume-position'));}catch(_){}
  const restoring=pending?.language===language&&Number.isInteger(pending.index)&&pending.index>=0&&Number.isFinite(pending.ratio)&&pending.ratio>=0&&pending.ratio<=1;
  // The deferred motion script sees this before it creates the hero entrance.
  window.resumeLanguageNavigation=restoring;
  if(restoring&&'scrollRestoration' in history){
    const previous=history.scrollRestoration;history.scrollRestoration='manual';
    addEventListener('load',()=>{history.scrollRestoration=previous;},{once:true});
  }
  if(pending?.language===language&&!restoring){try{sessionStorage.removeItem('resume-position');}catch(_){}pending=null;}

  document.addEventListener('DOMContentLoaded',()=>{
    let prefetched=false;
    function prefetch(){
      if(prefetched)return;prefetched=true;
      const hint=document.createElement('link');hint.rel='prefetch';hint.as='document';
      hint.href=languageUrl(language==='ru'?'en':'ru').href;
      document.head.append(hint);
    }
    // Warm only the alternate document; all fonts, styles and scripts are shared.
    if(!navigator.connection?.saveData)prefetch();
    document.querySelectorAll('[data-language]').forEach(link=>{
      const target=link.dataset.language;
      link.href=languageUrl(target).href;
      link.setAttribute('aria-current',target===language?'true':'false');
      if(target!==language){link.addEventListener('pointerenter',prefetch,{once:true});link.addEventListener('focus',prefetch,{once:true});}
      link.addEventListener('click',event=>{
        if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button>0)return;
        try{localStorage.setItem('resume-language',target);}catch(_){}
        if(target===language){event.preventDefault();return;}
        try{
          const sections=[...document.querySelectorAll('main>section')];
          const starts=sections.map(section=>section.getBoundingClientRect().top+scrollY);
          let index=0;starts.forEach((start,i)=>{if(start<=scrollY+2)index=i;});
          const end=starts[index+1]??document.documentElement.scrollHeight;
          sessionStorage.setItem('resume-position',JSON.stringify({language:target,index,ratio:Math.max(0,Math.min(1,(scrollY-starts[index])/Math.max(1,end-starts[index]))),project:document.querySelector('.project-grid')?.scrollLeft||0}));
        }catch(_){}
      });
    });
    if(!restoring)return;
    try{sessionStorage.removeItem('resume-position');}catch(_){}
    let restoredY;
    function restore(){
      window.ScrollTrigger?.refresh();
      const sections=[...document.querySelectorAll('main>section')];
      const section=sections[pending.index];if(!section)return;
      const top=section.getBoundingClientRect().top+scrollY;
      const next=sections[pending.index+1];
      const end=next?next.getBoundingClientRect().top+scrollY:document.documentElement.scrollHeight;
      const y=top+pending.ratio*Math.max(1,end-top);
      window.scrollTo({top:y,behavior:'instant'});restoredY=scrollY;
      window.ScrollTrigger?.update();
      const projects=document.querySelector('.project-grid');if(projects&&Number.isFinite(pending.project))projects.scrollLeft=Math.max(0,pending.project);
      window.dispatchEvent(new Event('resume:language-restored'));
    }
    // Do not wait for window.load or font downloads before showing the destination.
    requestAnimationFrame(()=>{
      restore();
      // A cold font load may change heights. Correct once, only while the reader
      // remains at the restored position; never pull them back after they scroll.
      document.fonts?.ready.then(()=>{
        if(Number.isFinite(restoredY)&&Math.abs(scrollY-restoredY)<=2)requestAnimationFrame(restore);
      });
    });
  });
})();
