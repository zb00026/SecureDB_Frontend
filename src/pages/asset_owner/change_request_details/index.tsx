import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Textarea,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useDamToast } from '@common/index';
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
  const { showSuccess } = useDamToast();
  const [changeRequest, setChangeRequest] = useState<AssetQueryChangeRequest | null>(null);
  const [queryResults, setQueryResults] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproveDlgOpen, setIsApproveDlgOpen] = useState(false);
  const [isRejectDlgOpen, setIsRejectDlgOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const changeRequestId = searchParams.get('changeRequestId');
  const { handleRequest } = useApiRequest();
  const cancelRef = useRef(null);

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
        },
        errorDescriptionId: 'text.failed_to_fetch_change_request',
      }
    );
  };

  const handleApprove = (approvalStatus: ChangeRequestStatus) => {
    setIsLoading(true);
    
    const requestData: any = {
      requestId: changeRequest?.id,
      query: changeRequest?.query,
      approvalStatus,
    };

    // Add reject reason if rejecting
    if (approvalStatus === ChangeRequestStatus.REJECTED && rejectReason.trim()) {
      requestData.rejectReason = rejectReason.trim();
    }

    handleRequest(
      `/api/asset_owner/assets/change_requests/set_approval`,
      'POST',
      requestData,
      {
        onSuccess: (data: any) => {
          if (data.results) {
            setQueryResults(data.results);
          }
          setIsLoading(false);
          if (approvalStatus == ChangeRequestStatus.APPROVED) {
            showSuccess({ description: intl.formatMessage({ id: 'text.change_request_approved_successfully' }) });
            setIsApproveDlgOpen(false);
          } else {
            showSuccess({ description: intl.formatMessage({ id: 'text.change_request_rejected_successfully' }) });
            setIsRejectDlgOpen(false);
            setRejectReason(''); // Reset reject reason
          }
        },
        onError: () => {
          setIsLoading(false);
          if (approvalStatus == ChangeRequestStatus.APPROVED) {
            setIsApproveDlgOpen(false);
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

  const handleRejectDialogClose = () => {
    setIsRejectDlgOpen(false);
    setRejectReason('');
  };

  const actionButtons = (
    <>
      <Button
        onClick={() => setIsApproveDlgOpen(true)}
        isLoading={isLoading}
        colorScheme='green'
        isDisabled={changeRequest?.approvalStatus !== ChangeRequestStatus.PENDING}
      >
        <FormattedMessage id='text.approve' />
      </Button>
      <Button
        onClick={() => setIsRejectDlgOpen(true)}
        isLoading={isLoading}
        colorScheme='red'
        isDisabled={changeRequest?.approvalStatus !== ChangeRequestStatus.PENDING}
      >
        <FormattedMessage id='text.reject' />
      </Button>
    </>
  );

  return (
    <>
      <QueryDetailsShared
        title={intl.formatMessage({ id: 'text.change_request_details' })}
        asset={changeRequest?.asset ?? null}
        query={changeRequest?.query ?? ''}
        queryResults={queryResults}
        isQueryEditable={true}
        ticketReference={changeRequest?.ticketReference}
        changeDescription={changeRequest?.changeDescription}
        isTicketInfoVisible={true}
        actionButtons={actionButtons}
      />

      {/* Custom Reject Dialog with Reason Textarea */}
      <AlertDialog isOpen={isRejectDlgOpen} leastDestructiveRef={cancelRef} onClose={handleRejectDialogClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              <FormattedMessage id='text.reject_change_request' />
            </AlertDialogHeader>
            <AlertDialogBody>
              <FormattedMessage id='text.are_you_sure_reject_change_request' />
              <FormControl mt={4}>
                <FormLabel>
                  <FormattedMessage id='text.reject_reason' />
                </FormLabel>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={intl.formatMessage({ id: 'text.enter_reject_reason' })}
                  rows={4}
                  resize='vertical'
                />
              </FormControl>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleRejectDialogClose}>
                <FormattedMessage id='text.cancel' />
              </Button>
              <Button 
                colorScheme='red' 
                onClick={() => handleApprove(ChangeRequestStatus.REJECTED)} 
                ml={3} 
                isLoading={isLoading}
                isDisabled={!rejectReason.trim()}
              >
                <FormattedMessage id='text.reject' />
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

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
