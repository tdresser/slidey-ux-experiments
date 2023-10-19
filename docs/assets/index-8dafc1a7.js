var Pt=Object.defineProperty;var St=(n,t,e)=>t in n?Pt(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var r=(n,t,e)=>(St(n,typeof t!="symbol"?t+"":t,e),e),Q=(n,t,e)=>{if(!t.has(n))throw TypeError("Cannot "+e)};var f=(n,t,e)=>(Q(n,t,"read from private field"),e?e.call(n):t.get(n)),F=(n,t,e)=>{if(t.has(n))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(n):t.set(n,e)},B=(n,t,e,o)=>(Q(n,t,"write to private field"),o?o.call(n,e):t.set(n,e),e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))o(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&o(l)}).observe(document,{childList:!0,subtree:!0});function e(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(s){if(s.ep)return;s.ep=!0;const i=e(s);fetch(s.href,i)}})();class Dt{constructor(t){r(this,"animationStartTime",0);r(this,"animationStartOffset",0);r(this,"networkDelay");r(this,"maxOffset");r(this,"offset",0);r(this,"parallax");r(this,"limitFingerDrag");r(this,"boostVelocity");r(this,"targetStopPercent");this.networkDelay=t.networkDelay,this.maxOffset=t.targetOffset,this.parallax=t.parallax,this.limitFingerDrag=t.limitFingerDrag,this.boostVelocity=t.boostVelocity,this.targetStopPercent=t.targetStopPercent}startAnimating(t){this.animationStartTime=t,this.animationStartOffset=this.offset}pointerUp(t){return"success"}committed(t){return t-this.animationStartTime>=this.networkDelay}}function It(n){return n&&n.__esModule&&Object.prototype.hasOwnProperty.call(n,"default")?n.default:n}var it={exports:{}};(function(n){(function(){n.exports=t;function t(e,o,s,i){typeof s=="object"&&(i=s,s=!1),typeof i>"u"&&(i={});for(var l=0,c=0,E=0,y=0,m=e.length,p=0;p<m;++p)l+=e[p],c+=o[p],E+=e[p]*o[p],y+=e[p]*e[p];if(i.m=(E-l*c/m)/(y-l*l/m),i.b=c/m-i.m*l/m,s){for(var K=0,P=0;P<m;++P)K+=(o[P]-i.b-i.m*e[P])*(o[P]-i.b-i.m*e[P]);var W=m*y-l*l,J=1/(m-2)*K;i.bErr=Math.sqrt(J/W*y),i.mErr=Math.sqrt(m/W*J)}return function(Et){return i.m*Et+i.b}}})()})(it);var Rt=it.exports;const wt=It(Rt);function a(){throw new Error("missing element")}function rt(n){let t={m:0};const e=n.map(s=>s.offset),o=n.map(s=>s.time);return wt(o,e,!1,t),t.m,t.m}const Y=10,Ot=10;class H{constructor(t){r(this,"mass",1);r(this,"initialVelocity",0);r(this,"dampingRatio");r(this,"undampedNaturalFrequency");r(this,"dampedNaturalFrequency");r(this,"lastNFrames");r(this,"name");r(this,"overshootCurve",t=>t);const e=(2*Math.PI/t.frequencyResponse)**2*this.mass;this.undampedNaturalFrequency=Math.sqrt(e/this.mass),this.dampedNaturalFrequency=this.undampedNaturalFrequency*Math.sqrt(Math.abs(1-t.dampingRatio**2)),this.dampingRatio=t.dampingRatio,this.lastNFrames=[],this.name=t.name,t.overshootCurve&&(this.overshootCurve=t.overshootCurve)}position(t,e){const o=this.undampedNaturalFrequency*this.dampingRatio,s=this.dampedNaturalFrequency,i=(this.initialVelocity+o*t)/s,l=t;let c=Math.exp(-o*e)*(i*Math.sin(s*e)+l*Math.cos(s*e));if(c<0&&(c=this.overshootCurve(c)),isNaN(c)||!isFinite(c))throw"Spring config invalid. Position: "+c;this.lastNFrames.push({offset:c,time:e});let E=!1;if(this.lastNFrames.length>Y){this.lastNFrames.shift();let y=0;for(let m of this.lastNFrames)y+=m.offset*m.offset;E=y<Ot*Y}return c<1&&(E=!0),{offset:c,done:E}}velocity(){return rt(this.lastNFrames)}}var I,h,R;class Ft extends Dt{constructor(e){super(e);F(this,I,void 0);F(this,h,void 0);F(this,R,void 0);r(this,"lastRaf",null);r(this,"hasCommitted",!1);r(this,"hasAborted",!1);r(this,"pointerHistory",[]);r(this,"spring80FrequencyResponseInput",document.getElementById("spring80FrequencyResponse")??a());r(this,"spring80FrequencyResponseDisplay",document.getElementById("spring80FrequencyResponseDisplay")??a());r(this,"spring80DampingRatioInput",document.getElementById("spring80DampingRatio")??a());r(this,"spring80DampingRatioDisplay",document.getElementById("spring80DampingRatioDisplay")??a());r(this,"spring80FrequencyResponse",parseFloat(this.spring80FrequencyResponseInput.value));r(this,"spring80DampingRatio",parseFloat(this.spring80DampingRatioInput.value));this.animationStartOffset=0,this.spring80FrequencyResponseInput.addEventListener("input",()=>this.updateDisplays()),this.spring80DampingRatioInput.addEventListener("input",()=>this.updateDisplays()),B(this,I,new H({frequencyResponse:200,dampingRatio:.95,name:"100%"})),B(this,h,new H({frequencyResponse:this.spring80FrequencyResponse,dampingRatio:this.spring80DampingRatio,name:"80%"})),B(this,R,new H({frequencyResponse:200,dampingRatio:.9,name:"0%"}))}updateDisplays(){this.spring80FrequencyResponseDisplay.innerHTML=this.spring80FrequencyResponseInput.value,this.spring80DampingRatioDisplay.innerHTML=this.spring80DampingRatioInput.value}advance(e){e=e,!this.hasCommitted&&this.committed(e)&&(this.startAnimating(this.lastRaf||e),this.hasCommitted=!0,f(this,I).initialVelocity=f(this,h).velocity());const o=e-this.animationStartTime;let s=null;return this.hasAborted?(s=f(this,R).position(this.animationStartOffset,o),this.offset=Math.max(s.offset,0)):this.hasCommitted?(s=f(this,I).position(this.maxOffset-this.animationStartOffset,o),this.offset=this.maxOffset-s.offset):(s=f(this,h).position(this.maxOffset*this.targetStopPercent-this.animationStartOffset,o),this.offset=this.maxOffset*this.targetStopPercent-s.offset),this.lastRaf=e,{done:s.done&&(this.hasCommitted||this.hasAborted),fgOffset:this.offset,bgOffset:this.fgToBgOffset(this.offset),hasCommitted:this.hasCommitted}}pointerMove(e){return this.offset=this.fingerDragAdd(this.offset,e.movementX),this.pointerHistory.push({offset:this.offset,time:e.timeStamp}),this.pointerHistory.length>10&&this.pointerHistory.shift(),this.offset<0&&(this.offset=0),{done:!1,fgOffset:this.offset,bgOffset:this.fgToBgOffset(this.offset),hasCommitted:!1}}fingerDragAdd(e,o){return this.limitFingerDrag?e+this.targetStopPercent*o:e+o}fgToBgOffset(e){return this.parallax?.25*(e-this.maxOffset):0}setDefaultVelocity(){this.offset=0,f(this,h).initialVelocity=-2}pointerUp(e){let o=rt(this.pointerHistory);return console.log("before: "+o),this.boostVelocity&&(o*=4,o=Math.max(o,1)),console.log("post boost: "+o),o=Math.min(o,2),console.log("post clamp: "+o),(this.offset+o*100)/this.maxOffset<.3||o<-.1?(this.hasAborted=!0,f(this,R).initialVelocity=-o,"abort"):(f(this,h).initialVelocity=-o,"success")}}I=new WeakMap,h=new WeakMap,R=new WeakMap;let M=!1,L=!1,A=!1,_=!1,x=!1,z=!1,g=["resources/srp-cats.png","resources/srp-couches.png","resources/banana-pie-srp.png","resources/goo.gl-stock-a.png","resources/goo.gl-stock-b.png","resources/news-frontpage.png","resources/news-article.png","resources/pants-hemming-srp.png","resources/pants-srp.png"],u=0;const at=document.body??a(),lt=document.getElementById("scrim")??a(),Bt=document.getElementById("globalProgress")??a(),ct=document.getElementById("attributedProgress")??a(),w=document.getElementById("networkDelayInput")??a(),qt=document.getElementById("networkDelayDisplay")??a(),Lt=document.getElementById("zoomDisplay")??a(),At=document.getElementById("buttonTest")??a(),xt=document.getElementById("buttonSettings")??a(),mt=document.getElementById("settingsPanel")??a(),ut=document.getElementById("screenshots")??a(),kt=document.getElementById("targetStopDisplay")??a();var nt;const ft=((nt=document.getElementById("frontimg"))==null?void 0:nt.querySelector("img"))??a();var st;const $=((st=document.getElementById("midimg"))==null?void 0:st.querySelector("img"))??a();var ot;const U=((ot=document.getElementById("backimg"))==null?void 0:ot.querySelector("img"))??a(),Z=document.getElementById("settingZoom")??a(),dt=document.getElementById("settingProgressAttribution")??a(),Mt=document.getElementById("settingUnloadHandler")??a(),Tt=document.getElementById("settingBoostVelocity")??a(),T=document.getElementById("settingTargetStop")??a();let v=ct,O=v.querySelector(".bar"),Ct="lightblue",d=0,j=0,k=0,Nt=["P25","P50","P75","P90","P95","P99"],C=[30,100,330,660,1e3,2360],D=1,N=1;function Vt(){return C[parseInt(w.value)]*2}function Ht(n){var t;((t=n.target)==null?void 0:t.classList[0])!="screenshot"||M||(L=!0,b=V())}function pt(n){return .3+(1-n/document.documentElement.getBoundingClientRect().width)*.5}let q=!1;function _t(n){if(!L)return;let t=b.pointerMove(n);console.log(t),document.documentElement.style.setProperty("--fg-offset",`${t.fgOffset}px`),document.documentElement.style.setProperty("--bg-offset",`${t.bgOffset}px`),document.documentElement.style.setProperty("--scrim",`${pt(t.fgOffset)}`),gt(t.fgOffset),$t(t.fgOffset)}function gt(n){let t=n/document.documentElement.getBoundingClientRect().width,e=1-(1-N)*t;document.documentElement.style.setProperty("--fg-scale",`${e}`)}function $t(n){if(n/document.documentElement.getBoundingClientRect().width>.5){if(!q){let e=document.documentElement.animate([{"--bg-scale":N}],{duration:100,fill:"forwards"});e.finished.then(()=>{e.commitStyles(),e.cancel()}),q=!0}}else if(q){let e=document.documentElement.animate([{"--bg-scale":D}],{duration:100,fill:"forwards"});e.finished.then(()=>{e.commitStyles(),e.cancel()}),q=!1}}function Ut(n){if(!L)return;if(L=!1,_=!1,b.pointerUp(n)=="abort")X(),A=!0;else if(Mt.checked){let e=document.documentElement.style.getPropertyValue("--fg-offset"),o=document.documentElement.style.getPropertyValue("--fg-scale"),s=document.documentElement.getBoundingClientRect().width*10/100,i=document.documentElement.animate([{"--fg-scale":1,"--fg-offset":s+"px"}],{duration:300,fill:"forwards"});i.finished.then(()=>{if(i.commitStyles(),i.cancel(),window.confirm("are you sure you want to leave this page?  It's very nice.")){let l=document.documentElement.animate([{"--fg-scale":o,"--fg-offset":e}],{duration:200,fill:"forwards"});l.finished.then(()=>{l.commitStyles(),l.cancel(),X(),et().then(tt)})}});return}et().then(tt)}function Zt(){let n=document.documentElement.animate([{"--fg-scale":N,"--bg-scale":1}],{duration:100,fill:"forwards"});n.finished.then(()=>{n.commitStyles(),n.cancel()})}function X(){let n=document.documentElement.animate([{"--fg-scale":1,"--bg-scale":D}],{duration:100,fill:"forwards"});n.finished.then(()=>{n.commitStyles(),n.cancel()})}function tt(){z=!0,document.documentElement.animate([{"--scrim":0}],{duration:100}).finished.then(vt),x=!A,x?ht():G()}function ht(){let n=performance.now();if(n>=k){G();return}v.style.display="block",O.max=k-d,O.value=n-d,requestAnimationFrame(ht)}let b=V();bt();function yt(n,t){const e=b.advance(n);document.documentElement.style.setProperty("--fg-offset",`${e.fgOffset}px`),document.documentElement.style.setProperty("--bg-offset",`${e.bgOffset}px`);const s=pt(e.fgOffset)+.1*Math.sin((n-d)/200);document.documentElement.style.setProperty("--scrim",`${s}`),gt(e.fgOffset),n-d>800&&(v.style.display="block"),e.hasCommitted&&!_&&(Zt(),_=!0),e.done?t():requestAnimationFrame(i=>{yt(i,t)})}function et(){return M=!0,d=performance.now(),j=d+parseFloat(w.value),k=d+Vt(),console.log("start : "+d+" commit : "+j+" load : "+k),b.startAnimating(d),new Promise(n=>{yt(performance.now(),n)})}function vt(){z=!1,document.documentElement.style.setProperty("--fg-offset","0px"),document.documentElement.style.setProperty("--vertical-offset","0px"),document.documentElement.style.setProperty("--scrim","0.0"),document.documentElement.style.setProperty("--bg-scale",D.toString()),document.documentElement.style.setProperty("--fg-scale","1.0"),A?(document.documentElement.style.setProperty("--main-background-color",Ct),A=!1):Gt(),x||(M=!1)}function G(){x=!1,v.style.display="none",O.removeAttribute("value"),O.removeAttribute("max"),z||(M=!1)}function bt(){vt(),G()}function V(){return new Ft({networkDelay:C[parseInt(w.value)],targetOffset:document.documentElement.getBoundingClientRect().width,parallax:!0,limitFingerDrag:!0,boostVelocity:!!Tt.checked,targetStopPercent:parseFloat(T.value)})}function zt(){let n=document.documentElement.getBoundingClientRect().width,t=V();t.setDefaultVelocity(),t.startAnimating(0);var e=document.getElementById("plot")??a();let o=e.width/1e3;e.height=n*o;var s=e.getContext("2d");if(!s)return;s.scale(o,o),s.lineWidth=3,s.strokeStyle="black",s.moveTo(0,0);for(var i=0;i<1e3;i++)s.lineTo(i,t.advance(i).fgOffset);s.stroke(),s.strokeStyle="red";let l=n*parseFloat(T.value);s.moveTo(0,l),s.lineTo(1e3,l),s.stroke(),s.strokeStyle="green";let c=C[parseInt(w.value)];s.moveTo(c,0),s.lineTo(c,n),s.stroke()}function S(){let n=parseInt(w.value);qt.innerHTML=Nt[n]+"="+C[n].toString(),D=parseInt(Z.value)/100,N=D+(1-D)/3,Lt.innerHTML=Z.value.toString(),kt.innerHTML=`${100*parseFloat(T.value)}`,b.updateDisplays(),zt(),b=V(),bt()}function Gt(){ft.src=$.src,$.src=U.src,U.src=g[u],u=(u+1)%g.length}function Kt(){mt.style.display="none",lt.style.display="block",ut.style.display="block",at.classList.add("test")}function Wt(){mt.style.display="flex",lt.style.display="none",ut.style.display="none",at.classList.remove("test")}function Jt(){dt.checked?v=ct:v=Bt,O=v.querySelector(".bar")}function Qt(){w.addEventListener("input",S),Z.addEventListener("input",S),T.addEventListener("input",S);let n=document.getElementById("spring80FrequencyResponse")??a(),t=document.getElementById("spring80DampingRatio")??a();n.addEventListener("input",S),t.addEventListener("input",S),At.addEventListener("click",Kt),xt.addEventListener("click",Wt),ft.src=g[u],u=(u+1)%g.length,$.src=g[u],u=(u+1)%g.length,U.src=g[u],u=(u+1)%g.length,dt.addEventListener("change",Jt),S(),window.addEventListener("pointerdown",Ht),window.addEventListener("pointerup",Ut),window.addEventListener("pointermove",_t)}onload=Qt;