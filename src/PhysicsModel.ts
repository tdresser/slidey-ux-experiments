
export interface AdvanceResult {
    done: boolean,
    offset: number,
}

export interface PhysicsModelInit {
    networkStart: number,
    networkDelay: number,
    maxOffset: number,
  }

export abstract class PhysicsModel {
    networkStart:number;
    networkDelay:number;
    maxOffset:number;
    offset: number = 0;

    constructor(init:PhysicsModelInit) {
        this.networkStart = init.networkStart;
        this.networkDelay = init.networkDelay;
        this.maxOffset = init.maxOffset;
    }

    abstract advance(finished: (d?: unknown) => void): AdvanceResult;
    abstract pointerMove(delta: number): number;
};