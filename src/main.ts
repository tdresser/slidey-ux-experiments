import './style.css'
import { setupCounter } from './counter.ts'

let animationLock: Animation;
let transition;

let networkStart: number;
let animating = false;
let pointingDown = false;

function fail(): never {
  throw new Error("missing element");
}

const scrim = document.getElementById("scrim") ?? fail();
const networkDelayInput = document.getElementById("networkDelayInput") as HTMLInputElement ?? fail();
const stopRatioInput = document.getElementById("stopRatioInput") as HTMLInputElement ?? fail();
const frictionRatioInput = document.getElementById("frictionRatioInput") as HTMLInputElement ?? fail();
const frictionCoeffInput = document.getElementById("frictionCoeffInput") as HTMLInputElement ?? fail();
const minVelocityInput = document.getElementById("minVelocityInput") as HTMLInputElement ?? fail();
const maxVelocityInput = document.getElementById("maxVelocityInput") as HTMLInputElement ?? fail();
const modeRadioButtonInputs = Array.from(document.querySelectorAll('input[name="mode"]')).map(x => x as HTMLInputElement);

const networkDelayDisplay = document.getElementById("networkDelayDisplay") as HTMLInputElement ?? fail();
const stopRatioDisplay = document.getElementById("stopRatioDisplay") as HTMLInputElement ?? fail();
const frictionRatioDisplay = document.getElementById("frictionRatioDisplay") as HTMLInputElement ?? fail();
const frictionCoeffDisplay = document.getElementById("frictionCoeffDisplay") as HTMLInputElement ?? fail();
const minVelocityDisplay = document.getElementById("minVelocityDisplay") as HTMLInputElement ?? fail();
const maxVelocityDisplay = document.getElementById("maxVelocityDisplay") as HTMLInputElement ?? fail();

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

const maxOffset = document.documentElement.getBoundingClientRect().width;
let offset = 0;
finishAnimation()

function handlePointerMove(e: PointerEvent) {
  if (!pointingDown) {
    return;
  }

  offset += e.movementX;
  if (offset < 0) {
    offset = 0;
  }
  document.documentElement.style.setProperty("--offset", `${offset}px`);

  let offsetAsPercent = offset / document.documentElement.getBoundingClientRect().width;
  let scrim = 0.3 + (1 - offsetAsPercent) * 0.5;

  if (mode == MODE_80_PERCENT) {
    document.documentElement.style.setProperty("--scrim", `${scrim}`);
  }
}

function handlePointerUp(_: PointerEvent) {
  if (!pointingDown) {
    return;
  }
  pointingDown = false;

  // TODO: Tim doesn't understand why this is needed, as we should be snapshotting after every modification.
  snapshotValues();

  startAnimation().then(() => {
    // Pretty sure this isn't needed.
    //let maxOffset = document.documentElement.getBoundingClientRect().width;
    //document.documentElement.style.setProperty("--offset", `${maxOffset}px`);

    let scrimOut = document.documentElement.animate([{ '--scrim': 0 }], { duration: 100 });
    scrimOut.finished.then(finishAnimation);
  });
}

let networkDelay: number;

interface AdvanceResult {
  done: boolean,
}

interface PhysicsModel {
  advance(finished: (d?: unknown) => void): AdvanceResult;
};

class FrictionPhysicsModel implements PhysicsModel {
  stopRatio: number;
  frictionRatio: number;
  frictionCoeff: number;
  minVelocity: number;
  maxVelocity: number;
  velocity: number;

  constructor() {
    this.stopRatio = parseFloat(stopRatioInput.value);
    this.frictionRatio = parseFloat(frictionRatioInput.value);
    this.frictionCoeff = parseFloat(frictionCoeffInput.value);
    this.minVelocity = parseFloat(minVelocityInput.value);
    this.maxVelocity = parseFloat(maxVelocityInput.value);
    this.velocity = this.maxVelocity;
  }

  advance(finished: (d?: unknown) => void): AdvanceResult {
    console.log("TICK");
    let target = maxOffset;
    offset += this.velocity;

    // Is the page committed?
    let committed = (performance.now() - networkStart) >= networkDelay;
    let done = false;
    if (committed) {
      // We should be speeding up, but at least start with min velocity.
      if (this.velocity < this.minVelocity) {
        this.velocity = this.minVelocity;
      } else if (offset >= target) {
        // We've reached the end!
        offset = target;
        done = true;
        console.log("Reached the end");
        finished();
      } else if (this.velocity < this.maxVelocity) {
        // Keep speeding up by inverse of friction up until max velocity.
        this.velocity = this.velocity / (1 - this.frictionCoeff);
        if (this.velocity >= this.maxVelocity) {
          this.velocity = this.maxVelocity;
        }
      }
    } else {
      // If we're at the stop point, drop the velocity to 0.
      if (offset >= target * this.stopRatio) {
        offset = target * this.stopRatio;
        this.velocity = 0;
      } else if (offset > target * this.frictionRatio) {
        // We've entered the friction zone, so start slowing down until min velocity.
        this.velocity = this.velocity * (1 - this.frictionCoeff);
        if (this.velocity < this.minVelocity) {
          this.velocity = this.minVelocity;
        }
      }
    }

    document.documentElement.style.setProperty("--offset", `${offset}px`);

    return {
      done,
    }
  }
}

let physicsModel = new FrictionPhysicsModel();

function advance(finished: (d?: unknown) => void) {
  const advanceResult = physicsModel.advance(finished);
  console.log(advanceResult);
  if (!advanceResult.done) {
    console.log("REQUEST;")
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
  offset = 0;
  animating = false;
  document.documentElement.style.setProperty("--offset", `${offset}px`);
  document.documentElement.style.setProperty("--vertical-offset", '0px');
  document.documentElement.style.setProperty("--scrim", "0.0");
  if (animationLock) {
    animationLock.play();
  }
  scrim.style.display = "none";
}

function snapshotValues() {
  networkStart = performance.now()
  networkDelay = parseFloat(networkDelayInput.value);

  for (const option of modeRadioButtonInputs) {
    if (option.checked) {
      mode = parseInt(option.value);
    }
  }
}

function updateDisplays() {
  networkDelayDisplay.innerHTML = networkDelayInput.value;
  stopRatioDisplay.innerHTML = stopRatioInput.value;
  frictionRatioDisplay.innerHTML = frictionRatioInput.value;
  frictionCoeffDisplay.innerHTML = frictionCoeffInput.value;
  minVelocityDisplay.innerHTML = minVelocityInput.value;
  maxVelocityDisplay.innerHTML = maxVelocityInput.value;

  // This is a bit overkill, but with mode switching, these were sometimes getting out of sync.
  snapshotValues();
  finishAnimation();
}

function init() {
  networkDelayInput.addEventListener("input", updateDisplays);
  stopRatioInput.addEventListener("input", updateDisplays);
  frictionRatioInput.addEventListener("input", updateDisplays);
  frictionCoeffInput.addEventListener("input", updateDisplays);
  minVelocityInput.addEventListener("input", updateDisplays);
  maxVelocityInput.addEventListener("input", updateDisplays);
  for (const option of modeRadioButtonInputs) {
    console.log(option);
    option.addEventListener("click", updateDisplays)
  }
  updateDisplays();

  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointermove", handlePointerMove);
}

onload = init