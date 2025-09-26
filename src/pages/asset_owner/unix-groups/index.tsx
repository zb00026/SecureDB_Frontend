import React from 'react';
import { DamBasePage } from '../../../common/components/DamBasePage';
import { useIntl } from 'react-intl';
import UnixGroups from './unix_groups';

export const name = 'Unix Groups Management';

export function Component() {
  const intl = useIntl();
  
  return (
    <DamBasePage title={intl.formatMessage({ id: 'unix_groups.title' })}>
      <UnixGroups />
    </DamBasePage>
  );
}
