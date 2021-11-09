interface P_type {
  Start: boolean;
  Run: boolean;
  Done: boolean;
  Skip: boolean;
  Reset: boolean;
  Next: number;
}

export default class MMLogic {
  mm_vault: { [x: string]: P_type[] };
  constructor() {
    this.mm_vault = {
      P200: this.makePArr(7),
      P300: this.makePArr(5),
      P400: this.makePArr(8),
      P500: this.makePArr(7),
      P600: this.makePArr(20, [1, 2, 3, 7, 4, 5, 8, 6, 9, 0, 0, 0]),
      P700: this.makePArr(7),
      P800: this.makePArr(9),
    };
  }
  is_running = false;
  run() {
    if (this.is_running) return;
    const mm_run = () => {
      this.doMMLogic();
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
    const a = MMLogic.mm_var_regexp.exec(name);
    if (a) return this.mm_vault[a[1]][a[2]][a[3]];
    else return undefined;
  }
  setPLCVarByName(name: string, value) {
    const a = MMLogic.mm_var_regexp.exec(name);
    if (a) this.mm_vault[a[1]][a[2]][a[3]] = value;
  }
  makeP(next: number): P_type {
    return {
      Start: false,
      Done: false,
      Run: false,
      Skip: false,
      Reset: false,
      Next: next,
    };
  }
  makePArr(n: number, seq?: number[]): P_type[] {
    if (seq == undefined) seq = [...Array(n)].map((value, index) => index);
    return [...Array(n)].map((value, index) => this.makeP(seq[index]));
  }
  doMMLogic() {
    for (var xxx in this.mm_vault) {
      const pxxx = this.mm_vault[xxx] as P_type[];
      if (pxxx[0].Start == true) {
        pxxx[0].Start = false;
        if (pxxx[0].Skip) {
          pxxx[0].Done = true;
          console.log(`${xxx} skiped`);
        } else {
          pxxx[0].Run = true;
          pxxx[1].Start = true;
        }
      }

      const work = (p_step: P_type, index: number) => {
        if (index == 0) return;

        if ((p_step.Done && p_step.Run) || (p_step.Start && p_step.Skip)) {
          if (p_step.Skip) {
            p_step.Done = true;
            console.log(`${xxx}[${index}] skiped`);
          }
          p_step.Run = false;
          if (p_step.Next < pxxx.length && p_step.Next != 0) {
            pxxx[p_step.Next].Start = true;
          } else {
            pxxx[0].Run = false;
            pxxx[0].Done = true;
            console.log(`${xxx} complete`);
          }
        }
        if (p_step.Start) {
          p_step.Start = false;
          if (!p_step.Skip) {
            p_step.Run = true;
            let t = 0;
            const p_name = xxx.slice(0);
            const run = () => {
              t += 10;
              if (t < 100) {
                setTimeout(run, 100);
                console.log(`${p_name}[${index}] ${t}%`);
              } else {
                p_step.Done = true;
                console.log(`${p_name}[${index}] complete`);
              }
            };
            run();
          }
        }
      };
      let w_i = pxxx[0].Next;
      while (w_i) {
        work(pxxx[w_i], w_i);
        w_i = pxxx[w_i].Next;
      }

      if (pxxx[0].Reset) {
        console.log(`${xxx} Reset`);
        pxxx.forEach((p) => {
          for (var prop in p) p[prop] = false;
        });
      }
    }
    if (this.mm_vault.P200[0].Start) {
      this.mm_vault.P200[0].Start = false;
      this.mm_vault.P200[0].Run = true;
      this.mm_vault.P200[1].Start = true;
    }
    // console.log(mm_vault.P200);
  }
}
