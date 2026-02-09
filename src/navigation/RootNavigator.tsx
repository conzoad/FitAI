import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const TAB_ICONS: Record<string, string> = {
  HomeTab: '⌂',
  DiaryTab: '☰',
  AddMealTab: '+',
  WorkoutTab: '🏋',
  ChatTab: '✉',
  ProfileTab: '☺',
};

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'AddMealTab') {
            return (
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
              </View>
            );
          }
          return (
            <Text style={[styles.tabIcon, { color }]}>
              {TAB_ICONS[route.name]}
            </Text>
          );
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
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 64,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 22,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },
});
