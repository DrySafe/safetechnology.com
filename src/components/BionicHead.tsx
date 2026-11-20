import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const EAR = new THREE.Vector3(-.36,.2,.6);
export const qualities = [
  { title:'Empatia + precisão', detail:'Sensibilidade humana. Inteligência aplicada.', anchor:[.99,.55,.48], end:[64,23] },
  { title:'Criatividade ampliada', detail:'Ideias humanas. Novas possibilidades.', anchor:[-.72,1.15,.35], end:[20,18] },
  { title:'Decisões com contexto', detail:'Dados conectados ao olhar humano.', anchor:[.4,-.74,.46], end:[61,84] },
];
export type AnnotationRefs={paths:RefObject<(SVGPathElement|null)[]>;labels:RefObject<(HTMLDivElement|null)[]>;dots:RefObject<(SVGCircleElement|null)[]>};

function panel(draw:(s:THREE.Shape)=>void, depth=.16){
  const shape=new THREE.Shape();draw(shape);
  const source=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.045,curveSegments:24});
  const geometry=new TessellateModifier(.18,5).modify(source);source.dispose();
  const positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i),y=positions.getY(i);
    positions.setZ(i,positions.getZ(i)+.18*Math.cos((x-.1)*1.4)*Math.cos(y*.75));
  }
  geometry.deleteAttribute('normal');
  const smooth=mergeVertices(geometry);geometry.dispose();smooth.computeVertexNormals();return smooth;
}
function path(points:number[][],radius=.018){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number]))),40,radius,6,false)}

