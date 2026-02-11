import { useEffect, useState } from 'react';
import { request, stateActions, useDamToast } from '@common/index';
import { Role } from '@models/Role';
import { RoleOption } from '../index';
import { USER_ROLE, FEATURE_FLAGS } from '@/constants/enums';
import { useIntl } from 'react-intl';

export function useRoles() {
  const [roles, setRoles] = useState<Array<Role>>([]);
  const [roleOptions, setRoleOptions] = useState<Array<RoleOption>>([]);
  const { showError } = useDamToast();
  const intl = useIntl();

  useEffect(() => {
    stateActions.addLoading();
    request(`/api/admin/roles`, {
      method: 'GET',
      data: {}
    }).then((res: any) => {
      if (res) {
        stateActions.subLoading();
        setRoles(res);
        // Filter out 'Approver' role from options if feature flag is disabled
        const filteredRoles = FEATURE_FLAGS.ENABLE_APPROVER_ROLE 
          ? res 
          : res.filter((role: Role) => role.name !== USER_ROLE.APPROVER);
        setRoleOptions(filteredRoles.map((role: Role) => ({ label: role.name, value: role.id.toString() })));
      } else {
        setRoleOptions([]);
        setRoles([]);
      }
    }).catch((e) => {
      setRoleOptions([]);
      setRoles([]);
      showError({
        description: e?.response?.data?.error ?? intl.formatMessage({ id: 'text.failed_getting_roles' })
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { roles, roleOptions };
}

