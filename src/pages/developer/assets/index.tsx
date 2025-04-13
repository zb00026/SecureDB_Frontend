import { Flex } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { DamCardDivider, useListPage } from "@common/index";
import { Asset } from "@models/assets/Asset";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { AssetsTable } from "../components/assets_table";

export const isSearchable = true;
export const displayName = 'Developer Assets Access Request Page';

export function Component() {
  const intl = useIntl();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Array<Asset>>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const { getData } = useListPage<Asset>({
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

  useEffect(() => {
    setAssets(Array.isArray(getData) ? getData : getData.content ?? []);
  }, [getData]);

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.assets' })}
      backTitle={intl.formatMessage({ id: 'text.dashboard' })}
      backURI="/">
      <Flex flexDir="column" w="full" px={6}>
        <DamCardDivider></DamCardDivider>
        <AssetsTable
          assets={assets}
          selectedAsset={selectedAsset}
          onSelectAsset={handleSelectAsset}
          onRequestAccess={handleRequestAccess}
        />

      </Flex>
    </DamBasePage>
  );
}