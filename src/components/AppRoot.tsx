import { useEffect } from 'react';
import { MdSettings, MdHome, MdQuestionAnswer } from 'react-icons/md';
import { ChakraProvider, Tabs, TabList, TabPanels, Tab, TabPanel, Icon, chakra } from '@chakra-ui/react';

import { MainTab } from '~/tabs/MainTab';
import { SettingsTab } from '~/tabs/SettingsTab';
import { FaqTab } from '~/tabs/FaqTab';

import { Provider } from 'react-redux';
import { theme } from '~/theme';
import { persistSettings } from '~/features/settings/persistSettings';
import { setupStore } from '~/store'; 

// Private to this file only.
const store = setupStore();

export function AppRoot() {
  useEffect(() => persistSettings(store), []);

  return (
    <ChakraProvider theme={theme}>
      <Provider store={store}>
        <Tabs flex={1} minH={0} display="flex" flexDir="column">
          <TabList justifyContent="center">
            <Tab>
              <Icon as={MdHome} mr="1" />
              <chakra.span>应用</chakra.span>
            </Tab> 
          </TabList>

          <TabPanels overflow="auto" minW={0} flexDir="column" flex={1} display="flex">
            <TabPanel>
              <MainTab />
            </TabPanel>
            <TabPanel flex={1} display="flex">
              <SettingsTab />
            </TabPanel>
            <TabPanel>
              <FaqTab />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Provider>
    </ChakraProvider>
  );
}
