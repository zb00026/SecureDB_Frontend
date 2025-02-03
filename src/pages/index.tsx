import { Flex } from "@chakra-ui/react";
import { MyBasePage } from "@common/components/MyBasePage";
import { PrimaryButton, useMyState } from "@common/index";
import { Role } from "@models/Role";
import { FormattedMessage, useIntl } from "react-intl";
import { Link, useNavigate } from 'react-router-dom';

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
        <MyBasePage
            title={intl.formatMessage({ id: 'text.admin' })}
            backTitle={intl.formatMessage({ id: 'text.dashboard' })}
            backURI="/">
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
            </Flex>
        </MyBasePage>
    );
}