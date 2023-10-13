import './style.css'
import { SpringPhysicsModel } from './SpringPhysicsModel.ts';
import { PhysicsModel } from './PhysicsModel.ts';
import { fail } from './util.ts';

let animationLock: Animation;
let transition;

let animating = false;
let pointingDown = false;
let aborting = false;

const scrim = document.getElementById("scrim") ?? fail();
const progress = document.getElementById("progress") ?? fail();
const networkDelayInput = document.getElementById("networkDelayInput") as HTMLInputElement ?? fail();
const networkDelayDisplay = document.getElementById("networkDelayDisplay") as HTMLInputElement ?? fail();

const settingParallax = document.getElementById("settingParallax") as HTMLInputElement ?? fail();
const settingLimitFingerDrag = document.getElementById("settingLimitFingerDrag") as HTMLInputElement ?? fail();

let lastColor = "lightblue";

let startTime = 0;

let buckets = ["P25","P50","P75","P90","P95","P99"];
let times = [31,101,328,665,1003,2358];

// We want to generate the same color if you try swiping back but then abort multiple times in a row.
let seed = 100;
function randomColor() {
  seed = seed+1;
  const rand = ((seed * 185852 + 1) % 34359738337) / 34359738337
  return "#" + Math.floor(rand*16777215).toString(16);
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
    document.documentElement.style.setProperty("--main-background-color", randomColor());
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

function handlePointerMove(e: PointerEvent) {
  if (!pointingDown) {
    return;
  }

  let moveResult = physicsModel.pointerMove(e);
  document.documentElement.style.setProperty("--fg-offset", `${moveResult.fgOffset}px`);
  document.documentElement.style.setProperty("--bg-offset", `${moveResult.bgOffset}px`);
  document.documentElement.style.setProperty("--scrim", `${offsetToScrimPercent(moveResult.fgOffset)}`);
}

function handlePointerUp(e: PointerEvent) {
  if (!pointingDown) {
    return;
  }
  pointingDown = false;
  const aborted = physicsModel.pointerUp(e) == "abort";
  if (aborted) {
    // Reset the color when the animation finished.
    aborting = true;
    seed--;
  }

  startAnimation().then(() => {
    let scrimOut = document.documentElement.animate([{ '--scrim': 0 }], { duration: 100 });
    scrimOut.finished.then(finishAnimation);
  });
}

let physicsModel: PhysicsModel = initPhysics();

finishAnimation()

function advance(rafTime: number, finished: (d?: unknown) => void) {
  const advanceResult = physicsModel.advance(rafTime);
  document.documentElement.style.setProperty("--fg-offset", `${advanceResult.fgOffset}px`);
  document.documentElement.style.setProperty("--bg-offset", `${advanceResult.bgOffset}px`);
  document.documentElement.style.setProperty("--scrim", `${offsetToScrimPercent(advanceResult.fgOffset)}`);
  if (rafTime-startTime > 800) {
     progress.style.display = "block";
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
  physicsModel.startAnimating(startTime);
  return new Promise(resolve => {
    advance(performance.now(), resolve);
  });
}

function finishAnimation() {
  // Reset stuff.
  animating = false;
  document.documentElement.style.setProperty("--fg-offset", '0px');
  document.documentElement.style.setProperty("--vertical-offset", '0px');
  document.documentElement.style.setProperty("--scrim", "0.0");

  if (aborting) {
    document.documentElement.style.setProperty("--main-background-color", lastColor);
    aborting = false;
  }

  if (animationLock) {
    animationLock.play();
  }
  scrim.style.display = "none";
  progress.style.display = "none";
}

function initPhysics(): PhysicsModel {
  return new SpringPhysicsModel({
    networkDelay: times[parseInt(networkDelayInput.value)],
    targetOffset: document.documentElement.getBoundingClientRect().width,
    parallax: !!settingParallax.checked,
    limitFingerDrag: !!settingLimitFingerDrag.checked,
  });
}

function updateDisplays() {
  let bucket = parseInt(networkDelayInput.value);
  console.log(bucket);
  networkDelayDisplay.innerHTML = buckets[bucket] + "=" + times[bucket];

  physicsModel.updateDisplays();

  // This is a bit overkill, but with mode switching, these were sometimes getting out of sync.
  physicsModel = initPhysics();
  finishAnimation();
}

function init() {
  networkDelayInput.addEventListener("input", updateDisplays);
  updateDisplays();

  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointermove", handlePointerMove);
}

onload = init
