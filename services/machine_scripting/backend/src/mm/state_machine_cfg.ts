import * as fs from "fs";
import { ExtractByType, MM_adress } from "~shared/types/types";
import { iFsmConfig, iTransition, iData } from "../fsm_types";

const transitions: iTransition[] = JSON.parse(
  fs.readFileSync("src/mm/transitions.json").toString()
);

const init: string = "standby";
const fsm_config: iFsmConfig & {
  data: ExtractByType<iData, "MM">;
} = {
  init: init,
  transitions: transitions,
  data: {
    type: "MM",
    init: init,
    current_address: { cassete: 0, pos: 0 },
    cycle_state: 0,
    status_message: "no",
  },
  methods: {
    cycleExecutor: function (props: {
      cycle_name: string;
      lifecycle: any;
      resolve: () => void;
      reject: () => void;
    }) {
      props.resolve();
    },
    onBeforeLiftUpFrame: function () {
      if (this.current_level >= this.top_level) return false;
      return true;
    },
    onBeforeLiftDownFrame: function () {
      if (this.current_level <= 0) return false;
      return true;
    },
    onLeaveLiftingUpFrameCycle: function (lifecycle) {
      return new Promise((resolve, reject) =>
        this.cycleExecutor({
          cycle_name: "up_frame_cycle",
          lifecycle: lifecycle,
          resolve: () => {
            this.current_level += 1;
            resolve(null);
          },
          reject: () => {
            reject();
          },
        })
      );
    },

    onLeaveLiftingDownFrameCycle: function (lifecycle) {
      return new Promise((resolve, reject) =>
        this.cycleExecutor({
          cycle_name: "down_frame_cycle",
          lifecycle: lifecycle,
          resolve: () => {
            this.current_level -= 1;
            resolve(null);
          },
          reject: () => {
            reject();
          },
        })
      );
    },

    onLeaveHoldingFrameCycle: function (lifecycle) {
      return new Promise((resolve, reject) => {
        this.cycleExecutor({
          cycle_name: "init_to_hold",
          lifecycle: lifecycle,
          resolve: () => {
            resolve(null);
          },
          reject: () => {
            reject();
          },
        });
      });
    },

    onLeavePrepareingToLiftingBottomFrameCycle: function (lifecycle) {
      return new Promise((resolve, reject) => {
        this.cycleExecutor({
          cycle_name: "from_hold_to_lift_crab",
          lifecycle: lifecycle,
          resolve: () => {
            resolve(null);
          },
          reject: () => {
            reject();
          },
        });
      });
    },

    onLeavePrepareingToTopFrameMoveingVertical: function (lifecycle) {
      return new Promise((resolve, reject) => {
        this.cycleExecutor({
          cycle_name: "from_hold_to_init",
          lifecycle: lifecycle,
          resolve: () => {
            resolve(null);
          },
          reject: () => {
            reject();
          },
        });
      });
    },

    onLeaveLandingBottomFrameToPins: function (lifecycle) {
      return new Promise((resolve, reject) => {
        this.cycleExecutor({
          cycle_name: "from_upcrcyc_to_init",
          lifecycle: lifecycle,
          resolve: () => {
            resolve(null);
          },
          reject: () => {
            reject();
          },
        });
      });
    },
    onLeavePushingInCrabCycle: function (lifecycle) {
      return new Promise((resolve, reject) => {
        this.cycleExecutor({
          cycle_name: "pushin_crab",
          lifecycle: lifecycle,
          resolve: () => {
            resolve(null);
          },
          reject: () => {
            reject();
          },
        });
      });
    },
    onLeavePushingOutCrabCycle: function (lifecycle) {
      return new Promise((resolve, reject) => {
        this.cycleExecutor({
          cycle_name: "pushout_crab",
          lifecycle: lifecycle,
          resolve: () => {
            resolve(null);
          },
          reject: () => {
            reject();
          },
        });
      });
    },

    onBeforeLiftUpBottomFrame: function () {
      if (this.current_level <= 0) return false;
      return true;
    },
    onBeforeLiftDownBottomFrame: function () {
      if (this.current_level >= this.top_level) return false;
      return true;
    },

    onLeaveLiftingUpBottomFrameCycle: function (lifecycle) {
      return new Promise((resolve, reject) => {
        this.cycleExecutor({
          cycle_name: "up_crab_cycle",
          lifecycle: lifecycle,
          resolve: () => {
            this.current_level -= 1;
            resolve(null);
          },
          reject: () => {
            reject();
          },
        });
      });
    },
    onLeaveLiftingDownBottomFrameCycle: function (lifecycle) {
      return new Promise((resolve, reject) => {
        this.cycleExecutor({
          cycle_name: "down_crab_cycle",
          lifecycle: lifecycle,
          resolve: () => {
            this.current_level += 1;
            resolve(null);
          },
          reject: () => {
            reject();
          },
        });
      });
    },

    onAfterTransition: function (lifecycle) {
      return true;
    },
  },
};
export { fsm_config, transitions };
