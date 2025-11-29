// src/screens/CommunityScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  FlatList,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SOSFab from "../../components/SOSFab";

const { width } = Dimensions.get("window");

type SafetyPost = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  location: string;
  category: "safe" | "unsafe" | "incident" | "improvement";
  title: string;
  description: string;
  image?: string;
  timestamp: string;
  upvotes: number;
  comments: number;
  verified: boolean;
  urgency: "low" | "medium" | "high";
};

export default function CommunityScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "safe" | "unsafe" | "incident" | "improvement"
  >("all");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPost, setNewPost] = useState({
    category: "unsafe" as "safe" | "unsafe" | "incident" | "improvement",
    title: "",
    description: "",
    location: "",
    urgency: "medium" as "low" | "medium" | "high",
  });

  // Mock data with Indian names and cities
  const [safetyPosts, setSafetyPosts] = useState<SafetyPost[]>([
    {
      id: "1",
      userId: "user1",
      userName: "Priya Sharma",
      userAvatar: "👩",
      location: "Connaught Place, Delhi",
      category: "unsafe",
      title: "Poor street lighting near Central Park",
      description:
        "The entire stretch from Barakhamba Road to Kasturba Gandhi Marg has very poor lighting after 8 PM. Many office goers feel unsafe walking here.",
      timestamp: "2 hours ago",
      upvotes: 24,
      comments: 8,
      verified: true,
      urgency: "high",
    },
    {
      id: "2",
      userId: "user2",
      userName: "Rajesh Kumar",
      userAvatar: "👨",
      location: "Marine Drive, Mumbai",
      category: "safe",
      title: "Increased police patrols in evening",
      description:
        "Good to see regular police patrols during evening hours. Families can now enjoy peaceful walks along the sea face.",
      timestamp: "5 hours ago",
      upvotes: 42,
      comments: 12,
      verified: false,
      urgency: "low",
    },
    {
      id: "3",
      userId: "user3",
      userName: "Delhi Police",
      userAvatar: "👮",
      location: "South Delhi",
      category: "incident",
      title: "Traffic safety campaign launched",
      description:
        'We have launched "Safe Roads Delhi" campaign. Report traffic violations through our helpline or this app.',
      timestamp: "1 day ago",
      upvotes: 156,
      comments: 34,
      verified: true,
      urgency: "medium",
    },
    {
      id: "4",
      userId: "user4",
      userName: "Bangalore Citizens Group",
      userAvatar: "👥",
      location: "Koramangala, Bangalore",
      category: "improvement",
      title: "Request for pedestrian foot over bridge",
      description:
        "Collecting signatures for foot over bridge near Forum Mall junction. High pedestrian traffic and speeding vehicles make crossing dangerous.",
      timestamp: "2 days ago",
      upvotes: 89,
      comments: 23,
      verified: true,
      urgency: "high",
    },
    {
      id: "5",
      userId: "user5",
      userName: "Anita Desai",
      userAvatar: "👩",
      location: "Bandra West, Mumbai",
      category: "unsafe",
      title: "Open manholes near Linking Road",
      description:
        "Several manholes left open without warning signs. Extremely dangerous for pedestrians, especially during monsoon.",
      timestamp: "3 hours ago",
      upvotes: 67,
      comments: 15,
      verified: false,
      urgency: "high",
    },
    {
      id: "6",
      userId: "user6",
      userName: "Chennai Corporation",
      userAvatar: "🏢",
      location: "T Nagar, Chennai",
      category: "improvement",
      title: "New CCTV cameras installed in commercial area",
      description:
        "50 new high-resolution CCTV cameras installed across T Nagar for enhanced security surveillance.",
      timestamp: "1 day ago",
      upvotes: 112,
      comments: 28,
      verified: true,
      urgency: "medium",
    },
    {
      id: "7",
      userId: "user7",
      userName: "Vikram Singh",
      userAvatar: "👨",
      location: "Sector 17, Chandigarh",
      category: "safe",
      title: "Well-maintained pedestrian pathways",
      description:
        "The pedestrian pathways in Sector 17 are well-lit and properly maintained. Great for evening walks with family.",
      timestamp: "6 hours ago",
      upvotes: 38,
      comments: 7,
      verified: false,
      urgency: "low",
    },
    {
      id: "8",
      userId: "user8",
      userName: "Kolkata Traffic Police",
      userAvatar: "👮",
      location: "Park Street, Kolkata",
      category: "incident",
      title: "Road repair work alert",
      description:
        "Major road repair work scheduled from 10 PM to 6 AM. Alternative routes suggested via AJC Bose Road.",
      timestamp: "4 hours ago",
      upvotes: 45,
      comments: 11,
      verified: true,
      urgency: "medium",
    },
  ]);

  const filteredPosts =
    activeFilter === "all"
      ? safetyPosts
      : safetyPosts.filter((post) => post.category === activeFilter);

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.description || !newPost.location) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    const post: SafetyPost = {
      id: Date.now().toString(),
      userId: "currentUser",
      userName: "You",
      userAvatar: "👤",
      location: newPost.location,
      category: newPost.category,
      title: newPost.title,
      description: newPost.description,
      timestamp: "Just now",
      upvotes: 0,
      comments: 0,
      verified: false,
      urgency: newPost.urgency,
    };

    setSafetyPosts([post, ...safetyPosts]);
    setNewPost({
      category: "unsafe",
      title: "",
      description: "",
      location: "",
      urgency: "medium",
    });
    setIsCreateModalVisible(false);
    Alert.alert("Success", "Your safety report has been posted!");
  };

  const handleUpvote = (postId: string) => {
    setSafetyPosts((posts) =>
      posts.map((post) =>
        post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post
      )
    );
  };

  const handleReportToAuthorities = () => {
    Alert.alert(
      "Report to Authorities",
      "This will compile all high-priority safety reports and send them to local government authorities. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Report",
          onPress: () => {
            const highPriorityReports = safetyPosts.filter(
              (post) => post.urgency === "high" && post.category === "unsafe"
            );
            Alert.alert(
              "Report Sent!",
              `${highPriorityReports.length} high-priority safety concerns have been reported to authorities.`
            );
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "safe":
        return "#4CAF50";
      case "unsafe":
        return "#F44336";
      case "incident":
        return "#FF9800";
      case "improvement":
        return "#2196F3";
      default:
        return "#666";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "safe":
        return "shield-checkmark";
      case "unsafe":
        return "warning";
      case "incident":
        return "alert-circle";
      case "improvement":
        return "construct";
      default:
        return "help";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "#F44336";
      case "medium":
        return "#FF9800";
      case "low":
        return "#4CAF50";
      default:
        return "#666";
    }
  };

  const SafetyPostCard = ({ post }: { post: SafetyPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userAvatar}>{post.userAvatar}</Text>
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{post.userName}</Text>
              {post.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
              )}
            </View>
            <Text style={styles.postLocation}>{post.location}</Text>
          </View>
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
          <View
            style={[
              styles.urgencyBadge,
              { backgroundColor: getUrgencyColor(post.urgency) },
            ]}
          >
            <Text style={styles.urgencyText}>{post.urgency}</Text>
          </View>
        </View>
      </View>

      <View style={styles.categoryBadge}>
        <Ionicons
          name={getCategoryIcon(post.category)}
          size={14}
          color={getCategoryColor(post.category)}
        />
        <Text
          style={[
            styles.categoryText,
            { color: getCategoryColor(post.category) },
          ]}
        >
          {post.category.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postDescription}>{post.description}</Text>

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleUpvote(post.id)}
        >
          <Ionicons name="arrow-up" size={18} color="#666" />
          <Text style={styles.actionText}>{post.upvotes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={16} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const FilterTab = ({ filter, label }: { filter: string; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setActiveFilter(filter as any)}
    >
      <Ionicons
        name={getCategoryIcon(filter)}
        size={16}
        color={activeFilter === filter ? "#fff" : getCategoryColor(filter)}
      />
      <Text
        style={[
          styles.filterText,
          activeFilter === filter && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Safety Community</Text>
          <Text style={styles.headerSubtitle}>
            Report safety concerns in your area
          </Text>
        </View>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleReportToAuthorities}
        >
          <Ionicons name="megaphone" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs - Fixed Layout */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <FilterTab filter="all" label="All Posts" />
          <FilterTab filter="safe" label="Safe" />
          <FilterTab filter="unsafe" label="Unsafe" />
          <FilterTab filter="incident" label="Incident" />
          <FilterTab filter="improvement" label="Improvement" />
        </ScrollView>
      </View>

      {/* Posts List */}
      <FlatList
        data={filteredPosts}
        renderItem={({ item }) => <SafetyPostCard post={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.postsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No posts found</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to post in this category
            </Text>
          </View>
        }
      />

      {/* Create Post FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreateModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Safety Concern</Text>
            <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Category *</Text>
            <View style={styles.categoryButtons}>
              {[
                { value: "unsafe", label: "Unsafe", icon: "warning" },
                { value: "safe", label: "Safe", icon: "shield-checkmark" },
                { value: "incident", label: "Incident", icon: "alert-circle" },
                {
                  value: "improvement",
                  label: "Improvement",
                  icon: "construct",
                },
              ].map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryButton,
                    newPost.category === category.value && [
                      styles.categoryButtonActive,
                      { borderColor: getCategoryColor(category.value) },
                    ],
                  ]}
                  onPress={() =>
                    setNewPost({ ...newPost, category: category.value as any })
                  }
                >
                  <Ionicons
                    name={category.icon as any}
                    size={16}
                    color={
                      newPost.category === category.value
                        ? getCategoryColor(category.value)
                        : "#666"
                    }
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      newPost.category === category.value && {
                        color: getCategoryColor(category.value),
                      },
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Brief title of your safety concern..."
              value={newPost.title}
              onChangeText={(text) => setNewPost({ ...newPost, title: text })}
            />

            <Text style={styles.inputLabel}>Location *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Where is this located? (e.g., Connaught Place, Delhi)"
              value={newPost.location}
              onChangeText={(text) =>
                setNewPost({ ...newPost, location: text })
              }
            />

            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe the safety concern in detail..."
              value={newPost.description}
              onChangeText={(text) =>
                setNewPost({ ...newPost, description: text })
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>Urgency Level</Text>
            <View style={styles.urgencyButtons}>
              {["low", "medium", "high"].map((urgency) => (
                <TouchableOpacity
                  key={urgency}
                  style={[
                    styles.urgencyButton,
                    newPost.urgency === urgency && [
                      styles.urgencyButtonActive,
                      { backgroundColor: getUrgencyColor(urgency) },
                    ],
                  ]}
                  onPress={() =>
                    setNewPost({ ...newPost, urgency: urgency as any })
                  }
                >
                  <Text
                    style={[
                      styles.urgencyButtonText,
                      newPost.urgency === urgency &&
                        styles.urgencyButtonTextActive,
                    ]}
                  >
                    {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreatePost}
            >
              <Text style={styles.submitButtonText}>Post to Community</Text>
            </TouchableOpacity>
          </View>
          <SOSFab />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 238, 251, 1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(255, 238, 251, 1)",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#48074eff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#48074eff",
    marginTop: 4,
  },
  reportButton: {
    backgroundColor: "#48074eff",
    padding: 12,
    borderRadius: 12,
  },
  filterContainer: {
    backgroundColor: "rgba(255, 238, 251, 1)",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    maxHeight: 60,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    gap: 6,
    minWidth: 100,
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#48074eff",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filterTextActive: {
    color: "#fff",
  },
  postsList: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  userAvatar: {
    fontSize: 20,
    marginRight: 8,
    marginTop: 2,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  postLocation: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  postMeta: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    lineHeight: 24,
  },
  postDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#510553ff",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 238, 251, 1)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 6,
    flex: 1,
    minWidth: width * 0.4,
    justifyContent: "center",
  },
  categoryButtonActive: {
    borderWidth: 2,
    backgroundColor: "#f8f9fa",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  textArea: {
    minHeight: 100,
  },
  urgencyButtons: {
    flexDirection: "row",
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  urgencyButtonActive: {
    backgroundColor: "#007AFF",
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    textTransform: "capitalize",
  },
  urgencyButtonTextActive: {
    color: "#fff",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  submitButton: {
    backgroundColor: "#8b1757ff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});
