import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { AppProvider } from './src/store/AppContext';
import DashboardScreen     from './src/screens/DashboardScreen';
import ProjectsScreen      from './src/screens/ProjectsScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import CameraScreen        from './src/screens/CameraScreen';
import { colors } from './src/theme';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ emoji, focused }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.bgCard, borderTopColor: colors.border, height: 80, paddingBottom: 20 },
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerStyle: { backgroundColor: colors.bgCard },
        headerTitleStyle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tab.Screen name="Projects" component={ProjectsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📁" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator>
            <Stack.Screen name="Main"          component={MainTabs}          options={{ headerShown: false }} />
            <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Project', headerBackTitle: 'Back' }} />
            <Stack.Screen name="Camera"        component={CameraScreen}       options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
