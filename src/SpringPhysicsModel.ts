import { AdvanceResult, PhysicsModel, PhysicsModelInit } from './PhysicsModel.ts'
import { Point, fail, findVelocity } from './util.ts';

interface SpringConfig {
    frequencyResponse: number,
    dampingRatio: number,
    name: string, // Debug only.
    overshootCurve?: (x:number) => number,
}

interface SpringPosition {
    offset: number,
    done: boolean
}

const SPRING_HISTORY_SIZE = 10;
const SPRING_AT_REST_THRESHOLD = 10;

class Spring {
    mass = 1;
    initialVelocity = 0;
    dampingRatio: number;
    undampedNaturalFrequency: number;
    dampedNaturalFrequency: number;
    lastNFrames: Point[];
    name: string;
    overshootCurve = (x:number) => x;
    preserveMinOscillation = 0.0;

    constructor(springConfig: SpringConfig) {
        const stiffness = (((2 * Math.PI) / springConfig.frequencyResponse) ** 2) * this.mass
        this.undampedNaturalFrequency = Math.sqrt(stiffness / this.mass)
        this.dampedNaturalFrequency = this.undampedNaturalFrequency * Math.sqrt(Math.abs(1 - (springConfig.dampingRatio) ** 2))
        this.dampingRatio = springConfig.dampingRatio;
        // Used to compute velocity, and check if we're at rest.
        this.lastNFrames = [];
        this.name = springConfig.name;
        if (springConfig.overshootCurve) {
            this.overshootCurve = springConfig.overshootCurve;
        }
    }

    position(startPosition: number, time: number): SpringPosition {
        const a = this.undampedNaturalFrequency * this.dampingRatio
        const b = this.dampedNaturalFrequency
        const c = (this.initialVelocity + a * startPosition) / b
        const d = startPosition
        let position = (this.preserveMinOscillation + Math.exp(-a * time)) * (c * Math.sin(b * time) + (d * Math.cos(b * time)));

        if (position < 0) {
            position = this.overshootCurve(position);
        }

        if (isNaN(position) || !isFinite(position)) {
            throw ("Spring config invalid. Position: " + position);
        }
        this.lastNFrames.push({
            offset: position,
            time
        });

        let done = false;

        if (this.lastNFrames.length > SPRING_HISTORY_SIZE) {
            this.lastNFrames.shift();
            let sum = 0;
            for (let i of this.lastNFrames) {
                sum += i.offset * i.offset;
            }
            done = sum < SPRING_AT_REST_THRESHOLD * SPRING_HISTORY_SIZE;
        }

        // consider it done when back at 0 for the abort case
        if(position < 1) {
            done = true;
        }

        return {
            offset: position,
            done: done
        };
    }

    velocity() {
        return findVelocity(this.lastNFrames);
    }
}

// Spring physics inspired by https://medium.com/@patoreyes23/designing-interaction-spring-animations-c8b8788a4b2a .
export class SpringPhysicsModel extends PhysicsModel {
    #spring100: Spring;
    #spring80: Spring;
    #spring0: Spring;
    lastRaf: number | null = null;
    hasCommitted = false;
    hasAborted = false;
    pointerHistory: Point[] = [];
    snapping: boolean = false
    mode: string = "";
    parallaxTo80: boolean = false;

    spring80FrequencyResponseInput = document.getElementById("spring80FrequencyResponse") as HTMLInputElement ?? fail();
    spring80FrequencyResponseDisplay = document.getElementById("spring80FrequencyResponseDisplay") as HTMLInputElement ?? fail();

    spring80DampingRatioInput = document.getElementById("spring80DampingRatio") as HTMLInputElement ?? fail();
    spring80DampingRatioDisplay = document.getElementById("spring80DampingRatioDisplay") as HTMLInputElement ?? fail();

    preserveMinOscillationInput = document.getElementById("preserveMinOscillation") as HTMLInputElement ?? fail();
    preserveMinOscillationDisplay = document.getElementById("preserveMinOscillationDisplay") as HTMLInputElement ?? fail();

