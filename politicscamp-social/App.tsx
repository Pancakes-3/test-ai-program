import { useCallback, useEffect, useMemo, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { AuthScreen } from "./src/screens/AuthScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { FollowingScreen } from "./src/screens/FollowingScreen";
import { BreakingScreen } from "./src/screens/BreakingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { NewPostScreen } from "./src/screens/NewPostScreen";
import { CommentsScreen } from "./src/screens/CommentsScreen";
import { supabase } from "./src/lib/supabase";
import { fetchProfile } from "./src/lib/profile";
import { Profile } from "./src/types";
import { colors } from "./src/theme/colors";
import {
  getActiveSessionId,
  getSessions,
  saveSession,
  setActiveSessionId
} from "./src/lib/sessionStore";

export type RootStackParamList = {
  Tabs: undefined;
  NewPost: undefined;
  Comments: { postId: string };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const restoreSession = useCallback(async () => {
    const sessions = await getSessions();
    const activeId = await getActiveSessionId();
    const activeSession = sessions.find((item) => item.id === activeId) ?? sessions[0];
    if (activeSession?.session) {
      await supabase.auth.setSession({
        access_token: activeSession.session.access_token,
        refresh_token: activeSession.session.refresh_token
      });
      await setActiveSessionId(activeSession.session.user.id);
    }
    setSessionReady(true);
  }, []);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setProfile(null);
      return;
    }
    const { data: profileData } = await fetchProfile(data.user.id);
    if (profileData) setProfile(profileData);
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!sessionReady) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) saveSession(data.session);
      setLoading(false);
    });
  }, [sessionReady]);

  useEffect(() => {
    if (!sessionReady) return;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        saveSession(session);
      }
      loadProfile();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [sessionReady, loadProfile]);

  useEffect(() => {
    if (!loading) {
      loadProfile();
    }
  }, [loading, loadProfile]);

  const authSuccess = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  const contextValue = useMemo(() => ({ profile, refreshProfile: loadProfile }), [profile, loadProfile]);

  if (loading || !sessionReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  if (!profile) {
    return <AuthScreen onAuthSuccess={authSuccess} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" options={{ headerShown: false }}>
          {() => (
            <Tab.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: colors.blue },
                headerTintColor: colors.white,
                tabBarActiveTintColor: colors.red
              }}
            >
              <Tab.Screen name="Home">
                {() => <HomeScreen viewer={profile} context={contextValue} />}
              </Tab.Screen>
              <Tab.Screen name="Following">
                {() => <FollowingScreen viewer={profile} context={contextValue} />}
              </Tab.Screen>
              <Tab.Screen name="Breaking News">
                {() => <BreakingScreen viewer={profile} context={contextValue} />}
              </Tab.Screen>
              <Tab.Screen name="Profile">
                {() => <ProfileScreen viewer={profile} context={contextValue} />}
              </Tab.Screen>
            </Tab.Navigator>
          )}
        </Stack.Screen>
        <Stack.Screen name="NewPost" options={{ title: "New Post" }}>
          {() => <NewPostScreen viewer={profile} context={contextValue} />}
        </Stack.Screen>
        <Stack.Screen name="Comments" options={{ title: "Comments" }}>
          {({ route }) => (
            <CommentsScreen viewer={profile} postId={route.params.postId} context={contextValue} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white
  }
});
