import { Box, VStack } from "@chakra-ui/react";
import { PermissionTable } from "./permission_table";
import { useState } from "react";
import { AssetObject } from "@models/assets/AssetObject";
import { AccessLevel } from "@models/assets/AccessLevel";
import { AccessLevelObject } from "@models/assets/AccessLevelObject";
interface AccessLevelManagerProps {
  readonly initialData?: Array<AssetObject> | null;
  readonly accessLevelObjects?: Array<AccessLevelObject> | null;
  readonly onAddPermission?: (
    objectName: string,
    permission: AccessLevel
  ) => void;
  readonly onRemovePermission?: (
    objectName: string,
    permission: AccessLevel
  ) => void;
}

export function AccessLevelManager({ 
  initialData,
  accessLevelObjects,
  onAddPermission,
  onRemovePermission
}: AccessLevelManagerProps) {
  const [permissions] = useState<Record<string, Record<string, string[]>>>({});

  return (
    <VStack spacing={8} align="stretch" w='full'>
      {initialData?.map((assetObject) => (
        <Box key={assetObject.name}
          maxW={(assetObject.grants?.length ?? 0) > 6 ? 'full' : {
            base: 'full', sm: 'full', md: '60%', lg: '60%'
          }}>
          <PermissionTable
            type={assetObject.name as 'DATABASE' | 'TABLE' | 'VIEW' | 'PROCEDURE'}
            grants={assetObject.grants}
            data={assetObject.data}
            accessLevelObjects={accessLevelObjects}
            savedPermissions={permissions[assetObject.name]}
            onAddPermission={onAddPermission}
            onRemovePermission={onRemovePermission}
          />
        </Box>
      ))}
    </VStack>
  );
} 