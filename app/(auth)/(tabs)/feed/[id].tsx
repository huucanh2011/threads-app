import Comments from "@/components/Comments";
import Thread from "@/components/Thread";
import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQuery } from "convex/react";
import { Link, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const thread = useQuery(api.messages.getThreadById, {
    messageId: id as Id<"messages">,
  });
  const { userProfile } = useUserProfile();

  return (
    <View style={{ flexGrow: 1, marginBottom: 50 }}>
      <ScrollView>
        {thread ? (
          <Thread
            thread={thread as Doc<"messages"> & { creator: Doc<"users"> }}
          />
        ) : (
          <ActivityIndicator />
        )}
        <Comments messageId={id as Id<"messages">} />
      </ScrollView>
      <View style={styles.border} />
      <Link href={`/(auth)/(modal)/reply/${id}`} asChild>
        <TouchableOpacity style={styles.replyButton}>
          <Image
            source={{ uri: userProfile?.imageUrl as string }}
            style={styles.profileImage}
          />
          <Text>Reply to {thread?.creator?.first_name}</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default Page;

const styles = StyleSheet.create({
  border: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 10,
    borderRadius: 100,
    margin: 10,
    backgroundColor: Colors.itemBackground,
  },
  profileImage: {
    width: 25,
    height: 25,
    borderRadius: 15,
  },
});
