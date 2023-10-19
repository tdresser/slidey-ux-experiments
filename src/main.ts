import './style.css'
import { SpringPhysicsModel } from './SpringPhysicsModel.ts';
import { PhysicsModel } from './PhysicsModel.ts';
import { fail } from './util.ts';


let animating = false;
let pointingDown = false;
let aborting = false;
let hasCommitted = false;

// Tracking post commit animations.
let animatingLoadingBar = false;
let animatingScrim = false;

interface Screenshot {
  main: string,
  precommit?: string,
}

let screenshots: Screenshot[] = [
  { main: "resources/srp-couches.png" },
  { main: "resources/pants-hemming-srp.png", precommit: "resources/pants-srp.png" },
  { main: "resources/srp-cats.png" },
  { main: "resources/banana-pie-srp.png" },
  { main: "resources/goo.gl-stock-a.png", precommit: "resources/goo.gl-stock-b.png" },
  { main: "resources/news-frontpage.png" },
  { main: "resources/news-article.png" },
]
let nextImgIndex = 0;

const body = document.body ?? fail();
const scrim = document.getElementById("scrim") ?? fail();
const globalProgress = document.getElementById("globalProgress") ?? fail();
const attributedProgress = document.getElementById("attributedProgress") ?? fail();
const networkDelayInput = document.getElementById("networkDelayInput") as HTMLInputElement ?? fail();
const networkDelayDisplay = document.getElementById("networkDelayDisplay") as HTMLInputElement ?? fail();
const zoomDisplay = document.getElementById("zoomDisplay") as HTMLInputElement ?? fail();
const buttonTest = document.getElementById("buttonTest") as HTMLInputElement ?? fail();
const buttonSettings = document.getElementById("buttonSettings") as HTMLInputElement ?? fail();
const settingsPanel = document.getElementById("settingsPanel") ?? fail();
const screenshotsContainer = document.getElementById("screenshots") ?? fail();
const targetStopDisplay = document.getElementById("targetStopDisplay") ?? fail();

const frontimg = document.getElementById("frontimg")?.querySelector("img") as HTMLImageElement ?? fail();
const midimg = document.getElementById("midimg")?.querySelector("img") as HTMLImageElement ?? fail();
const midimgprecommit = document.getElementById("midimgprecommit")?.querySelector("img") as HTMLImageElement ?? fail();

const settingZoom = document.getElementById("settingZoom") as HTMLInputElement ?? fail();
const settingProgressAttribution = document.getElementById("settingProgressAttribution") as HTMLInputElement ?? fail();
const settingUnloadHandler = document.getElementById("settingUnloadHandler") as HTMLInputElement ?? fail();
const settingBoostVelocity = document.getElementById("settingBoostVelocity") as HTMLInputElement ?? fail();
const settingTargetStop = document.getElementById("settingTargetStop") as HTMLInputElement ?? fail();
const settingFadeForeground = document.getElementById("settingFadeForeground") as HTMLInputElement ?? fail();


let progress = attributedProgress;
let progress_bar = progress.querySelector(".bar") as HTMLProgressElement;

let lastColor = "lightblue";

let startTime = 0;
let commitTime = 0;
let loadTime = 0;

let bucket_name = ["P25", "P50", "P75", "P90", "P95", "P99"];
let bucket = [30, 100, 330, 660, 1000, 2360];

let zoom = 1.0;
let pop = 1.0;

function delayToFullLoadMs() {
  let commitDelay = bucket[parseInt(networkDelayInput.value)];
  return commitDelay * 2;
}

function handlePointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement)?.classList[0] != "screenshot" || animating) {
    return;
  }
  pointingDown = true;
  physicsModel = initPhysics();
}

function offsetToScrimPercent(offsetAsPercent: number) {
  return 0.3 + (1 - offsetAsPercent) * 0.5;
}

let popped = false;

function handlePointerMove(e: PointerEvent) {
  if (!pointingDown) {
    return;
  }

  let moveResult = physicsModel.pointerMove(e);
  console.log(moveResult);

  let fgOffsetAsPercent = moveResult.fgOffset / document.documentElement.getBoundingClientRect().width;

  document.documentElement.style.setProperty("--fg-offset", `${moveResult.fgOffset}px`);
  document.documentElement.style.setProperty("--bg-offset", `${moveResult.bgOffset}px`);
  document.documentElement.style.setProperty("--scrim", `${offsetToScrimPercent(fgOffsetAsPercent)}`);

  applyFilter(fgOffsetAsPercent);

  updateZoom(moveResult.fgOffset);
  updatePop(moveResult.fgOffset);
}

