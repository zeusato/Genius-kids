/** Distance-driven shallows. No transparent overlay, extra draw calls or tile outlines. */
export const waterVertex = `attribute float shoreDistance;
varying float shore; varying vec2 worldXZ;
void main(){ shore=shoreDistance; worldXZ=position.xz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
export const waterFragment = `varying float shore; varying vec2 worldXZ;
uniform float time; uniform vec3 deepTint; uniform vec3 shallowTint; uniform vec3 sandTint; uniform vec3 foamTint;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
    float n=noise(worldXZ*.62);
    float depth=max(0.,shore*(.86+n*.28));
    vec3 color=mix(shallowTint,deepTint,smoothstep(0.,3.,depth));
    color=mix(color,sandTint,1.-smoothstep(0.,.6,depth));
    float drift=sin(worldXZ.x*.75+worldXZ.y*.38+time*.65+n*3.);
    float ripple=sin(depth*10.-time*.8+n*5.);
    float shimmer=pow(max(0.,sin(worldXZ.x*1.5+worldXZ.y*.7+time*.32+n*4.)),10.);
    color+=shimmer*.012*smoothstep(.4,2.,depth);
    float foam=(1.-smoothstep(.02,.13,abs(depth-(.15+drift*.055))));
    foam*=smoothstep(.35,.75,noise(worldXZ*1.15+vec2(time*.035,0.)))*.28;
    color=mix(color,foamTint,foam);
    color+=max(0.,ripple)*.008*(1.-smoothstep(.3,1.9,depth));
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;
