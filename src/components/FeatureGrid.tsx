import { Box, SimpleGrid, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdMusicNote, MdAudioFile } from 'react-icons/md';
import { Icon } from '@chakra-ui/react';

interface FeatureCard {
  title: string;
  description: string;
  icon: any;
  path: string;
}

const features: FeatureCard[] = [
  {
    title: '音乐解密',
    description: '解密各种音乐平台的文件格式',
    icon: MdMusicNote,
    path: '/decrypt'
  },
  {
    title: '汽水解歌',
    description: '输入歌曲信息，自动解析并处理',
    icon: MdAudioFile,
    path: '/remove-vocals'
  }
];

export function FeatureGrid() {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.600');

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10} p={4}>
      {features.map((feature) => (
        <Box
          key={feature.title}
          bg={bgColor}
          p={6}
          rounded="lg"
          shadow="md"
          cursor="pointer"
          transition="all 0.3s"
          _hover={{
            transform: 'translateY(-2px)',
            shadow: 'lg',
            bg: hoverBgColor
          }}
          onClick={() => navigate(feature.path)}
        >
          <VStack spacing={4} align="start">
            <Icon as={feature.icon} w={8} h={8} color="blue.500" />
            <Text fontSize="xl" fontWeight="bold">
              {feature.title}
            </Text>
            <Text color="gray.500">
              {feature.description}
            </Text>
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  );
}
