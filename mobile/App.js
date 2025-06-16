import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MapScreen from './screens/MapScreen';
import DashboardScreen from './screens/DashboardScreen';
import VendorDetailScreen from './screens/VendorDetailScreen';
import RoutesScreen from './screens/RoutesScreen';
import RouteDetailScreen from './screens/RouteDetailScreen';
import TermsScreen from './screens/TermsScreen';
import { theme } from './theme';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Map">
          <Stack.Screen
            name="Map"
            component={MapScreen}
            options={{ title: 'Sunny Sales', headerTitleAlign: 'center' }}
          />
          <Stack.Screen
            name="VendorDetail"
            component={VendorDetailScreen}
            options={{ title: 'Vendedor' }}
          />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Routes" component={RoutesScreen} options={{ title: 'Trajetos' }} />
          <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ title: 'Trajeto' }} />
          <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Termos' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
