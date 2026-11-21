import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SIGNALS=28, VERTICES=6;
// Camera-facing ribbons follow the projected edge, rather than round point sprites.
const vertex=`uniform float uTime;attribute vec3 aEnd;attribute float aT;attribute float aHue;attribute vec2 aCorner;
varying vec2 vCorner;varying vec3 vColor;varying float vAlong;
vec3 deform(vec3 p){return p+vec3(sin(p.y*4.+uTime*.7),cos(p.x*3.+uTime*.8),sin(p.x*2.+uTime*.6))*.04;}
void main(){vec4 start=modelViewMatrix*vec4(deform(position),1.);vec4 end=modelViewMatrix*vec4(deform(aEnd),1.);
vec3 edge=end.xyz-start.xyz;float edgeLength=max(length(edge),.0001);
float halfLength=min(.07,edgeLength*.23);float offset=aCorner.x*halfLength/edgeLength;
vAlong=aT+offset;vec4 center=mix(start,end,vAlong);
vec2 direction=edge.xy/max(length(edge.xy),.0001);vec2 side=vec2(-direction.y,direction.x);
center.xy+=side*aCorner.y*.008;gl_Position=projectionMatrix*center;
vCorner=aCorner;vColor=mix(vec3(1.,.92,.4),vec3(.55,.95,1.),aHue);}`;
const fragment=`varying vec2 vCorner;varying vec3 vColor;varying float vAlong;
void main(){if(vAlong<0.||vAlong>1.)discard;
float axial=1.-smoothstep(.06,1.,abs(vCorner.x));
float lateral=1.-smoothstep(.45,1.,abs(vCorner.y));
float alpha=axial*lateral;if(alpha<.001)discard;
gl_FragColor=vec4(mix(vColor,vec3(1.,1.,.92),axial*.65),alpha);}`;

export default function NeuralSignals({nodes,edges,reduced,container}:{nodes:THREE.Vector3[];edges:number[];reduced:boolean;container:RefObject<HTMLDivElement|null>}){
  const ticks=useRef(0);
  const state=useMemo(()=>{
    const adjacent=nodes.map(()=>[] as number[]);
    for(let i=0;i<edges.length;i+=2){adjacent[edges[i]].push(edges[i+1]);adjacent[edges[i+1]].push(edges[i])}
    const routes=Array.from({length:SIGNALS},(_,i)=>{const from=edges[Math.floor(Math.random()*(edges.length/2))*2];return {from,to:adjacent[from][Math.floor(Math.random()*adjacent[from].length)],t:i/SIGNALS,duration:.8+Math.random()*1.1}});
    const geometry=new THREE.BufferGeometry();
    for(const [name,size] of [['position',3],['aEnd',3],['aT',1],['aHue',1],['aCorner',2]] as const)geometry.setAttribute(name,new THREE.BufferAttribute(new Float32Array(SIGNALS*VERTICES*size),size).setUsage(THREE.DynamicDrawUsage));
    const corners=[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];
    for(let i=0;i<SIGNALS;i++)corners.forEach(([x,y],j)=>geometry.attributes.aCorner.setXY(i*VERTICES+j,x,y));
    return {adjacent,routes,geometry,uniforms:{uTime:{value:0}}};
  },[nodes,edges]);
  useFrame(({clock},delta)=>{
    if(container.current)container.current.dataset.signals=String(reduced?0:SIGNALS);
    if(reduced)return;
    state.uniforms.uTime.value=clock.elapsedTime;
    state.routes.forEach((route,i)=>{
      route.t+=Math.min(delta,.05)/route.duration;
      if(route.t>=1){const previous=route.from;route.from=route.to;
        const choices=state.adjacent[route.from].filter(n=>n!==previous);
        route.to=choices.length?choices[Math.floor(Math.random()*choices.length)]:previous;
        route.t-=1;route.duration=.8+Math.random()*1.1;
      }
      const from=nodes[route.from],to=nodes[route.to];
      for(let j=0;j<VERTICES;j++){const index=i*VERTICES+j;
        state.geometry.attributes.position.setXYZ(index,from.x,from.y,from.z);
        state.geometry.attributes.aEnd.setXYZ(index,to.x,to.y,to.z);
        state.geometry.attributes.aT.setX(index,route.t);
        state.geometry.attributes.aHue.setX(index,i%4===0?1:0);
      }
    });
    for(const attribute of Object.values(state.geometry.attributes))attribute.needsUpdate=true;
    if(container.current)container.current.dataset.signalTick=String(++ticks.current);
  });
  return <mesh geometry={state.geometry} visible={!reduced} frustumCulled={false}><shaderMaterial uniforms={state.uniforms} vertexShader={vertex} fragmentShader={fragment} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} blending={THREE.NormalBlending}/></mesh>;
}
