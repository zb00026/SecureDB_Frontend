import { Flex, Input, Text } from "@chakra-ui/react";
import { MyBasePage } from "@common/components/MyBasePage";
import { MyCardDivider } from "@common/index";
import { useIntl } from "react-intl";

export const isSearchable = true;
export const displayName = 'Auditor Page';

export function Component() {
  const intl = useIntl();
  
  return (
    <MyBasePage
      title={intl.formatMessage({ id: 'text.auditor' })}
      backTitle={intl.formatMessage({ id: 'text.dashboard' })}
      backURI="/">
      <Flex flexDir="column" w="full" px={6}>
        <MyCardDivider></MyCardDivider>
        <Flex w='full' textAlign={'center'} mt={2} alignItems={'center'} gap={2}>
          <Text mb={0}>
            This is Auditor Page
          </Text>
          
        </Flex>
      </Flex>
      <Flex mt={6} />
    </MyBasePage>
  );
}