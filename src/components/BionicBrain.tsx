import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const qualities = [
  { title: 'Empatia + precisão', detail: 'Sensibilidade humana. Inteligência aplicada.', anchor: cortex(.85,.7,-1,.04).toArray(), end: [24,18] },
  { title: 'Criatividade ampliada', detail: 'Ideias humanas. Novas possibilidades.', anchor: cortex(1.2,.8,1,.04).toArray(), end: [65,35] },
  { title: 'Decisões com contexto', detail: 'Dados conectados ao olhar humano.', anchor: cortex(2,.65,1,.04).toArray(), end: [60,82] },
];
export type AnnotationRefs = {
  paths: RefObject<(SVGPathElement | null)[]>;
  labels: RefObject<(HTMLDivElement | null)[]>;
  dots: RefObject<(SVGCircleElement | null)[]>;
};

// Two separated hemispheres, with a folded cortex and an inferior brainstem.
// Parametric coordinates also locate every illuminated pathway on the cortex.
function cortex(theta: number, phi: number, side: number, lift = 0) {
  const folds = .035 * Math.sin(theta * 19 + 2 * Math.sin(phi * 6))
    + .027 * Math.sin(phi * 23 + 2.5 * Math.sin(theta * 7));
  const radius = 1 + folds + lift;
  const lowerTaper = 1 - .16 * Math.max(0, -Math.cos(theta));
  return new THREE.Vector3(
    side * (.065 + Math.sin(theta) * Math.sin(phi) * 1.2 * radius * lowerTaper),
    Math.cos(theta) * 1.08 * radius + .13,
    Math.sin(theta) * Math.cos(phi) * 1.22 * radius,
  );
}
function hemisphere(side: number) {
  const rows = 100, columns = 100;
  const positions: number[] = [], indices: number[] = [];
  for (let i=0;i<=rows;i++) for(let j=0;j<=columns;j++) {
    const p=cortex(i/rows*Math.PI,j/columns*Math.PI,side);
    positions.push(p.x,p.y,p.z);
  }
  for(let i=0;i<rows;i++) for(let j=0;j<columns;j++) {
    const a=i*(columns+1)+j,b=a+columns+1;
    if(side===1) indices.push(a,a+1,b,b,a+1,b+1);
    else indices.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
}
function pathway(side: number, row: number) {
  const points=Array.from({length:100},(_,i)=>{
    const phi=.08+i/99*(Math.PI-.16);
    const theta=.28+row*.32+.075*Math.sin(phi*7+row*1.7)+.04*Math.sin(phi*15+row);
    return cortex(theta,phi,side,.018);
  });
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),120,.014,5,false);
}
export default function BionicBrain({reduced, progress, annotations}: {
  reduced: boolean; progress: RefObject<number>; annotations: AnnotationRefs;
}) {
  const brain=useRef<THREE.Group>(null!);
  const signals=useRef<THREE.MeshBasicMaterial[]>([]);
  const scratch=useMemo(()=>new THREE.Vector3(),[]);
  const surfaces=useMemo(()=>[-1,1].map(hemisphere),[]);
  const paths=useMemo(()=>[-1,1].flatMap(side=>Array.from({length:8},(_,i)=>pathway(side,i))),[]);
  useFrame(({clock,camera,size})=>{
    const p=progress.current;
    const visible=p<.28;
    const t=reduced?0:clock.elapsedTime;
    for(let i=0;i<paths.length;i++) {
      const material=signals.current[i];
      if(material) material.opacity=reduced?.6:.18+.72*Math.pow((Math.sin(t*1.7-i*.7)+1)/2,4);
    }
    brain.current.updateWorldMatrix(true,false);
    qualities.forEach((quality,i)=>{
      const line=annotations.paths.current[i], label=annotations.labels.current[i], dot=annotations.dots.current[i];
      if(!line||!label||!dot)return;
      // Project the actual cortex point into the overlay, so leaders stay attached
      // while the brain follows the pointer and during the beginning of the zoom.
      scratch.fromArray(quality.anchor);brain.current.localToWorld(scratch);scratch.project(camera);
      const x=(scratch.x*.5+.5)*1000,y=(-scratch.y*.5+.5)*1000;
      const end=size.width<600?[[18,15],[68,38],[61,85]][i]:quality.end;
      const [ex,ey]=end.map(v=>v*10);
      label.style.left=`${end[0]}%`;label.style.top=`${end[1]}%`;
      const opacity=visible?(reduced?1:.35+.65*Math.pow((Math.sin(t*.9-i*2.1)+1)/2,2)):0;
      line.setAttribute('d',`M ${x} ${y} L ${ex} ${ey+32} L ${ex+115} ${ey+32}`);
      line.style.opacity=String(opacity);
      dot.setAttribute('cx',String(x));dot.setAttribute('cy',String(y));dot.style.opacity=String(opacity);
      label.style.opacity=String(opacity);
      label.style.visibility=visible?'visible':'hidden';
    });
  });
  return <group ref={brain}>
    {surfaces.map((geometry,i)=><mesh key={i} geometry={geometry}><meshPhysicalMaterial color="#7b8b91" metalness={.72} roughness={.32} clearcoat={.55} clearcoatRoughness={.25} side={THREE.DoubleSide}/></mesh>)}
    {paths.map((geometry,i)=><mesh key={i} geometry={geometry}><meshBasicMaterial ref={el=>{if(el)signals.current[i]=el}} color={i%3===0?'#bcb4ff':'#c7ff6b'} transparent opacity={.6} depthWrite={false}/></mesh>)}
    <mesh position={[0,-1.04,-.25]} rotation={[-.25,0,0]}><capsuleGeometry args={[.19,.55,8,16]}/><meshStandardMaterial color="#596971" metalness={.8} roughness={.27}/></mesh>
    {[-1,1].map(side=><mesh key={side} position={[side*.32,-.85,-.45]} scale={[.42,.32,.45]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#6d7e7f" metalness={.7} roughness={.4}/></mesh>)}
    {qualities.map((q,i)=><mesh key={i} position={q.anchor as [number,number,number]}><sphereGeometry args={[.035,12,12]}/><meshBasicMaterial color="#e2ffb4"/></mesh>)}
  </group>;
}

