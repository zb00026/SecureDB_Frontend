import { useToast } from "@chakra-ui/react";
import { useIntl } from "react-intl";

export function useMyToast() {
  const toast = useToast();
  const intl = useIntl();
  const showSuccess = ({ title = intl.formatMessage({id: 'text.SUCCESS'}), description }: any) => {
    toast({
      title: title,
      status: "success",
      position: "top",
      duration: 5000,
      isClosable: true,
      description: description,
    });
  };

  const showError = ({ description }: any) => {
    toast({
      // title: "Error",
      status: "error",
      position: "top",
      duration: 5000,
      isClosable: true,
      description: description,
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
