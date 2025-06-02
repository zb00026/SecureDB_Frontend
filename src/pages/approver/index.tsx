import { Flex } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { TextBody } from "@common/index";
import { useIntl } from "react-intl";

export const isSearchable = true;
export const displayName = 'Approver Page';

export function Component() {
  const intl = useIntl();
  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.approver' })}>
      <TextBody>
        This is Approver Page
      </TextBody>
      <Flex mt={6} />
    </DamBasePage>
  );
}