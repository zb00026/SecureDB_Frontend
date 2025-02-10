import { Flex } from "@chakra-ui/react";
import { MyBasePage } from "@common/components/MyBasePage";
import { PrimaryButton, TextBody, } from "@common/index";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "react-router-dom";

export const isSearchable = true;
export const displayName = 'Admin Main Page';

export function Component() {
  const intl = useIntl();
  return (
    <MyBasePage
      title={intl.formatMessage({ id: 'text.admin' })}
      backTitle={intl.formatMessage({ id: 'text.dashboard' })}
      backURI="/">
      <TextBody>
        This is Admin Page
      </TextBody>
      <Flex mt={6} />
      <Link to="/admin/users" >
        <PrimaryButton>
          <FormattedMessage id="text.users" />
        </PrimaryButton>
      </Link>
    </MyBasePage>
  );
}