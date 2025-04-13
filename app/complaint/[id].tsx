import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';

interface ComplaintDetails {
  complaint_id: number;
  category: string;
  description: string;
  multimedia_urls: string[];
  status: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

interface Comment {
  comment_id: number;
  user: string;
  content: string;
  created_at: string;
}

interface Action {
  action_id: number;
  action_details: string;
  action_multimedia_urls: string[];
  completion_percentage: number;
  created_at: string;
}

const ComplaintPage = () => {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'actions'>('details');
  const [complaint, setComplaint] = useState<ComplaintDetails | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
const [upvotes, setUpvotes] = useState(0);
const [downvotes, setDownvotes] = useState(0);
const [hasUpvoted, setHasUpvoted] = useState(false);
const [hasDownvoted, setHasDownvoted] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState({
    complaint: true,
    comments: true,
    actions: true
  });
  const [commentLoading, setCommentLoading] = useState(false);
// Add this useEffect to initialize votes
useEffect(() => {
    if (complaint) {
      setUpvotes(complaint.upvotes);
      setDownvotes(complaint.downvotes);
    }
  }, [complaint]);

// Add voting handlers
const handleUpvote = async () => {
    const prevUpvotes = upvotes;
    try {
      setUpvotes(prev => hasUpvoted ? prev - 1 : prev + 1);
      setHasUpvoted(!hasUpvoted);
      if (hasDownvoted) {
        setDownvotes(prev => prev - 1);
        setHasDownvoted(false);
      }
  
      const response = await fetch(`http://192.168.0.109:5004/complaints/${id}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header if needed
        },
        // body: JSON.stringify({ user_id: currentUser?.id })
      });
  
      if (!response.ok) {
        setUpvotes(prevUpvotes);
        setHasUpvoted(!hasUpvoted);
        Alert.alert('Error', 'User has already upvoted');
      }
    } catch (error) {
      setUpvotes(prevUpvotes);
      setHasUpvoted(!hasUpvoted);
      Alert.alert('Error', 'Failed to connect to server');
    }
  };
  
  const handleDownvote = async () => {
    const prevDownvotes = downvotes;
    try {
      setDownvotes(prev => hasDownvoted ? prev - 1 : prev + 1);
      setHasDownvoted(!hasDownvoted);
      if (hasUpvoted) {
        setUpvotes(prev => prev - 1);
        setHasUpvoted(false);
      }
  
      const response = await fetch(`http://192.168.0.109:5004/complaints/${id}/downvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header if needed
        },
        // body: JSON.stringify({ user_id: currentUser?.id })
      });
  
      if (!response.ok) {
        setDownvotes(prevDownvotes);
        setHasDownvoted(!hasDownvoted);
        Alert.alert('Error', 'User has already downvoted');
      }
    } catch (error) {
      setDownvotes(prevDownvotes);
      setHasDownvoted(!hasDownvoted);
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [complaintRes, commentsRes, actionsRes] = await Promise.all([
          fetch(`http://192.168.0.109:5004/complaints/getDetails/${id}`),
          fetch(`http://192.168.0.109:5004/complaints/${id}/comments`),
          fetch(`http://192.168.0.109:5004/complaints/${id}/actions`)
        ]);

        const complaintData = await complaintRes.json();
        setComplaint(complaintData.data?.[0] || null);

        const commentsData = await commentsRes.json();
        setComments(commentsData.data || []); // Fallback to empty array

        const actionsData = await actionsRes.json();
        setActions(actionsData.data || []);

      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading({ complaint: false, comments: false, actions: false });
      }
    };

    fetchData();
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setCommentLoading(true);
      const response = await fetch('http://192.168.0.109:5004/complaints/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint_id: id, content: newComment })
      });
  
      if (!response.ok) throw new Error('Failed to post comment');
      
      // Parse response safely
      const newCommentData = await response.json();
      
      // Ensure proper data structure before updating state
      if (newCommentData.data) {
        setComments(prev => [...prev, newCommentData.data]);
      } else {
        // Fallback in case API response structure differs
        const fallbackComment = {
          comment_id: Date.now(), // Temporary ID
          user: "User",
          content: newComment,
          created_at: new Date().toISOString()
        };
        setComments(prev => [...prev, fallbackComment]);
      }
      
      setNewComment('');
    } catch (error) {
      console.error('Comment error:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const renderMedia = (uris: string[]) => (
    <FlatList
      horizontal
      data={uris}
      renderItem={({ item }) => (
        <Image source={{ uri: item }} style={styles.mediaImage} />
      )}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={styles.mediaContainer}
      showsHorizontalScrollIndicator={false}
    />
  );

  const renderDetails = () => (
    <View style={styles.detailsContainer}>
      <View style={styles.statusContainer}>
        <Text style={[
          styles.statusText,
          { color: complaint?.status === 'Resolved' ? '#2ecc71' : '#e67e22' }
        ]}>
          {complaint?.status}
        </Text>
        <Text style={styles.dateText}>
          Reported {new Date(complaint?.created_at || '').toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </Text>
      </View>
  
      <Text style={styles.category}>{complaint?.category}</Text>
      <Text style={styles.description}>{complaint?.description}</Text>
  
      {complaint?.multimedia_urls?.length > 0 && (
        <>
          <Text style={styles.sectionHeading}>Attached Media</Text>
          <FlatList
            horizontal
            data={complaint.multimedia_urls}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            )}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.mediaContainer}
            showsHorizontalScrollIndicator={false}
          />
        </>
      )}
  
      <View style={styles.votingContainer}>
        <TouchableOpacity 
          style={[styles.voteButton, hasUpvoted && styles.activeUpvote]}
          onPress={handleUpvote}
        >
          <AntDesign 
            name="caretup" 
            size={20} 
            color={hasUpvoted ? '#2ecc71' : '#95a5a6'} 
          />
          <Text style={[
            styles.voteCount,
            { color: hasUpvoted ? '#2ecc71' : '#95a5a6' }
          ]}>
            {upvotes}
          </Text>
        </TouchableOpacity>
  
        <TouchableOpacity 
          style={[styles.voteButton, hasDownvoted && styles.activeDownvote]}
          onPress={handleDownvote}
        >
          <AntDesign 
            name="caretdown" 
            size={20} 
            color={hasDownvoted ? '#e74c3c' : '#95a5a6'} 
          />
          <Text style={[
            styles.voteCount,
            { color: hasDownvoted ? '#e74c3c' : '#95a5a6' }
          ]}>
            {downvotes}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.user?.[0]?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>{item.user || 'Anonymous'}</Text>
          <Text style={styles.commentTime}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  const renderAction = ({ item }: { item: Action }) => (
    <View style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <MaterialIcons name="construction" size={24} color="#2ecc71" />
        <Text style={styles.actionTitle}>Action Taken</Text>
        <Text style={styles.progressText}>
          {item.completion_percentage}% Complete
        </Text>
      </View>
      <Text style={styles.actionDetails}>{item.action_details}</Text>
      
      {item.action_multimedia_urls?.length > 0 && (
        <>
          <Text style={styles.sectionHeading}>Progress Photos</Text>
          {renderMedia(item.action_multimedia_urls)}
        </>
      )}

      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill,
          { width: `${item.completion_percentage}%` }
        ]} />
      </View>
      <Text style={styles.actionDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['details', 'comments', 'actions'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'comments' ? `Comments (${comments.length})` : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading.complaint || loading.comments || loading.actions ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          {activeTab === 'details' && (
            <FlatList
              data={[]}
              renderItem={() => null}
              ListHeaderComponent={renderDetails()}
            />
          )}

          {activeTab === 'comments' && (
            <>
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={item => item.comment_id.toString()}
                contentContainerStyle={styles.commentsList}
              />
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  placeholderTextColor="#95a5a6"
                />
                <TouchableOpacity 
                  style={styles.commentButton}
                  onPress={handleAddComment}
                  disabled={commentLoading}
                >
                  {commentLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Feather name="send" size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === 'actions' && (
            <FlatList
              data={actions}
              renderItem={renderAction}
              keyExtractor={item => item.action_id.toString()}
              contentContainerStyle={styles.actionsList}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa'
  },
  activeTab: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#3498db'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#95a5a6'
  },
  activeTabText: {
    color: '#3498db'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginHorizontal: 16,
    marginTop: 16
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statText: {
    fontSize: 16,
    fontWeight: '500'
  },
  commentsList: {
    paddingBottom: 80
  },
  commentContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16
  },
  commentContent: {
    flex: 1,
    marginLeft: 12
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  username: {
    fontWeight: '600',
    color: '#2c3e50'
  },
  commentTime: {
    color: '#95a5a6',
    fontSize: 12
  },
  commentText: {
    color: '#34495e',
    lineHeight: 20
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1'
  },
  commentInput: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16
  },
  commentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  actionsList: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  actionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1
  },
  progressText: {
    color: '#27ae60',
    fontWeight: '600'
  },
  actionDetails: {
    color: '#34495e',
    lineHeight: 22,
    marginBottom: 16
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    marginVertical: 12
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 4
  },
  actionDate: {
    color: '#95a5a6',
    fontSize: 12,
    marginTop: 8
  },
  detailsContainer: {
    paddingBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  dateText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  category: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  mediaContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  mediaImage: {
    width: 240,
    height: 160,
    borderRadius: 12,
    marginRight: 16,
  },
  votingContainer: {
    flexDirection: 'row',
    gap: 24,
    marginHorizontal: 16,
    marginTop: 16,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  activeUpvote: {
    backgroundColor: '#e8f6ee',
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  activeDownvote: {
    backgroundColor: '#fcebec',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  voteCount: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ComplaintPage;