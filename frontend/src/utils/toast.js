export function showToast(message, type='info', duration=4000){
  try{
    const id = 'toast-'+Date.now();
    const el = document.createElement('div');
    el.id = id;
    el.className = 'simple-toast '+type;
    el.textContent = message;
    Object.assign(el.style,{position:'fixed',right:'20px',top:'20px',background: type==='error'? '#ff5959': type==='success'? '#4caf50': '#333',color:'#fff',padding:'10px 14px',borderRadius:'6px',boxShadow:'0 4px 12px rgba(0,0,0,0.15)',zIndex:10000,opacity:0,transition:'opacity 0.2s'});
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.style.opacity=1);
    setTimeout(()=>{el.style.opacity=0; setTimeout(()=>{ try{el.remove()}catch(e){} },300)}, duration);
  }catch(e){console.warn('toast failed', e)}
}
