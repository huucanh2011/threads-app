import { Colors } from "@/constants/Colors";
import { Doc } from "@/convex/_generated/dataModel";
import { Link } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ProfileSearchResultProps = {
  user: Doc<"users">;
};

const ProfileSearchResult = ({ user }: ProfileSearchResultProps) => {
  return (
    <View style={styles.container}>
      <Link href={`/search/profile/${user._id}`} style={styles.link} asChild>
        <TouchableOpacity>
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          <View style={styles.infoContainer}>
            <Text style={styles.name}>
              {user.first_name} {user.last_name}
            </Text>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.followersCount}>
              {user.followersCount} followers
            </Text>
          </View>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileSearchResult;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  link: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  username: {
    fontSize: 14,
    color: "gray",
  },
  followersCount: {
    fontSize: 14,
  },
  followButton: {
    padding: 6,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonText: {
    fontWeight: "bold",
  },
});
