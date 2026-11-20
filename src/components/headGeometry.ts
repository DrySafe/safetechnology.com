import * as THREE from 'three';

const gaussian=(v:number,center:number,width:number)=>Math.exp(-Math.pow((v-center)/width,2));

// Anatomical cross-sections, rather than a silhouette extruded into a flat plate.
export function facePoint(y:number,angle:number){
  const lower=THREE.MathUtils.smoothstep(y,-1.05,-.6);
  const width=.48+.23*gaussian(y,.2,.85)-.19*(1-lower);
  const front=.77+.13*gaussian(y,1,.65)+.08*gaussian(y,-.8,.28)-.3*THREE.MathUtils.smoothstep(y,.8,1.27);
  const central=Math.exp(-Math.pow(angle/.35,2));
  const nose=(.30*gaussian(y,.14,.19)+.13*gaussian(y,.4,.35))*central;
  const lips=(.10*gaussian(y,-.29,.065)+.12*gaussian(y,-.43,.085))*Math.exp(-Math.pow(angle/.5,4));
  const socket=.13*gaussian(y,.6,.115)*gaussian(Math.abs(angle),.65,.25);
  const brow=.075*gaussian(y,.78,.08)*gaussian(Math.abs(angle),.6,.38);
  const cheek=.07*gaussian(y,.12,.24)*gaussian(Math.abs(angle),.95,.3);
  const x=.18+front*Math.cos(angle)+nose+lips-socket+brow+cheek;
  const z=width*Math.sin(angle);
  return new THREE.Vector3(x,y,z);
}
function grid(rows:number,columns:number,point:(u:number,v:number)=>THREE.Vector3){
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){const p=point(j/columns,i/rows);positions.push(p.x,p.y,p.z);uv.push(j/columns,i/rows)}
  for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const a=i*(columns+1)+j,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1)}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
export function facialShell(){
  const geometry=grid(150,100,(u,v)=>facePoint(1.27-v*2.28,-1.42+u*2.84));
  const uv=geometry.getAttribute('uv'),index=geometry.index!,kept:number[]=[];
  for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
    const angle=ids.reduce((sum,id)=>sum+(-1.42+uv.getX(id)*2.84),0)/3;
    const y=ids.reduce((sum,id)=>sum+(1.27-uv.getY(id)*2.28),0)/3;
    const inEye=Math.pow((Math.abs(angle)-.66)/.2,2)+Math.pow((y-.6)/.068,2)<1;
    if(!inEye)kept.push(...ids);
  }
  geometry.setIndex(kept);return geometry;
}
export function cranialShell(start:number,end:number){
  return grid(50,100,(u,v)=>{const a=start+u*(end-start);const r=.64+v*.57;
    const x=-.36+Math.cos(a)*r,y=.2+Math.sin(a)*r*1.12;
    const z=.12+.83*Math.sqrt(Math.max(0,1-Math.pow((r-.38)/.88,2)));
    return new THREE.Vector3(x,y,z);
  });
}
export function jawShell(){return grid(65,65,(u,v)=>{
  const x=-.23+u*1.1;const top=-.43-.08*Math.sin(u*Math.PI);const bottom=-.78-.28*Math.sin(u*Math.PI*.85);const y=THREE.MathUtils.lerp(top,bottom,v);
  const z=.15+.48*Math.sin(u*Math.PI*.8)+.12*Math.sin(v*Math.PI);
  return new THREE.Vector3(x,y,z);
});}
export function tube(points:THREE.Vector3[],radius=.012){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(32,points.length*3),radius,8,false)}

// Seeded local microtextures. Neither an external photo nor a model download is used.
export function surfaceTexture(kind:'ceramic'|'metal'){
  const size=256,data=new Uint8Array(size*size*4);let seed=17;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    seed=(seed*1664525+1013904223)>>>0;const noise=(seed>>>24)/255;
    const value=kind==='metal'?Math.round(120+25*Math.sin(y*2.4)+noise*35):Math.round(175+noise*35);
    const index=(y*size+x)*4;data[index]=data[index+1]=data[index+2]=value;data[index+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(kind==='metal'?2:5,kind==='metal'?2:5);texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

export function foreheadCap(){return grid(55,80,(u,v)=>{
  const angle=-1.42+u*2.84,start=facePoint(1.27,angle);
  const c1=new THREE.Vector3(start.x-.12,1.6,start.z*.95);
  const c2=new THREE.Vector3(-.16,1.72,start.z*.4);
  const end=new THREE.Vector3(-.36,1.59,0);
  return new THREE.CubicBezierCurve3(start,c1,c2,end).getPoint(v);
});}
export function sideCheek(){return grid(50,50,(u,v)=>{
  const y=.64-v*1.26;
  const rim=Math.max(.1-.1*THREE.MathUtils.smoothstep(y,-.6,-.3),-.36+Math.sqrt(Math.max(0,.68*.68-(y-.2)*(y-.2))));
  const face=facePoint(y,1.1);
  return new THREE.Vector3(THREE.MathUtils.lerp(rim,face.x,u),y,THREE.MathUtils.lerp(.48+.28*THREE.MathUtils.smoothstep(y,-.62,-.35),face.z,u)+.04*Math.sin(u*Math.PI));
});}
export function eyelid(side:number){return tube(Array.from({length:65},(_,i)=>{
  const t=i/64*Math.PI*2;const p=facePoint(.6+.068*Math.sin(t),side*(.66+.2*Math.cos(t)));p.x+=.008;return p;
}),.013);}
export function cranialVolume(upper:boolean){
  const geometry=grid(110,100,(u,v)=>{const theta=v*Math.PI,phi=u*Math.PI;return new THREE.Vector3(-.38+1.05*Math.sin(theta)*Math.cos(phi),.35+1.27*Math.cos(theta),.82*Math.sin(theta)*Math.sin(phi));});
  const pos=geometry.getAttribute('position'),index=geometry.index!,kept:number[]=[];
  for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];const x=ids.reduce((s,id)=>s+pos.getX(id),0)/3,y=ids.reduce((s,id)=>s+pos.getY(id),0)/3;
    const ear=(x+.36)**2+(y-.2)**2<.65**2;
    if(!ear && !(x>.3&&y<1.2) && (upper?y>.4:y<=.4))kept.push(...ids);
  }geometry.setIndex(kept);return geometry;
}
export function templeBridge(side:number){return grid(60,40,(u,v)=>{
  let start:THREE.Vector3;
  if(v<.3)start=facePoint(1+v/.3*.27,side*1.42);
  else{const p=facePoint(1.27,side*1.42);start=new THREE.CubicBezierCurve3(p,new THREE.Vector3(p.x-.12,1.6,p.z*.95),new THREE.Vector3(-.16,1.72,p.z*.4),new THREE.Vector3(-.36,1.59,0)).getPoint((v-.3)/.7)}
  const radius=Math.sqrt(Math.max(0,1-Math.pow((start.y-.35)/1.27,2)));
  return new THREE.Vector3(THREE.MathUtils.lerp(start.x,-.38,u),start.y,THREE.MathUtils.lerp(start.z,side*.82*radius,u));
});}
