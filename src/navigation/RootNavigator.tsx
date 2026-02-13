import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import {
  RootTabParamList,
  HomeStackParamList,
  DiaryStackParamList,
  WorkoutStackParamList,
  AddMealStackParamList,
} from '../models/types';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import DiaryScreen from '../screens/DiaryScreen';
import AddMealScreen from '../screens/AddMealScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';
import MealDetailScreen from '../screens/MealDetailScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import StartWorkoutScreen from '../screens/StartWorkoutScreen';
import ExerciseListScreen from '../screens/ExerciseListScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import CreateProgramScreen from '../screens/CreateProgramScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DiaryStack = createNativeStackNavigator<DiaryStackParamList>();
const WorkoutStack = createNativeStackNavigator<WorkoutStackParamList>();
const AddMealStack = createNativeStackNavigator<AddMealStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Stats" component={StatsScreen} />
    </HomeStack.Navigator>
  );
}

function DiaryStackNavigator() {
  return (
    <DiaryStack.Navigator screenOptions={{ headerShown: false }}>
      <DiaryStack.Screen name="Diary" component={DiaryScreen} />
      <DiaryStack.Screen name="MealDetail" component={MealDetailScreen} />
    </DiaryStack.Navigator>
  );
}

function WorkoutStackNavigator() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutStack.Screen name="Workouts" component={WorkoutsScreen} />
      <WorkoutStack.Screen name="StartWorkout" component={StartWorkoutScreen} />
      <WorkoutStack.Screen name="ExerciseList" component={ExerciseListScreen} />
      <WorkoutStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <WorkoutStack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <WorkoutStack.Screen name="CreateProgram" component={CreateProgramScreen} />
    </WorkoutStack.Navigator>
  );
}

function AddMealStackNavigator() {
  return (
    <AddMealStack.Navigator screenOptions={{ headerShown: false }}>
      <AddMealStack.Screen name="AddMeal" component={AddMealScreen} />
      <AddMealStack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
    </AddMealStack.Navigator>
  );
}

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const iconPaths: Record<string, string> = {
    home: 'M3 12.5L12 3.5l9 9v9a1 1 0 01-1 1h-5a1 1 0 01-1-1v-5h-4v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z',
    diary: 'M4 4a2 2 0 012-2h8a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm4 2v0m0 4v0m0 4v0m4-8v0m4-2H8m8 4H8m8 4H8',
    workout: 'M6.5 6.5h-3v11h3v-11zm14 0h-3v11h3v-11zM6.5 10H2v4h4.5v-4zm15 0h-4v4h4v-4zm-15 1.5h-1v1h1v-1zm15 0h-1v1h1v-1zM6.5 12h11',
    chat: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
    profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8z',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d={iconPaths[name] || ''} />
    </Svg>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'AddMealTab') {
            return (
              <View style={[styles.addButton, focused && styles.addButtonFocused]}>
                <Text style={styles.addButtonText}>+</Text>
              </View>
            );
          }

          const iconMap: Record<string, string> = {
            HomeTab: 'home',
            DiaryTab: 'diary',
            WorkoutTab: 'workout',
            ChatTab: 'chat',
            ProfileTab: 'profile',
          };

          return <TabIcon name={iconMap[route.name]} color={color} size={22} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Главная' }}
      />
      <Tab.Screen
        name="DiaryTab"
        component={DiaryStackNavigator}
        options={{ tabBarLabel: 'Дневник' }}
      />
      <Tab.Screen
        name="AddMealTab"
        component={AddMealStackNavigator}
        options={{
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen
        name="WorkoutTab"
        component={WorkoutStackNavigator}
        options={{ tabBarLabel: 'Трениров.' }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{ tabBarLabel: 'Чат' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Профиль' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonFocused: {
    backgroundColor: colors.primaryLight,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 32,
  },
});
