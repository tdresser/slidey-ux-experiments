
export interface AdvanceResult {
    done: boolean,
    fgOffset: number,
    bgOffset: number,
    hasCommitted: boolean
}

export interface PhysicsModelInit {
    networkDelay: number,
    targetOffset: number,
    parallax: boolean,
    fingerDragCurve: (x:number) => number,
    boostVelocity: boolean
    targetStopPercent: number
}

export abstract class PhysicsModel {
    animationStartTime: number = 0;
    animationStartOffset: number = 0;
    networkDelay: number;
    maxOffset: number;
    offset: number = 0;
    parallax: boolean;
    fingerDragCurve: (x:number) => number;
    boostVelocity: boolean;
    targetStopPercent: number;
    loadStart: number = 0;
    snapping: boolean = false;

    constructor(init: PhysicsModelInit) {
        this.networkDelay = init.networkDelay;
        this.maxOffset = init.targetOffset;
        this.parallax = init.parallax;
        this.fingerDragCurve = init.fingerDragCurve;
        this.boostVelocity = init.boostVelocity;
        this.targetStopPercent = init.targetStopPercent;
    }


    setSnapping(sn: boolean): boolean {
      this.snapping = sn;
      return sn;
    }

    startAnimating(time: number) {
        this.loadStart = time;
        this.animationStartTime = time;
        this.animationStartOffset = this.offset;
    }
    restartAnimating(time: number) {
        this.animationStartTime = time;
        this.animationStartOffset = this.offset;
    }

    abstract advance(rafTime: number): AdvanceResult;
    abstract pointerDown(e:PointerEvent): void;
    abstract pointerMove(e:PointerEvent): AdvanceResult;
    pointerUp(_:PointerEvent): "success" | "abort" {
        return "success";
    }
    abstract updateDisplays(): void;
    abstract setDefaultVelocity(): void;

    committed(rafTime: number) {
        return (rafTime - this.loadStart) >= this.networkDelay;
    }
};
