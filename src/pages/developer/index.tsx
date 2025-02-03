import { Flex } from "@chakra-ui/react";
import { MyBasePage } from "@common/components/MyBasePage";
import { TextBody } from "@common/index";
import { useIntl } from "react-intl";

export function Component() {
    const intl = useIntl();
    return (
        <MyBasePage
            title={intl.formatMessage({ id: 'text.developer' })}
            backTitle={intl.formatMessage({ id: 'text.dashboard' })}
            backURI="/">
            <TextBody>
                This is Developer Page
            </TextBody>
            <Flex mt={6} />
        </MyBasePage>
    );
}