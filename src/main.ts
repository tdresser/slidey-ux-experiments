import './style.css'
import { FrictionPhysicsModel } from './FrictionPhysicsModel.ts'
import { fail } from './util.ts';

let animationLock: Animation;
let transition;

let animating = false;
let pointingDown = false;

const scrim = document.getElementById("scrim") ?? fail();
const networkDelayInput = document.getElementById("networkDelayInput") as HTMLInputElement ?? fail();
const modeRadioButtonInputs = Array.from(document.querySelectorAll('input[name="mode"]')).map(x => x as HTMLInputElement);
const networkDelayDisplay = document.getElementById("networkDelayDisplay") as HTMLInputElement ?? fail();

const MODE_80_PERCENT = 0;
const MODE_ZOOM_OUT = 1;
let mode = MODE_80_PERCENT;

function handlePointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement)?.id != "" || animating) {
    return;
  }
  pointingDown = true;

  // @ts-ignore
  transition = document.startViewTransition();
  transition.ready.then(() => {
    animationLock = document.documentElement.animate({}, {
      duration: 100,
      pseudoElement: '::view-transition-new(root)',
    });
    animationLock.pause();
    scrim.style.display = "block";
  });
}

function handlePointerMove(e: PointerEvent) {
  if (!pointingDown) {
    return;
  }

  let offset = physicsModel.pointerMove(e.movementX);
  document.documentElement.style.setProperty("--offset", `${offset}px`);

  let offsetAsPercent = offset / document.documentElement.getBoundingClientRect().width;
  let scrim = 0.3 + (1 - offsetAsPercent) * 0.5;

  document.documentElement.style.setProperty("--scrim", `${scrim}`);
}

function handlePointerUp(_: PointerEvent) {
  if (!pointingDown) {
    return;
  }
  pointingDown = false;

  startAnimation().then(() => {
    // Pretty sure this isn't needed.
    //let maxOffset = document.documentElement.getBoundingClientRect().width;
    //document.documentElement.style.setProperty("--offset", `${maxOffset}px`);

    let scrimOut = document.documentElement.animate([{ '--scrim': 0 }], { duration: 100 });
    scrimOut.finished.then(finishAnimation);
  });
}

let physicsModel: FrictionPhysicsModel = snapshotValues();
finishAnimation()

function advance(finished: (d?: unknown) => void) {
  const advanceResult = physicsModel.advance(finished);
  document.documentElement.style.setProperty("--offset", `${advanceResult.offset}px`);
  if (!advanceResult.done) {
    requestAnimationFrame(() => { advance(finished) });
  }
}

function startAnimation() {
  animating = true;
  return new Promise(resolve => {
    advance(resolve);
  });
}

function finishAnimation() {
  // Reset stuff.
  physicsModel = snapshotValues();
  animating = false;
  document.documentElement.style.setProperty("--offset", '0px');
  document.documentElement.style.setProperty("--vertical-offset", '0px');
  document.documentElement.style.setProperty("--scrim", "0.0");
  if (animationLock) {
    animationLock.play();
  }
  scrim.style.display = "none";
}

function snapshotValues(): FrictionPhysicsModel {
  for (const option of modeRadioButtonInputs) {
    if (option.checked) {
      mode = parseInt(option.value);
    }
  }

  return new FrictionPhysicsModel({
    networkStart: performance.now(),
    networkDelay: parseFloat(networkDelayInput.value),
    maxOffset: document.documentElement.getBoundingClientRect().width,
  });
}

function updateDisplays() {
  networkDelayDisplay.innerHTML = networkDelayInput.value;

  physicsModel.updateDisplays();

  // This is a bit overkill, but with mode switching, these were sometimes getting out of sync.
  physicsModel = snapshotValues();
  finishAnimation();
}

function init() {
  networkDelayInput.addEventListener("input", updateDisplays);

  for (const option of modeRadioButtonInputs) {
    option.addEventListener("click", updateDisplays)
  }
  updateDisplays();

  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointermove", handlePointerMove);
}

onload = init