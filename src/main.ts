import './style.css'
import { SpringPhysicsModel } from './SpringPhysicsModel.ts';
import { PhysicsModel } from './PhysicsModel.ts';
import { fail } from './util.ts';

let animationLock: Animation;
let transition;

let animating = false;
let pointingDown = false;
let aborting = false;
let hasCommitted = false;

// Tracking post commit animations.
let animatingLoadingBar = false;
let animatingScrim = false;

const scrim = document.getElementById("scrim") ?? fail();
const progress = document.getElementById("progress") ?? fail();
const progressContainer = document.getElementById("progressContainer") ?? fail();
const progress_bar = document.getElementById("progress_bar") as HTMLProgressElement ?? fail();
const networkDelayInput = document.getElementById("networkDelayInput") as HTMLInputElement ?? fail();
const networkDelayDisplay = document.getElementById("networkDelayDisplay") as HTMLInputElement ?? fail();
const networkDelayLoadInput = document.getElementById("networkDelayLoadInput") as HTMLInputElement ?? fail();
const networkDelayLoadDisplay = document.getElementById("networkDelayLoadDisplay") as HTMLInputElement ?? fail();
const zoomDisplay = document.getElementById("zoomDisplay") as HTMLInputElement ?? fail();

const settingLoadProgressBar = document.getElementById("settingLoadProgressBar") as HTMLInputElement ?? fail();
const settingParallax = document.getElementById("settingParallax") as HTMLInputElement ?? fail();
const settingLimitFingerDrag = document.getElementById("settingLimitFingerDrag") as HTMLInputElement ?? fail();
const settingZoom = document.getElementById("settingZoom") as HTMLInputElement ?? fail();
const settingBackground = document.getElementById("settingBackground") as HTMLInputElement ?? fail();
const settingProgressAttribution = document.getElementById("settingProgressAttribution") as HTMLInputElement ?? fail();

let lastColor = "lightblue";

let startTime = 0;
let commitTime = 0;
let loadTime = 0;

let bucket = [50, 100, 300, 600, 1200, 2500]; 

let zoom = 1.0;
let pop = 1.0;

// We want to generate the same color if you try swiping back but then abort multiple times in a row.
let seed = 100;
function randomColor() {
  seed = seed+1;
  const rand = ((seed * 185852 + 1) % 34359738337) / 34359738337
  return "#" + Math.floor(rand*16777215).toString(16);
}

function getBackgroundColorForNextPage() {
  if (!!settingBackground.checked)
    return "white";
  return randomColor();
}

function delayToFullLoadMs() {
  let commitDelay = bucket[parseInt(networkDelayInput.value)];
  let loadDelay = bucket[parseInt(networkDelayLoadInput.value)];
  return Math.max(commitDelay, loadDelay);
}

function handlePointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement)?.id != "" || animating) {
    return;
  }
  pointingDown = true;
  physicsModel = initPhysics();

  // @ts-ignore
  transition = document.startViewTransition();
  transition.ready.then(() => {
    lastColor = document.documentElement.style.getPropertyValue("--main-background-color");
    document.documentElement.style.setProperty("--main-background-color", getBackgroundColorForNextPage());
    animationLock = document.documentElement.animate({}, {
      duration: 0,
      pseudoElement: '::view-transition-new(root)',
    });
    animationLock.pause();
    scrim.style.display = "block";
  });
}

function offsetToScrimPercent(offset:number) {
  let offsetAsPercent = offset / document.documentElement.getBoundingClientRect().width;
  return 0.3 + (1 - offsetAsPercent) * 0.5;
}

let popped = false;

function handlePointerMove(e: PointerEvent) {
  if (!pointingDown) {
    return;
  }

  let moveResult = physicsModel.pointerMove(e);
  document.documentElement.style.setProperty("--fg-offset", `${moveResult.fgOffset}px`);
  document.documentElement.style.setProperty("--bg-offset", `${moveResult.bgOffset}px`);
  document.documentElement.style.setProperty("--scrim", `${offsetToScrimPercent(moveResult.fgOffset)}`);

  updateZoom(moveResult.fgOffset);
  updatePop(moveResult.fgOffset);
}

function updateZoom(offset: number) {
  let offsetAsPercent = offset / document.documentElement.getBoundingClientRect().width;
  let fgScale = 1.0 - (1.0 - pop) * offsetAsPercent;
  document.documentElement.style.setProperty("--fg-scale", `${fgScale}`);
}
function updatePop(offset:number) {
  let offsetAsPercent = offset / document.documentElement.getBoundingClientRect().width;
  if(offsetAsPercent > 0.5) {
    if(!popped) {
      let anim = document.documentElement.animate([{ '--bg-scale': pop }], { duration: 100, fill: "forwards" });
      anim.finished.then(() => {anim.commitStyles(); anim.cancel();});
      popped = true;
    }
  } else {
    if(popped) {
      let anim = document.documentElement.animate([{ '--bg-scale': zoom }], { duration: 100, fill: "forwards" });
      anim.finished.then(() => {anim.commitStyles(); anim.cancel();});
      popped = false;
    }
  }
}

function handlePointerUp(e: PointerEvent) {
  if (!pointingDown) {
    return;
  }
  pointingDown = false;
  hasCommitted = false;
  const aborted = physicsModel.pointerUp(e) == "abort";
  if (aborted) {
    animateOnAbort();
    // Reset the color when the animation finished.
    aborting = true;
    seed--;
  }

  startAnimation().then(animatePostCommitOrAbort);
}

