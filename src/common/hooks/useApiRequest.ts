import { useIntl } from "react-intl";
import { request, stateActions, useDamToast } from "@common/index";

interface ApiRequestOptions {
  onSuccess?: (data: any) => void;
  successTitleId?: string;
  successDescriptionId?: string;
  errorDescriptionId?: string;
}

export function useApiRequest() {
  const intl = useIntl();
  const { showSuccess, showError } = useDamToast();

  const handleRequest = async (
    url: string,
    method: string,
    data: any,
    options: ApiRequestOptions
  ) => {
    stateActions.addLoading();
    try {
      const response = await request(url, {
        method,
        data
      });
      
      if (options.successTitleId && options.successDescriptionId) {
        showSuccess({
          id: 'toastSuccess',
          title: intl.formatMessage({ id: options.successTitleId }),
          description: intl.formatMessage({ id: options.successDescriptionId })
        });
      }
      
      options.onSuccess?.(response);
    } catch (e: any) {
      showError({
        id: 'toastError',
        description: e?.response?.data?.error ?? intl.formatMessage({ id: options.errorDescriptionId ?? 'text.operation_failed' })
      });
    }
  };

  return { handleRequest };
} 