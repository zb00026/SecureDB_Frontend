import { Flex } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCardDivider, useListPage } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { AssetsTable } from "../components/assets_table";
import { SetCredentialDialog } from "@common/components/DamDialog/SetCredentialDialog";
import { AccessRequest } from "@models/assets/AccessRequest";
import { useApiRequest } from "@common/hooks/useApiRequest";
import { AssetCredential } from "@models/assets/AssetCredential";
import { DamAlertDialog } from "@common/components/DamDialog/DamAlertDialog";

export const isSearchable = true;
export const displayName = 'Developer Assets Access Request Page';

export function Component() {
  const intl = useIntl();
  const navigate = useNavigate();
  const { handleRequest } = useApiRequest();
  const [assets, setAssets] = useState<Array<Asset>>([]);
  const [isPsdDialogOpen, setIsPsdDialogOpen] = useState<boolean>(false);
  const [isRelinquishDialogOpen, setIsRelinquishDialogOpen] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedAccessRequest, setSelectedAccessRequest] = useState<AccessRequest | null>(null);

  const { getData, getList: getAssetsList } = useListPage<Asset>({
    baseUri: "/api/developer/assets",
    defaultParams: {},
    usePagination: false
  });

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleRequestAccess = (asset: Asset) => {
    navigate(`/developer/assets/request_access_asset?assetId=${asset.id}`);
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
      handleRequest(`/api/developer/assets/set_credential_password/${selectedAccessRequest.id}`, 'POST', assetCredential, {
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
      handleRequest(`/api/developer/assets/relinquish_access/${selectedAccessRequest.id}`, 'POST', null, {
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
    navigate(`/developer/assets/query_asset?assetId=${asset.id}&accessRequestId=${asset.accessRequest?.id}`);
  };

  useEffect(() => {
    setAssets(Array.isArray(getData) ? getData : getData.content ?? []);
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
          onRelinquishAccess={(accessRequest) => { setIsRelinquishDialogOpen(true); setSelectedAccessRequest(accessRequest) }}
          onQueryAsset={handleQueryAsset}
          showQueryButton={true}
        />
      </Flex>
      <SetCredentialDialog
        isOpen={isPsdDialogOpen}
        onClose={() => setIsPsdDialogOpen(false)}
        onSubmit={handleUpdatePassword}
        isTemporaryPassword={true}
      />
      <DamAlertDialog
        isOpen={isRelinquishDialogOpen}
        onClose={() => setIsRelinquishDialogOpen(false)}
        onConfirm={handleRelinquishAccess}
        title="text.relinquish_access"
        message="text.are_you_sure_relinquish_access"
        confirmButtonId="btnConfirmRelinquishAccess"
      />
    </DamBasePage>
  );
}