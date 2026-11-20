export function NeuralFallback(){
  const dots=Array.from({length:70},(_,i)=>{const a=i*2.39996,r=Math.sqrt((i+.5)/70);return {x:150+Math.cos(a)*r*118,y:135+Math.sin(a)*r*87}});
  return <svg className="brain-fallback" viewBox="0 0 300 300" aria-hidden="true"><g fill="none" stroke="#b8ca7a" strokeWidth=".8" opacity=".65">{dots.flatMap((p,i)=>dots.slice(i+1).filter(q=>Math.hypot(q.x-p.x,q.y-p.y)<45).slice(0,4).map((q,j)=><path key={`${i}-${j}`} d={`M${p.x} ${p.y}L${q.x} ${q.y}`}/>))}<path d="M105 210L127 250L142 218L155 237L151 204M127 250L155 237"/></g><g fill="#dcffa0">{dots.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={2}/>)}</g></svg>;
}
