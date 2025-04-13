import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  Modal, 
  Pressable, 
  TextInput, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface Government {
  government_id: number;
  name: string;
  jurisdiction: string;
  email: string;
}

interface Article {
  article_id: number;
  title: string;
  summary: string;
  images: string[];
  content: any[];
  created_at: string;
}

interface Complaint {
  complaint_id: number;
  category: string;
  description: string;
  multimedia_urls: string[];
  status: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

const GovernmentDetail = () => {
  const { id } = useLocalSearchParams();
  const [government, setGovernment] = useState<Government | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeSection, setActiveSection] = useState<'articles' | 'complaints'>('articles');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState<number | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    category: '',
    description: '',
    multimedia_urls: [''],
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState({
    gov: true,
    articles: true,
    complaints: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const govRes = await fetch(`http://192.168.0.109:5004/localgovernments`);
        const govData = await govRes.json();
        const foundGov = (govData.data || []).find((g: Government) => g.government_id.toString() === id);
        setGovernment(foundGov || null);

        const artRes = await fetch(`http://192.168.0.109:5004/articles/${id}`);
        const artData = await artRes.json();
        setArticles(artData.data || []);

        const compRes = await fetch(`http://192.168.0.109:5004/complaints/${id}`);
        const compData = await compRes.json();
        setComplaints(compData.data || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading({ gov: false, articles: false, complaints: false });
      }
    };

    fetchData();
  }, [id]);

  const handleAISummary = async (articleId: number) => {
    setAiLoading(articleId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowSummary(articleId);
    setAiLoading(null);
  };

  const handleSubmitComplaint = async () => {
    try {
      setSubmitting(true);
      
      const complaintData = {
        government_id: Number(id),
        category: newComplaint.category,
        description: newComplaint.description,
        multimedia_urls: newComplaint.multimedia_urls.filter(url => url.trim() !== ''),
        status: "Pending"
      };

      const response = await fetch('http://192.168.0.109:5004/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) throw new Error('Submission failed');
      
      Alert.alert('Success', 'Complaint submitted successfully!');
      setShowComplaintModal(false);
      setNewComplaint({ category: '', description: '', multimedia_urls: ['']});
      
    } catch (error) {
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = (content: any) => {
    return content.map((item: any, index: number) => {
      switch (item.type) {
        case 'header':
          return <Text key={index} style={styles.contentHeader}>{item.content}</Text>;
        case 'subheader':
          return <Text key={index} style={styles.contentSubheader}>{item.content}</Text>;
        case 'image':
          return (
            <Image
              key={index}
              source={{ uri: item.src }}
              style={styles.contentImage}
              resizeMode="cover"
            />
          );
        case 'paragraph':
          return <Text key={index} style={styles.contentParagraph}>{item.content}</Text>;
        case 'list':
          return (
            <View key={index} style={styles.listContainer}>
              {item.items.map((listItem: string, i: number) => (
                <Text key={i} style={styles.listItem}>• {listItem}</Text>
              ))}
            </View>
          );
        case 'quote':
          return (
            <View key={index} style={styles.quoteContainer}>
              <Text style={styles.quoteText}>"{item.content}"</Text>
              <Text style={styles.quoteAuthor}>- {item.author}</Text>
            </View>
          );
        default:
          return <Text key={index} style={styles.contentParagraph}>{item.content}</Text>;
      }
    });
  };

  if (loading.gov) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!government) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Government not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Government Header */}
      <View style={styles.govHeader}>
        <Text style={styles.govName}>{government?.name || 'Community'}</Text>
        <Text style={styles.govJurisdiction}>Jurisdiction : {government?.jurisdiction || ''}</Text>
        <Text style={styles.govEmail}>Contact Email : {government?.email || ''}</Text>
      </View>

      {/* Section Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, activeSection === 'articles' && styles.activeToggle]}
          onPress={() => setActiveSection('articles')}
        >
          <Text style={[styles.toggleText, activeSection === 'articles' && styles.activeToggleText]}>
            Articles ({(articles || []).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, activeSection === 'complaints' && styles.activeToggle]}
          onPress={() => setActiveSection('complaints')}
        >
          <Text style={[styles.toggleText, activeSection === 'complaints' && styles.activeToggleText]}>
            Complaints ({(complaints || []).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Articles Section */}
      {activeSection === 'articles' && (
        <View style={styles.sectionContainer}>
          {loading.articles ? (
            <ActivityIndicator size="medium" color="#2196F3" />
          ) : (
            <FlatList
              data={articles || []}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.articleCard}>
                  <TouchableOpacity onPress={() => setSelectedArticle(item)}>
                    <Text style={styles.articleTitle}>{item.title}</Text>
                    {(item.images || []).length > 0 && (
                      <Image 
                        source={{ uri: item.images[0] }} 
                        style={styles.articleThumbnail} 
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.aiButton}
                    onPress={() => handleAISummary(item.article_id)}
                  >
                    {aiLoading === item.article_id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.aiButtonText}>Summarize with AI</Text>
                    )}
                  </TouchableOpacity>
                  {showSummary === item.article_id && (
                    <Text style={styles.summaryBox}>{item.summary}</Text>
                  )}
                </View>
              )}
              keyExtractor={item => item.article_id.toString()}
              ListEmptyComponent={<Text style={styles.emptyText}>No articles found</Text>}
            />
          )}
        </View>
      )}

      {/* Complaints Section */}
      {activeSection === 'complaints' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Citizen Complaints | </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowComplaintModal(true)}
            >
              <Text style={styles.addButtonText}>Add Complaint</Text>
            </TouchableOpacity>
          </View>
          {loading.complaints ? (
            <ActivityIndicator size="medium" color="#2196F3" />
          ) : (
            <FlatList
              data={complaints || []}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.complaintCard}
                  onPress={() => router.push(`/complaint/${item.complaint_id}`)}
                >
                  <View style={styles.complaintHeader}>
                    <Text style={styles.complaintCategory}>{item.category}</Text>
                    <Text style={[styles.status, { color: item.status === 'Pending' ? '#e67e22' : '#2ecc71' }]}>
                      {item.status}
                    </Text>
                  </View>
                  <Text style={styles.complaintDescription}>
                    {(item.description || '').substring(0, 80)}...
                  </Text>
                  {(item.multimedia_urls || []).length > 0 && (
                    <Image source={{ uri: item.multimedia_urls[0] }} style={styles.complaintImage} />
                  )}
                  <View style={styles.upvoteContainer}>
                    <Text style={styles.upvotes}>▲ {item.upvotes || 0} Upvotes</Text>
                    <Text style={styles.downvotes}>▼ {item.downvotes || 0} Downvotes</Text>
                    <Text style={styles.date}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.complaint_id.toString()}
              ListEmptyComponent={<Text style={styles.emptyText}>No complaints found</Text>}
            />
          )}
        </View>
      )}

      {/* Article Modal */}
      <Modal
        visible={!!selectedArticle}
        animationType="slide"
        transparent={false}
      >
        <ScrollView style={styles.modalContainer}>
          <Pressable 
            style={styles.closeButton}
            onPress={() => setSelectedArticle(null)}
          >
            <AntDesign name="close" size={24} color="#2c3e50" />
          </Pressable>
          
          {selectedArticle && (
            <>
              <Text style={styles.modalTitle}>{selectedArticle.title}</Text>
              {selectedArticle.images[0] && (
                <Image 
                  source={{ uri: selectedArticle.images[0] }} 
                  style={styles.modalImage} 
                />
              )}
              <View style={styles.contentContainer}>
                {renderContent(selectedArticle.content)}
              </View>
            </>
          )}
        </ScrollView>
      </Modal>

      {/* Complaint Submission Modal */}
      <Modal
        visible={showComplaintModal}
        animationType="slide"
        transparent={false}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Complaint</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowComplaintModal(false)}
            >
              <AntDesign name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Title*</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Potholes, Sanitation"
            value={newComplaint.category}
            onChangeText={text => setNewComplaint({...newComplaint, category: text})}
          />

          <Text style={styles.inputLabel}>Brief Description*</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Describe the issue in detail..."
            multiline
            numberOfLines={4}
            value={newComplaint.description}
            onChangeText={text => setNewComplaint({...newComplaint, description: text})}
          />

          <Text style={styles.inputLabel}>Image URLs (one per line)</Text>
          {newComplaint.multimedia_urls.map((url, index) => (
            <TextInput
              key={index}
              style={styles.input}
              placeholder={`Image URL #${index + 1}`}
              value={url}
              onChangeText={text => {
                const newUrls = [...newComplaint.multimedia_urls];
                newUrls[index] = text;
                setNewComplaint({...newComplaint, multimedia_urls: newUrls});
              }}
            />
          ))}

          <TouchableOpacity
            style={styles.addUrlButton}
            onPress={() => setNewComplaint({
              ...newComplaint,
              multimedia_urls: [...newComplaint.multimedia_urls, '']
            })}
          >
            <Text style={styles.addUrlText}>+ Add Another Image URL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitComplaint}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Complaint</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#c0392b',
    fontSize: 16,
    fontWeight: '500',
  },
  govHeader: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  govName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  govJurisdiction: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 4,
    fontWeight: '500',
  },
  govEmail: {
    fontSize: 15,
    color: '#3498db',
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  activeToggle: {
    backgroundColor: '#2980b9',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#95a5a6',
    letterSpacing: 0.5,
  },
  activeToggleText: {
    color: '#ffffff',
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  articleCard: {
    backgroundColor: '#e6e6f5',
    borderRadius: 12,
    marginHorizontal: 2,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    margin: 16,
    lineHeight: 28,
  },
  articleThumbnail: {
    width: '100%',
    height: 140,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
  },
  aiButton: {
    backgroundColor: '#2e2e75',
    padding: 14,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  aiButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  summaryBox: {
    backgroundColor: '#2e2e75',
    padding: 18,
    margin: 16,
    marginTop: -29,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2980b9',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  closeButton: {
    position: 'absolute',
    top: 36,
    right: 24,
    zIndex: 1,
    backgroundColor: 'rgba(255, 23, 23, 0.49)',
    padding: 10,
    borderRadius: 20,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
    marginHorizontal: 24,
    marginTop: 48,
    marginBottom: 24,
    lineHeight: 34,
  },
  modalImage: {
    width: '100%',
    height: 360,
    marginBottom: 24,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  contentHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 20,
    lineHeight: 32,
  },
  contentSubheader: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 16,
    lineHeight: 26,
    opacity: 0.9,
  },
  contentParagraph: {
    fontSize: 17,
    lineHeight: 28,
    color: '#2c3e50',
    marginBottom: 24,
    textAlign: 'justify',
  },
  contentImage: {
    width: '100%',
    height: 400,
    borderRadius: 4,
    marginVertical: 24,
  },
  listContainer: {
    marginLeft: 20,
    marginBottom: 24,
  },
  listItem: {
    fontSize: 17,
    lineHeight: 28,
    color: '#2c3e50',
    marginBottom: 8,
  },
  quoteContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#2980b9',
    paddingLeft: 20,
    marginVertical: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 6,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#7f8c8d',
    lineHeight: 28,
  },
  quoteAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34495e',
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#28ad9a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  addUrlButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  addUrlText: {
    color: '#fff',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 8,
    marginHorizontal: 24,
    marginVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  complaintCard: {
    backgroundColor: '#e6e6f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  complaintCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  complaintDescription: {
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 12,
  },
  complaintImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  upvoteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upvotes: {
    color: '#2196F3',
    fontWeight: '500',
  },
  downvotes: {
    color: '#f01d1d',
    fontWeight: '500',
  },
  date: {
    color: '#95a5a6',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    marginTop: 20,
  },
});

export default GovernmentDetail;