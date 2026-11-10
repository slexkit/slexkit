/** Installed before the candidate module loads; counts active host resources. */
export function installResourceProbe() {
  const timers=new Set(),intervals=new Set(),frames=new Set(),listeners=[];
  const timeout=window.setTimeout.bind(window),clearTimeout=window.clearTimeout.bind(window);
  const interval=window.setInterval.bind(window),clearInterval=window.clearInterval.bind(window);
  const raf=window.requestAnimationFrame.bind(window),cancelRaf=window.cancelAnimationFrame.bind(window);
  window.setTimeout=(fn,ms,...args)=>{let id;id=timeout(()=>{timers.delete(id);typeof fn==="function"?fn(...args):void 0;},ms);timers.add(id);return id;};
  window.clearTimeout=id=>{timers.delete(id);clearTimeout(id);};
  window.setInterval=(fn,ms,...args)=>{const id=interval(fn,ms,...args);intervals.add(id);return id;};
  window.clearInterval=id=>{intervals.delete(id);clearInterval(id);};
  window.requestAnimationFrame=fn=>{let id;id=raf(time=>{frames.delete(id);fn(time);});frames.add(id);return id;};
  window.cancelAnimationFrame=id=>{frames.delete(id);cancelRaf(id);};
  const add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;
  const capture=options=>typeof options==="boolean"?options:!!options?.capture;
  EventTarget.prototype.addEventListener=function(type,fn,options){
    if((this===window||this===document)&&fn&&!options?.once&&!listeners.some(v=>v.target===this&&v.type===type&&v.fn===fn&&v.capture===capture(options)))listeners.push({target:this,type,fn,capture:capture(options)});
    return add.call(this,type,fn,options);
  };
  EventTarget.prototype.removeEventListener=function(type,fn,options){
    const i=listeners.findIndex(v=>v.target===this&&v.type===type&&v.fn===fn&&v.capture===capture(options));if(i>=0)listeners.splice(i,1);
    return remove.call(this,type,fn,options);
  };
  const observers=new Set();
  for(const key of ["MutationObserver","ResizeObserver"]){
    const Original=window[key];if(!Original)continue;
    window[key]=class extends Original {
      targets=new Set();
      observe(target,...args){this.targets.add(target);observers.add(this);return super.observe(target,...args);}
      unobserve(target){this.targets.delete(target);if(!this.targets.size)observers.delete(this);return super.unobserve?.(target);}
      disconnect(){observers.delete(this);this.targets.clear();return super.disconnect();}
    };
  }
  window.__resourceSnapshot=()=>({timers:timers.size,intervals:intervals.size,frames:frames.size,listeners:listeners.length,observers:observers.size});
}
