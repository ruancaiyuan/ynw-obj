import { Box, Button, Container, Heading, Input, Text, VStack, useToast, Table, Thead, Tbody, Tr, Th, Td, Image, Flex, IconButton, Progress, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaPlay, FaPause, FaDownload } from 'react-icons/fa';
import { ChevronDownIcon, DownloadIcon } from '@chakra-ui/icons';

interface SongInfo {
  songName: string;
  artistName: string;
  playOnline: string;
  playlistCoverURL: string;
  audioData?: string; // 存储 base64 编码的音频数据
}

export function RemoveVocalsPage() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // 从 localStorage 加载缓存的音频
  const loadCachedAudio = (songId: string): string | null => {
    try {
      return localStorage.getItem(`audio_${songId}`);
    } catch (error) {
      console.error('读取缓存音频失败:', error);
      return null;
    }
  };

  // 保存音频到 localStorage
  const saveAudioToCache = (songId: string, audioData: string) => {
    try {
      localStorage.setItem(`audio_${songId}`, audioData);
    } catch (error) {
      console.error('保存音频到缓存失败:', error);
      toast({
        title: '缓存失败',
        description: '音频文件太大，无法保存到本地缓存',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // 下载音频
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

      // 创建Blob对象
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // 创建下载链接
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${songInfo.songName}-${songInfo.artistName}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理Blob URL
      URL.revokeObjectURL(blobUrl);
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

  const handleParse = async () => {
    try {
      setIsLoading(true);
      const urlRegex = /https:\/\/qishui\.douyin\.com\/s\/[a-zA-Z0-9]+/;
      const urlMatch = inputText.match(urlRegex);

      if (!urlMatch) {
        toast({
          title: '解析失败',
          description: '未找到有效的汽水音乐链接',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }

      const url = urlMatch[0];
      console.log('解析到的URL:', url);

      const response = await axios.get('http://192.168.1.17:3000/api/qishui', {
        params: { url }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || '获取数据失败');
      }

      const jsonData = response.data.data;
      const songData = jsonData.loaderData.track_page.audioWithLyricsOption;
      console.log('解析到的数据:', songData);

      const songName = songData.trackName || '未知歌曲';
      const artistName = songData.artistName || '未知歌手';
      const playOnline = songData.url || '';
      const playlistCoverURL = songData.coverURL || '';

      // 检查是否有缓存的音频
      const songId = playOnline.split('/').pop() || '';
      const cachedAudio = loadCachedAudio(songId);

      const newSongInfo = {
        songName,
        artistName,
        playOnline,
        playlistCoverURL,
        audioData: cachedAudio || undefined
      };

      setSongInfo(newSongInfo);

      toast({
        title: '解析成功',
        description: `已获取到歌曲：${songName} - ${artistName}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('解析出错:', error);
      toast({
        title: '解析失败',
        description: error instanceof Error ? error.message : '请求处理时发生错误',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW='container.xl' py={8}>
      <VStack spacing={8} align='stretch'>
        {/*<Box textAlign='center'>*/}
        {/*  <Heading as='h1' size='xl' mb={4}>*/}
        {/*    汽水解歌*/}
        {/*  </Heading>*/}
        {/*  <Text fontSize='lg' color='gray.500'>*/}
        {/*    输入歌曲信息，自动解析并处理*/}
        {/*  </Text>*/}
        {/*</Box>*/}

        <Box>
          <Input
            placeholder='请输入汽水分享链接：《没心没肺（DJ抖音版）》@汽水音乐 https://qishui.douyin.com/s/ianecQfH/'
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            size='lg'
            mb={4}
          />
          <Button
            colorScheme='blue'
            size='lg'
            width='full'
            onClick={handleParse}
            isLoading={isLoading}
            loadingText='解析中...'
          >
            解析歌曲
          </Button>
        </Box>

        {songInfo && (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>专辑封面</Th>
                  <Th>歌曲名称</Th>
                  <Th>歌手</Th>
                  <Th>播放控制</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>
                    {songInfo.playlistCoverURL && (
                      <Image
                        src={songInfo.playlistCoverURL}
                        alt="专辑封面"
                        boxSize="100px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                  </Td>
                  <Td>{songInfo.songName}</Td>
                  <Td>{songInfo.artistName}</Td>
                  <Td>
                    <Flex align="center" gap={4}>
                      <IconButton
                        aria-label="播放"
                        icon={<FaPlay />}
                        onClick={onOpen}
                        colorScheme="blue"
                        size="lg"
                        isRound
                      />
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<DownloadIcon />}
                          variant="ghost"
                          size="sm"
                          aria-label="下载选项"
                        />
                        <MenuList>
                          <MenuItem onClick={() => handleDownload('mp3')}>下载 MP3</MenuItem>
                          {/*<MenuItem onClick={() => handleDownload('wav')}>下载 WAV</MenuItem>*/}
                        </MenuList>
                      </Menu>
                    </Flex>
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>
        )}

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>正在播放: {songInfo?.songName}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Box
                as="iframe"
                src={`http://192.168.1.17:3000/api/audio?url=${encodeURIComponent(songInfo?.playOnline || '')}`}
                width="100%"
                height="400px"
                border="none"
                borderRadius="md"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
}
