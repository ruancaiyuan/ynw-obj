import { Box, SimpleGrid, Text, VStack, useColorModeValue, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdMusicNote, MdAudioFile } from 'react-icons/md';
import { Icon } from '@chakra-ui/react';
import { toast } from '@chakra-ui/react';
import { spawn } from 'child_process';

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
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.600');

  const handleDownload = async (format: 'mp3' | 'wav') => {
    if (!songInfo?.playOnline) {
      toast({
        title: '错误',
        description: '没有可下载的音频',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const url = `http://192.168.1.17:3000/api/audio?url=${encodeURIComponent(songInfo.playOnline)}&download=true&format=${format}&songName=${encodeURIComponent(songInfo.songName)}&artistName=${encodeURIComponent(songInfo.artistName)}`;
      
      // 添加错误处理
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 检查Content-Type
      const contentType = response.headers.get('content-type');
      if (format === 'wav' && contentType !== 'audio/wav') {
        throw new Error('服务器返回的格式不是WAV');
      }
      
      window.open(url, '_blank');
    } catch (error) {
      console.error('下载错误:', error);
      toast({
        title: '下载失败',
        description: error.message || '请稍后重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

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
