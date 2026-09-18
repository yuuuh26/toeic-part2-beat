import { AFTER_HOURS_VELOCITY } from "./bgm-track-after-hours.js";
import { READY_SET_GOAL } from "./bgm-track-ready-set-goal.js";
import { STEP_INTO_FOCUS } from "./bgm-track-step-into-focus.js";
import { VICTORY_LOOP } from "./bgm-track-victory-loop.js";

export const BGM_TRACKS = Object.freeze([
  { id: "after-hours-velocity", title: "After Hours Velocity", src: AFTER_HOURS_VELOCITY },
  { id: "ready-set-goal", title: "Ready Set Goal", src: READY_SET_GOAL, fullSrc: "https://raw.githubusercontent.com/yuuuh26/english-speaking-beat/main/assets/bgm/ready_set_goal.mp3" },
  { id: "step-into-focus", title: "Step Into Focus", src: STEP_INTO_FOCUS },
  { id: "victory-loop", title: "Victory Loop", src: VICTORY_LOOP }
]);
