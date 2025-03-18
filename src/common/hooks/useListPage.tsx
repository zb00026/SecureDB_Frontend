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

function isSpringBootPage<T>(data: SpringBootPage<T> | T[]): data is SpringBootPage<T> {
  return !Array.isArray(data) && 'totalElements' in data;
}

export function useListPage<T>({ 
  baseUri, 
  defaultParams = {}, 
  usePagination = true 
}: {
  baseUri: string;
  defaultParams?: Record<string, any>;
  usePagination?: boolean;
}) {
  const [params, setParams] = useState<Record<string, any>>({});
  const [data, setData] = useState<SpringBootPage<T> | T[]>(usePagination ? {} as SpringBootPage<T> : []);
  const { showRes } = useMyToast();

  const getList = async (params: Record<string, any> = {}) => {
    // Only include pagination params if usePagination is true
    const queryParams = {
      ...defaultParams,
      ...params,
      ...(usePagination ? {
        page: params.page || 1,
        perPage: params.perPage || 10
      } : {})
    };

    const queryString = createQueryString(queryParams);
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
        ...(usePagination ? { page: 1, perPage: 10 } : {})
      });
    } else {
      getList(usePagination ? { page: 1, perPage: 10 } : {});
    }
  }, []);

  const pagination = usePagination ? {
    meta: {
      total: isSpringBootPage(data) ? data.totalElements : 0,
      current_page: isSpringBootPage(data) ? data.number + 1 : 1,
      per_page: isSpringBootPage(data) ? data.size : 10
    },
    onChange: (page: number, pageSize: number) => {
      let t = {
        ...defaultParams,
        ...params,
        page,
        perPage: pageSize,
      };
      getList(t);
    },
  } : undefined;

  const transformResponse = (response: SpringBootPage<T>): PaginationResponse<T> => {
    return {
      data: response?.content ?? [],
      pagination: usePagination ? {
        current: 1,
        pageSize: 10,
        total: 0
      } : undefined
    };
  };

  return {
    getData: data,
    getList,
    pagination,
    transformResponse
  };
};
