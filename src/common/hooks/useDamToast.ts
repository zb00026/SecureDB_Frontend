import { useToast } from "@chakra-ui/react";
import { useIntl } from "react-intl";

export function useDamToast() {
  const toast = useToast();
  const intl = useIntl();
  
  // Generate unique ID for toasts to avoid duplicate key warnings
  const generateToastId = (type: 'success' | 'error', customId?: string) => {
    if (customId) return customId;
    return `${type}-${Date.now()}-${crypto.randomUUID()}`;
  };

  const showSuccess = ({ id, title = intl.formatMessage({id: 'text.SUCCESS'}), description }: { id?: string, title?: string, description: string }) => {
    const toastId = generateToastId('success', id);
    toast({
      id: toastId,
      title,
      description,
      status: 'success',
      position: "top",
      duration: 5000,
      isClosable: true,
    });
  };

  const showError = ({ id, title, description, onCloseComplete, duration }: { id?: string, title?: string, description: string, onCloseComplete?: () => void, duration?: number }) => {
    const toastId = generateToastId('error', id);
    toast({
      id: toastId,
      title,
      description,
      status: 'error',
      position: "top",
      duration: duration ?? 5000,
      isClosable: true,
      onCloseComplete
    });
  };

  const showRes = (res: any, customId?: string) => {
    const status = res.code === 0 ? "success" : "error";
    const toastId = generateToastId(status, customId);
    toast({
      id: toastId,
      title: res.message ?? "",
      description: res.description ?? "",
      status,
      position: "top",
      duration: 5000,
      isClosable: true,
    });
  };


  return { showSuccess, showError, showRes };
}
