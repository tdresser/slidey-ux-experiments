import { AdvanceResult, PhysicsModel, PhysicsModelInit } from './PhysicsModel.ts'
import { fail } from './util.ts';

export class FrictionPhysicsModel extends PhysicsModel {
  stopRatioInput = document.getElementById("stopRatioInput") as HTMLInputElement ?? fail();
  frictionRatioInput = document.getElementById("frictionRatioInput") as HTMLInputElement ?? fail();
  frictionCoeffInput = document.getElementById("frictionCoeffInput") as HTMLInputElement ?? fail();
  minVelocityInput = document.getElementById("minVelocityInput") as HTMLInputElement ?? fail();
  maxVelocityInput = document.getElementById("maxVelocityInput") as HTMLInputElement ?? fail();

  stopRatio = parseFloat(this.stopRatioInput.value);
  frictionRatio = parseFloat(this.frictionRatioInput.value);
  frictionCoeff = parseFloat(this.frictionCoeffInput.value);
  minVelocity = parseFloat(this.minVelocityInput.value);
  maxVelocity = parseFloat(this.maxVelocityInput.value);
  velocity = this.maxVelocity;

  stopRatioDisplay = document.getElementById("stopRatioDisplay") as HTMLInputElement ?? fail();
  frictionRatioDisplay = document.getElementById("frictionRatioDisplay") as HTMLInputElement ?? fail();
  frictionCoeffDisplay = document.getElementById("frictionCoeffDisplay") as HTMLInputElement ?? fail();
  minVelocityDisplay = document.getElementById("minVelocityDisplay") as HTMLInputElement ?? fail();
  maxVelocityDisplay = document.getElementById("maxVelocityDisplay") as HTMLInputElement ?? fail();

  constructor(init:PhysicsModelInit) {
    super(init);
    console.log("NEW MODEL " + this.networkDelay);
    this.stopRatioInput.addEventListener("input", this.updateDisplays);
    this.frictionRatioInput.addEventListener("input", this.updateDisplays);
    this.frictionCoeffInput.addEventListener("input", this.updateDisplays);
    this.minVelocityInput.addEventListener("input", this.updateDisplays);
    this.maxVelocityInput.addEventListener("input", this.updateDisplays);
  }

  updateDisplays() {
    this.stopRatioDisplay.innerHTML = this.stopRatioInput.value;
    this.frictionRatioDisplay.innerHTML = this.frictionRatioInput.value;
    this.frictionCoeffDisplay.innerHTML = this.frictionCoeffInput.value;
    this.minVelocityDisplay.innerHTML = this.minVelocityInput.value;
    this.maxVelocityDisplay.innerHTML = this.maxVelocityInput.value;
  }

  advance(): AdvanceResult {
    let target = this.maxOffset;
    this.offset += this.velocity;

    let done = false;
    if (this.committed()) {
      // We should be speeding up, but at least start with min velocity.
      if (this.velocity < this.minVelocity) {
        this.velocity = this.minVelocity;
      } else if (this.offset >= target) {
        // We've reached the end!
        this.offset = target;
        done = true;
      } else if (this.velocity < this.maxVelocity) {
        // Keep speeding up by inverse of friction up until max velocity.
        this.velocity = this.velocity / (1 - this.frictionCoeff);
        if (this.velocity >= this.maxVelocity) {
          this.velocity = this.maxVelocity;
        }
      }
    } else {
      // If we're at the stop point, drop the velocity to 0.
      if (this.offset >= target * this.stopRatio) {
        this.offset = target * this.stopRatio;
        this.velocity = 0;
      } else if (this.offset > target * this.frictionRatio) {
        // We've entered the friction zone, so start slowing down until min velocity.
        this.velocity = this.velocity * (1 - this.frictionCoeff);
        if (this.velocity < this.minVelocity) {
          this.velocity = this.minVelocity;
        }
      }
    }

    return {
      done,
      offset: this.offset,
    }
  }

  pointerMove(delta: number) : number {
    this.offset += delta;
    if (this.offset < 0) {
      this.offset = 0;
    }
    return this.offset;
  }
}