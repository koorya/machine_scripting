import {
  ReqTypes_get,
  ReqTypes_post,
  RequestMatching
} from "~shared/types/types";

import { Express } from "express";


type EndPointResponse<T> = Extract<RequestMatching, { type: T; }>["response"];
type EndPointRequest<T> = Extract<RequestMatching, { type: T; }>["request"];
type EndPointFunctionGet<T extends ReqTypes_get> = () => Promise<
  EndPointResponse<T>
>;
type EndPointFunctionPost<T extends ReqTypes_post> = (
  arg0: EndPointRequest<T>
) => Promise<EndPointResponse<T>>;
type EndPointTypeGet<T extends ReqTypes_get> = {
  name: T;
  data: EndPointFunctionGet<T>;
};
type EndPointTypePost<T extends ReqTypes_post> = {
  name: T;
  data: EndPointFunctionPost<T>;
};
type EndPointCreatorGet = <T extends ReqTypes_get>(
  arg0: T,
  arg1: EndPointFunctionGet<T>
) => EndPointTypeGet<T>;
type EndPointCreatorPost = <T extends ReqTypes_post>(
  arg0: T,
  arg1: EndPointFunctionPost<T>
) => EndPointTypePost<T>;
export const createEndPointGet: EndPointCreatorGet = (arg0, arg1) => {
  return {
    name: arg0,
    data: arg1,
    method: "GET",
  };
};
export const createEndPointPost: EndPointCreatorPost = (arg0, arg1) => {
  return {
    name: arg0,
    data: arg1,
    method: "POST",
  };
};
type EndPointTypeGetOfUnion<U extends ReqTypes_get> = { [K in U]: EndPointTypeGet<K> }[U];
type EndPointTypePostOfUnion<U extends ReqTypes_post> = { [K in U]: EndPointTypePost<K> }[U];

export function associateEndpoints(end_points_get: EndPointTypeGetOfUnion<ReqTypes_get>[], end_points_post: EndPointTypePostOfUnion<ReqTypes_post>[], app: Express) {

  end_points_get.forEach((end_point) => {
    app.get(`/${end_point.name}`, async (request, response, next) => {
      try {
        const data = await end_point.data();
        response.json(data);
      } catch (error) {
        return next(error);
      }
    });
  });

  end_points_post.forEach((end_point) => {
    app.post(`/${end_point.name}`, async (request, response, next) => {
      try {
        const data = await end_point.data(request.body);
        response.json(data);
      } catch (error) {
        return next(error);
      }
    });
  });
}