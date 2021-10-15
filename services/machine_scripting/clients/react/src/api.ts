import { ExtractByType, RequestMatching } from "./types";

type ReqTypes_get<T = RequestMatching> = T extends { type: any; method: "GET" }
  ? T["type"]
  : never;
type ReqTypes_post<T = RequestMatching> = T extends {
  type: any;
  method: "POST";
}
  ? T["type"]
  : never;
type IResponse<type> = ExtractByType<RequestMatching, type>["response"];
type IRequest<type extends ReqTypes_post> = ExtractByType<
  RequestMatching,
  type
>["request"];

export class API {
  address: string;
  port: number;
  constructor(address: string, port: number) {
    this.address = address;
    this.port = port;
    console.log("api created");
  }
  getByAPI_get<type extends ReqTypes_get, response_type = IResponse<type>>(
    name: type
  ): Promise<response_type> {
    return new Promise((resolve, reject) => {
      fetch(`${this.address}:${this.port}/${name}`)
        .then((res) => res.json())
        .then((res) => {
          resolve(res as response_type);
        });
    });
  }
  getByAPI_post<
    type extends ReqTypes_post,
    response_type = IResponse<type>,
    request_type = IRequest<type>
  >(
    name: type,
    req: request_type,
    abortSignal?: AbortSignal
  ): Promise<response_type> {
    return new Promise(async (resolve, reject) => {
      try {
        const ret = await fetch(`${this.address}:${this.port}/${name}`, {
          method: "POST",
          body: JSON.stringify(req),
          headers: { "Content-Type": "application/json" },
          signal: abortSignal,
        });
        resolve(await ret.json());
      } catch {
        console.log("POST catch");
      }
    });
  }
}
