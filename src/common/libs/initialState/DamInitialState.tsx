import { useColorMode } from '@chakra-ui/react'
import { useEffect } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { isAuthorizedPath, DamFullLoading, useMyState } from '@common/index'
import { ForbiddenPage } from '@pages/error/forbidden'

export function DamInitialState() {
  const { snap } = useMyState()
  const { colorMode, toggleColorMode } = useColorMode()

  const location = useLocation();
  const user = snap.session.user;

  // Protect routes based on user role
  const isAuthorized = () => {
    const path = location.pathname;
    return isAuthorizedPath(path, user);
  };

  const [searchParams] = useSearchParams()
  // colorMode
  useEffect(() => {
    let color = searchParams.get('theme')
    let colorMode = localStorage.getItem('chakra-ui-color-mode')
    if (color) {
      if (color !== colorMode) toggleColorMode()
    }
  }, [colorMode])

  useEffect(() => {

  }, [snap.storage.isLogin])

  if(!isAuthorized())
    return <ForbiddenPage />
  if (snap.session.ready) 
    return <Outlet />
  return <DamFullLoading />
}
