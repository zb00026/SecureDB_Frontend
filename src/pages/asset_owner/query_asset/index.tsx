import { useQueryAssetData } from "@common/hooks/useQueryAssetPage";
import { SharedQueryComponent } from "@common/components/SharedQueryComponent";

export function Component() {
  const { currentAsset, accessRequestId } = useQueryAssetData({ userType: "asset_owner" });

  return (
    <SharedQueryComponent
      asset={currentAsset}
      accessRequestId={accessRequestId}
      userType="asset_owner"
    />
  );
}