function updateZoom(offset: number) {
  let offsetAsPercent = offset / document.documentElement.getBoundingClientRect().width;
  let fgScale = 1.0 - (1.0 - pop) * offsetAsPercent;
  document.documentElement.style.setProperty("--fg-scale", `${fgScale}`);
}
function updatePop(offset: number) {
  let offsetAsPercent = offset / document.documentElement.getBoundingClientRect().width;
  if (offsetAsPercent > 0.5) {
    if (!popped) {
      let anim = document.documentElement.animate([{ '--bg-scale': pop }], { duration: 100, fill: "forwards" });
      anim.finished.then(() => { anim.commitStyles(); anim.cancel(); });
      popped = true;
    }
  } else {
    if (popped) {
      let anim = document.documentElement.animate([{ '--bg-scale': zoom }], { duration: 100, fill: "forwards" });
      anim.finished.then(() => { anim.commitStyles(); anim.cancel(); });
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
  } else if (settingUnloadHandler.checked) {
    let offset = document.documentElement.style.getPropertyValue("--fg-offset");
    let scale = document.documentElement.style.getPropertyValue("--fg-scale");
    let p20 = document.documentElement.getBoundingClientRect().width * 10 / 100;
    let anim = document.documentElement.animate([{ '--fg-scale': 1.0, '--fg-offset': p20 + 'px' }], { duration: 300, fill: "forwards" });
    anim.finished.then(() => {
      anim.commitStyles();
      anim.cancel();
      if (window.confirm("are you sure you want to leave this page?  It's very nice.")) {
        let anim = document.documentElement.animate([{ '--fg-scale': scale, '--fg-offset': offset }], { duration: 200, fill: "forwards" });
        anim.finished.then(() => {
          anim.commitStyles();
          anim.cancel();
          animateOnAbort();
          startAnimation().then(animatePostCommitOrAbort);
        });
      }
    });
    return;
  }

  startAnimation().then(animatePostCommitOrAbort);
}

function animateOnCommit() {
  let anim = document.documentElement.animate([{ '--fg-scale': pop, '--bg-scale': 1.0 }], { duration: 100, fill: "forwards" });
  console.log("SET OPACITY TO 0");
  anim.finished.then(() => { anim.commitStyles(); anim.cancel(); });
  const midimgprecommitAnim = midimgprecommit.animate({ opacity: 0 }, { duration: 100, fill: "forwards" });
  midimgprecommitAnim.finished.then(() => {midimgprecommitAnim.commitStyles(); midimgprecommitAnim.cancel()});

}

function animateOnAbort() {
  let anim = document.documentElement.animate([{ '--fg-scale': 1.0, '--bg-scale': zoom }], { duration: 100, fill: "forwards" });
  anim.finished.then(() => { anim.commitStyles(); anim.cancel(); });
}

function animatePostCommitOrAbort() {
  // scrim animation for screenshot to live, defaults to 100ms.
  animatingScrim = true;
  let scrimOut = document.documentElement.animate([{ '--scrim': 0 }], { duration: 100 });
  scrimOut.finished.then(finishScrimAnimation);

  animatingLoadingBar = !aborting;
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

  let fgOffsetAsPercent = advanceResult.fgOffset / document.documentElement.getBoundingClientRect().width;
  const scrimBase = offsetToScrimPercent(fgOffsetAsPercent);
  applyFilter(fgOffsetAsPercent);
  const scrim = scrimBase + 0.1 * Math.sin((rafTime - startTime) / 200);
  document.documentElement.style.setProperty("--scrim", `${scrim}`);
  updateZoom(advanceResult.fgOffset);
  if (rafTime - startTime > 800) {
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
  midimgprecommit.style.opacity = "1";

  if (aborting) {
    document.documentElement.style.setProperty("--main-background-color", lastColor);
    aborting = false;
  } else {
    rotateImgs();
  }

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
    parallax: true,
    limitFingerDrag: true,
    boostVelocity: !!settingBoostVelocity.checked,
    targetStopPercent: parseFloat(settingTargetStop.value)
  });
}

