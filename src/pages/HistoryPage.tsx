import { Box, Container, Heading, Text, VStack, Table, Thead, Tbody, Tr, Th, Td, Button, Flex, Select, Tooltip } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { accessLogger } from '../util/accessLogger';

interface AccessLog {
  id: string;
  timestamp: number;
  ip: string;
  path: string;
  userAgent: string;
  ipInfo?: {
    location: {
      country: string;
      province: string;
      city: string;
      county: string;
    };
    isp: string;
    overseasRegion: boolean;
  };
}

const PAGE_SIZES = [10, 20, 50, 100];

export function HistoryPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadLogs = async () => {
    const accessLogs = accessLogger.getLogs();
    // 按时间戳倒序排序
    const sortedLogs = [...accessLogs].sort((a, b) => b.timestamp - a.timestamp);
    
    // 获取IP详细信息
    const logsWithIpInfo = await Promise.all(
      sortedLogs.map(async (log) => {
        if (log.ip === 'unknown') return log;
        try {
          const response = await fetch(`https://mesh.if.iqiyi.com/aid/ip/info?version=1.1.1&ip=${log.ip}`);
          const data = await response.json();
          if (data.code === '0') {
            return {
              ...log,
              ipInfo: {
                location: {
                  country: data.data.countryCN || '未知',
                  province: data.data.provinceCN || '未知',
                  city: data.data.cityCN || '未知',
                  county: data.data.countyCN || '未知'
                },
                isp: data.data.ispCN || '未知',
                overseasRegion: data.data.overseasRegion || false
              }
            };
          }
          return log;
        } catch (error) {
          console.error('Failed to fetch IP info:', error);
          return log;
        }
      })
    );
    
    setLogs(logsWithIpInfo);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // 计算分页数据
  const totalPages = Math.ceil(logs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentLogs = logs.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(event.target.value);
    setPageSize(newSize);
    setCurrentPage(1); // 重置到第一页
  };

  const formatIpInfo = (log: AccessLog) => {
    if (!log.ipInfo) return log.ip;
    const { location, isp, overseasRegion } = log.ipInfo;
    const overseas = overseasRegion ? ' (海外)' : '';
    
    // 过滤掉未知信息
    const locationParts = [
      location.country,
      location.province,
      location.city,
      location.county
    ].filter(part => part && part !== '*' && part !== '未知');
    
    const locationStr = locationParts.length > 0 ? locationParts.join(' ') : '未知地区';
    const ispStr = isp && isp !== '*' ? isp : '未知运营商';
    
    return `${locationStr} - ${ispStr}${overseas}`;
  };

  const parseUserAgent = (userAgent: string) => {
    // 常见浏览器标识
    const browsers = [
      { name: 'Chrome', pattern: /Chrome\/(\d+\.\d+)/ },
      { name: 'Firefox', pattern: /Firefox\/(\d+\.\d+)/ },
      { name: 'Safari', pattern: /Version\/(\d+\.\d+).*Safari/ },
      { name: 'Edge', pattern: /Edg\/(\d+\.\d+)/ },
      { name: 'Opera', pattern: /OPR\/(\d+\.\d+)/ },
      { name: 'IE', pattern: /MSIE (\d+\.\d+)/ }
    ];

    for (const browser of browsers) {
      const match = userAgent.match(browser.pattern);
      if (match) {
        return `${browser.name} ${match[1]}`;
      }
    }

    // 如果没有匹配到已知浏览器，返回原始信息
    return userAgent;
  };

  return (
    <Container maxW="container.xl" py={8} px={4}>
      <VStack spacing={8} align="stretch" width="100%">
        <Box>
          <Heading as="h1" size="xl" mb={4}>
            访问历史
          </Heading>
          <Text fontSize="lg" color="gray.500" mb={8}>
            查看系统访问记录
          </Text>
        </Box>
        <Box>
          <Button onClick={loadLogs} mb={4}>
            刷新记录
          </Button>
        </Box>
        <Box overflowX="auto" width="100%">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th width="20%">时间</Th>
                <Th width="35%">IP地址及位置</Th>
                <Th width="15%">访问路径</Th>
                <Th width="30%">浏览器信息</Th>
              </Tr>
            </Thead>
            <Tbody>
              {currentLogs.map((log) => (
                <Tr key={log.id}>
                  <Td whiteSpace="nowrap">{new Date(log.timestamp).toLocaleString()}</Td>
                  <Td>
                    <Tooltip label={log.ip} placement="top">
                      <Text noOfLines={1}>{formatIpInfo(log)}</Text>
                    </Tooltip>
                  </Td>
                  <Td whiteSpace="nowrap">{log.path}</Td>
                  <Td>
                    <Tooltip label={log.userAgent} placement="top">
                      <Text noOfLines={1}>{parseUserAgent(log.userAgent)}</Text>
                    </Tooltip>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        <Flex justify="space-between" align="center" mt={4}>
          <Box>
            <Select value={pageSize} onChange={handlePageSizeChange} width="150px">
              {PAGE_SIZES.map(size => (
                <option key={size} value={size}>
                  每页 {size} 条
                </option>
              ))}
            </Select>
          </Box>
          <Flex gap={2}>
            <Button
              onClick={() => handlePageChange(1)}
              isDisabled={currentPage === 1}
            >
              首页
            </Button>
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
            >
              上一页
            </Button>
            <Text>
              第 {currentPage} 页，共 {totalPages} 页
            </Text>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
            >
              下一页
            </Button>
            <Button
              onClick={() => handlePageChange(totalPages)}
              isDisabled={currentPage === totalPages}
            >
              末页
            </Button>
          </Flex>
        </Flex>
      </VStack>
    </Container>
  );
} 