import { AdvanceResult, PhysicsModel, PhysicsModelInit } from './PhysicsModel.ts'
// import { fail } from './util.ts';

interface SpringConfig {
    frequencyResponse : number,
    dampingRatio : number
}

const SPRING_AT_REST_HISTORY_SIZE = 10;
const SPRING_AT_REST_THRESHOLD = 10;

class Spring {
    mass = 1;
    initialVelocity = 0; // TODO
    // dampingCoefficient: number;
    dampingRatio: number;
    undampedNaturalFrequency: number;
    dampedNaturalFrequency: number;
    lastNFrames: number[];

    constructor(springConfig: SpringConfig) {
        const stiffness = (((2 * Math.PI) / springConfig.frequencyResponse)**2) * this.mass
        // this.dampingCoefficient = (4 * Math.PI * springConfig.dampingRatio * this.mass) / springConfig.frequencyResponse;
        this.undampedNaturalFrequency = Math.sqrt(stiffness / this.mass)
        this.dampedNaturalFrequency = this.undampedNaturalFrequency * Math.sqrt(Math.abs(1 - (springConfig.dampingRatio)**2))
        this.dampingRatio = springConfig.dampingRatio;
        // Used to check if we're at rest.
        this.lastNFrames = [];
    }

    position(startPosition: number, time: number): AdvanceResult {
        const a = this.undampedNaturalFrequency * this.dampingRatio
        const b = this.dampedNaturalFrequency
        const c = (this.initialVelocity + a * startPosition) / b
        const d = startPosition
        const position = Math.exp(-a * time) * (c * Math.sin(b * time) + (d * Math.cos(b * time)));
        if (isNaN(position) || !isFinite(position)) {
            throw("Spring config invalid. Position: " + position);
        }
        console.log(this);
        this.lastNFrames.push(position);

        let done = false;

        if (this.lastNFrames.length > SPRING_AT_REST_HISTORY_SIZE) {
            this.lastNFrames.shift();
            let sum = 0;
            for (let i of this.lastNFrames) {
                sum += i*i;
            }
            done = sum < SPRING_AT_REST_THRESHOLD * SPRING_AT_REST_HISTORY_SIZE;
        }
        return {
            offset: position,
            done: done
        };
    }


}

// Spring physics inspired by https://medium.com/@patoreyes23/designing-interaction-spring-animations-c8b8788a4b2a .
export class SpringPhysicsModel extends PhysicsModel {
  #spring100: Spring;
  #spring80: Spring;
  #spring0: Spring;
  hasCommitted = false;

  constructor(init:PhysicsModelInit) {
    super(init);
    this.#spring100 = new Spring({
        frequencyResponse: 1.2,
        dampingRatio: 0.9
    });
    this.#spring80 = new Spring({
        frequencyResponse: 1.2,
        dampingRatio: 0.8
    });
    this.#spring0 = new Spring({
        frequencyResponse: 1.2,
        dampingRatio: 0.9
    });

    console.log("NEW MODEL " + this.networkDelay);
  }

  updateDisplays() {
  }

  advance(rafTime: number): AdvanceResult {
    const time = (rafTime - this.animationStartTime) / 1000;
    let singleFrameDelayOnCommitHack = false;

    if (!this.hasCommitted && this.committed()) {
        // Switch springs!
        // TODO - preserve velocity.
        console.log("COMMIT");
        console.log(this);
        this.startAnimating(rafTime);
        this.hasCommitted = true;
        singleFrameDelayOnCommitHack = true;
    }

    let springResult = null;
    if (!this.hasCommitted/* || singleFrameDelayOnCommitHack*/) {
        console.log("NOT THERE YET.")
        springResult = this.#spring80.position(this.maxOffset * 0.8 - this.animationStartOffset, time);
        this.offset = this.maxOffset * 0.8 - springResult.offset;
    } else {
        springResult = this.#spring100.position(this.maxOffset - this.animationStartOffset, time);
        this.offset = this.maxOffset - springResult.offset;
    }
    console.log("Offset " + this.offset);

    return {
      done: springResult.done && this.hasCommitted,
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