import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router'; // ✅ Use Expo Router

interface Community {
  government_id: number;
  name: string;
  jurisdiction: string;
  email: string;
}

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter(); // ✅ Expo Router navigation

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch('http://192.168.0.109:5004/localgovernments');
        const data = await response.json();
        
        if (data.success) {
          setCommunities(data.data);
        } else {
          setError('Failed to fetch communities');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  const renderItem = ({ item }: { item: Community }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/community/${item.government_id}`)} // ✅ Route to dynamic page
    >
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.jurisdiction}>{item.jurisdiction}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Local Governments</Text>
      <FlatList
        data={communities}
        renderItem={renderItem}
        keyExtractor={(item) => item.government_id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 24,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 4,
  },
  jurisdiction: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#3498db',
    fontStyle: 'italic',
  },
  listContent: {
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#e74c3c',
    fontSize: 16,
  },
});

export default Communities;
