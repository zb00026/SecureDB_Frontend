import { HStack, Badge, Text, Flex } from '@chakra-ui/react';
import { TerminalCommandAudit } from '@models/TerminalCommandAudit';
import { formatDateTime, getRiskLevelColor, getCommandTypeColor } from '../utils/terminalAuditUtils';

interface CommandBadgesProps {
  command: TerminalCommandAudit;
  showTimestamp?: boolean;
}

export const CommandBadges = ({ command, showTimestamp = true }: CommandBadgesProps) => {
  return (
    <Flex direction="column" gap={2}>
      <HStack spacing={2} flexWrap="wrap">
        <Badge colorScheme="blue" variant="subtle" fontSize="sm">
          #{command.commandSequence}
        </Badge>
        <Badge colorScheme={getCommandTypeColor(command.commandType)} variant="subtle">
          {command.commandType}
        </Badge>
        <Badge colorScheme={getRiskLevelColor(command.riskLevel)} variant="subtle">
          {command.riskLevel}
        </Badge>
        {command.isDangerous && (
          <Badge colorScheme="red" variant="solid">
            DANGEROUS
          </Badge>
        )}
      </HStack>
      {showTimestamp && (
        <Text fontSize="sm" color="gray.500" mb={0}>
          {formatDateTime(command.executedAt)}
        </Text>
      )}
    </Flex>
  );
};
