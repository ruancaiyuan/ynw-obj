import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { FeatureGrid } from '../components/FeatureGrid';

export function MainTab() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            YNW 内网程序 - 脚本服务中心
          </Heading>
          <Text fontSize="lg" color="gray.500">
            提供各种脚本服务
          </Text>
        </Box>
        <FeatureGrid />
      </VStack>
    </Container>
  );
}
