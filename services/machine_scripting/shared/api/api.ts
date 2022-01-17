import { IRequest, IResponse, ReqTypes_get, ReqTypes_post } from "../types/types";

export class API<matching> {
  address: string;
  port: number;
  fetch: ((input: RequestInfo, init?: RequestInit) => Promise<Response>) | undefined;
  constructor(address: string, port: number) {
    this.address = address;
    this.port = port;
    console.log("api created");
  }
  async setUpFetch() {
    if (this.fetch === undefined) {
      try {
        const t = fetch;
      } catch (e) {
        const module = "node_modules/node-fetch";
        const { default: fetch } = await import(module).catch(e => {
          console.log(e);
        });
        this.fetch = fetch;
      }
    }
  }

  async getByAPI_get<
    type extends ReqTypes_get<matching>,
    request_type extends IRequest<type, matching> = IRequest<type, matching>,
    response_type = IResponse<type, matching>,
    >(
      name: type,
      req?: request_type,
  ): Promise<response_type> {
    await this.setUpFetch();
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams(req)
      if (this.fetch !== undefined)
        this.fetch(`${this.address}:${this.port}/${name}?${params.toString()}`)
          .then((res) => {
            if (res.ok)
              return res.json().then((res) => {
                resolve(res as response_type);
              });
            else
              reject(res.statusText);
          }).catch((reason) => {
            reject("unable to fetch")
          });
      else {
        fetch(`${this.address}:${this.port}/${name}?${params.toString()}`)
          .then((res) => {
            if (res.ok)
              return res.json().then((res) => {
                resolve(res as response_type);
              });
            else
              reject(res.statusText);
          }).catch((reason) => {
            reject("unable to fetch")
          });
      }
    });

  }
  async getByAPI_post<
    type extends ReqTypes_post<matching>,
    response_type = IResponse<type, matching>,
    request_type = IRequest<type, matching>
  >(
    name: type,
    req: request_type,
    abortSignal?: AbortSignal
  ): Promise<response_type> {
    await this.setUpFetch();
    return new Promise(async (resolve, reject) => {
      if (this.fetch !== undefined) {
        try {
          const ret = await this.fetch(`${this.address}:${this.port}/${name}`, {
            method: "POST",
            body: JSON.stringify(req),
            headers: { "Content-Type": "application/json" },
            signal: abortSignal,
          });
          resolve(await ret.json());
        } catch (e) {

          console.log(`POST catch | ${e}`);
          reject();
        }
      } else {
        try {
          const ret = await fetch(`${this.address}:${this.port}/${name}`, {
            method: "POST",
            body: JSON.stringify(req),
            headers: { "Content-Type": "application/json" },
            signal: abortSignal,
          });
          resolve(await ret.json());
        } catch (e) {

          console.log(`POST catch | ${e}`);
          reject();
        }
      }
    });
  }
}
