import { Flex } from "@chakra-ui/react";
import { MyBasePage } from "@common/components/MyBasePage";
import { TextBody } from "@common/index";
import { useIntl } from "react-intl";

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