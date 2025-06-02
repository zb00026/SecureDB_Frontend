import { Flex, Input, Text } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCardDivider } from "@common/index";
import { useIntl } from "react-intl";

export const isSearchable = true;
export const displayName = 'Auditor Page';

export function Component() {
  const intl = useIntl();
  
  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.auditor' })}>
      <Flex flexDir="column" w="full" px={6}>
        <DamCardDivider></DamCardDivider>
        <Flex w='full' textAlign={'center'} mt={2} alignItems={'center'} gap={2}>
          <Text mb={0}>
            This is Auditor Page
          </Text>
          
        </Flex>
      </Flex>
      <Flex mt={6} />
    </DamBasePage>
  );
}