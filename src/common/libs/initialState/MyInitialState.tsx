import { useColorMode } from '@chakra-ui/react'
import { useEffect } from 'react'
import { Outlet, useSearchParams } from 'react-router-dom'
import { MyFullLoading, stateActions, useMyState } from '../..'

export function MyInitialState() {
  const { snap } = useMyState()
  const { colorMode, toggleColorMode } = useColorMode()

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
    if (location.pathname === '/') {
      var pkhash = searchParams.get('pkhash')
      if (pkhash) location.href = 'home/guess?gameMode=pk&pkhash=' + pkhash
    }

  }, [snap.storage.isLogin])

  if (snap.session.ready) return <Outlet />
  else return <MyFullLoading />
}
