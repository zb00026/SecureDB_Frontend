import { useToast } from "@chakra-ui/react";
import { useIntl } from "react-intl";

export function useDamToast() {
  const toast = useToast();
  const intl = useIntl();
  const showSuccess = ({ id, title = intl.formatMessage({id: 'text.SUCCESS'}), description }: { id?: string, title?: string, description: string }) => {
    toast({
      id: id ?? 'toastSuccess',
      title,
      description,
      status: 'success',
      position: "top",
      duration: 5000,
      isClosable: true,
    });
  };

  const showError = ({ id, title, description, onCloseComplete, duration }: { id?: string, title?: string, description: string, onCloseComplete?: () => void, duration?: number }) => {
    toast({
      id: id ?? 'toastError',
      title,
      description,
      status: 'error',
      position: "top",
      duration: duration ?? 5000,
      isClosable: true,
      onCloseComplete
    });
  };

  const showRes = (res: any) => {
    toast({
      title: res.message ?? "",
      description: res.description ?? "",
      status: res.code === 0 ? "success" : "error",
      position: "top",
      duration: 5000,
      isClosable: true,
    });
  };

  return { showSuccess, showError, showRes };
}
