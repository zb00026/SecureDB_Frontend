import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { DamWebTerminal } from './DamWebTerminal';
import { Asset } from '@models/assets/Asset';

interface DamTerminalModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly asset: Asset;
  readonly userAccessType?: string;
}

export function DamTerminalModal({ isOpen, onClose, asset, userAccessType }: DamTerminalModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const modalBg = useColorModeValue('white', 'gray.800');
  const modalBorderColor = useColorModeValue('gray.200', 'gray.600');

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleClose = () => {
    setIsFullscreen(false);
    onClose();
  };

  if (!asset) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={isFullscreen ? 'full' : '6xl'}
      isCentered={!isFullscreen}
    >
      <ModalOverlay />
      <ModalContent
        bg={modalBg}
        borderColor={modalBorderColor}
        maxW={isFullscreen ? '100vw' : '90vw'}
        maxH={isFullscreen ? '100vh' : '90vh'}
        w={isFullscreen ? '100vw' : 'auto'}
        h={isFullscreen ? '100vh' : 'auto'}
        m={isFullscreen ? 0 : 'auto'}
        borderRadius={isFullscreen ? 0 : 'md'}
      >
        <ModalHeader
          borderBottom="1px"
          borderColor={modalBorderColor}
          pb={2}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleFullscreen}
            mr={2}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </Button>
          Terminal Access: {asset.name}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0} h={isFullscreen ? 'calc(100vh - 60px)' : '80vh'} minH="600px">
          <DamWebTerminal
            assetId={asset.id!}
            assetName={asset.name}
            hostAddress={asset.hostAddress}
            portNumber={asset.portNumber}
            onClose={handleClose}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            userAccessType={userAccessType}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
