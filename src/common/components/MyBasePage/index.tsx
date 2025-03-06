import { Flex } from "@chakra-ui/react";
import useLogout from "@common/hooks/useLogout";
import {
  MyButton,
  MyCard,
  MyCardBody,
  MyCardDivider,
  MyContent,
  TextCardHeader
} from "@common/index";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";

export type MyPageProps = Readonly<{
  title: string;
  children?: any;
  backURI?: string;
  backTitle?: string;
  hasBody?: boolean;
}>;

export function MyBasePage({
  title,
  backURI,
  backTitle,
  children,
  hasBody = true
}: MyPageProps) {
  const logout = useLogout();
  return (
    <MyContent w="98%" py={hasBody ? '24px' : 0}>
      <Flex flexDir="column">
        <Flex w="100%"></Flex>
        <Flex flexWrap="wrap" w="100%">
          <Flex pt={5} flexDir="column" w="100%">
            <MyCard mt="4" pb={hasBody ? 4 : 0}>
              <MyCardBody>
                <TextCardHeader w="full" pb={0}>
                  <Flex justifyContent="space-between" alignItems="center">
                    {
                      (backURI && backTitle) ? (
                        <Link to={backURI}>
                          <MyButton colorScheme="green" mr={4}>
                            {backTitle}
                          </MyButton>
                        </Link>
                      ) : (
                        <></>
                      )
                    }

                    {title}
                    <MyButton onClick={logout} colorScheme="red" id="btnLogout">
                      <FormattedMessage id="text.logout" />
                    </MyButton>
                  </Flex>
                </TextCardHeader>
                {
                  hasBody ? (<Flex flexDir="column" w="full" px={6}>
                    <MyCardDivider></MyCardDivider>
                    {children}
                  </Flex>) : (<></>)
                }
              </MyCardBody>
            </MyCard>
          </Flex>
        </Flex>
      </Flex>
    </MyContent>
  );
}