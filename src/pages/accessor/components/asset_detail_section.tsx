import { Asset } from "@models/assets/Asset";
import { Flex, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface AssetDetailsSectionProps {
  readonly asset: Asset | null;
  readonly showDescription?: boolean; // Optional flag to show/hide description
  readonly className?: string; // Optional styling
  readonly textSize?: string; // Optional text size override
  readonly pb?: number;
}

export function AssetDetailsSection({ 
  asset, 
  showDescription = true,
  className,
  textSize = "lg",
  pb = 6

}: AssetDetailsSectionProps) {
  return (
    <Flex w="full" flexDirection={'column'} gap={1} pt={3} pb={pb} className={className}>
      <Flex>
        <Text fontSize={textSize} fontWeight="bold">
          <FormattedMessage id="text.asset_name" />
        </Text>
        :
        <Text fontSize={textSize}>
          {asset?.name}
        </Text>
      </Flex>

      {showDescription && (
        <Flex>
          <Text fontSize={textSize} fontWeight="bold">
            <FormattedMessage id="text.asset_description" />
          </Text>
          :
          <Text fontSize={textSize}>
            {asset?.description}
          </Text>
        </Flex>
      )}
    </Flex>
  );
}