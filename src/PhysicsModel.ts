
export interface AdvanceResult {
    done: boolean,
    offset: number,
}

export interface PhysicsModelInit {
    dragStartTime: number,
    networkDelay: number,
    targetOffset: number,
}

export abstract class PhysicsModel {
    animationStartTime: number = 0;
    animationStartOffset: number = 0;
    networkDelay: number;
    maxOffset: number;
    offset: number = 0;

    constructor(init: PhysicsModelInit) {
        this.networkDelay = init.networkDelay;
        this.maxOffset = init.targetOffset;
    }

    startAnimating(time: number) {
        this.animationStartTime = time;
        this.animationStartOffset = this.offset;
    }

    abstract advance(rafTime: number): AdvanceResult;
    abstract pointerMove(delta: number): number;
    abstract updateDisplays(): void;

    committed() {
        return (performance.now() - this.animationStartTime) >= this.networkDelay;
    }
};