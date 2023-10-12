import lsq from 'least-squares';

export function fail(): never {
    throw new Error("missing element");
}

export interface Point {
    offset: number,
    time: number;
}

export function findVelocity(points: Point[]): number {
    let ret = {m: 0};

    const offsets = points.map(x => x.offset);
    const times = points.map(x => x.time);

    lsq(times, offsets, false, ret);
    let vel = ret.m;
    if (!isFinite(vel)) {
        vel = 0;
    }
    return ret.m;
}