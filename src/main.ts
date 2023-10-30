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
const dragCurveInput = document.getElementById("dragCurve") as HTMLSelectElement ?? fail();
const chevron = document.getElementById("chevron") as HTMLElement ?? fail();
const chevronContainer = document.getElementById("chevronContainer") as HTMLElement ?? fail();
const settingChevron = document.getElementById("settingChevron") as HTMLInputElement ?? fail();
const presetInput = document.getElementById("preset") as HTMLInputElement ?? fail();

const frontimg = document.getElementById("frontimg")?.querySelector("img") as HTMLImageElement ?? fail();
const midimg = document.getElementById("midimg")?.querySelector("img") as HTMLImageElement ?? fail();
const midimgprecommit = document.getElementById("midimgprecommit")?.querySelector("img") as HTMLImageElement ?? fail();

const settingZoom = document.getElementById("settingZoom") as HTMLInputElement ?? fail();
const settingProgressAttribution = document.getElementById("settingProgressAttribution") as HTMLInputElement ?? fail();
const settingUnloadHandler = document.getElementById("settingUnloadHandler") as HTMLInputElement ?? fail();
const settingBoostVelocity = document.getElementById("settingBoostVelocity") as HTMLInputElement ?? fail();
const settingTargetStop = document.getElementById("settingTargetStop") as HTMLInputElement ?? fail();
const settingFadeForeground = document.getElementById("settingFadeForeground") as HTMLInputElement ?? fail();
const settingWobble = document.getElementById("settingWobble") as HTMLInputElement ?? fail();
const settingSlowDrift = document.getElementById("settingSlowDrift") as HTMLInputElement ?? fail();
const settingPulseScrim = document.getElementById("settingPulseScrim") as HTMLInputElement;
const settingPostpone = document.getElementById("settingPostpone") as HTMLInputElement ?? fail();
const settingParallaxTo80 = document.getElementById("settingParallaxTo80") as HTMLInputElement ?? fail();

let progress = attributedProgress;
let progress_bar = progress.querySelector(".bar") as HTMLProgressElement;
let globalBar = globalProgress.querySelector(".bar") as HTMLProgressElement;

let startTime = 0;
let loadTime = 0;

let bucket_name = ["P25", "P50", "P75", "P90", "P95", "P99"];
let bucket = [30, 100, 330, 660, 1000, 2360];

function formatPercentile(ms: number): string {
  let i=0; 
  while(ms>bucket[i]) i++;
  if (i==0) return "<P25"; 
  if (i==6) return ">P99";
  return ">"+bucket_name[i-1];
}

let zoom = 1.0;
let pop = 1.0;

let snapping = false;

parseQuery();

interface StringByString {
  [key: string]: string;
}

let initialState: StringByString = {};
saveInitialState();

function saveInitialState() {
  let inputs = document.querySelectorAll("input");
  for (const input of inputs) {
    if (input) {
      if (input.type == "checkbox") {
        initialState[input.id] = input.checked.toString();
      } else {
        initialState[input.id] = input.value;
      }
    }
  }
  let selects = document.querySelectorAll("select");
  for (const select of selects) {
    initialState[select.id] = select.value;
  }
}

function parseQuery() {
  console.log("PARSE");
  var url_string = window.location.href;
  var url = new URL(url_string);
  for(const [ key, value ] of url.searchParams) {
    console.log(key, value); 
    if (key == "runTest") {
      runTest();
    }
    let element = document.getElementById(key);
    if(!element) continue;
    if(element.nodeName == "INPUT") {
      let input = element as HTMLInputElement;
      if (input.type == "checkbox") {
        input.checked = (value == "true");
      } else {
        input.value = value;
      }
    }
  }
}

function updateQuery() {
  const url = new URL(window.location.toString());

  let inputs = document.querySelectorAll("input");
  for (const input of inputs) {
    if (input) {
      if (input.type == "checkbox") {
        if(initialState[input.id] != input.checked.toString()) {
          url.searchParams.set(input.id, input.checked.toString());
        } else {
          url.searchParams.delete(input.id);
        }
      } else {
        if(initialState[input.id] != input.value) {
          url.searchParams.set(input.id, input.value);
        } else {
          url.searchParams.delete(input.id);
        }
      }
    }
  }
  let selects = document.querySelectorAll("select");
  for (const select of selects) {
    url.searchParams.set(select.id, select.value);
  }
  console.log("UPDATE");
  for(const [ key, value ] of url.searchParams) {
    console.log(key, value); 
  }
  window.history.replaceState({}, '', url);
}

