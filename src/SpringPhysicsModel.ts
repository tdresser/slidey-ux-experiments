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
        let position = Math.exp(-a * time) * (c * Math.sin(b * time) + (d * Math.cos(b * time)));

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

    spring80FrequencyResponseInput = document.getElementById("spring80FrequencyResponse") as HTMLInputElement ?? fail();
    spring80FrequencyResponseDisplay = document.getElementById("spring80FrequencyResponseDisplay") as HTMLInputElement ?? fail();

    spring80DampingRatioInput = document.getElementById("spring80DampingRatio") as HTMLInputElement ?? fail();
    spring80DampingRatioDisplay = document.getElementById("spring80DampingRatioDisplay") as HTMLInputElement ?? fail();

    spring80FrequencyResponse = parseFloat(this.spring80FrequencyResponseInput.value);
    spring80DampingRatio = parseFloat(this.spring80DampingRatioInput.value);

    constructor(init: PhysicsModelInit) {
        super(init);
        this.animationStartOffset = 0;

        this.spring80FrequencyResponseInput.addEventListener("input", () => this.updateDisplays());
        this.spring80DampingRatioInput.addEventListener("input", () => this.updateDisplays());

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
        this.#spring0 = new Spring({
            frequencyResponse: 200,
            dampingRatio: 0.9,
            name: "0%",
        });
    }

    updateDisplays() {
        this.spring80FrequencyResponseDisplay.innerHTML = this.spring80FrequencyResponseInput.value;
        this.spring80DampingRatioDisplay.innerHTML = this.spring80DampingRatioInput.value;
    }

    advance(rafTime: number): AdvanceResult {
        rafTime = rafTime;
        if (!this.hasCommitted && this.committed(rafTime)) {
            // Switch springs!
            this.startAnimating(this.lastRaf || rafTime);
            this.hasCommitted = true;
            this.#spring100.initialVelocity = this.#spring80.velocity();
        }
        const time = rafTime - this.animationStartTime;

        let springResult: SpringPosition | null = null;
        if (this.hasAborted) {
            springResult = this.#spring0.position(this.animationStartOffset, time);
            // Prevent overshoot here.
            this.offset = Math.max(springResult.offset, 0);
        } else if (!this.hasCommitted) {
            springResult = this.#spring80.position(this.maxOffset * this.targetStopPercent - this.animationStartOffset, time);
            this.offset = this.maxOffset * this.targetStopPercent - springResult.offset;
        } else {
            springResult = this.#spring100.position(this.maxOffset - this.animationStartOffset, time);
            this.offset = this.maxOffset - springResult.offset;
        }

        this.lastRaf = rafTime;
        return {
            done: springResult.done && (this.hasCommitted || this.hasAborted),
            fgOffset: this.offset,
            bgOffset: this.fgToBgOffset(this.offset),
            hasCommitted: this.hasCommitted
        }
    }

    pointerMove(e: PointerEvent): AdvanceResult {
        this.offset = this.fingerDragAdd(this.offset, e.movementX);
        this.pointerHistory.push({
            offset: this.offset,
            time: e.timeStamp
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

    fingerDragAdd(offset: number, movement: number): number {
        if (!this.limitFingerDrag) {
            return offset + movement;
        }
        // Linear to targetStopPercent; assumes no "overdrag" like on mobile sim
        return offset + this.targetStopPercent * movement;
    }

    fgToBgOffset(offset: number): number {
        if (!this.parallax) {
            return 0;
        }
        return 0.25 * (offset - this.maxOffset);
    }

    setDefaultVelocity(): void {
        this.offset = this.maxOffset / 4; // assume a default of touch up at 25% of the width
        this.#spring80.initialVelocity = this.boostVelocity ? -2.0 : -1.0;
    }

    pointerUp(_: PointerEvent): "success" | "abort" {
        // Don't let us overshoot too far. TODO: tune this.
        let velocity = findVelocity(this.pointerHistory);
        console.log("before: " + velocity);
        if(this.boostVelocity) {
            velocity *= 4.0;
            velocity = Math.max(velocity, 1.0);
        }
        console.log("post boost: " + velocity)
        velocity = Math.min(velocity, 2.0);
        console.log("post clamp: " + velocity);

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
