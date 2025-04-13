import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber/native';
import Coach from '../components/Coach';
import useControls from 'r3f-native-orbitcontrols';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

type MenuItem = {
  label: string;
  submenu?: MenuItem[];
  answer?: string;
  onSelect?: () => Promise<string>;
};

const mainMenu: MenuItem[] = [
  {
    label: 'Tell me a random government policy or scheme.',
    onSelect: async () => {
      try {
        const response = await fetch('http://192.168.0.109:5001/policies/random');
        const data = await response.json();
        return data.success 
          ? `${data.data.name}: ${data.data.description}`
          : 'Unable to fetch daily policy. Please try again later.';
      } catch (error) {
        return 'Network error. Please check your connection.';
      }
    }
  },
  {
    label: 'I want to learn about this app',
    answer: 'My pleasure. What do you want to know specifically?',
    submenu: [
      {
        label: 'App Usage Guide',
        answer: 'Sure. Select a topic below for detailed information:',
        submenu: [
          {
            label: 'Basic Navigation',
            answer: 'Use the hierarchical menu system to explore topics. Tap on any option in the navigation bar to view the respective content.'
          },
          {
            label: 'Assistant Interaction',
            answer: 'Myself, the 3D assistant, will verbally respond to your selections. Click on a questions and I will answer.'
          },
          {
            label: 'Saved Preferences',
            answer: 'Your frequently accessed topics and preferences will be saved for personalized experience.'
          }
        ]
      },
      {
        label: 'Social Impact',
        answer: 'Here are some key societal benefits. Choose one to know more about it:',
        submenu: [
          {
            label: 'Tell me about Civic Awareness',
            answer: 'Democratizes access to complex policy information, empowering informed decision-making.'
          },
          {
            label: 'I want to know what is Digital Inclusion',
            answer: 'Voice-first design ensures accessibility for diverse literacy levels and abilities.'
          },
          {
            label: 'Explain about Community Building',
            answer: 'Future updates will include collaborative features for grassroots policy discussions.'
          }
        ]
      },
      {
        label: 'Community Features',
        answer: 'Current and planned community aspects:',
        submenu: [
          {
            label: 'Discussion Forums',
            answer: 'Coming soon: Topic-based forums for policy discussions with verified experts.'
          },
          {
            label: 'Local Initiatives',
            answer: 'Future integration with local government portals for grassroots program participation.'
          },
          {
            label: 'Collaborative Learning',
            answer: 'Planned features include group learning modules and community Q&A sessions.'
          }
        ]
      }
    ]
  },
  {
    label: 'Government Schemes & Policies',
    answer: 'Select a category to explore:',
    submenu: [
      {
        label: 'Education',
        submenu: [
          {
            label: 'National Education Policy',
            answer: 'Comprehensive framework for holistic education reform with emphasis on digital learning and skill development.'
          },
          {
            label: 'Scholarship Programs',
            answer: 'Various central and state scholarships for SC/ST/OBC, minority communities, and merit-based awards.'
          }
        ]
      },
      {
        label: 'Healthcare',
        submenu: [
          {
            label: 'Ayushman Bharat',
            answer: 'World\'s largest health protection scheme providing ₹5 lakh/year per family for secondary and tertiary care.'
          },
          {
            label: 'National Health Mission',
            answer: 'Strengthens healthcare infrastructure with focus on rural areas and reproductive/child health.'
          }
        ]
      },
      {
        label: 'Women & Child',
        submenu: [
          {
            label: 'Beti Bachao Beti Padhao',
            answer: 'Ensures survival, protection, and education of the girl child through multi-sectoral interventions.'
          },
          {
            label: 'POSHAN Abhiyaan',
            answer: 'National nutrition mission targeting reduction in stunting, undernutrition and low birth weight.'
          }
        ]
      }
    ]
  }
];

const Assistant: React.FC = () => {
  const [menuStack, setMenuStack] = useState<MenuItem[][]>([mainMenu]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [Controls, events] = useControls();

  const speakAnswer = (answer: string) => {
    setIsSpeaking(true);
    Speech.speak(answer, {
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  const handleMenuPress = async (item: MenuItem) => {
    if (item.onSelect) {
      setIsLoading(true);
      const answer = await item.onSelect();
      setIsLoading(false);
      speakAnswer(answer);
    } else {
      if (item.answer) speakAnswer(item.answer);
      if (item.submenu) setMenuStack([...menuStack, item.submenu]);
    }
  };

  const currentMenu = menuStack[menuStack.length - 1];

  return (
    <LinearGradient colors={['#f0f4ff', '#e6f9ff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 3D Model Container */}
        <View style={styles.modelContainer} {...events}>
          <Canvas
            onCreated={(state) => {
              const _gl: any = state.gl.getContext();
              const pixelStorei = _gl.pixelStorei.bind(_gl);
              _gl.pixelStorei = function(...args: any) {
                const [parameter] = args;
                switch(parameter) {
                  case _gl.UNPACK_FLIP_Y_WEBGL:
                    return pixelStorei(...args);
                }
              };
            }}
          >
            <Controls enablePan={false} enableZoom={false} />
            <ambientLight intensity={2.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Suspense fallback={null}>
              <Coach isTalking={isSpeaking} />
            </Suspense>
          </Canvas>
        </View>

        {/* Menu System */}
        <View style={styles.menuContainer}>
          {menuStack.length > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setMenuStack(menuStack.slice(0, -1))}
            >
              <MaterialIcons name="arrow-back" size={24} color="#2A4D7A" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2A4D7A" />
              <Text style={styles.loadingText}>Fetching Daily Policy...</Text>
            </View>
          ) : (
            currentMenu.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
                {item.submenu && (
                  <MaterialIcons name="chevron-right" size={20} color="#2A4D7A" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  modelContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  menuContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: 'rgba(42, 77, 122, 0.1)',
  },
  backButtonText: {
    color: '#2A4D7A',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    marginVertical: 8,
    shadowColor: '#2A4D7A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemText: {
    color: '#2A4D7A',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#2A4D7A',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
});

export default Assistant;