import * as zmq from "zeromq";

export class PlcConnector {
  zmq_sock: zmq.Request;
  port: number;
  constructor(port: number) {
    this.zmq_sock = new zmq.Request();
    this.port = port;
    this.zmq_sock.connect(`tcp://127.0.0.1:${port}`);
  }
  async readVar(names: string[]) {
    if (!this.zmq_sock.writable) {

      console.log(`port: ${this.port}; readable: ${this.zmq_sock.readable}`)
      throw Error("zmq_sock not writable ");
    }
    await this.zmq_sock.send(
      JSON.stringify({
        PlcVarsArray: {
          arr: names.map((n) => {
            return { name: n };
          }),

          update: false,
        },
      })
    );
    var [msg] = await this.zmq_sock.receive();
    return JSON.parse(msg.toString()).PlcVarsArray.arr;
  }
  async readVarToObj(names: string[]): Promise<{ [key: string]: any }> {
    const plc_variables_obj = {};
    (await this.readVar(names)).map(
      (el) => (plc_variables_obj[el.name] = el.value)
    );
    return plc_variables_obj;
  }

  async waitForPlcVar(
    name: string,
    value: any,
    t: number = 200
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let mon: NodeJS.Timeout;
      const run = async () => {
        const plc_variables = await this.readVarToObj([name]);
        if (plc_variables[name] != value) mon = setTimeout(run, t);
        else resolve();
      };
      run();
    });
  }

  async writeVar(vars: { [key: string]: any }) {
    await this.zmq_sock.send(
      JSON.stringify({
        PlcVarsArray: {
          arr: Object.keys(vars).map((n) => {
            return { name: n, value: vars[n] };
          }),

          update: true,
        },
      })
    );
    var [msg] = await this.zmq_sock.receive();
    return JSON.parse(msg.toString()).PlcVarsArray.arr;
  }
  async writeVarByName(name: string, value: any) {
    const pv = {};
    pv[name] = value;
    await this.writeVar(pv);
  }
}

export interface IPlcConnector extends PlcConnector { }
