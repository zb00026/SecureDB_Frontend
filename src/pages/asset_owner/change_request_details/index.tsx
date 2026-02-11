import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, Flex, Text } from '@chakra-ui/react';
import { useDamToast, DamRejectDialog } from '@common/index';
import { useApiRequest } from '@common/hooks/useApiRequest';
import { AssetQueryChangeRequest } from '@models/assets/AssetQueryChangeRequest';
import { QueryDetailsShared } from '@common/components/QueryDetailsShared';
import { DamAlertDialog } from '@common/components/DamDialog/DamAlertDialog';
import { ChangeRequestStatus } from '@/constants/enums';

interface QueryResult {
  headers: string[];
  data: Record<string, any>[];
  query: string;
}

interface QueryResponse {
  totalQueries: number;
  results: QueryResult[];
}

export function Component() {
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useDamToast();
  const [changeRequest, setChangeRequest] = useState<AssetQueryChangeRequest | null>(null);
  const [queryResults, setQueryResults] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproveDlgOpen, setIsApproveDlgOpen] = useState(false);
  const [isRejectDlgOpen, setIsRejectDlgOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRunningQuery, setIsRunningQuery] = useState(false);
  const [editedQuery, setEditedQuery] = useState<string>('');
  const [approvalFailed, setApprovalFailed] = useState(false);
  const changeRequestId = searchParams.get('changeRequestId');
  const { handleRequest } = useApiRequest();

  // Initialize editedQuery when changeRequest is loaded
  useEffect(() => {
    if (changeRequest?.query) {
      setEditedQuery(changeRequest.query);
    }
  }, [changeRequest?.id]); // Only update when changeRequest ID changes (on initial load or refresh)

  useEffect(() => {
    if (changeRequestId) {
      fetchChangeRequest();
    }
  }, [changeRequestId]);

  const fetchChangeRequest = () => {
    handleRequest(
      `/api/asset_owner/assets/change_requests/${changeRequestId}`,
      'GET',
      {},
      {
        onSuccess: (data: AssetQueryChangeRequest) => {
          setChangeRequest(data);
          setEditedQuery(data.query);
        },
        errorDescriptionId: 'text.failed_to_fetch_change_request',
      }
    );
  };

  const handleApprove = (approvalStatus: ChangeRequestStatus) => {
    setIsApproving(true);
    setIsLoading(true);
    
    // Use edited query if approval failed and query was edited, otherwise use original query
    const queryToUse = approvalFailed && editedQuery ? editedQuery : (changeRequest?.query ?? '');
    
    const requestData: any = {
      requestId: changeRequest?.id,
      query: queryToUse,
      approvalStatus,
    };

    handleRequest(
      `/api/asset_owner/assets/change_requests/set_approval`,
      'POST',
      requestData,
      {
        onSuccess: (data: any) => {
          if (data.results) {
            setQueryResults(data.results);
          }
          // Use edited query if approval failed and query was edited, otherwise use original query
          const queryToUse = approvalFailed && editedQuery ? editedQuery : (changeRequest?.query ?? '');
          // Update local status immediately
          if (changeRequest) {
            setChangeRequest({
              ...changeRequest,
              approvalStatus: approvalStatus,
              query: queryToUse,
            });
          }
          setIsLoading(false);
          setIsApproving(false);
          setApprovalFailed(false); // Reset approval failed flag on success
          if (approvalStatus == ChangeRequestStatus.APPROVED) {
            showSuccess({ description: intl.formatMessage({ id: 'text.change_request_approved_successfully' }) });
            setIsApproveDlgOpen(false);
            // Delay to show the updated status before any potential navigation
            setTimeout(() => {
              // Status is already updated, user can see it
            }, 1500);
          } else {
            showSuccess({ description: intl.formatMessage({ id: 'text.change_request_rejected_successfully' }) });
            setIsRejectDlgOpen(false);
            setTimeout(() => {
              // Status is already updated, user can see it
            }, 1500);
          }
        },
        onError: () => {
          setIsLoading(false);
          setIsApproving(false);
          if (approvalStatus == ChangeRequestStatus.APPROVED) {
            setIsApproveDlgOpen(false);
            // Set approval failed flag to allow query editing and re-running
            setApprovalFailed(true);
          } else {
            setIsRejectDlgOpen(false);
          }
        },
        errorDescriptionId:
          approvalStatus == ChangeRequestStatus.APPROVED
            ? 'text.failed_to_approve_change_request'
            : 'text.failed_to_reject_change_request',
      }
    );
  };

  const handleQueryChange = (newQuery: string) => {
    setEditedQuery(newQuery);
  };

  const runQuery = () => {
    if (!editedQuery.trim()) {
      showError({ description: 'Please enter a query' });
      return;
    }

    if (!changeRequest?.asset?.id) {
      showError({ description: 'Asset not selected' });
      return;
    }

    setIsRunningQuery(true);

    const requestData = {
      requestId: changeRequest?.id,
      assetId: changeRequest.asset.id,
      isChangeRequest: true,
      ticketReference: changeRequest?.ticketReference,
      changeDescription: changeRequest?.changeDescription,
      query: editedQuery,
    };

    handleRequest(
      `/api/asset_owner/assets/run_query`,
      'POST',
      requestData,
      {
        onSuccess: (data: any) => {
          if (data.results) {
            setQueryResults(data.results);
          }
          // Update the change request with the new query
          if (changeRequest) {
            setChangeRequest({
              ...changeRequest,
              query: editedQuery,
            });
          }
          setIsRunningQuery(false);
          setApprovalFailed(false); // Reset approval failed flag after successful run
          showSuccess({ description: intl.formatMessage({ id: 'text.query_run_success' }) });
        },
        onError: () => {
          setIsRunningQuery(false);
        },
        errorDescriptionId: 'text.failed_to_run_query',
      }
    );
  };

  const handleReject = (reason: string) => {
    setIsRejecting(true);
    setIsLoading(true);
    
    const requestData = {
      requestId: changeRequest?.id,
      query: changeRequest?.query,
      approvalStatus: ChangeRequestStatus.REJECTED,
      rejectReason: reason,
    };

    handleRequest(
      `/api/asset_owner/assets/change_requests/set_approval`,
      'POST',
      requestData,
      {
        onSuccess: (data: any) => {
          if (data.results) {
            setQueryResults(data.results);
          }
          // Update local status immediately
          if (changeRequest) {
            setChangeRequest({
              ...changeRequest,
              approvalStatus: ChangeRequestStatus.REJECTED,
            });
          }
          setIsLoading(false);
          setIsRejecting(false);
          showSuccess({ description: intl.formatMessage({ id: 'text.change_request_rejected_successfully' }) });
          setIsRejectDlgOpen(false);
          // Delay to show the updated status before any potential navigation
          setTimeout(() => {
            // Status is already updated, user can see it
          }, 1500);
        },
        onError: () => {
          setIsLoading(false);
          setIsRejecting(false);
          setIsRejectDlgOpen(false);
        },
        errorDescriptionId: 'text.failed_to_reject_change_request',
      }
    );
  };

  const actionButtons = (
    <>
      {/* Show buttons only when status is REQUESTED */}
      {changeRequest?.approvalStatus === ChangeRequestStatus.REQUESTED && !approvalFailed && (
        <>
          <Button
            onClick={() => setIsApproveDlgOpen(true)}
            isLoading={isApproving}
            loadingText={intl.formatMessage({ id: 'text.approving' })}
            colorScheme='green'
            disabled={isApproving || isRejecting}
          >
            <FormattedMessage id='text.approve' />
          </Button>
          <Button
            onClick={() => setIsRejectDlgOpen(true)}
            isLoading={isRejecting}
            loadingText={intl.formatMessage({ id: 'text.rejecting' })}
            colorScheme='red'
            disabled={isApproving || isRejecting}
          >
            <FormattedMessage id='text.reject' />
          </Button>
        </>
      )}
      {/* Show Run Query button when approval failed */}
      {approvalFailed && (
        <>
          <Button
            onClick={runQuery}
            isLoading={isRunningQuery}
            loadingText="Running..."
            colorScheme='blue'
            disabled={isRunningQuery || isApproving || isRejecting}
          >
            <FormattedMessage id='text.run_query' />
          </Button>
          <Button
            onClick={() => setIsApproveDlgOpen(true)}
            isLoading={isApproving}
            loadingText={intl.formatMessage({ id: 'text.approving' })}
            colorScheme='green'
            disabled={isRunningQuery || isApproving || isRejecting}
          >
            <FormattedMessage id='text.approve' />
          </Button>
          <Button
            onClick={() => setIsRejectDlgOpen(true)}
            isLoading={isRejecting}
            loadingText={intl.formatMessage({ id: 'text.rejecting' })}
            colorScheme='red'
            disabled={isRunningQuery || isApproving || isRejecting}
          >
            <FormattedMessage id='text.reject' />
          </Button>
        </>
      )}
      {/* Show approved status - buttons are hidden when status is APPROVED */}
      {changeRequest?.approvalStatus === ChangeRequestStatus.APPROVED && !approvalFailed && (
        <Flex w='full' alignItems={'center'} justifyContent={'center'}>
          <Text color="green.600" fontWeight="semibold">
            <FormattedMessage id="text.change_request_approved_successfully" />
          </Text>
        </Flex>
      )}
      {/* Show rejected status - buttons are hidden when status is REJECTED */}
      {changeRequest?.approvalStatus === ChangeRequestStatus.REJECTED && (
        <Flex w='full' alignItems={'center'} justifyContent={'center'}>
          <Text color="red.600" fontWeight="semibold">
            <FormattedMessage id="text.change_request_rejected_successfully" />
          </Text>
        </Flex>
      )}
    </>
  );

  return (
    <>
      <QueryDetailsShared
        title={intl.formatMessage({ id: 'text.change_request_details' })}
        asset={changeRequest?.asset ?? null}
        query={editedQuery || changeRequest?.query || ''}
        queryResults={queryResults}
        isQueryEditable={
          (approvalFailed || changeRequest?.approvalStatus === ChangeRequestStatus.REQUESTED) && !!changeRequest
        }
        onQueryChange={handleQueryChange}
        ticketReference={changeRequest?.ticketReference}
        changeDescription={changeRequest?.changeDescription}
        isTicketInfoVisible={true}
        actionButtons={actionButtons}
      />

      {/* Reject Dialog with Reason */}
      <DamRejectDialog
        isOpen={isRejectDlgOpen}
        onClose={() => setIsRejectDlgOpen(false)}
        onConfirm={handleReject}
        title="text.reject_change_request"
        message="text.are_you_sure_reject_change_request"
        isLoading={isLoading}
      />

      {/* Approval Dialog */}
      <DamAlertDialog
        isOpen={isApproveDlgOpen}
        onClose={() => setIsApproveDlgOpen(false)}
        onConfirm={() => handleApprove(ChangeRequestStatus.APPROVED)}
        title='text.approve_change_request'
        message='text.are_you_sure_approve_change_request'
        confirmButtonId='btnConfirmApproveChangeRequest'
      />
    </>
  );
}
