import { AdvanceResult, PhysicsModel, PhysicsModelInit } from './PhysicsModel.ts'
import { Point, findVelocity } from './util.ts';
// import { fail } from './util.ts';

interface SpringConfig {
    frequencyResponse: number,
    dampingRatio: number,
    name: string, // Debug only.
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

    constructor(springConfig: SpringConfig) {
        const stiffness = (((2 * Math.PI) / springConfig.frequencyResponse) ** 2) * this.mass
        // this.dampingCoefficient = (4 * Math.PI * springConfig.dampingRatio * this.mass) / springConfig.frequencyResponse;
        this.undampedNaturalFrequency = Math.sqrt(stiffness / this.mass)
        this.dampedNaturalFrequency = this.undampedNaturalFrequency * Math.sqrt(Math.abs(1 - (springConfig.dampingRatio) ** 2))
        this.dampingRatio = springConfig.dampingRatio;
        // Used to compute velocity, and check if we're at rest.
        this.lastNFrames = [];
        this.name = springConfig.name;
    }

    position(startPosition: number, time: number): SpringPosition {
        console.log("Start position: " + startPosition);
        console.log("Time: " + time);
        const a = this.undampedNaturalFrequency * this.dampingRatio
        const b = this.dampedNaturalFrequency
        const c = (this.initialVelocity + a * startPosition) / b
        const d = startPosition
        const position = Math.exp(-a * time) * (c * Math.sin(b * time) + (d * Math.cos(b * time)));

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
    pointerHistory: Point[] = [];

    constructor(init: PhysicsModelInit) {
        super(init);
        this.animationStartOffset = this.animationStartTime;
        this.#spring100 = new Spring({
            frequencyResponse: 200,
            dampingRatio: 0.95,
            name: "100%",
        });
        this.#spring80 = new Spring({
            frequencyResponse: 1600,
            dampingRatio: 0.80,
            name: "80%",
        });
        this.#spring0 = new Spring({
            frequencyResponse: 1000,
            dampingRatio: 0.95,
            name: "0%",
        });
    }

    updateDisplays() {
    }

    advance(rafTime: number): AdvanceResult {
        rafTime = rafTime;
        if (!this.hasCommitted && this.committed()) {
            // Switch springs!
            this.startAnimating(this.lastRaf || rafTime);
            this.hasCommitted = true;
            this.#spring100.initialVelocity = this.#spring80.velocity();
            console.log("VELOCITY HANDOFF: " + this.#spring80.velocity());
        }
        const time = rafTime - this.animationStartTime;;

        let springResult: SpringPosition | null = null;
        if (!this.hasCommitted) {
            springResult = this.#spring80.position(this.maxOffset * 0.8 - this.animationStartOffset, time);
            console.log(this.#spring80);
            this.offset = this.maxOffset * 0.8 - springResult.offset;
        } else {
            console.log(this.#spring100);
            springResult = this.#spring100.position(this.maxOffset - this.animationStartOffset, time);
            this.offset = this.maxOffset - springResult.offset;
        }
        console.log("Offset " + this.offset);

        this.lastRaf = rafTime;
        return {
            done: springResult.done && this.hasCommitted,
            fgOffset: this.offset,
            bgOffset: this.fgToBgOffset(this.offset)
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
            bgOffset: this.fgToBgOffset(this.offset)
        }
    }

    fingerDragAdd(offset: number, movement: number): number {
        if (!this.limitFingerDrag) {
            return offset + movement;
        }
        // Linear to 0.8; assumes no "overdrag" like on mobile sim
        return offset + 0.8 * movement;
    }

    fgToBgOffset(offset: number): number {
        if (!this.parallax) {
            return 0;
        }
        return 0.25 * (offset - this.maxOffset);
    }

    pointerUp(_: PointerEvent): void {
        // Don't let us overshoot too far. TODO: tune this.
        this.#spring80.initialVelocity = Math.max(-findVelocity(this.pointerHistory), -1.2);
        console.log("STARTING VELOCITY: " + this.#spring80.initialVelocity);
    }
}
