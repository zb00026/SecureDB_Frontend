
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";
import { Box, VStack, Heading, Text, Grid, GridItem, Card, CardBody, Button } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { ViewIcon } from "@chakra-ui/icons";


export const isSearchable = true;
export const displayName = 'Auditor Page';

export function Component() {
  const navigate = useNavigate();
  
  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <VStack align="start" spacing={2}>
          <Heading size="lg">
            <FormattedMessage id="text.auditor" />
          </Heading>
          <Text color="gray.500">
            <FormattedMessage id="text.audit_log_storage" />
          </Text>
        </VStack>

        <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
          <GridItem>
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <VStack align="start" spacing={2}>
                    <ViewIcon boxSize={8} color="blue.500" />
                    <Heading size="md">
                      <FormattedMessage id="text.audit_log_storage" />
                    </Heading>
                    <Text color="gray.500">
                      View and analyze system audit logs and user activities
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="blue"
                    onClick={() => navigate('/auditor/audit-trail')}
                    leftIcon={<ViewIcon />}
                  >
                    <FormattedMessage id="text.audit_log_storage" />
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <VStack align="start" spacing={2}>
                    <ViewIcon boxSize={8} color="green.500" />
                    <Heading size="md">
                      <FormattedMessage id="terminal.audit.title" />
                    </Heading>
                    <Text color="gray.500">
                      Monitor and review terminal sessions and commands
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="green"
                    onClick={() => navigate('/auditor/terminal-audit')}
                    leftIcon={<ViewIcon />}
                  >
                    <FormattedMessage id="terminal.audit.title" />
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </VStack>
    </Box>
  );
}