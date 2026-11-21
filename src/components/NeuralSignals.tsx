import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SIGNALS=28, TRAIL=9;
const vertex=`uniform float uTime;attribute vec3 aEnd;attribute float aT;attribute float aGlow;attribute float aHue;varying float vGlow;varying vec3 vColor;
vec3 deform(vec3 p){return p+vec3(sin(p.y*4.+uTime*.7),cos(p.x*3.+uTime*.8),sin(p.x*2.+uTime*.6))*.04;}
void main(){vec3 p=mix(deform(position),deform(aEnd),aT);vGlow=aGlow;
vColor=mix(vec3(1.,.9,.38),vec3(.55,.95,1.),aHue);
vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
gl_PointSize=clamp((14.+aGlow*29.)*4./max(.5,-mv.z),2.,90.);}`;
const fragment=`varying float vGlow;varying vec3 vColor;void main(){vec2 p=gl_PointCoord-.5;float r=length(p);
float core=exp(-r*r*250.);float halo=exp(-r*r*19.)*.38;
float star=(exp(-abs(p.x)*100.-abs(p.y)*13.)+exp(-abs(p.y)*100.-abs(p.x)*13.))*.2;
float a=(core+halo+star)*vGlow;if(a<.008)discard;gl_FragColor=vec4(mix(vColor,vec3(1.),core*.7),a);}`;

export default function NeuralSignals({nodes,edges,reduced,container}:{nodes:THREE.Vector3[];edges:number[];reduced:boolean;container:RefObject<HTMLDivElement|null>}){
  const ticks=useRef(0);
  const state=useMemo(()=>{
    const adjacent=nodes.map(()=>[] as number[]);
    for(let i=0;i<edges.length;i+=2){adjacent[edges[i]].push(edges[i+1]);adjacent[edges[i+1]].push(edges[i])}
    const routes=Array.from({length:SIGNALS},(_,i)=>{const from=edges[Math.floor(Math.random()*(edges.length/2))*2];return {from,to:adjacent[from][Math.floor(Math.random()*adjacent[from].length)],t:i/SIGNALS,duration:.8+Math.random()*1.1}});
    const geometry=new THREE.BufferGeometry();
    for(const [name,size] of [['position',3],['aEnd',3],['aT',1],['aGlow',1],['aHue',1]] as const)geometry.setAttribute(name,new THREE.BufferAttribute(new Float32Array(SIGNALS*TRAIL*size),size).setUsage(THREE.DynamicDrawUsage));
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
      for(let j=0;j<TRAIL;j++){const index=i*TRAIL+j,t=route.t-j*.025;
        state.geometry.attributes.position.setXYZ(index,from.x,from.y,from.z);
        state.geometry.attributes.aEnd.setXYZ(index,to.x,to.y,to.z);
        state.geometry.attributes.aT.setX(index,Math.max(0,t));
        state.geometry.attributes.aGlow.setX(index,t<0?0:Math.pow(1-j/TRAIL,2));
        state.geometry.attributes.aHue.setX(index,i%4===0?1:0);
      }
    });
    for(const attribute of Object.values(state.geometry.attributes))attribute.needsUpdate=true;
    if(container.current)container.current.dataset.signalTick=String(++ticks.current);
  });
  return <points geometry={state.geometry} visible={!reduced} frustumCulled={false}><shaderMaterial uniforms={state.uniforms} vertexShader={vertex} fragmentShader={fragment} transparent depthWrite={false} blending={THREE.AdditiveBlending}/></points>;
}