function plot() {
  let width = document.documentElement.getBoundingClientRect().width;
  let physicsModel: PhysicsModel = initPhysics();

  physicsModel.setDefaultVelocity();
  physicsModel.startAnimating(0);

  var c = document.getElementById("plot") as HTMLCanvasElement ?? fail();
  let scale = c.width / 1000.0;
  c.height = width * scale;
  var ctx = c.getContext("2d");
  if (!ctx) return;

  ctx.scale(scale, scale);
  ctx.lineWidth = 3;

  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (var x = 0; x < 1000; x++) {
    ctx.lineTo(x, physicsModel.advance(x).fgOffset);
  }
  ctx.stroke();

  // draw the stop point
  ctx.strokeStyle = 'red';
  let stop = width * parseFloat(settingTargetStop.value);
  ctx.beginPath();
  ctx.moveTo(0, stop);
  ctx.lineTo(1000, stop);
  ctx.stroke();

  // draw the commit point
  ctx.strokeStyle = 'green';
  let commitDelay = bucket[parseInt(networkDelayInput.value)];
  ctx.beginPath();
  ctx.moveTo(commitDelay, 0);
  ctx.lineTo(commitDelay, width);
  ctx.stroke();

}


function updateDisplays() {
  let bucketIndex = parseInt(networkDelayInput.value);
  networkDelayDisplay.innerHTML = bucket_name[bucketIndex] + "=" + bucket[bucketIndex].toString();
  zoom = parseInt(settingZoom.value) / 100.0;
  pop = zoom + (1.0 - zoom) / 3; // 1/3 betwen zoom to 1.0
  zoomDisplay.innerHTML = settingZoom.value.toString();

  targetStopDisplay.innerHTML = `${100 * parseFloat(settingTargetStop.value)}`;

  physicsModel.updateDisplays();
  plot();

  // This is a bit overkill, but with mode switching, these were sometimes getting out of sync.
  physicsModel = initPhysics();
  finishAllAnimation();
}

// `progress` is in the 0-1 range meaning how far off is the top page
function applyFilter(progress: number) {
  if (settingFadeForeground.checked) {
    frontimg.style.filter = `grayscale(${progress})`
  }
}

function rotateImgs() {
  frontimg.style.filter = ""
  frontimg.src = midimg.src;
  midimg.src = screenshots[nextImgIndex].main;
  midimgprecommit.src = screenshots[nextImgIndex].precommit ?? "";

  nextImgIndex = (nextImgIndex + 1) % screenshots.length;
}

function runTest() {
  settingsPanel.style.display = "none";
  scrim.style.display = "block";
  screenshotsContainer.style.display = "block";
  body.classList.add("test");
}

function stopTest() {
  settingsPanel.style.display = "flex";
  scrim.style.display = "none";
  screenshotsContainer.style.display = "none";
  body.classList.remove("test");
}

function changeProgressAttribution() {
  if (!settingProgressAttribution.checked) {
    progress = globalProgress;
  } else {
    progress = attributedProgress;
  }
  progress_bar = progress.querySelector(".bar") as HTMLProgressElement;
}

function init() {
  networkDelayInput.addEventListener("input", updateDisplays);
  settingZoom.addEventListener("input", updateDisplays);
  settingTargetStop.addEventListener("input", updateDisplays);
  settingBoostVelocity.addEventListener("input", updateDisplays);

  let spring80FrequencyResponseInput = document.getElementById("spring80FrequencyResponse") as HTMLInputElement ?? fail();
  let spring80DampingRatioInput = document.getElementById("spring80DampingRatio") as HTMLInputElement ?? fail();
  let hookAtInput = document.getElementById("hookAt") as HTMLInputElement ?? fail();

  spring80FrequencyResponseInput.addEventListener("input", updateDisplays);
  spring80DampingRatioInput.addEventListener("input", updateDisplays);
  hookAtInput.addEventListener("input", updateDisplays);

  buttonTest.addEventListener("click", runTest);
  buttonSettings.addEventListener("click", stopTest);

  frontimg.src = screenshots[nextImgIndex].main;
  nextImgIndex = (nextImgIndex + 1) % screenshots.length;
  midimg.src = screenshots[nextImgIndex].main;
  midimgprecommit.src = screenshots[nextImgIndex].precommit ?? "";
  nextImgIndex = (nextImgIndex + 1) % screenshots.length;

  settingProgressAttribution.addEventListener("change", changeProgressAttribution);
  updateDisplays();

  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointermove", handlePointerMove);
}
onload = init
