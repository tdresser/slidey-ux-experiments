
export interface AdvanceResult {
    done: boolean,
    fgOffset: number,
    bgOffset: number,
}

export interface PhysicsModelInit {
    networkDelay: number,
    targetOffset: number,
    parallax: boolean,
    limitFingerDrag: boolean
}

export abstract class PhysicsModel {
    animationStartTime: number = 0;
    animationStartOffset: number = 0;
    networkDelay: number;
    maxOffset: number;
    offset: number = 0;
    parallax: boolean;
    limitFingerDrag: boolean;


    constructor(init: PhysicsModelInit) {
        this.networkDelay = init.networkDelay;
        this.maxOffset = init.targetOffset;
        this.parallax = init.parallax;
        this.limitFingerDrag = init.limitFingerDrag;
    }

    startAnimating(time: number) {
        this.animationStartTime = time;
        this.animationStartOffset = this.offset;
    }

    abstract advance(rafTime: number): AdvanceResult;
    abstract pointerMove(e:PointerEvent): AdvanceResult;
    pointerUp(_:PointerEvent) {}
    abstract updateDisplays(): void;

    committed() {
        return (performance.now() - this.animationStartTime) >= this.networkDelay;
    }
};
