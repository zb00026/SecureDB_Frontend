import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, VStack, Text, Box, useColorModeValue, Divider, FormControl,
  FormLabel, Textarea, Checkbox, Badge, HStack
} from '@chakra-ui/react';
import { FormattedMessage } from 'react-intl';
import { AccessRequest } from '@models/assets/AccessRequest';
import { UnixAccessApprovalDTO } from '@models/assets/UnixAccessRequest';
import { request, useDamToast } from '@common/index';

interface UnixAccessApprovalDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly accessRequest: AccessRequest;
  readonly onSuccess?: () => void;
}

export function UnixAccessApprovalDialog({
  isOpen,
  onClose,
  accessRequest,
  onSuccess
}: UnixAccessApprovalDialogProps) {
  const { showError, showSuccess } = useDamToast();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [approvalData, setApprovalData] = useState<UnixAccessApprovalDTO>({
    approvedGroupIds: []
  });
  const [rejectionData, setRejectionData] = useState({
    rejectReason: ''
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const gray600 = useColorModeValue('gray.600', 'gray.300');
  const gray50 = useColorModeValue('gray.50', 'gray.700');

  // Initialize approval data with requested groups
  useEffect(() => {
    if (isOpen && accessRequest.groupMemberships) {
      const requestedGroupIds = accessRequest.groupMemberships.map(membership => membership.unixGroupId);
      setApprovalData({
        approvedGroupIds: requestedGroupIds
      });
    }
  }, [isOpen, accessRequest.groupMemberships]);

  const handleApprove = async () => {
    if (approvalData.approvedGroupIds.length === 0) {
      showError({
        description: 'At least one group must be approved'
      });
      return;
    }

    try {
      setIsApproving(true);
      await request(`/api/asset_owner/assets/unix-requests/${accessRequest.id}/approve`, {
        method: 'POST',
        data: approvalData
      },
        true, 30000);

      showSuccess({
        description: 'Unix access request approved successfully'
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      showError({
        description: error.data?.error || 'Failed to approve Unix access request'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionData.rejectReason.trim()) {
      showError({
        description: 'Rejection reason is required'
      });
      return;
    }

    try {
      setIsRejecting(true);
      await request(`/api/asset_owner/assets/unix-requests/${accessRequest.id}/reject`, {
        method: 'POST',
        data: rejectionData
      });

      showSuccess({
        description: 'Unix access request rejected successfully'
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      showError({
        description: error.data?.error || 'Failed to reject Unix access request'
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const addGroupToApproval = (membershipId: number) => {
    setApprovalData(prev => ({
      ...prev,
      approvedGroupIds: [...prev.approvedGroupIds, membershipId]
    }));
  };

  const removeGroupFromApproval = (membershipId: number) => {
    setApprovalData(prev => ({
      ...prev,
      approvedGroupIds: prev.approvedGroupIds.filter(id => id !== membershipId)
    }));
  };

  const handleClose = () => {
    setApprovalData({ approvedGroupIds: [] });
    setRejectionData({ rejectReason: '' });
    setIsApproving(false);
    setIsRejecting(false);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="90vh">
        <ModalHeader color={textColor}>
          <VStack align="start" spacing={2}>
            <Text fontSize="lg" fontWeight="bold">
              <FormattedMessage id="text.unix_access_approval" />
            </Text>
            <HStack spacing={4}>
              <Text fontSize="sm" color={gray600} mb={0}>
                Request ID: {accessRequest.id}
              </Text>
              <Badge colorScheme={getStatusColor(accessRequest.assetApproverStatus)}>
                {accessRequest.assetApproverStatus}
              </Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <Divider />
        <ModalBody overflowY="auto">
          <VStack spacing={4} align="stretch">
            {/* Request Details */}
            <Box p={4} bg={gray50} borderRadius="md">
              <Text fontWeight="bold" mb={2}>Request Details</Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Asset:</Text> {accessRequest.asset.name} ({accessRequest.asset.hostAddress})
                </Text>
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Requestor:</Text> {accessRequest.requestor.email}
                </Text>
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Requested Username:</Text> {accessRequest.requestedUsername}
                </Text>
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Request Time:</Text> {new Date(accessRequest.requestTime).toLocaleString()}
                </Text>
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Reason:</Text> {accessRequest.requestReason}
                </Text>
              </VStack>
            </Box>

            {/* Group Memberships */}
            <Box p={4} bg={gray50} borderRadius="md">
              <Text fontWeight="bold" mb={2}>Requested Group Memberships</Text>
              <VStack align="start" spacing={2}>
                {accessRequest.groupMemberships?.map((membership) => (
                  <HStack key={membership.id} spacing={2}>
                    <Checkbox
                      isChecked={approvalData.approvedGroupIds.includes(membership.unixGroupId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          addGroupToApproval(membership.unixGroupId);
                        } else {
                          removeGroupFromApproval(membership.unixGroupId);
                        }
                      }}
                    />
                    <Text fontSize="sm">{membership.unixGroup.name}</Text>
                    {membership.unixGroup.description && (
                      <Text fontSize="xs" color={gray600} mb={0}>
                        - {membership.unixGroup.description}
                      </Text>
                    )}
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Rejection Form */}
            <FormControl>
              <FormLabel>
                <FormattedMessage id="text.rejection_reason" />
              </FormLabel>
              <Textarea
                value={rejectionData.rejectReason}
                onChange={(e) => setRejectionData(prev => ({ ...prev, rejectReason: e.target.value }))}
                placeholder="Explain why this request is being rejected"
                rows={3}
              />
            </FormControl>

          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleClose} mr={3}>
            <FormattedMessage id="text.cancel" />
          </Button>
          <Button
            onClick={handleApprove}
            colorScheme="green"
            isLoading={isApproving}
            loadingText="Approving..."
            isDisabled={approvalData.approvedGroupIds.length === 0 || isRejecting}
            mr={3}
          >
            <FormattedMessage id="text.approve_request" />
          </Button>
          <Button
            onClick={handleReject}
            colorScheme="red"
            isLoading={isRejecting}
            loadingText="Rejecting..."
            isDisabled={!rejectionData.rejectReason.trim() || isApproving}
          >
            <FormattedMessage id="text.reject_request" />
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
