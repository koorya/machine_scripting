interface P_type {
  Start: boolean;
  Run: boolean;
  Done: boolean;
  Skip: boolean;
  Reset: boolean;
}
interface MMTask {
  name: string;
  length: number;
  steps: P_type[];
  seq: number[];
}

function createP(): P_type {
  return {
    Start: false,
    Run: false,
    Done: false,
    Skip: false,
    Reset: false,
  };
}
export function createTask(
  name: string,
  length: number,
  seq?: number[]
): MMTask {
  if (seq == undefined)
    seq = [...Array(length)].map((value, index) => index + 1);
  if (seq.length < length)
    seq = [...seq, ...[...Array(length - seq.length)].map(() => 0)];
  seq = [...seq];
  seq[length - 1] = 0;

  return {
    name: name,
    length: length,
    steps: seq.map(() => createP()),
    seq: seq,
  };
}

export default class FakeMM {
  mm_tasks: MMTask[];
  timeout_period = 100;
  constructor() {
    this.mm_tasks = [
      createTask("P200", 20),
      createTask("P300", 20),
      createTask("P400", 20),
      createTask("P500", 20),
      createTask("P600", 20, [1, 2, 3, 7, 4, 8, 5, 6]),
      createTask("P700", 20),
      createTask("P800", 20),
    ];
  }

  is_running = false;
  run() {
    if (this.is_running) return;
    const mm_run = async () => {
      await this.doMMLogic();
      if (this.is_running) setTimeout(mm_run, 50);
    };
    this.is_running = true;
    mm_run();
  }
  stop() {
    this.is_running = false;
  }

  static mm_var_regexp = /(P\d{3})\[(\d{1,2})\]\.([A-Z][a-z]*)/;
  getPLCVarByName(name: string) {
    const a = FakeMM.mm_var_regexp.exec(name);
    if (a)
      return this.mm_tasks.find((task, index) => task.name == a[1])?.steps[
        parseInt(a[2])
      ][a[3]];
    else return undefined;
  }
  setPLCVarByName(name: string, value) {
    const a = FakeMM.mm_var_regexp.exec(name);
    if (a) {
      try {
        this.mm_tasks.find((task, index) => task.name == a[1]).steps[
          parseInt(a[2])
        ][a[3]] = value;
      } catch {
        throw new Error(`invalid variable name: ${name}`);
      }
    }
  }

  tryStartPxx(task: MMTask): string {
    const pxx = task.steps;
    if (pxx[0].Start == true) {
      console.log("tryStartPxx");
      pxx[0].Start = false;
      if (pxx[0].Skip) {
        pxx[0].Done = true;
        return `skiped`;
      } else {
        pxx[0].Run = true;
        pxx[task.seq[1]].Start = true;
      }
      return `run`;
    }
    return "";
  }

  countTo100() {
    return new Promise<void>((resolve) => {
      const run = (t: number) => {
        console.log(`${t}%`);
        if (t < 100) setTimeout(run, 10, t + 10);
        else resolve();
      };
      run(0);
    });
  }

  async executeStep(p_step: MMTask, index: number) {
    if (!p_step.steps[index].Start) return;
    p_step.steps[index].Start = false;

    if (p_step.steps[index].Skip) {
      p_step.steps[index].Done = true;
    } else {
      p_step.steps[index].Run = true;
      console.log(`${p_step.name}[${index}]`);
      await this.countTo100(); //хитрое условие шага
      p_step.steps[index].Run = false;
      p_step.steps[index].Done = true;
    }
  }

  async doWork(task: MMTask) {
    let i: number;
    for (i = 0; i < task.seq.length; i++) {
      const step_index = task.seq[i];
      const p_step = task.steps[step_index];

      if (p_step.Start) {
        await this.executeStep(task, step_index);
        if (i < task.seq.length - 1 && task.seq[i + 1] != 0)
          task.steps[task.seq[i + 1]].Start = true;
        else {
          task.steps[0].Run = false;
          task.steps[0].Done = true;
          return;
        }
      }
    }

    return;
  }

  doMMLogic() {
    for (var task of this.mm_tasks) {
      const status = this.tryStartPxx(task);
      if (status !== "") console.log(`${task.name} ${status}`);

      this.doWork(task);

      if (task.steps[0].Reset) {
        this.resetAllSteps(task.steps);
      }
    }
  }
  resetStep(p: P_type) {
    p.Done = false;
    p.Reset = false;
    p.Run = false;
    p.Skip = false;
    p.Start = false;
  }
  resetAllSteps(pxxx: P_type[]) {
    pxxx.forEach(this.resetStep);
  }
  resetAllTasks() {
    this.mm_tasks.forEach((value) => {
      this.resetAllSteps(value.steps);
    });
  }
}