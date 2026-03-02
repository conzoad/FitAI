import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import {
  RootTabParamList,
  HomeStackParamList,
  DiaryStackParamList,
  WorkoutStackParamList,
} from '../models/types';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';

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
import CreateExerciseScreen from '../screens/CreateExerciseScreen';
import ProgramDetailScreen from '../screens/ProgramDetailScreen';
import MuscleDetailScreen from '../screens/MuscleDetailScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DiaryStack = createNativeStackNavigator<DiaryStackParamList>();
const WorkoutStack = createNativeStackNavigator<WorkoutStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Stats" component={StatsScreen} />
      <HomeStack.Screen name="MealDetail" component={MealDetailScreen} />
    </HomeStack.Navigator>
  );
}

function DiaryStackNavigator() {
  return (
    <DiaryStack.Navigator screenOptions={{ headerShown: false }}>
      <DiaryStack.Screen name="Diary" component={DiaryScreen} />
      <DiaryStack.Screen name="MealDetail" component={MealDetailScreen} />
      <DiaryStack.Screen name="AddMeal" component={AddMealScreen} />
      <DiaryStack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
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
      <WorkoutStack.Screen name="CreateExercise" component={CreateExerciseScreen} />
      <WorkoutStack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <WorkoutStack.Screen name="MuscleDetail" component={MuscleDetailScreen} />
    </WorkoutStack.Navigator>
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
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color }) => {
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
        options={{ tabBarLabel: T.nav.home }}
      />
      <Tab.Screen
        name="DiaryTab"
        component={DiaryStackNavigator}
        options={{ tabBarLabel: T.nav.diary }}
      />
      <Tab.Screen
        name="WorkoutTab"
        component={WorkoutStackNavigator}
        options={{ tabBarLabel: T.nav.workouts }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{ tabBarLabel: T.nav.chat }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: T.nav.profile }}
      />
    </Tab.Navigator>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: c.tabBarBg,
      borderTopWidth: 1,
      borderTopColor: c.glassBorder,
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
  });
}
