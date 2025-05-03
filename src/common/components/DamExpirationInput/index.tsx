import { Flex, Text, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface ExpirationInputProps {
  readonly days: number;
  readonly hours: number;
  readonly onDaysChange: (value: number) => void;
  readonly onHoursChange: (value: number) => void;
}

export function ExpirationInput({ days, hours, onDaysChange, onHoursChange }: ExpirationInputProps) {
  return (
    <Flex gap={4} mt={2} w={{ base: 'full', sm: 'auto', md: '50%', lg: '50%' }}>
      <Flex direction="column" flex={1}>
        <Text mb={1}>
          <FormattedMessage id="text.days" />
        </Text>
        <NumberInput
          value={days}
          onChange={(_, value) => onDaysChange(value)}
          min={0}
          max={365}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </Flex>
      <Flex direction="column" flex={1}>
        <Text mb={1}>
          <FormattedMessage id="text.hours" />
        </Text>
        <NumberInput
          value={hours}
          onChange={(_, value) => onHoursChange(value)}
          min={0}
          max={23}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </Flex>
    </Flex>
  );
}