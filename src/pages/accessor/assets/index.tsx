import { Flex } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { useListPage, state, userHasRole } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { AssetType, USER_ROLE } from "@/constants/enums";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { AssetsTable } from "../components/assets_table";
import { SetCredentialDialog } from "@common/components/DamDialog/SetCredentialDialog";
import { AccessRequest, ApprovalStatus } from "@models/assets/AccessRequest";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { AssetCredential } from "@models/assets/AssetCredential";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";
import { DamViewAccessModal } from "@common/components/DamDialog/DamViewAccessModal";
import { useViewAccess } from "@common/hooks/useViewAccess";
import { UnixAccessRequestDialog } from "@common/components/DamDialog/UnixAccessRequestDialog";
import { DamTerminalModal } from "@common/components/DamTerminal";

export const isSearchable = true;
export const displayName = 'Accessor Assets Access Request Page';

export function Component() {
  const intl = useIntl();
  const navigate = useNavigate();
  const { handleRequest } = useApiRequest();
  const [assets, setAssets] = useState<Array<Asset>>([]);
  const [isPsdDialogOpen, setIsPsdDialogOpen] = useState<boolean>(false);
  const [isRelinquishDialogOpen, setIsRelinquishDialogOpen] = useState<boolean>(false);
  const [isUnixRequestDialogOpen, setIsUnixRequestDialogOpen] = useState<boolean>(false);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState<boolean>(false);
  const [terminalAsset, setTerminalAsset] = useState<Asset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedAccessRequest, setSelectedAccessRequest] = useState<AccessRequest | null>(null);

  // Use the shared view access hook
  const {
    isViewAccessModalOpen,
    viewAccessAsset,
    assetAccessData,
    isLoadingAccess,
    accessError,
    viewAssetAccess,
    closeViewAccessModal
  } = useViewAccess({ apiEndpoint: '/api/accessor/assets' });

  const { getData, getList: getAssetsList } = useListPage<Asset>({
    baseUri: "/api/accessor/assets",
    defaultParams: {},
    usePagination: false
  });

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleRequestAccess = (asset: Asset) => {
    if (asset.type === AssetType.UNIX_SERVER) {
      setSelectedAsset(asset);
      setIsUnixRequestDialogOpen(true);
    } else {
      navigate(`/accessor/assets/request_access_asset?assetId=${asset.id}`);
    }
  };

  const handleUpdatePassword = (username: string, password: string) => {
    if (selectedAccessRequest) {
      let assetCredential: AssetCredential = {
        id: 0,
        assetId: 0,
        userId: 0,
        username: "",
        password: ""
      };
      assetCredential.password = password;
      handleRequest(`/api/accessor/assets/set_credential_password/${selectedAccessRequest.id}`, 'POST', assetCredential, {
        onSuccess: () => {
          getAssetsList();
        },
        successTitleId: 'text.password_updated',
        successDescriptionId: 'text.password_update_success',
        errorDescriptionId: 'text.password_update_failed'
      });
    }
  };

  const handleRelinquishAccess = () => {
    if (selectedAccessRequest) {
      handleRequest(`/api/accessor/assets/relinquish_access/${selectedAccessRequest.id}`, 'POST', null, {
        onSuccess: () => {
          setIsRelinquishDialogOpen(false);
          getAssetsList();
        },
        successTitleId: 'text.access_relinquished',
        successDescriptionId: 'text.access_relinquished_success',
        errorDescriptionId: 'text.access_relinquished_failed'
      });
    }
  };

  const handleQueryAsset = (asset: Asset) => {
    if (asset.locked) {
      // Asset is locked, cannot query
      return;
    }
    navigate(`/accessor/assets/query_asset?assetId=${asset.id}&accessRequestId=${asset.accessRequest?.id}`);
  };

  const handleOpenTerminal = (asset: Asset) => {
    setTerminalAsset(asset);
    setIsTerminalModalOpen(true);
  };

  const handleCloseTerminal = () => {
    setIsTerminalModalOpen(false);
    setTerminalAsset(null);
  };

  useEffect(() => {
    const allAssets = Array.isArray(getData) ? getData : getData.content ?? [];
    const databaseAssets = allAssets.filter((asset: Asset) => 
      asset.type === AssetType.DATABASE || asset.type === AssetType.UNIX_SERVER
    );
    setAssets(databaseAssets);
  }, [getData]);

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.assets' })}>
      <Flex flexDir="column" w="full" px={6}>
        <AssetsTable
          assets={assets}
          selectedAsset={selectedAsset}
          onSelectAsset={handleSelectAsset}
          onRequestAccess={handleRequestAccess}
          onUpdatePassword={(accessRequest) => { setIsPsdDialogOpen(true); setSelectedAccessRequest(accessRequest) }}
          onRelinquishAccess={(accessRequest) => { setSelectedAccessRequest(accessRequest); setIsRelinquishDialogOpen(true); }}
          onQueryAsset={handleQueryAsset}
          onTerminalAsset={handleOpenTerminal}
          onViewAccess={viewAssetAccess}
          showQueryButton={true}
        />
      </Flex>
      <SetCredentialDialog
        isOpen={isPsdDialogOpen}
        onClose={() => setIsPsdDialogOpen(false)}
        onSubmit={handleUpdatePassword}
        showPasswordWarning={true}
        isTemporaryPassword={true}
        usernamePlaceholder="Enter DB Username"
        passwordPlaceholder="Enter DB Password"
        confirmPasswordPlaceholder="Re-enter DB Password"
        assetName={selectedAsset?.name}
      />
      <DamAlertDialog
        isOpen={isRelinquishDialogOpen}
        onClose={() => setIsRelinquishDialogOpen(false)}
        onConfirm={handleRelinquishAccess}
        title={selectedAccessRequest?.assetApproverStatus === ApprovalStatus.APPROVED ? "text.relinquish_access" : "text.cancel_access_request"}
        message={selectedAccessRequest?.assetApproverStatus === ApprovalStatus.APPROVED ? "text.are_you_sure_relinquish_access" : "text.are_you_sure_cancel_access_request"}
        confirmButtonId="btnConfirmRelinquishAccess"
      />

      {/* View Access Modal */}
      <DamViewAccessModal
        isOpen={isViewAccessModalOpen}
        onClose={closeViewAccessModal}
        asset={viewAccessAsset}
        assetAccessData={assetAccessData}
        isLoading={isLoadingAccess}
        error={accessError}
      />

      {/* Unix Access Request Dialog */}
      {selectedAsset && (
        <UnixAccessRequestDialog
          isOpen={isUnixRequestDialogOpen}
          onClose={() => {
            setIsUnixRequestDialogOpen(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
          onSuccess={() => {
            getAssetsList();
            setIsUnixRequestDialogOpen(false);
            setSelectedAsset(null);
          }}
        />
      )}

      {/* Terminal Modal */}
      {terminalAsset && (() => {
        const user = state.session.user;
        const userAccessType = userHasRole(user, USER_ROLE.ACCESSOR) ? USER_ROLE.ACCESSOR : undefined;
        return (
          <DamTerminalModal
            isOpen={isTerminalModalOpen}
            onClose={handleCloseTerminal}
            asset={terminalAsset}
            userAccessType={userAccessType}
          />
        );
      })()}
    </DamBasePage>
  );
}