function animateOnCommit() {
  let anim = document.documentElement.animate([{ '--fg-scale': pop, '--bg-scale': 1.0 }], { duration: 100, fill: "forwards" });
  anim.finished.then(() => {anim.commitStyles(); anim.cancel();});
}

function animateOnAbort() {
  let anim = document.documentElement.animate([{ '--fg-scale': 1.0, '--bg-scale': zoom }], { duration: 100, fill: "forwards" });
  anim.finished.then(() => {anim.commitStyles(); anim.cancel();});
}

function animatePostCommitOrAbort() {
  // scrim animation for screenshot to live, defaults to 100ms.
  animatingScrim = true;
  let scrimOut = document.documentElement.animate([{ '--scrim': 0 }], { duration: 100 });
  scrimOut.finished.then(finishScrimAnimation);

  animatingLoadingBar = !!settingLoadProgressBar.checked && !aborting;
  if (animatingLoadingBar) {
    animateLoadingProgressBar();
  } else {
    finishLoadingBarAnimation();
  }
}

function animateLoadingProgressBar() {
  let currentTime = performance.now();
  if (currentTime >= loadTime) {
    finishLoadingBarAnimation();
    return;
  }

  progress.style.display = "block";
  progress_bar.max = loadTime - startTime;
  progress_bar.value = currentTime - startTime;
  requestAnimationFrame(animateLoadingProgressBar);
}

let physicsModel: PhysicsModel = initPhysics();
finishAllAnimation();

function advance(rafTime: number, finished: (d?: unknown) => void) {
  const advanceResult = physicsModel.advance(rafTime);
  document.documentElement.style.setProperty("--fg-offset", `${advanceResult.fgOffset}px`);
  document.documentElement.style.setProperty("--bg-offset", `${advanceResult.bgOffset}px`);
  document.documentElement.style.setProperty("--scrim", `${offsetToScrimPercent(advanceResult.fgOffset)}`);
  updateZoom(advanceResult.fgOffset);
  if (rafTime-startTime > 800) {
     progress.style.display = "block";
  }
  if (advanceResult.hasCommitted && !hasCommitted) {
    animateOnCommit();
    hasCommitted = true;
  }
  if (advanceResult.done) {
    finished();
  } else {
    requestAnimationFrame((rafTime) => { advance(rafTime, finished) });
  }
}

function startAnimation() {
  animating = true;
  startTime = performance.now();
  commitTime = startTime + parseFloat(networkDelayInput.value);
  loadTime = startTime + delayToFullLoadMs();
  console.log("start : " + startTime + " commit : " + commitTime + " load : " + loadTime);
  physicsModel.startAnimating(startTime);
  return new Promise(resolve => {
    advance(performance.now(), resolve);
  });
}

function finishScrimAnimation() {
  animatingScrim = false;
  document.documentElement.style.setProperty("--fg-offset", '0px');
  document.documentElement.style.setProperty("--vertical-offset", '0px');
  document.documentElement.style.setProperty("--scrim", "0.0");
  document.documentElement.style.setProperty("--bg-scale", zoom.toString());  
  document.documentElement.style.setProperty("--fg-scale", "1.0");

  if (aborting) {
    document.documentElement.style.setProperty("--main-background-color", lastColor);
    aborting = false;
  }

  if (animationLock) {
    animationLock.play();
  }
  scrim.style.display = "none";

  if (!animatingLoadingBar)
    animating = false;
}

function finishLoadingBarAnimation() {
  animatingLoadingBar = false;
  progress.style.display = "none";
  progress_bar.removeAttribute('value');
  progress_bar.removeAttribute('max');

  if (!animatingScrim)
    animating = false;
}

function finishAllAnimation() {
  finishScrimAnimation();
  finishLoadingBarAnimation();
}

function initPhysics(): PhysicsModel {
  return new SpringPhysicsModel({
    networkDelay: bucket[parseInt(networkDelayInput.value)],
    targetOffset: document.documentElement.getBoundingClientRect().width,
    parallax: !!settingParallax.checked,
    limitFingerDrag: !!settingLimitFingerDrag.checked,
  });
}

function updateDisplays() {
  networkDelayDisplay.innerHTML = bucket[parseInt(networkDelayInput.value)].toString();
  networkDelayLoadDisplay.innerHTML = delayToFullLoadMs().toString();
  zoom = parseInt(settingZoom.value)/100.0;
  pop = zoom + (1.0 - zoom)/3; // 1/3 betwen zoom to 1.0
  zoomDisplay.innerHTML = settingZoom.value.toString();

  physicsModel.updateDisplays();

  // This is a bit overkill, but with mode switching, these were sometimes getting out of sync.
  physicsModel = initPhysics();
  finishAllAnimation();
}

function changeProgressAttribution() {
  if (settingProgressAttribution.checked) {
    progressContainer.classList.add("attributed");
  } else {
    progressContainer.classList.remove("attributed");
  }
}

function init() {
  networkDelayInput.addEventListener("input", updateDisplays);
  networkDelayLoadInput.addEventListener("input", updateDisplays);
  settingZoom.addEventListener("input", updateDisplays);
  settingProgressAttribution.addEventListener("change", changeProgressAttribution);
  updateDisplays();

  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointermove", handlePointerMove);
}

onload = init
