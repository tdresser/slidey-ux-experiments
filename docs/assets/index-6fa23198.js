var Vt=Object.defineProperty;var Ht=(e,n,t)=>n in e?Vt(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var a=(e,n,t)=>(Ht(e,typeof n!="symbol"?n+"":n,t),t),dt=(e,n,t)=>{if(!n.has(e))throw TypeError("Cannot "+t)};var u=(e,n,t)=>(dt(e,n,"read from private field"),t?t.call(e):n.get(e)),T=(e,n,t)=>{if(n.has(e))throw TypeError("Cannot add the same private member more than once");n instanceof WeakSet?n.add(e):n.set(e,t)},N=(e,n,t,s)=>(dt(e,n,"write to private field"),s?s.call(e,t):n.set(e,t),t);(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();class _t{constructor(n){a(this,"animationStartTime",0);a(this,"animationStartOffset",0);a(this,"networkDelay");a(this,"maxOffset");a(this,"offset",0);a(this,"parallax");a(this,"fingerDragCurve");a(this,"boostVelocity");a(this,"targetStopPercent");a(this,"loadStart",0);a(this,"snapping",!1);this.networkDelay=n.networkDelay,this.maxOffset=n.targetOffset,this.parallax=n.parallax,this.fingerDragCurve=n.fingerDragCurve,this.boostVelocity=n.boostVelocity,this.targetStopPercent=n.targetStopPercent}setSnapping(n){return this.snapping=n,n}startAnimating(n){this.loadStart=n,this.animationStartTime=n,this.animationStartOffset=this.offset}restartAnimating(n){this.animationStartTime=n,this.animationStartOffset=this.offset}pointerUp(n){return"success"}committed(n){return n-this.loadStart>=this.networkDelay}}function Ut(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var It={exports:{}};(function(e){(function(){e.exports=n;function n(t,s,i,o){typeof i=="object"&&(o=i,i=!1),typeof o>"u"&&(o={});for(var c=0,l=0,I=0,g=0,d=t.length,h=0;h<d;++h)c+=t[h],l+=s[h],I+=t[h]*s[h],g+=t[h]*t[h];if(o.m=(I-c*l/d)/(g-c*c/d),o.b=l/d-o.m*c/d,i){for(var O=0,b=0;b<d;++b)O+=(s[b]-o.b-o.m*t[b])*(s[b]-o.b-o.m*t[b]);var C=d*g-c*c,ut=1/(d-2)*O;o.bErr=Math.sqrt(ut/C*g),o.mErr=Math.sqrt(d/C*ut)}return function(Nt){return o.m*Nt+o.b}}})()})(It);var $t=It.exports;const Wt=Ut($t);function r(){throw new Error("missing element")}function bt(e){let n={m:0};const t=e.map(i=>i.offset),s=e.map(i=>i.time);return Wt(s,t,!1,n),n.m,n.m}const mt=10,Zt=10;class Y{constructor(n){a(this,"mass",1);a(this,"initialVelocity",0);a(this,"dampingRatio");a(this,"undampedNaturalFrequency");a(this,"dampedNaturalFrequency");a(this,"lastNFrames");a(this,"name");a(this,"overshootCurve",n=>n);a(this,"preserveMinOscillation",0);const t=(2*Math.PI/n.frequencyResponse)**2*this.mass;this.undampedNaturalFrequency=Math.sqrt(t/this.mass),this.dampedNaturalFrequency=this.undampedNaturalFrequency*Math.sqrt(Math.abs(1-n.dampingRatio**2)),this.dampingRatio=n.dampingRatio,this.lastNFrames=[],this.name=n.name,n.overshootCurve&&(this.overshootCurve=n.overshootCurve)}position(n,t){const s=this.undampedNaturalFrequency*this.dampingRatio,i=this.dampedNaturalFrequency,o=(this.initialVelocity+s*n)/i,c=n;let l=(this.preserveMinOscillation+Math.exp(-s*t))*(o*Math.sin(i*t)+c*Math.cos(i*t));if(l<0&&(l=this.overshootCurve(l)),isNaN(l)||!isFinite(l))throw"Spring config invalid. Position: "+l;this.lastNFrames.push({offset:l,time:t});let I=!1;if(this.lastNFrames.length>mt){this.lastNFrames.shift();let g=0;for(let d of this.lastNFrames)g+=d.offset*d.offset;I=g<Zt*mt}return l<1&&(I=!0),{offset:l,done:I}}velocity(){return bt(this.lastNFrames)}}var S,f,D;class zt extends _t{constructor(t){super(t);T(this,S,void 0);T(this,f,void 0);T(this,D,void 0);a(this,"lastRaf",null);a(this,"hasCommitted",!1);a(this,"hasAborted",!1);a(this,"pointerHistory",[]);a(this,"snapping",!1);a(this,"mode","");a(this,"parallaxTo80",!1);a(this,"spring80FrequencyResponseInput",document.getElementById("spring80FrequencyResponse")??r());a(this,"spring80FrequencyResponseDisplay",document.getElementById("spring80FrequencyResponseDisplay")??r());a(this,"spring80DampingRatioInput",document.getElementById("spring80DampingRatio")??r());a(this,"spring80DampingRatioDisplay",document.getElementById("spring80DampingRatioDisplay")??r());a(this,"preserveMinOscillationInput",document.getElementById("preserveMinOscillation")??r());a(this,"preserveMinOscillationDisplay",document.getElementById("preserveMinOscillationDisplay")??r());a(this,"hookAtInput",document.getElementById("hookAt")??r());a(this,"hookAtDisplay",document.getElementById("hookAtDisplay")??r());a(this,"spring80FrequencyResponse",parseFloat(this.spring80FrequencyResponseInput.value));a(this,"spring80DampingRatio",parseFloat(this.spring80DampingRatioInput.value));a(this,"preserveMinOscillation",parseFloat(this.preserveMinOscillationInput.value));a(this,"hookAtPercent",parseFloat(this.hookAtInput.value));a(this,"hooked",!1);a(this,"pointerDownX",0);a(this,"dontBounceBackpageInput",document.getElementById("settingDontBounceBackpage")??r());a(this,"dontBounceBackpage",!!this.dontBounceBackpageInput.checked);a(this,"wobbleInput",document.getElementById("settingWobble")??r());a(this,"wobble",!!this.wobbleInput.checked);a(this,"slowDriftInput",document.getElementById("settingSlowDrift")??r());a(this,"slowDrift",!!this.slowDriftInput.checked);a(this,"postponeInput",document.getElementById("settingPostpone")??r());a(this,"postpone",!!this.postponeInput.checked);a(this,"postponed",0);this.animationStartOffset=0,this.spring80FrequencyResponseInput.addEventListener("input",()=>this.updateDisplays()),this.spring80DampingRatioInput.addEventListener("input",()=>this.updateDisplays()),this.preserveMinOscillationInput.addEventListener("input",()=>this.updateDisplays()),this.hookAtInput.addEventListener("input",()=>this.updateDisplays()),this.dontBounceBackpageInput.addEventListener("input",()=>this.updateDisplays()),this.wobbleInput.addEventListener("input",()=>this.updateDisplays()),this.slowDriftInput.addEventListener("input",()=>this.updateDisplays()),this.postponeInput.addEventListener("input",()=>this.updateDisplays()),N(this,S,new Y({frequencyResponse:200,dampingRatio:.95,name:"100%"})),N(this,f,new Y({frequencyResponse:this.spring80FrequencyResponse,dampingRatio:this.spring80DampingRatio,name:"80%"})),u(this,f).preserveMinOscillation=parseFloat(this.preserveMinOscillationInput.value),N(this,D,new Y({frequencyResponse:200,dampingRatio:.9,name:"0%"}))}updateDisplays(){this.spring80FrequencyResponseDisplay.innerHTML=this.spring80FrequencyResponseInput.value,this.spring80DampingRatioDisplay.innerHTML=this.spring80DampingRatioInput.value,this.preserveMinOscillationDisplay.innerHTML=this.preserveMinOscillationInput.value,this.hookAtDisplay.innerHTML=this.hookAtInput.value,this.dontBounceBackpage=!!this.dontBounceBackpageInput.checked,this.wobble=!!this.wobbleInput.checked,this.slowDrift=!!this.slowDriftInput.checked,u(this,f).preserveMinOscillation=parseFloat(this.preserveMinOscillationInput.value),this.postpone=!!this.postponeInput.checked}advance(t){t=t,!this.hasCommitted&&this.committed(t)&&(this.postpone&&(u(this,f).velocity()>0?this.postponed||(this.postponed=t):this.postponed=0),this.postponed||(this.restartAnimating(this.lastRaf||t),this.hasCommitted=!0,this.hooked?u(this,S).initialVelocity=u(this,f).velocity():(this.hooked=!0,u(this,S).initialVelocity=u(this,f).initialVelocity),isNaN(u(this,S).initialVelocity)&&(u(this,S).initialVelocity=-2)));let s=t-this.animationStartTime;this.postponed&&(s+=t-this.postponed);let i=null;if(!this.hooked)this.offset=this.animationStartOffset-s*u(this,f).initialVelocity;else if(this.hasAborted)i=u(this,D).position(this.animationStartOffset,s),this.offset=Math.max(i.offset,0);else if(this.hasCommitted)i=u(this,S).position(this.maxOffset-this.animationStartOffset,s),this.offset=this.maxOffset-i.offset;else{let l=this.targetStopPercent;this.slowDrift&&(l-=.25),i=u(this,f).position(this.maxOffset*l-this.animationStartOffset,s),this.offset=this.maxOffset*l-i.offset}!this.hooked&&this.offset>this.maxOffset*this.hookAtPercent/100&&(this.restartAnimating(this.lastRaf||t),this.hooked=!0,this.animationStartOffset=this.offset);let o=i?i.done:!1;if(this.wobble&&!this.hasCommitted&&(this.offset+=this.maxOffset*.02*Math.sin(2*Math.PI*s/1e3)),this.slowDrift&&!this.hasCommitted){let l=this.maxOffset*.25;this.offset+=l-l*1e3/(s+1e3)}let c=this.offset;return this.dontBounceBackpage&&(i=u(this,D).position(this.maxOffset-this.animationStartOffset,t-this.loadStart),c=this.maxOffset-Math.max(i.offset,0)),this.lastRaf=t,{done:o&&(this.hasCommitted||this.hasAborted),fgOffset:this.offset,bgOffset:this.fgToBgOffset(c),hasCommitted:this.hasCommitted}}pointerDown(t){this.pointerDownX=t.clientX}pointerMove(t){return this.offset=this.fingerDragCurve(t.clientX-this.pointerDownX),this.pointerHistory.push({offset:this.offset,time:t.timeStamp}),this.pointerHistory.length>10&&this.pointerHistory.shift(),this.offset<0&&(this.offset=0),{done:!1,fgOffset:this.offset,bgOffset:this.fgToBgOffset(this.offset),hasCommitted:!1}}fgToBgOffset(t){let s=0;return this.parallax?this.parallaxTo80?s=.25*(t-this.targetStopPercent*this.maxOffset):s=.25*(t-this.maxOffset):s=0,Math.min(0,s)}setDefaultVelocity(){this.offset=this.maxOffset/4,u(this,f).initialVelocity=this.boostVelocity?-1:-.5}setSnapping(t){return this.snapping=t,t}setMode(t){this.mode=t}setParallaxTo80(t){this.parallaxTo80=t}pointerUp(t){let s;return!this.snapping&&this.mode=="snapto"?s=0:(s=bt(this.pointerHistory),this.boostVelocity&&(s=Math.max(s,1)),s=Math.min(s,2.5),s=Math.max(s,.3)),u(this,D).initialVelocity=-s,(this.offset+s*100)/this.maxOffset<.3||s<-.1?(this.hasAborted=!0,u(this,D).initialVelocity=-s,"abort"):(u(this,f).initialVelocity=-s,"success")}}S=new WeakMap,f=new WeakMap,D=new WeakMap;let z=!1,$=!1,q=!1,tt=!1,x=!1,at=!1,w=[{main:"resources/srp-couches.png"},{main:"resources/pants-hemming-srp.png",precommit:"resources/pants-srp.png"},{main:"resources/srp-cats.png"},{main:"resources/banana-pie-srp.png"},{main:"resources/goo.gl-stock-a.png",precommit:"resources/goo.gl-stock-b.png"},{main:"resources/news-frontpage.png"},{main:"resources/news-article.png"}],y=0;const Pt=document.body??r(),St=document.getElementById("scrim")??r(),X=document.getElementById("globalProgress")??r(),wt=document.getElementById("attributedProgress")??r(),F=document.getElementById("networkDelayInput")??r(),Xt=document.getElementById("networkDelayDisplay")??r(),Gt=document.getElementById("zoomDisplay")??r(),Qt=document.getElementById("buttonTest")??r(),Kt=document.getElementById("buttonSettings")??r(),Dt=document.getElementById("settingsPanel")??r(),Bt=document.getElementById("screenshots")??r(),Jt=document.getElementById("targetStopDisplay")??r(),A=document.getElementById("dragCurve")??r(),j=document.getElementById("chevron")??r(),E=document.getElementById("chevronContainer")??r(),Yt=document.getElementById("settingChevron")??r(),jt=document.getElementById("preset")??r();var yt;const W=((yt=document.getElementById("frontimg"))==null?void 0:yt.querySelector("img"))??r();var vt;const et=((vt=document.getElementById("midimg"))==null?void 0:vt.querySelector("img"))??r();var Et;const G=((Et=document.getElementById("midimgprecommit"))==null?void 0:Et.querySelector("img"))??r(),nt=document.getElementById("settingZoom")??r(),Ot=document.getElementById("settingProgressAttribution")??r(),te=document.getElementById("settingUnloadHandler")??r(),kt=document.getElementById("settingBoostVelocity")??r(),Q=document.getElementById("settingTargetStop")??r(),ee=document.getElementById("settingFadeForeground")??r(),ne=document.getElementById("settingWobble")??r(),se=document.getElementById("settingSlowDrift")??r(),rt=document.getElementById("settingPulseScrim"),ie=document.getElementById("settingPostpone")??r(),oe=document.getElementById("settingParallaxTo80")??r();let M=wt,st=M.querySelector(".bar"),Z=X.querySelector(".bar"),B=0,it=0,ae=["P25","P50","P75","P90","P95","P99"],re=[30,100,330,660,1e3,2360];function le(e){let n=0;for(;e>re[n];)n++;return n==0?"<P25":n==6?">P99":">"+ae[n-1]}let R=1,K=1,P=!1;ue();let L={};ce();function ce(){let e=document.querySelectorAll("input");for(const t of e)t&&(t.type=="checkbox"?L[t.id]=t.checked.toString():L[t.id]=t.value);let n=document.querySelectorAll("select");for(const t of n)L[t.id]=t.value}function ue(){console.log("PARSE");var e=window.location.href,n=new URL(e);for(const[t,s]of n.searchParams){console.log(t,s),t=="runTest"&&Tt();let i=document.getElementById(t);if(i&&i.nodeName=="INPUT"){let o=i;o.type=="checkbox"?o.checked=s=="true":o.value=s}}}function de(){const e=new URL(window.location.toString());let n=document.querySelectorAll("input");for(const s of n)s&&(s.type=="checkbox"?L[s.id]!=s.checked.toString()?e.searchParams.set(s.id,s.checked.toString()):e.searchParams.delete(s.id):L[s.id]!=s.value?e.searchParams.set(s.id,s.value):e.searchParams.delete(s.id));let t=document.querySelectorAll("select");for(const s of t)e.searchParams.set(s.id,s.value);console.log("UPDATE");for(const[s,i]of e.searchParams)console.log(s,i);window.history.replaceState({},"",e)}function me(){let e=parseInt(F.value);return Math.min(Math.max(e+500,e*2),e+1e3)}function fe(e){var n;((n=e.target)==null?void 0:n.classList[0])!="screenshot"||z&&!x||(q=!0,ct(),$=!0,p=J(),p.pointerDown(e))}function Mt(e){return .3+(1-e)*.5}let V=!1,v=null,_=0,ft=50;function U(e){if(!$)return;v||(v=e);let n=e.x-v.x;v=e,_=Math.min(Math.max(_+n,0),ft),Rt(_/ft);let t=p.pointerMove(e),s=t.fgOffset/document.documentElement.getBoundingClientRect().width;document.documentElement.style.setProperty("--fg-offset",`${t.fgOffset}px`),document.documentElement.style.setProperty("--bg-offset",`${t.bgOffset}px`),document.documentElement.style.setProperty("--scrim",`${Mt(s)}`),Ct(s),xt(t.fgOffset),pe(t.fgOffset)}let H=!1;function Rt(e){Yt.checked||(e=0),E.style.display="block",e>.7?(E.style.left="25px",E.style.borderRadius="50%",E.style.width=getComputedStyle(E).height,j.style.opacity="1",H||(navigator.vibrate(1),H=!0)):e>.1?(H=!1,E.style.left="1px",E.style.borderRadius="15px",E.style.width=`${E.getBoundingClientRect().height*(e-.1)/.6}px`,j.style.opacity=`${Math.min(Math.max((e-.5)/.2,0),1)}`):(H=!1,E.style.display="none",j.style.opacity="0")}function xt(e){let n=e/document.documentElement.getBoundingClientRect().width,t=1-(1-K)*n;document.documentElement.style.setProperty("--fg-scale",`${t}`)}function pe(e){if(e/document.documentElement.getBoundingClientRect().width>.5){if(!V){let t=document.documentElement.animate([{"--bg-scale":K}],{duration:100,fill:"forwards"});t.finished.then(()=>{t.commitStyles(),t.cancel()}),V=!0}}else if(V){let t=document.documentElement.animate([{"--bg-scale":R}],{duration:100,fill:"forwards"});t.finished.then(()=>{t.commitStyles(),t.cancel()}),V=!1}}let k=null;function ot(e){if(P){k=e;return}if(k=null,v=null,Rt(0),_=0,!$)return;if($=!1,tt=!1,p.pointerUp(e)=="abort")pt(),q=!0;else if(te.checked){let t=document.documentElement.style.getPropertyValue("--fg-offset"),s=document.documentElement.style.getPropertyValue("--fg-scale"),i=document.documentElement.animate([{"--fg-scale":1,"--fg-offset":"0px"}],{duration:300,fill:"forwards"});i.finished.then(()=>{if(i.commitStyles(),i.cancel(),window.confirm("are you sure you want to leave this page?  It's very nice.")){let o=document.documentElement.animate([{"--fg-scale":s,"--fg-offset":t}],{duration:200,fill:"forwards"});o.finished.then(()=>{o.commitStyles(),o.cancel(),pt(),gt().then(ht)})}});return}gt().then(ht)}function he(){let e=document.documentElement.animate([{"--fg-scale":K,"--bg-scale":1}],{duration:100,fill:"forwards"});e.finished.then(()=>{e.commitStyles(),e.cancel()});const n=G.animate({opacity:0},{duration:100,fill:"forwards"});n.finished.then(()=>{n.commitStyles(),n.cancel()})}function pt(){let e=document.documentElement.animate([{"--fg-scale":1,"--bg-scale":R}],{duration:100,fill:"forwards"});e.finished.then(()=>{e.commitStyles(),e.cancel()})}function ht(){at=!0,document.documentElement.animate([{"--scrim":0}],{duration:100}).finished.then(Ft),x=!q,x?At():lt()}function At(){if(!x)return;let e=performance.now();if(e>=it){lt();return}X.style.display="block",Z.max=it-B,Z.value=e-B,requestAnimationFrame(At)}let p=J();ct();let Lt=!!rt.checked;function qt(e,n){const t=p.advance(e);document.documentElement.style.setProperty("--fg-offset",`${t.fgOffset}px`),document.documentElement.style.setProperty("--bg-offset",`${t.bgOffset}px`);let s=t.fgOffset/document.documentElement.getBoundingClientRect().width;const i=Mt(s);Ct(s);let o=i;Lt&&(o+=.1*Math.sin(2*Math.PI*(e-B)/1e3+Math.PI)),document.documentElement.style.setProperty("--scrim",`${o}`),xt(t.fgOffset),e-B>350&&(M.style.display="block"),t.hasCommitted&&!tt&&(he(),tt=!0),t.done?n():requestAnimationFrame(c=>{qt(c,n)})}function gt(){return z=!0,B=performance.now(),it=B+me(),p.startAnimating(B),new Promise(e=>{qt(performance.now(),e)})}function Ft(){at=!1,document.documentElement.style.setProperty("--fg-offset","0px"),document.documentElement.style.setProperty("--vertical-offset","0px"),document.documentElement.style.setProperty("--scrim","0.0"),document.documentElement.style.setProperty("--bg-scale",R.toString()),document.documentElement.style.setProperty("--fg-scale","1.0"),G.style.opacity="1",q||ve(),q=!1,x||(z=!1)}function lt(){x=!1,M.style.display="none",st.removeAttribute("value"),st.removeAttribute("max"),X.style.display="none",Z.removeAttribute("value"),Z.removeAttribute("max"),at||(z=!1)}function ct(){lt(),Ft()}function J(){const e=document.documentElement.getBoundingClientRect().width,n=parseFloat(Q.value);let t=i=>i;if(A.value=="linear80")t=i=>i*n;else if(A.value=="linearelastic")t=i=>{const o=i/e,c=.7;return o<c?i:(c+(o-c)/20)*e};else if(A.value=="snapto"){let i=0,o=0,c=-999;P=p.setSnapping(!1);let l=-1,I=4,g=1,d=[];t=h=>{c==-999&&(c=h);let O=h-c;if(c=h,P&&(i<l*e?(i+=I,i>=l*e&&(i=l*e,P=p.setSnapping(!1),o=0,k!==null&&ot(k))):i>l*e&&(i-=I,i<=l*e&&(i=l*e,P=p.setSnapping(!1),o=0,k!==null&&ot(k)))),P)return requestAnimationFrame(()=>{P&&v!==null&&U(v)}),i;d.push(O),d.length>5&&d.shift();let b=0;for(let C of d)C*g<0&&b++;return b==d.length&&(g=-g,o=0),o+=O,l<n&&o/e>.1?(l=n,P=p.setSnapping(!0),requestAnimationFrame(()=>{v!==null&&U(v)})):l>0&&o/e<-.05?(l=0,P=p.setSnapping(!0),requestAnimationFrame(()=>{v!==null&&U(v)})):i+=.1*O,i}}let s=new zt({networkDelay:parseInt(F.value),targetOffset:e,parallax:!0,fingerDragCurve:t,boostVelocity:!!kt.checked,targetStopPercent:n});return s.setMode(A.value),s.setParallaxTo80(!!oe.checked),s}function ge(){let e=document.documentElement.getBoundingClientRect().width,n=J();n.setDefaultVelocity(),n.startAnimating(0);var t=document.getElementById("plot")??r(),s=t.getContext("2d");if(!s)return;s.save(),s.clearRect(0,0,t.width,t.height),s.scale(t.width/2e3,t.height/e),s.lineWidth=3,s.strokeStyle="black",s.beginPath(),s.moveTo(0,0);for(var i=0;i<2e3;i++)s.lineTo(i,n.advance(i).fgOffset);s.stroke(),s.strokeStyle="red";let o=e*parseFloat(Q.value);s.beginPath(),s.moveTo(0,o),s.lineTo(2e3,o),s.stroke(),s.strokeStyle="green";let c=parseInt(F.value);s.beginPath(),s.moveTo(c,0),s.lineTo(c,e),s.stroke(),s.restore()}function m(){de();let e=parseInt(F.value);Xt.innerHTML=e+"ms "+le(e),R=parseInt(nt.value)/100,K=R+(1-R)/3,Gt.innerHTML=nt.value.toString(),Lt=!!rt.checked,Jt.innerHTML=`${100*parseFloat(Q.value)}`,p.updateDisplays(),ge(),p=J(),ct()}function ye(){}function Ct(e){ee.checked&&(W.style.filter=`grayscale(${e})`)}function ve(){W.style.filter="",W.src=et.src,et.src=w[y].main,G.src=w[y].precommit??"",y=(y+1)%w.length}function Tt(){Dt.style.display="none",St.style.display="block",Bt.style.display="block",document.documentElement.style.setProperty("--main-background-color","#202020"),Pt.classList.add("test")}function Ee(){Dt.style.display="flex",St.style.display="none",Bt.style.display="none",document.documentElement.style.setProperty("--main-background-color","white"),Pt.classList.remove("test")}function Ie(){Ot.checked?M=wt:M=X,st=M.querySelector(".bar")}function be(){let e=document.querySelectorAll("input");for(const o of e)o.addEventListener("input",m);F.addEventListener("input",m),nt.addEventListener("input",m),Q.addEventListener("input",m),kt.addEventListener("input",m),A.addEventListener("change",m),jt.addEventListener("change",ye);let n=document.getElementById("spring80FrequencyResponse")??r(),t=document.getElementById("spring80DampingRatio")??r(),s=document.getElementById("preserveMinOscillation")??r(),i=document.getElementById("hookAt")??r();n.addEventListener("input",m),t.addEventListener("input",m),s.addEventListener("input",m),i.addEventListener("input",m),ne.addEventListener("input",m),se.addEventListener("input",m),rt.addEventListener("input",m),ie.addEventListener("input",m),Qt.addEventListener("click",Tt),Kt.addEventListener("click",Ee),W.src=w[y].main,y=(y+1)%w.length,et.src=w[y].main,G.src=w[y].precommit??"",y=(y+1)%w.length,Ot.addEventListener("change",Ie),m(),window.addEventListener("pointerdown",fe),window.addEventListener("pointerup",ot),window.addEventListener("pointermove",U)}onload=be;
