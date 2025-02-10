import { Flex } from "@chakra-ui/react";
import { MyBasePage } from "@common/components/MyBasePage";
import { TextBody } from "@common/index";
import { useIntl } from "react-intl";

export const isSearchable = true;
export const displayName = 'Resource Owner Main Page';

export function Component() {

  const intl = useIntl();
  return (
    <MyBasePage
      title={intl.formatMessage({ id: 'text.resource_owner' })}
      backTitle={intl.formatMessage({ id: 'text.dashboard' })}
      backURI="/">
      <TextBody>
        This is Resource Owner Page
      </TextBody>
      <Flex mt={6} />
    </MyBasePage>
  );
}