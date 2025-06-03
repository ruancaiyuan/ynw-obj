import { Box, Container } from '@chakra-ui/react';
import { SelectFile } from '../components/SelectFile';
import { FileListing } from '../features/file-listing/FileListing';

export function DecryptPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <SelectFile />
        <Box w="full" mt={4}>
          <FileListing />
        </Box>
      </Box>
    </Container>
  );
} 