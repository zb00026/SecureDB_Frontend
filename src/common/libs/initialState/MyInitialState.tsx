import { useColorMode } from '@chakra-ui/react'
import { useEffect } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { MyFullLoading, stateActions, useMyState } from '../..'
import { USER_ROLE } from '@/constants/enums'
import { ForbiddenPage } from '@pages/error/forbidden'
import { Role } from '@models/Role'

export function MyInitialState() {
  const { snap } = useMyState()
  const { colorMode, toggleColorMode } = useColorMode()

  const location = useLocation();
  const user = snap.session.user;

  // Protect routes based on user role
  const isAuthorized = () => {
    const path = location.pathname;
    if (!user?.roles.length) return false;
    let hasRole : boolean = false;
    if(path == '/') return true;
    user.roles.forEach((role : Role) => {
      const userRole = role.name;
      if( !userRole ) return;

      if (path.startsWith('/admin') && userRole == USER_ROLE.ADMIN) {
        hasRole = true;
      }

      if (path.startsWith('/developer') && userRole == USER_ROLE.DEVELOPER) {
        hasRole = true;
      }
      if (path.startsWith('/resource_owner') && userRole == USER_ROLE.RESOURCE_OWNER) {
        hasRole = true;
      }
      if (path.startsWith('/approver') && userRole == USER_ROLE.APPROVER) {
        hasRole = true;
      }
      if (path.startsWith('/auditor') && userRole == USER_ROLE.AUDITOR) {
        hasRole = true;
      }
    })
    

    return hasRole;
  };

  const [searchParams] = useSearchParams()
  // colorMode
  useEffect(() => {
    var color = searchParams.get('theme')
    var colorMode = localStorage.getItem('chakra-ui-color-mode')
    if (color) {
      // console.log(color, colorMode);
      if (color !== colorMode) toggleColorMode()
    }
  }, [colorMode])

  useEffect(() => {

  }, [snap.storage.isLogin])

  if(!isAuthorized())
    return <ForbiddenPage />
  if (snap.session.ready) 
    return <Outlet />
  return <MyFullLoading />
}