    hookAtInput = document.getElementById("hookAt") as HTMLInputElement ?? fail();
    hookAtDisplay = document.getElementById("hookAtDisplay") as HTMLInputElement ?? fail();

    spring80FrequencyResponse = parseFloat(this.spring80FrequencyResponseInput.value);
    spring80DampingRatio = parseFloat(this.spring80DampingRatioInput.value);
    preserveMinOscillation = parseFloat(this.preserveMinOscillationInput.value);

    hookAtPercent = parseFloat(this.hookAtInput.value);
    hooked = false;
    pointerDownX: number = 0;
    dontBounceBackpage = false;  

    wobbleInput = document.getElementById("settingWobble") as HTMLInputElement ?? fail();
    wobble = !!this.wobbleInput.checked;

    postpone = true;
    postponed = 0;

    constructor(init: PhysicsModelInit) {
        super(init);
        this.animationStartOffset = 0;

        this.spring80FrequencyResponseInput.addEventListener("input", () => this.updateDisplays());
        this.spring80DampingRatioInput.addEventListener("input", () => this.updateDisplays());
        this.preserveMinOscillationInput.addEventListener("input", () => this.updateDisplays());
        this.hookAtInput.addEventListener("input", () => this.updateDisplays());
        this.wobbleInput.addEventListener("input", () => this.updateDisplays());
        
        this.#spring100 = new Spring({
            frequencyResponse: 200,
            dampingRatio: 0.95,
            name: "100%",
        });
        //const distanceFactorToMaxOvershoot = 0.5;
        //const maxOvershootFactor = 0.15;
        this.#spring80 = new Spring({
            frequencyResponse: this.spring80FrequencyResponse,
            dampingRatio: this.spring80DampingRatio,
            name: "80%",
            // 1-1/(x+1)
            /*overshootCurve: function (x) {
                const percent = Math.min(1, -x / (init.targetOffset * distanceFactorToMaxOvershoot));
                console.log(percent);
                return -init.targetOffset * maxOvershootFactor * (1 - 1/(percent + 1));
            }*/
        });
        this.#spring80.preserveMinOscillation = parseFloat(this.preserveMinOscillationInput.value);
        this.#spring0 = new Spring({
            frequencyResponse: 200,
            dampingRatio: 0.9,
            name: "0%",
        });
    }

    updateDisplays() {
        this.spring80FrequencyResponseDisplay.innerHTML = this.spring80FrequencyResponseInput.value;
        this.spring80DampingRatioDisplay.innerHTML = this.spring80DampingRatioInput.value;
        this.preserveMinOscillationDisplay.innerHTML = this.preserveMinOscillationInput.value;
        this.hookAtDisplay.innerHTML = this.hookAtInput.value;
        this.wobble = !!this.wobbleInput.checked;
        this.#spring80.preserveMinOscillation = parseFloat(this.preserveMinOscillationInput.value);
   }

    advance(rafTime: number): AdvanceResult {
        rafTime = rafTime;

        if (!this.hasCommitted && this.committed(rafTime)) {
            if (this.postpone) {
                if (this.#spring80.velocity() > 0) {
                    if (!this.postponed) {
                        this.postponed = rafTime;
                    } 
                } else {
                    this.postponed = 0;
                }
            }
            if (!this.postponed) {
                // Switch springs!
                this.restartAnimating(this.lastRaf || rafTime);
                this.hasCommitted = true;
                if(!this.hooked) {
                    this.hooked = true;
                    this.#spring100.initialVelocity = this.#spring80.initialVelocity;
                } else {
                    this.#spring100.initialVelocity = this.#spring80.velocity();
                }
                if (isNaN(this.#spring100.initialVelocity)) {
                    this.#spring100.initialVelocity = -2.0;
                }
            }
        }
        let time = rafTime - this.animationStartTime;
        if (this.postponed) {
            time += (rafTime - this.postponed);
        }
        let springResult: SpringPosition | null = null;
        if (!this.hooked) {
            this.offset = this.animationStartOffset - time * this.#spring80.initialVelocity;
        } else if (this.hasAborted) {
            springResult = this.#spring0.position(this.animationStartOffset, time);
            // Prevent overshoot here.
            this.offset = Math.max(springResult.offset, 0);
        } else if (!this.hasCommitted) {
           let targetStopPercent = this.targetStopPercent;
           springResult = this.#spring80.position(this.maxOffset * targetStopPercent - this.animationStartOffset, time);
            this.offset = this.maxOffset * targetStopPercent - springResult.offset;
        } else {
            springResult = this.#spring100.position(this.maxOffset - this.animationStartOffset, time);
            this.offset = this.maxOffset - springResult.offset;
        }

        if(!this.hooked && (this.offset > (this.maxOffset * this.hookAtPercent / 100.0))) {
            // hook
            this.restartAnimating(this.lastRaf || rafTime);
            this.hooked = true;
            this.animationStartOffset = this.offset;
        }

        let done = springResult ? springResult.done : false;

        if (this.wobble && !this.hasCommitted) {
            // wobble a distance of 2% of width about 1 cycle per half second
            this.offset += this.maxOffset * 0.02 * Math.sin(2*Math.PI*time/1000);
        }
        let bgOffset = this.offset;
        if (this.dontBounceBackpage) {
            springResult = this.#spring0.position(this.maxOffset - this.animationStartOffset, rafTime - this.loadStart);
            // Prevent overshoot here.
            bgOffset = this.maxOffset - Math.max(springResult.offset, 0);
        }

        this.lastRaf = rafTime;
        return {
            done: done && (this.hasCommitted || this.hasAborted),
            fgOffset: this.offset,
            bgOffset: this.fgToBgOffset(bgOffset),
            hasCommitted: this.hasCommitted
        }
    }

    pointerDown(clientX: number) {
        this.pointerDownX = clientX;
    }

    pointerMove(clientX: number, timeStamp: number): AdvanceResult {
        this.offset = this.fingerDragCurve(clientX - this.pointerDownX);
        this.pointerHistory.push({
            offset: this.offset,
            time: timeStamp
        })
        if (this.pointerHistory.length > 10) {
            this.pointerHistory.shift();
        }
        if (this.offset < 0) {
            this.offset = 0;
        }
        return {
            done: false,
            fgOffset: this.offset,
            bgOffset: this.fgToBgOffset(this.offset),
            hasCommitted: false
        }
    }

    fgToBgOffset(offset: number): number {
        let result = 0;
        if (!this.parallax) {
            result = 0;
        } else if (this.parallaxTo80) {
          result = 0.25 * (offset - this.targetStopPercent * this.maxOffset);
        } else {
          result = 0.25 * (offset - this.maxOffset);
        }
        return Math.min(0, result);
    }

    setDefaultVelocity(): void {
        this.offset = this.maxOffset / 4; // assume a default of touch up at 25% of the width
        this.#spring80.initialVelocity = this.boostVelocity ? -1.0 : -0.5;
    }

    setSnapping(sn : boolean): boolean {
      this.snapping = sn;
      return sn;
    }

    setMode(mode: string): void {
      this.mode = mode;
    }
    setParallaxTo80(flag: boolean): void {
      this.parallaxTo80 = flag;
    }

    pointerUp(): "success" | "abort" {
        // Don't let us overshoot too far. TODO: tune this.
        let velocity;
        if (!this.snapping && this.mode == "snapto") {
          velocity = 0;
        } else {
          velocity = findVelocity(this.pointerHistory);
          if(this.boostVelocity) {
              //velocity *= 2.0;
              velocity = Math.max(velocity, 1.0);
          }
          velocity = Math.min(velocity, 2.5);
          velocity = Math.max(velocity, 0.3);
        }
        this.#spring0.initialVelocity = -velocity

        // TODO: we could use the event position (but maybe it's already sent via a prior touchmove?)
        // If the offset + 100ms at current velocity < threshold, abort.
        if (((this.offset + velocity * 100) / this.maxOffset) < 0.3 || velocity < -0.1) {
            this.hasAborted = true;
            this.#spring0.initialVelocity = -velocity
            return "abort";
        } else {
            this.#spring80.initialVelocity = -velocity
            return "success"
        }
    }
}
