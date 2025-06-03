import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { FaqTab } from '../tabs/FaqTab';

export function HelpPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={4}>
            使用帮助
          </Heading>
          <Text fontSize="lg" color="gray.500" mb={8}>
            了解如何使用音乐解密工具
          </Text>
        </Box>
        <FaqTab />
      </VStack>
    </Container>
  );
} 