export default function BionicHead({progress,reduced,annotations}:{progress:RefObject<number>;reduced:boolean;annotations:AnnotationRefs}){
  const head=useRef<THREE.Group>(null!);const plates=useRef<(THREE.Group|null)[]>([]);const rotor=useRef<THREE.Group>(null!);const tunnel=useRef<THREE.Group>(null!);
  const glow=useRef<THREE.ShaderMaterial>(null!);
  const scratch=useMemo(()=>new THREE.Vector3(),[]);
  const geometries=useMemo(()=>[
    // Ceramic crown: long arc from the occipital shell to the forehead.
    panel(s=>{s.moveTo(-1.22,.22);s.bezierCurveTo(-1.7,1.52,-.55,1.98,.54,1.53);s.quadraticCurveTo(1.02,1.35,1.12,.91);s.lineTo(.76,1.01);s.bezierCurveTo(.31,1.56,-.94,1.48,-1.01,.39);s.closePath()}),
    // Human facial profile. An inset eye separates brow and cheek.
    panel(s=>{s.moveTo(.78,1.03);s.quadraticCurveTo(1.13,1.05,1.14,.73);s.lineTo(1.08,.48);s.quadraticCurveTo(1.18,.12,1.5,-.07);s.quadraticCurveTo(1.63,-.21,1.38,-.26);s.lineTo(1.25,-.25);s.quadraticCurveTo(1.17,-.37,1.3,-.42);s.lineTo(1.35,-.49);s.lineTo(1.22,-.54);s.quadraticCurveTo(1.39,-.64,1.23,-.74);s.quadraticCurveTo(1.28,-1.02,.94,-1.05);s.lineTo(.49,-.78);s.quadraticCurveTo(.78,-.28,.49,.03);s.lineTo(.36,.58);s.closePath();const eye=new THREE.Path();eye.moveTo(.75,.57);eye.quadraticCurveTo(.93,.73,1.1,.59);eye.lineTo(1.02,.46);eye.quadraticCurveTo(.88,.45,.75,.57);s.holes.push(eye)},.22),
    // Independent jaw plate exposes the mechanical hinge below the ear.
    panel(s=>{s.moveTo(-.07,-.4);s.quadraticCurveTo(.45,-.16,.57,-.57);s.lineTo(.88,-1.02);s.quadraticCurveTo(.14,-1.07,-.46,-.64);s.lineTo(-.2,-.43);s.closePath()},.18),
    panel(s=>{s.moveTo(-1.24,.18);s.lineTo(-1.02,.08);s.quadraticCurveTo(-1.13,-.5,-.7,-.91);s.lineTo(-.91,-1.12);s.quadraticCurveTo(-1.51,-.58,-1.24,.18);s.closePath()},.16),
  ],[]);
  const wires=useMemo(()=>Array.from({length:11},(_,i)=>path([[-.96+i*.12,-.62,-.05],[-.72+i*.11,-1.08,.02],[-.73+i*.1,-1.52,.15],[-1+i*.15,-1.98,.1]],i%3===0?.033:.015)),[]);
  const traces=useMemo(()=>Array.from({length:9},(_,i)=>path([[-1.07,.1+i*.11,.24],[-.96,.16+i*.1,.25],[-.8,.22+i*.1,.26],[-.65+i*.065,.93,.25],[.35,.95-i*.055,.25]],.009)),[]);
  const inner=useMemo(()=>{const s=new THREE.Shape();s.absellipse(-.25,.3,1.08,1.12,0,Math.PI*2,false,0);const hole=new THREE.Path();hole.absarc(EAR.x,EAR.y,.49,0,Math.PI*2,true);s.holes.push(hole);return new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false,curveSegments:48})},[]);
  useFrame(({clock,camera,size})=>{
    const p=progress.current,t=reduced?0:clock.elapsedTime;
    const opening=reduced?0:THREE.MathUtils.smoothstep(p,.09,.28);
    plates.current.forEach((plate,i)=>{if(!plate)return;const sign=i%2?1:-1;plate.position.set(sign*opening*(.45+i*.12),opening*(i===0?1.1:i===2?-.7:.2),.3+opening*(.3+i*.1));plate.rotation.set(opening*(i-1.5)*.65,opening*sign*1.3,opening*sign*(.25+i*.2));});
    if(glow.current)glow.current.uniforms.strength.value=(1-opening)*.65;
    rotor.current.rotation.z=t*.18+opening*7;
    tunnel.current.rotation.z=-opening*3;
    head.current.updateWorldMatrix(true,false);
    qualities.forEach((q,i)=>{const line=annotations.paths.current[i],label=annotations.labels.current[i],dot=annotations.dots.current[i];if(!line||!label||!dot)return;
      const visible=p<.12;
      scratch.fromArray(q.anchor);head.current.localToWorld(scratch);scratch.project(camera);
      const x=(scratch.x*.5+.5)*1000,y=(-scratch.y*.5+.5)*1000;
      const end=size.width<600?[[64,27],[12,14],[60,91]][i]:q.end;
      const [ex,ey]=end.map(v=>v*10);const opacity=visible?(reduced?1:.45+.55*Math.pow((Math.sin(t*.9-i*2.1)+1)/2,2)):0;
      label.style.left=`${end[0]}%`;label.style.top=`${end[1]}%`;label.style.opacity=String(opacity);label.style.visibility=visible?'visible':'hidden';
      line.setAttribute('d',`M ${x} ${y} L ${ex} ${ey+30} L ${ex+110} ${ey+30}`);line.style.opacity=String(opacity);dot.setAttribute('cx',String(x));dot.setAttribute('cy',String(y));dot.style.opacity=String(opacity);
    });
  });
  return <group ref={head}>
    <mesh geometry={inner} position={[0,0,.02]}><meshStandardMaterial color="#101c1c" metalness={.8} roughness={.33}/></mesh>
    {geometries.map((geometry,i)=><group key={i} ref={el=>{plates.current[i]=el}} position={[0,0,.3]}><mesh geometry={geometry}><meshPhysicalMaterial color="#cbd5d0" metalness={.48} roughness={.27} clearcoat={.8}/></mesh></group>)}
    {wires.map((geometry,i)=><mesh key={i} geometry={geometry}><meshStandardMaterial color={i%3?'#657975':'#b5c4bd'} metalness={.95} roughness={.23}/></mesh>)}
    {traces.map((geometry,i)=><mesh key={i} geometry={geometry}><meshBasicMaterial color={i%2?'#b9e9df':'#97aa91'} transparent opacity={.5}/></mesh>)}
    {/* Recessed optical eye, small nose intake and lip seam. */}
    <mesh position={[.96,.55,.41]} scale={[.14,.065,.06]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#101716" metalness={.7} roughness={.2}/></mesh>
    <mesh position={[1.01,.55,.465]}><sphereGeometry args={[.035,16,12]}/><meshBasicMaterial color="#c7ff6b"/></mesh>
    <mesh position={[1.34,-.2,.49]} scale={[.055,.018,.02]}><sphereGeometry args={[1,12,8]}/><meshBasicMaterial color="#14231e"/></mesh>
    <mesh position={[1.23,-.5,.57]} rotation={[0,0,-.08]}><boxGeometry args={[.18,.018,.01]}/><meshStandardMaterial color="#35423b"/></mesh>
    {/* Open ear aperture: no solid disk blocks the camera's flight path. */}
    <group position={[EAR.x,EAR.y,EAR.z]}>
      <mesh><torusGeometry args={[.52,.085,12,80]}/><meshStandardMaterial color="#d4ddd7" metalness={.85} roughness={.22}/></mesh>
      <mesh position={[0,0,.045]}><torusGeometry args={[.43,.024,8,80]}/><meshBasicMaterial color="#caff8a"/></mesh>
      <mesh position={[0,0,-.02]}><torusGeometry args={[.6,.018,6,80]}/><meshBasicMaterial color="#8dafa6"/></mesh>
      <group ref={rotor}>{Array.from({length:28},(_,i)=>{const a=i/28*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*.49,Math.sin(a)*.49,.06]} rotation={[0,0,a]}><boxGeometry args={[.055,.012,.025]}/><meshBasicMaterial color={i%4?'#748d80':'#e7ffc8'}/></mesh>})}</group>
      <group ref={tunnel}>
        {Array.from({length:16},(_,i)=><mesh key={i} position={[0,0,-.18-i*.85]} rotation={[0,0,i*.13]}><torusGeometry args={[.405,.016,6,48]}/><meshBasicMaterial color={i%3?'#7ec2ad':'#d5ff9f'} transparent opacity={.8-i*.025}/></mesh>)}
        {Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*.4,Math.sin(a)*.4,-6]}><boxGeometry args={[.007,.007,13]}/><meshBasicMaterial color="#86b6a1" transparent opacity={.5}/></mesh>})}
        <mesh position={[0,0,-13.5]}><circleGeometry args={[.4,48]}/><meshBasicMaterial color="#dbffd0"/></mesh>
      </group>
      <mesh position={[0,0,.09]}><planeGeometry args={[1.65,1.65]}/><shaderMaterial ref={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={{strength:{value:.65}}} vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}" fragmentShader="varying vec2 vUv; uniform float strength; void main(){float r=length(vUv-.5);float halo=exp(-r*r*24.0);gl_FragColor=vec4(.73,1.0,.68,halo*strength);}"/></mesh>
      <pointLight color="#c7ff8a" intensity={1.5} distance={2}/>
    </group>
    {/* Smaller exposed temple gears and jaw hinge. */}
    {[[-.4,.98,.28,.2],[.29,.17,.51,.11],[-.68,-.57,.22,.13]].map(([x,y,z,r],i)=><group key={i} position={[x,y,z]}><mesh><torusGeometry args={[r,.025,8,32]}/><meshStandardMaterial color="#a5b6b1" metalness={.9} roughness={.25}/></mesh><mesh><circleGeometry args={[r*.7,24]}/><meshStandardMaterial color="#1c2c28" metalness={.8} roughness={.25}/></mesh><mesh position={[0,0,.01]}><circleGeometry args={[r*.2,12]}/><meshBasicMaterial color="#c7ff6b"/></mesh></group>)}
    <mesh position={[-.23,-2.02,.02]} scale={[1.2,.28,.6]}><sphereGeometry args={[1,32,16]}/><meshStandardMaterial color="#a9bab2" metalness={.65} roughness={.3}/></mesh>
  </group>;
}
