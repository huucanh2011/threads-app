import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: "white",
          },
        }}
      />
      <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;
