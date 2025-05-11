import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  useDisclosure
} from '@chakra-ui/react'
import React, { useImperativeHandle } from 'react'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import { useSetState } from 'react-use'

type DamAlertProps = {
  message?: string
  description?: string
  cancelText?: string
  confirmText?: string
  link?: string
}

export type DamAlertMethodsProps = {
  show: (data: DamAlertProps) => void
  hide: () => void
}

const DamAlertComponent = (props: any, ref: any) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = React.useRef<any>()
  const navigate = useNavigate()
  const intl = useIntl()

  const [state, setState] = useSetState<DamAlertProps>({
    message: 'message',
    description: intl.formatMessage({ id: 'text.Description' }),
    cancelText: intl.formatMessage({ id: 'text.Cancel' }),
    confirmText: intl.formatMessage({ id: 'text.Confirm' }),
    link: undefined
  })

  useImperativeHandle(ref, () => ({
    show: (data: DamAlertProps) => {
      setState({ ...state, ...data })
      onOpen()
    },
    hide: () => {
      onClose()
    }
  }))

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      colorScheme='blue'
      isCentered
      size='sm'
    >
      <AlertDialogOverlay>
        <AlertDialogContent sx={{ zIndex: '2000 !important' }}>
          <AlertDialogHeader fontSize='lg' fontWeight='bold'>
            {state.message}
          </AlertDialogHeader>

          <AlertDialogBody>{state.description}</AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              {state.cancelText}
            </Button>
            <Button
              colorScheme='red'
              onClick={() => {
                onClose()
                if (state.link && state.link !== '') navigate(state.link)
              }}
              ml={3}
            >
              {state.confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}

export const DamAlert = React.forwardRef(DamAlertComponent)
