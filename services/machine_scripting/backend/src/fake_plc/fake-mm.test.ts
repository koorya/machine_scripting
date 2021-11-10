import FakeMM from "./fake-mm";
import { createTask } from "./fake-mm";

beforeAll(() => {
  jest.spyOn(FakeMM.prototype, "countTo100").mockImplementation(async () => {});
});

afterAll(() => jest.restoreAllMocks());

describe("MMLogick ", () => {
  const mmlogic = new FakeMM();

  test("example test", () => {
    expect(1).toBe(1);
  });

  test("vault get/set", () => {
    mmlogic.setPLCVarByName("P200[0].Start", true);
    expect(mmlogic.getPLCVarByName("P200[0].Start")).toBe(true);

    mmlogic.setPLCVarByName("P200[0].Start", false);
    expect(mmlogic.getPLCVarByName("P200[0].Start")).toBe(false);
  });

  const task1 = createTask("task1", 3);
  const task2 = createTask("task2", 4, [2, 1, 3, 4]);
  const task3 = createTask("task3", 20, [1, 2, 3, 7, 4, 8, 5, 6]);

  test("createTask without seq", () => {
    expect(task1.name).toBe("task1");
    expect(task1.length).toBe(3);
    expect(task1.seq.length).toBe(3);
    expect(task1.seq[0]).toBe(1);
    expect(task1.seq[1]).toBe(2);
    expect(task1.seq[2]).toBe(0);
    expect(task1.steps.length).toBe(3);
  });

  test("createTask with short seq", () => {
    expect(task2.name).toBe("task2");
    expect(task2.length).toBe(4);
    expect(task2.seq.length).toBe(4);
    expect(task2.seq[0]).toBe(2);
    expect(task2.seq[1]).toBe(1);
    expect(task2.seq[2]).toBe(3);
    expect(task2.seq[3]).toBe(0);
    expect(task2.steps.length).toBe(4);
  });

  test("createTask with long seq", () => {
    expect(task3.name).toBe("task3");
    expect(task3.length).toBe(20);
    expect(task3.seq.length).toBe(20);
    expect(task3.seq[0]).toBe(1);
    expect(task3.seq[1]).toBe(2);
    expect(task3.seq[2]).toBe(3);
    expect(task3.seq[3]).toBe(7);
    expect(task3.seq[4]).toBe(4);
    expect(task3.seq[5]).toBe(8);
    expect(task3.seq[6]).toBe(5);
    expect(task3.seq[7]).toBe(6);
    expect(task3.seq[8]).toBe(0);
    expect(task3.seq[9]).toBe(0);
    expect(task3.steps.length).toBe(20);
  });

  test("start task no skip", () => {
    task1.steps[0].Start = true;
    task1.steps[0].Skip = false;
    expect(mmlogic.tryStartPxx(task1)).toBe("run");
    expect(task1.steps[0].Start).toBe(false);
    expect(task1.steps[0].Run).toBe(true);
    expect(task1.steps[0].Done).toBe(false);
    expect(task1.steps[task1.seq[1]].Start).toBe(true);

    mmlogic.resetAllSteps(task1.steps);
  });

  test("start task skip", () => {
    task1.steps[0].Start = true;
    task1.steps[0].Skip = true;
    expect(mmlogic.tryStartPxx(task1)).toBe("skiped");
    expect(task1.steps[0].Start).toBe(false);
    expect(task1.steps[0].Run).toBe(false);
    expect(task1.steps[0].Done).toBe(true);
    expect(task1.steps[task1.seq[1]].Start).toBe(false);

    mmlogic.resetAllSteps(task1.steps);
  });

  test("start task not started", () => {
    mmlogic.resetAllSteps(task1.steps);

    expect(mmlogic.tryStartPxx(task1)).toBe("");
    expect(task1.steps[0].Start).toBe(false);
    expect(task1.steps[0].Run).toBe(false);
    expect(task1.steps[0].Done).toBe(false);
    expect(task1.steps[task1.seq[1]].Start).toBe(false);

    mmlogic.resetAllSteps(task1.steps);
  });

  test("executeStep started", async () => {
    const index = task1.seq[1];
    task1.steps[index].Start = true;
    await mmlogic.executeStep(task1, index);
    expect(task1.steps[index]).toStrictEqual({
      Start: false,
      Run: false,
      Done: true,
      Skip: false,
      Reset: false,
    });
    mmlogic.resetAllSteps(task1.steps);
  });

  test("executeStep not started", async () => {
    const index = task1.seq[1];
    task1.steps[index].Start = false;
    await mmlogic.executeStep(task1, index);
    expect(task1.steps[index]).toStrictEqual({
      Start: false,
      Run: false,
      Done: false,
      Skip: false,
      Reset: false,
    });
    mmlogic.resetAllSteps(task1.steps);
  });
  test("executeStep started and skiped", async () => {
    const index = task1.seq[1];
    task1.steps[index].Start = true;
    task1.steps[index].Skip = true;
    await mmlogic.executeStep(task1, index);
    expect(task1.steps[index]).toStrictEqual({
      Start: false,
      Run: false,
      Done: true,
      Skip: true,
      Reset: false,
    });
    mmlogic.resetAllSteps(task1.steps);
  });

  test("doWork start no skip", async () => {
    task1.steps[0].Start = true;
    expect(mmlogic.tryStartPxx(task1)).toBe("run");

    await mmlogic.doWork(task1);
    expect(task1.steps[0]).toStrictEqual({
      Start: false,
      Run: false,
      Done: true,
      Skip: false,
      Reset: false,
    });
    mmlogic.resetAllSteps(task1.steps);
  });
  test("doWork start skip", async () => {
    task1.steps[0].Start = true;
    task1.steps[0].Skip = true;
    expect(mmlogic.tryStartPxx(task1)).toBe("skiped");

    await mmlogic.doWork(task1);
    expect(task1.steps[0]).toStrictEqual({
      Start: false,
      Run: false,
      Done: true,
      Skip: true,
      Reset: false,
    });
    mmlogic.resetAllSteps(task1.steps);
  });
  test("doWork no start", async () => {
    mmlogic.resetAllSteps(task2.steps);
    expect(mmlogic.tryStartPxx(task2)).toBe("");

    await mmlogic.doWork(task2);
    expect(task2.steps[0]).toStrictEqual({
      Start: false,
      Run: false,
      Done: false,
      Skip: false,
      Reset: false,
    });
    mmlogic.resetAllSteps(task2.steps);
  });

  test("doMMLogic", () => {
    mmlogic.resetAllTasks();
    mmlogic.setPLCVarByName("P200[0].Start", true);
    expect(mmlogic.getPLCVarByName("P200[0].Start")).toBe(true);
    expect(mmlogic.getPLCVarByName("P200[0].Done")).toBe(false);

    mmlogic.doMMLogic();
    expect(mmlogic.getPLCVarByName("P200[0].Start")).toBe(false);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(mmlogic.getPLCVarByName("P200[0].Done")).toBe(true);
        resolve();
      }, 100);
    });
  });
});
