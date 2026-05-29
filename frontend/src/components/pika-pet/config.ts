export const PET_CONFIG = {
  spritesheet: {
    url: '/pika-pet/sprites/spritesheet.png',
    cellWidth: 192,
    cellHeight: 208,
    cols: 8,
  },
  actions: {
    idle:        { row: 0, frames: 5, fps: 8,  loop: true,  holdLastMs: 500 },
    walk_right:  { row: 1, frames: 6, fps: 10, loop: true,  holdLastMs: 0 },
    walk_left:   { row: 2, frames: 6, fps: 10, loop: true,  holdLastMs: 0 },
    interact:    { row: 3, frames: 5, fps: 10, loop: false, holdLastMs: 300 },
    skill:       { row: 4, frames: 6, fps: 12, loop: false, holdLastMs: 300 },
    sleep:       { row: 5, frames: 3, fps: 4,  loop: true,  holdLastMs: 0 },
  },
  displaySize: {
    width: 120,
    height: 130,
  },
  timeouts: {
    idleToSleep: 30000,
    walkIntervalMin: 6000,
    walkIntervalMax: 15000,
    walkSpeed: 1,
  },
};

export type PetAction = keyof typeof PET_CONFIG.actions;

export type PetState = 'idle' | 'walk-left' | 'walk-right' | 'interact' | 'skill' | 'sleep';
