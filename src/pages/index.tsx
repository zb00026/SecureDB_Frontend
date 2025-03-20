import { USER_ROLE } from "@/constants/enums";
import { Flex } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { PrimaryButton, useMyState, userHasRole } from "@common/index";
import { Role } from "@models/Role";
import { FormattedMessage, useIntl } from "react-intl";
import { Link, useNavigate } from 'react-router-dom';

export const name = 'Dashboard';
export const isSearchable = true;

export function Component() {
  const { snap } = useMyState()
  const navigate = useNavigate();
  const intl = useIntl();

  const user = snap.session.user;

  if (!user?.roles?.length) {
    navigate('/error/forbidden');
    return;
  }

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.dashboard' })}>
      <Flex mt={6} flexDirection="row" gap={4} >
        {
          user.roles.map((role: Role) => (
            <Link to={"/" + role.name.toLowerCase().replace(" ", "_")} key={role.id} >
              <PrimaryButton>
                <FormattedMessage id={"text." + role.name.toLowerCase().replace(" ", "_")} />
              </PrimaryButton>
            </Link>
          ))
        }
        {
          (userHasRole(user, USER_ROLE.AUDITOR) || userHasRole(user, USER_ROLE.ADMIN)) && (
            <Link to="/auditor/audit-trail">
              <PrimaryButton>
                <FormattedMessage id={"text.audit_trail"} />
              </PrimaryButton>
            </Link>
          )
        }
      </Flex>
    </DamBasePage>
  );
}