interface Preset {
  [key: string]: StringByString;
}

// configs
// Quick Bounce: https://tdresser.github.io/slidey-ux-experiments/?settingPostpone=true&spring80DampingRatio=1.2&preserveMinOscillation=0.04
// Slow Bounce: https://tdresser.github.io/slidey-ux-experiments/?settingPostpone=true&spring80FrequencyResponse=800&spring80DampingRatio=1.2&preserveMinOscillation=0.04
// Steady: https://tdresser.github.io/slidey-ux-experiments/?spring80FrequencyResponse=680&spring80DampingRatio=0.92
// Drift: https://tdresser.github.io/slidey-ux-experiments/?spring80FrequencyResponse=800&settingSlowDrift=true

let presets: Preset = {
  "quickBounce": {
    "settingPostpone": "true",
    "settingPulseScrim": "true",
    "spring80FrequencyResponse": "400", 
    "preserveMinOscillation": "0.02"
  },
  "slowBounce": {
    "settingPostpone": "true",
    "spring80FrequencyResponse": "800", 
    "spring80DampingRatio": "1.2",
    "preserveMinOscillation": "0.04"
  },
  "steady": {
    "spring80FrequencyResponse": "680", 
    "spring80DampingRatio": "0.92"
  },
  "drift": {
    "spring80FrequencyResponse": "800",
    "settingSlowDrift": "true"
  },
  "none": {
  }
};

function applySettings(settings: StringByString) {
  for (const key in settings) {
    let element = document.getElementById(key);
    if(!element) continue;
    if(element.nodeName == "INPUT") {
      let value = settings[key];
      let input = element as HTMLInputElement;
      if (input.type == "checkbox") {
        input.checked = (value == "true");
      } else {
        input.value = value;
      }
    }
  }
}

function applyPreset(name: string) {
  applySettings(initialState);
  applySettings(presets[name]);
}

function delayToFullLoadMs() {
  let commitDelay = parseInt(networkDelayInput.value);
  return Math.min(Math.max(commitDelay + 500, commitDelay * 2), commitDelay + 1000);
}

function handlePointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement)?.classList[0] != "screenshot" || (animating && !animatingLoadingBar)) {
    return;
  }

  // Stop all animations if we're starting a new one.
  aborting = true;
  finishAllAnimation();

  pointingDown = true;
  physicsModel = initPhysics();
  physicsModel.pointerDown(e);
}

function offsetToScrimPercent(offsetAsPercent: number) {
  return 0.3 + (1 - offsetAsPercent) * 0.5;
}

let popped = false;

let lastPointerMoveEvent : PointerEvent | null = null;
let chevronAccumulator : number = 0;
let chevronMaxValue : number = 50;

function handlePointerMove(e: PointerEvent) {
  if (!pointingDown) {
    return;
  }

  if (!lastPointerMoveEvent) {
    lastPointerMoveEvent = e;
  }
  let dx = e.x - lastPointerMoveEvent.x;
  lastPointerMoveEvent = e;
  chevronAccumulator = Math.min(Math.max(chevronAccumulator + dx, 0), chevronMaxValue);
  updateChevron(chevronAccumulator / chevronMaxValue);

  let moveResult = physicsModel.pointerMove(e);

  let fgOffsetAsPercent = moveResult.fgOffset / document.documentElement.getBoundingClientRect().width;

  document.documentElement.style.setProperty("--fg-offset", `${moveResult.fgOffset}px`);
  document.documentElement.style.setProperty("--bg-offset", `${moveResult.bgOffset}px`);
  document.documentElement.style.setProperty("--scrim", `${offsetToScrimPercent(fgOffsetAsPercent)}`);

  applyFilter(fgOffsetAsPercent);

  updateZoom(moveResult.fgOffset);
  updatePop(moveResult.fgOffset);
}

