import { useEffect, useState } from "react";
import { useMyToast, request } from "../";

export const useListPage = ({ baseUri, defaultParams }: any) => {
  const [params, setParams] = useState<any>({});
  const [getData, setData] = useState<any>({});
  const { showRes } = useMyToast();
  const getList = (data: any, url = "") => {
    request(url || baseUri, data)
      .then((res) => {
        setParams(data);
        setData(res);
      })
      .catch(showRes);
  };

  useEffect(() => {
    if(defaultParams){
      getList({      
        ...defaultParams,
        ...{ page: 1, perPage: 20 }
      });
    } else {
      getList({ page: 1, perPage: 20 });
    }
    
  }, []);

  const pagination = {
    meta: getData?.meta,
    onChange: (page: number, pageSize: number) => {
      let t = {
        ...defaultParams,
        ...params,
        ...{ page: page, perPage: pageSize },
      };
      getList(t);
    },
  };
  return {
    getData,
    getList,
    pagination,
    params,
  };
};
