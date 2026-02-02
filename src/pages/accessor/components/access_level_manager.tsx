import { Box, VStack } from "@chakra-ui/react";
import { PermissionTable } from "./permission_table";
import { useState, useCallback } from "react";
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
  readonly editable?: boolean;
}

export function AccessLevelManager({ 
  initialData,
  accessLevelObjects,
  onAddPermission,
  onRemovePermission,
  editable
}: AccessLevelManagerProps) {
  const [permissions] = useState<Record<string, Record<string, string[]>>>({});

  const addAllPermissionsForAssetObject = useCallback((assetObject: AssetObject) => {
    if (!assetObject.data || !assetObject.grants) return;
    
    assetObject.data.forEach(objName => {
      assetObject.grants?.forEach(grant => {
        if (grant.templates !== 'FULL ACCESS') {
          onAddPermission?.(objName, grant);
        }
      });
    });
  }, [onAddPermission]);

  const removeAllPermissionsForAssetObject = useCallback((assetObject: AssetObject) => {
    if (!assetObject.data || !assetObject.grants) return;
    
    assetObject.data.forEach(objName => {
      assetObject.grants?.forEach(grant => {
        onRemovePermission?.(objName, grant);
      });
    });
  }, [onRemovePermission]);

  const handleAddPermission = useCallback((objectName: string, permission: AccessLevel) => {
    // Handle FULL ACCESS master control across all asset objects
    if (permission.templates === 'FULL ACCESS') {
      // When FULL ACCESS is checked, add all permissions for all objects
      initialData?.forEach(assetObject => {
        addAllPermissionsForAssetObject(assetObject);
      });
    }
    onAddPermission?.(objectName, permission);
  }, [onAddPermission, initialData, addAllPermissionsForAssetObject]);

  const handleRemovePermission = useCallback((objectName: string, permission: AccessLevel) => {
    // Handle FULL ACCESS master control across all asset objects
    if (permission.templates === 'FULL ACCESS') {
      // When FULL ACCESS is unchecked, remove all permissions for all objects
      initialData?.forEach(assetObject => {
        removeAllPermissionsForAssetObject(assetObject);
      });
    } else {
      // If any individual permission is removed, also remove FULL ACCESS
      onRemovePermission?.(objectName, permission);
    }
  }, [onRemovePermission, initialData, removeAllPermissionsForAssetObject]);

  return (
    <VStack spacing={8} align="stretch" w='full'>
      {initialData?.map((assetObject) => (
        <Box key={assetObject.name}
          maxW={(assetObject.grants?.length ?? 0) > 6 ? 'full' : {
            base: 'full', sm: 'full', md: '60%', lg: '60%'
          }}>
          <PermissionTable
            type={assetObject.name as 'DATABASE' | 'TABLE' | 'VIEW' | 'PROCEDURE' | 'COLLECTION'}
            grants={assetObject.grants}
            data={assetObject.data}
            accessLevelObjects={accessLevelObjects}
            savedPermissions={permissions[assetObject.name]}
            onAddPermission={handleAddPermission}
            onRemovePermission={handleRemovePermission}
            editable={editable ?? true}
          />
        </Box>
      ))}
    </VStack>
  );
} 