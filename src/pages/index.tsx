import { Flex } from "@chakra-ui/react";
import { clearGoogleToken, MyButton, MyCard, MyCardBody, MyCardDivider, MyContent, PrimaryButton, TextCardHeader } from "@common/index";
import keycloak from "@common/keycloak/keycloak";
import { FormattedMessage } from "react-intl";
import { Link } from 'react-router-dom';

export function Component() {
    const handleLogout = () => {
        clearGoogleToken();
        keycloak.logout();
    }
    return (
        <MyContent w="98%">
            <Flex flexDir="column">
                <Flex flexWrap="wrap" w="100%">
                    <Flex pt={5} flexDir="column" w="100%">
                        <MyCard mt="4">
                            <MyCardBody>
                                <TextCardHeader w="full" pb={0}>
                                    <Flex justifyContent="space-between" alignItems="center">
                                        <FormattedMessage id="text.api_test" />
                                        <MyButton onClick={handleLogout} colorScheme="red">
                                            <FormattedMessage id="text.logout" />
                                        </MyButton>
                                    </Flex>
                                </TextCardHeader>
                                <Flex flexDir="column" w="full" px={6} pb={6}>
                                    <MyCardDivider />
                                    <Flex mt={6} />
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