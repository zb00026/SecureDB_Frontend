import { useEffect, useState } from "react";
import { useMyToast, request } from "../";
import { SpringBootPage, PaginationResponse } from "@models/Pagenation";


const createQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return searchParams.toString();
};

const getUrl = (baseUri: string, queryString: string): string => {
  if (!queryString) return baseUri;
  return `${baseUri}?${queryString}`;
};

export function useListPage<T>({ baseUri, defaultParams = {} }: {
  baseUri: string;
  defaultParams?: Record<string, any>;
}) {
  const [params, setParams] = useState<any>({});
  const [getData, setData] = useState<any>({});
  const { showRes } = useMyToast();
  const getList = async (params: Record<string, any> = {}) => {
    const queryString = createQueryString({
      ...defaultParams,
      ...params
    });

    const url = getUrl(baseUri, queryString);

    request(url, {})
      .then((res) => {
        setParams({});
        setData(res);
      })
      .catch(showRes);
  };

  useEffect(() => {
    if (defaultParams) {
      getList({
        ...defaultParams,
        ...{ page: 1, perPage: 10 }
      });
    } else {
      getList({ page: 1, perPage: 10 });
    }

  }, []);

  const pagination = {
    meta: {
      total: getData?.totalElements ?? 0,
      current_page: (getData?.number ?? 0) + 1,
      per_page: getData?.size ?? 10
    },
    onChange: (page: number, pageSize: number) => {
      let t = {
        ...defaultParams,
        ...params,
        ...{ page: page, perPage: pageSize },
      };
      getList(t);
    },
  };
  const transformResponse = (response: SpringBootPage<T>): PaginationResponse<T> => {
    return {
      data: response?.content ?? [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0
      }
    };
  };

  return {
    getData,
    getList,
    pagination,
    transformResponse
  };
};
