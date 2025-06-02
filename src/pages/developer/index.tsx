import { Flex } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { PrimaryButton } from "@common/index";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "react-router-dom";

export const isSearchable = true;
export const displayName = 'Developer Page';

export function Component() {
  const intl = useIntl();
  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.developer' })}>
      <Flex flexDir="column" w="full" px={6}>
        <Flex mt={6} gap={2}>
          <Link to="/developer/assets" >
            <PrimaryButton>
              <FormattedMessage id="text.show_assets" />
            </PrimaryButton>
          </Link>
        </Flex>
      </Flex>
    </DamBasePage>
  );
}