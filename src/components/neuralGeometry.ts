import * as THREE from 'three';

export function createNeuralNetwork(){
  let seed=817;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const nodes:THREE.Vector3[]=[];
  // Two overlapping hemispheres, a lower cerebellum and a tapered brainstem.
  for(let i=0;i<440;i++){
    const y=1-2*random(),angle=random()*Math.PI*2,r=Math.sqrt(1-y*y),side=i%2?1:-1;
    const inside=i%5===0?.65+random()*.25:1;
    const x=1.62*r*Math.cos(angle)*inside;
    let height=.25+1.13*y*inside;
    if(height<-.3)height=-.3+(height+.3)*.48+.07*x;
    nodes.push(new THREE.Vector3(x,height,side*.15+.57*r*Math.sin(angle)*inside));
  }
  for(let i=0;i<65;i++){const y=1-2*random(),a=random()*Math.PI*2,r=Math.sqrt(1-y*y);nodes.push(new THREE.Vector3(-.93+.51*r*Math.cos(a),-.66+.39*y,.4*r*Math.sin(a)))}
  for(let i=0;i<35;i++){const t=i/34,a=i*2.4;nodes.push(new THREE.Vector3(-.65+t*.33+Math.cos(a)*.13,-.75-t*.65,Math.sin(a)*.14))}
  const edges:number[]=[];const used=new Set<string>();
  nodes.forEach((p,i)=>{
    const nearest=nodes.map((q,j)=>({j,d:p.distanceToSquared(q)})).filter(n=>n.j!==i&&n.d<.48).sort((a,b)=>a.d-b.d).slice(0,5);
    nearest.forEach(({j})=>{const key=i<j?`${i}-${j}`:`${j}-${i}`;if(!used.has(key)){used.add(key);edges.push(i,j)}});
  });
  const nodeGeometry=new THREE.BufferGeometry();nodeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(nodes.flatMap(p=>p.toArray()),3));nodeGeometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(nodes.map(()=>random()),1));
  const lineGeometry=new THREE.BufferGeometry(),positions:number[]=[],phases:number[]=[],seeds:number[]=[];
  for(let i=0;i<edges.length;i+=2){positions.push(...nodes[edges[i]].toArray(),...nodes[edges[i+1]].toArray());phases.push(0,1);const s=random();seeds.push(s,s)}
  lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));lineGeometry.setAttribute('aTravel',new THREE.Float32BufferAttribute(phases,1));lineGeometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
  return {nodes,edges,nodeGeometry,lineGeometry};
}
