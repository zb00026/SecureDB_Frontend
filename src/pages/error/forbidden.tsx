import { Flex, Text } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { useIntl } from "react-intl";

export function ForbiddenPage() {
    const intl = useIntl();
    return (
        <DamBasePage
            title="Permission Error">
            <Flex w='full' h='300px' textAlign={'center'} alignItems={'center'} justifyContent={'center'}>
                <Text
                    fontSize='18px'
                    fontWeight='500'
                    textAlign='center'
                    alignItems='center'
                    color='red'>
                    You are not authorized to access this page
                </Text>
            </Flex>

            <Flex mt={6} />
        </DamBasePage>
    );
}