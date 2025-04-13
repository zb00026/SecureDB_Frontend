import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  TableContainer,
  Text
} from "@chakra-ui/react";
import { AccessLevel } from "@models/assets/AccessLevel";
import { AccessLevelObject } from "@models/assets/AccessLevelObject";
import { useEffect, useState, useCallback } from "react";
import { FormattedMessage } from "react-intl";


interface PermissionTableProps {
  readonly type: 'DATABASE' | 'TABLE' | 'VIEW' | 'PROCEDURE';
  readonly grants?: Array<AccessLevel> | null;
  readonly accessLevelObjects?: Array<AccessLevelObject> | null;
  readonly data?: Array<string> | null;
  readonly savedPermissions?: Record<string, string[]>; // Format: { "objectName": ["permission1", "permission2"] }
  readonly onAddPermission?: (objectName: string, permission: AccessLevel) => void;
  readonly onRemovePermission?: (objectName: string, permission: AccessLevel) => void;
}

export function PermissionTable({
  type,
  grants,
  data,
  accessLevelObjects,
  savedPermissions = {},
  onAddPermission,
  onRemovePermission
}: PermissionTableProps) {
  // State to track checkbox status
  const [permissions, setPermissions] = useState<Record<string, Set<string>>>({});

  // Initialize permissions from saved state
  useEffect(() => {
    if (data && data.length > 0) {
      const initialPermissions: Record<string, Set<string>> = {};
      data.forEach(objectName => {
        initialPermissions[objectName] = new Set(savedPermissions[objectName] || []);
      });
      setPermissions(initialPermissions);
    }
  }, [data, savedPermissions]);

  const alreadyHaveAccess = (accessLevel: AccessLevel, objectName: string) => {
    return accessLevelObjects?.some(obj => 
      obj.accessLevel.id === accessLevel.id && obj.objectName === objectName
    ) ?? false;
  }

  const handleCheckboxChange = useCallback((objectName: string, permission: AccessLevel, isChecked: boolean) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      newPermissions[objectName] ??= new Set();

      if (isChecked) {
        newPermissions[objectName].add(permission.templates ?? '');
      } else {
        newPermissions[objectName].delete(permission.templates ?? '');
      }

      return newPermissions;
    });

    // Call the appropriate callback outside of the state update
    if (isChecked) {
      onAddPermission?.(objectName, permission);
    } else {
      onRemovePermission?.(objectName, permission);
    }
  }, [onAddPermission, onRemovePermission]);

  return (
    <TableContainer>
      <Text fontSize="md" fontWeight="bold" mb={4}>
        {type} Permissions
      </Text>
      {(grants?.length ?? 0) > 0 && Object.keys(permissions).length > 0 ? (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>{type}</Th>
              {grants?.map(grant => (
                <Th
                  textAlign='center'
                  alignItems='center'
                  key={grant.id}>{grant.templates}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data?.map(objectName => (
              <Tr key={objectName}>
                <Td>{objectName}</Td>
                {grants?.map(grant => (
                  <Td textAlign='center' alignItems='center' key={`${objectName}-${grant.id}`}>
                    <Checkbox
                      isChecked={permissions[objectName]?.has(grant.templates ?? '') || alreadyHaveAccess(grant, objectName)}
                      onChange={(e) => handleCheckboxChange(objectName, grant, e.target.checked)}
                      isDisabled={grant.object == 'DATABASE' && grant.templates == 'FETCH ACCESS'}
                    />
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>
          <FormattedMessage id="text.no_permissions" />
        </Text>
      )}
    </TableContainer>
  );
} 