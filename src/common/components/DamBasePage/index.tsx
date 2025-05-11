import { Flex } from "@chakra-ui/react";
import useLogout from "@common/hooks/useLogout";
import {
  DamButton,
  DamCard,
  DamCardBody,
  DamCardDivider,
  DamContent,
  TextCardHeader
} from "@common/index";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";

export type DamPageProps = Readonly<{
  title: string;
  children?: any;
  backURI?: string;
  backTitle?: string;
  hasBody?: boolean;
}>;

export function DamBasePage({
  title,
  backURI,
  backTitle,
  children,
  hasBody = true
}: DamPageProps) {
  const logout = useLogout();
  return (
    <DamContent py={hasBody ? '24px' : 0}>
      <Flex flexDir="column">
        <Flex w="100%"></Flex>
        <Flex flexWrap="wrap" w="100%">
          <Flex pt={5} flexDir="column" w="100%">
            <DamCard mt="4" pb={hasBody ? 4 : 0}>
              <DamCardBody>
                <TextCardHeader w="full" pb={0}>
                  <Flex justifyContent="space-between" alignItems="center">
                    {
                      (backURI && backTitle) ? (
                        <Link to={backURI}>
                          <DamButton colorScheme="green" mr={4}>
                            {backTitle}
                          </DamButton>
                        </Link>
                      ) : (
                        <></>
                      )
                    }

                    {title}
                    <DamButton onClick={logout} colorScheme="red" id="btnLogout">
                      <FormattedMessage id="text.logout" />
                    </DamButton>
                  </Flex>
                </TextCardHeader>
                {
                  hasBody ? (<Flex flexDir="column" w="full" px={6}>
                    <DamCardDivider></DamCardDivider>
                    {children}
                  </Flex>) : (<></>)
                }
              </DamCardBody>
            </DamCard>
          </Flex>
        </Flex>
      </Flex>
    </DamContent>
  );
}