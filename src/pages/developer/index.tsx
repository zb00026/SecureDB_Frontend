import { Flex } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { TextBody } from "@common/index";
import { useIntl } from "react-intl";

export const isSearchable = true;
export const displayName = 'Developer Page';

export function Component() {
  const intl = useIntl();
  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.developer' })}
      backTitle={intl.formatMessage({ id: 'text.dashboard' })}
      backURI="/">
      <TextBody>
        This is Developer Page
      </TextBody>
      <Flex mt={6} />
    </DamBasePage>
  );
}