let chevronPop : boolean = false;

function updateChevron(percent: number) {
  if (!settingChevron.checked)
    percent = 0;

  chevronContainer.style.display = "block";
  if (percent > 0.7) {
    chevronContainer.style.left = "25px";
    chevronContainer.style.borderRadius = "50%";
    chevronContainer.style.width = getComputedStyle(chevronContainer).height;
    chevron.style.opacity = "1";
    if (!chevronPop) {
      navigator.vibrate(1);
      chevronPop = true;
    }
  } else if (percent > 0.1) {
    chevronPop = false;
    chevronContainer.style.left = "1px";
    chevronContainer.style.borderRadius = "15px"
    chevronContainer.style.width = `${chevronContainer.getBoundingClientRect().height * (percent - 0.1) / 0.6}px`;
    chevron.style.opacity = `${Math.min(Math.max((percent - 0.5) / 0.2, 0), 1)}`;
  } else {
    chevronPop = false;
    chevronContainer.style.display = "none";
    chevron.style.opacity = "0";
  }
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

let lastPointerUpEvent : PointerEvent | null = null;

function handlePointerUp(e: PointerEvent) {
  if (snapping) {
    lastPointerUpEvent = e;
    return;
  }
  lastPointerUpEvent = null;

  lastPointerMoveEvent = null;
  updateChevron(0);
  chevronAccumulator = 0;

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
    let anim = document.documentElement.animate([{ '--fg-scale': 1.0, '--fg-offset': '0px' }], { duration: 300, fill: "forwards" });
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
  anim.finished.then(() => { anim.commitStyles(); anim.cancel(); });
  const midimgprecommitAnim = midimgprecommit.animate({ opacity: 0 }, { duration: 100, fill: "forwards" });
  midimgprecommitAnim.finished.then(() => { midimgprecommitAnim.commitStyles(); midimgprecommitAnim.cancel() });

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
  if (!animatingLoadingBar) {
    return;
  }

  let currentTime = performance.now();
  if (currentTime >= loadTime) {
    finishLoadingBarAnimation();
    return;
  }

  globalProgress.style.display = "block";
  globalBar.max = loadTime - startTime;
  globalBar.value = currentTime - startTime;
  requestAnimationFrame(animateLoadingProgressBar);
}

let physicsModel: PhysicsModel = initPhysics();
finishAllAnimation();

let pulseScrim = !!settingPulseScrim.checked;

function advance(rafTime: number, finished: (d?: unknown) => void) {
  const advanceResult = physicsModel.advance(rafTime);
  document.documentElement.style.setProperty("--fg-offset", `${advanceResult.fgOffset}px`);
  document.documentElement.style.setProperty("--bg-offset", `${advanceResult.bgOffset}px`);

  let fgOffsetAsPercent = advanceResult.fgOffset / document.documentElement.getBoundingClientRect().width;
  const scrimBase = offsetToScrimPercent(fgOffsetAsPercent);
  applyFilter(fgOffsetAsPercent);
  let scrim = scrimBase;
  if (pulseScrim) {
    scrim += 0.1 * Math.sin(2 * Math.PI * (rafTime - startTime) / 1000 + Math.PI);
  }
  document.documentElement.style.setProperty("--scrim", `${scrim}`);
  updateZoom(advanceResult.fgOffset);
  if (rafTime - startTime > 350) {
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
  loadTime = startTime + delayToFullLoadMs();
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

  if (!aborting) {
    rotateImgs();
  }
  aborting = false;

  if (!animatingLoadingBar)
    animating = false;
}

function finishLoadingBarAnimation() {
  animatingLoadingBar = false;
  progress.style.display = "none";
  progress_bar.removeAttribute('value');
  progress_bar.removeAttribute('max');

  globalProgress.style.display = "none";
  globalBar.removeAttribute("value");
  globalBar.removeAttribute("max");

  if (!animatingScrim)
    animating = false;
}

function finishAllAnimation() {
  finishLoadingBarAnimation();
  finishScrimAnimation();
}

function initPhysics(): PhysicsModel {
  const width = document.documentElement.getBoundingClientRect().width;
  const targetStopPercent = parseFloat(settingTargetStop.value);

  let fingerDragCurve = (x: number) => x;
  if (dragCurveInput.value == "linear80") {
    // Linear to targetStopPercent; assumes no "overdrag" like on mobile sim
    fingerDragCurve = (x: number) => x * targetStopPercent;
  } else if (dragCurveInput.value == "linearelastic") {
    fingerDragCurve = (x: number) => {
      const percent = x / width;
      const startSlowing = 0.7;
      if (percent < startSlowing) {
        return x;
      } else {
        return (startSlowing + (percent - startSlowing) / 20) * width;
      }
    }
  } else if (dragCurveInput.value == "snapto") {
    let lastOffset = 0;
    let lastAccumulation = 0;
    let lastX = -999;
    snapping = physicsModel.setSnapping(false);
    let snapTarget = -1;
    let snapSpeed = 4;
    let direction = 1;
    let dxHistory : number[] = [];

    fingerDragCurve = (x: number) => {
      if (lastX == -999)
        lastX = x;
      let dx = x - lastX;
      lastX = x;

      // If we're snapping, just move quick to target.
      if (snapping) {
        if (lastOffset < snapTarget * width) {
          lastOffset += snapSpeed;
          if (lastOffset >= snapTarget * width) {
            lastOffset = snapTarget * width;
            snapping = physicsModel.setSnapping(false);
            lastAccumulation = 0;
            if (lastPointerUpEvent !== null) {
              handlePointerUp(lastPointerUpEvent);
            }
          }
        } else if (lastOffset > snapTarget * width) {
          lastOffset -= snapSpeed;
          if (lastOffset <= snapTarget * width) {
            lastOffset = snapTarget * width;
            snapping = physicsModel.setSnapping(false);
            lastAccumulation = 0;
            if (lastPointerUpEvent !== null) {
              handlePointerUp(lastPointerUpEvent);
            }
          }
        }
      }

      // If we're still snapping, it means we need to animate.
      if (snapping) {
        requestAnimationFrame(() => {
          if (snapping) {
            if (lastPointerMoveEvent !== null) {
              handlePointerMove(lastPointerMoveEvent);
            } else {
            }
          }
        });
        return lastOffset;
      } 

      // Debounce direction.
      dxHistory.push(dx);
      if (dxHistory.length > 5)
        dxHistory.shift();
      let oppositeCount = 0;
      for (let i of dxHistory) {
        if (i * direction < 0)
          oppositeCount++
      }
      // Reset accumulation if we're sure we switched directions.
      if (oppositeCount == dxHistory.length) {
        direction = -direction;
        lastAccumulation = 0;
      }

      lastAccumulation += dx;

      // Snap to 80 if we moved 10% of the screen to the right.
      if (snapTarget < targetStopPercent && lastAccumulation / width > 0.1) {
        snapTarget = targetStopPercent;
        snapping = physicsModel.setSnapping(true);
        requestAnimationFrame(() => {
          if (lastPointerMoveEvent !== null) {
            handlePointerMove(lastPointerMoveEvent);
          }
        });
      }
      // Snap back to 0 if we moved 5% of the screen to the left.
      else if (snapTarget > 0 && lastAccumulation / width < -0.05) {
        snapTarget = 0;
        snapping = physicsModel.setSnapping(true);
        requestAnimationFrame(() => {
          if (lastPointerMoveEvent !== null) {
            handlePointerMove(lastPointerMoveEvent);
          }
        });
      }
      // We're not snapping, so move very gradually
      else {
        lastOffset += 0.1 * dx;
      }
      return lastOffset;
    };
  }

  let result = new SpringPhysicsModel({
    networkDelay: parseInt(networkDelayInput.value),
    targetOffset: width,
    parallax: true,
    fingerDragCurve: fingerDragCurve,
    boostVelocity: !!settingBoostVelocity.checked,
    targetStopPercent: targetStopPercent
  });
  result.setMode(dragCurveInput.value);
  result.setParallaxTo80(!!settingParallaxTo80.checked);
  return result;
}

function plot() {
  let width = document.documentElement.getBoundingClientRect().width;
  let physicsModel: PhysicsModel = initPhysics();

  physicsModel.setDefaultVelocity();
  physicsModel.startAnimating(0);

  var c = document.getElementById("plot") as HTMLCanvasElement ?? fail();
  //let scale = c.width / 1000.0;
  //c.height = width * scale;
  var ctx = c.getContext("2d");
  if (!ctx) return;

  ctx.save();
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.scale(c.width/2000.0, c.height/width);
  ctx.lineWidth = 3;

  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (var x = 0; x < 2000; x++) {
    ctx.lineTo(x, physicsModel.advance(x).fgOffset);
  }
  ctx.stroke();

  // draw the stop point
  ctx.strokeStyle = 'red';
  let stop = width * parseFloat(settingTargetStop.value);
  ctx.beginPath();
  ctx.moveTo(0, stop);
  ctx.lineTo(2000, stop);
  ctx.stroke();

  // draw the commit point
  ctx.strokeStyle = 'green';
  let commitDelay = parseInt(networkDelayInput.value);
  ctx.beginPath();
  ctx.moveTo(commitDelay, 0);
  ctx.lineTo(commitDelay, width);
  ctx.stroke();

  ctx.restore();
}

function updateDelay() {
  let delay = parseInt(networkDelayInput.value);
  networkDelayDisplay.innerHTML = delay + "ms " + formatPercentile(delay);
}

function updateDisplays( resetPreset = true ) {
  updateQuery();

  updateDelay();

  zoom = parseInt(settingZoom.value) / 100.0;
  pop = zoom + (1.0 - zoom) / 3; // 1/3 betwen zoom to 1.0
  zoomDisplay.innerHTML = settingZoom.value.toString();

  pulseScrim = !!settingPulseScrim.checked;

  targetStopDisplay.innerHTML = `${100 * parseFloat(settingTargetStop.value)}`;

  physicsModel.updateDisplays();
  plot();

  // This is a bit overkill, but with mode switching, these were sometimes getting out of sync.
  physicsModel = initPhysics();
  finishAllAnimation();

  if(resetPreset) {
    presetInput.value = "none";
  }
}

function updatePreset() {
  let presetName = presetInput.value;
  if (presetName != "custom") {
    applyPreset(presetName);
  }
  updateDisplays(false);
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
  document.documentElement.style.setProperty("--main-background-color", `#202020`);
  body.classList.add("test");
}

function stopTest() {
  settingsPanel.style.display = "flex";
  scrim.style.display = "none";
  screenshotsContainer.style.display = "none";
  document.documentElement.style.setProperty("--main-background-color", `white`);
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
  let inputs = document.querySelectorAll("input");
  for (const input of inputs) {
    if (input.id != "networkDelayInput") {
      input.addEventListener("input", () => updateDisplays());
    }
  }
  networkDelayInput.addEventListener("input", updateDelay);
  settingZoom.addEventListener("input", () => updateDisplays());
  settingTargetStop.addEventListener("input", () => updateDisplays());
  settingBoostVelocity.addEventListener("input", () => updateDisplays());
  dragCurveInput.addEventListener("change", () => updateDisplays());
  presetInput.addEventListener("change", updatePreset);

  let spring80FrequencyResponseInput = document.getElementById("spring80FrequencyResponse") as HTMLInputElement ?? fail();
  let spring80DampingRatioInput = document.getElementById("spring80DampingRatio") as HTMLInputElement ?? fail();
  let preserveMinOscillationInput = document.getElementById("preserveMinOscillation") as HTMLInputElement ?? fail();
  let hookAtInput = document.getElementById("hookAt") as HTMLInputElement ?? fail();

  spring80FrequencyResponseInput.addEventListener("input", () => updateDisplays());
  spring80DampingRatioInput.addEventListener("input", () => updateDisplays());
  preserveMinOscillationInput.addEventListener("input", () => updateDisplays());
  hookAtInput.addEventListener("input", () => updateDisplays());

  settingWobble.addEventListener("input", () => updateDisplays());
  settingSlowDrift.addEventListener("input", () => updateDisplays());
  settingPulseScrim.addEventListener("input", () => updateDisplays());
  settingPostpone.addEventListener("input", () => updateDisplays());

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
