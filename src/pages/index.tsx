import { Flex } from "@chakra-ui/react";
import { MyCard, MyCardBody, MyCardDivider, MyContent, PrimaryButton, TextCardHeader } from "@common/index";
import { FormattedMessage } from "react-intl";
import { Link } from 'react-router-dom';

export function Component() {
    return (
        <MyContent w="98%">
            <Flex flexDir="column">
                <Flex flexWrap="wrap" w="100%">
                    <Flex pt={5} flexDir="column" w="100%">
                        <MyCard mt="4">
                            <MyCardBody>
                                <TextCardHeader>
                                    <FormattedMessage id="text.api_test" />
                                </TextCardHeader>
                                <Flex flexDir="column" w="full" px={6} py={8}>
                                    <MyCardDivider/>
                                    <Flex mt={6}/>
                                    <Link to="/users" >
                                        <PrimaryButton>
                                            <FormattedMessage id="text.users" />
                                        </PrimaryButton>
                                    </Link>
                                </Flex>
                            </MyCardBody>
                        </MyCard>
                    </Flex>
                </Flex>
            </Flex>

        </MyContent>
    );
}