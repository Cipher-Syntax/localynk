// localynk/app/screens/bookingChoice.js (Redesigned Component)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const BookingChoice = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { placeId, placeName } = params;
  const [selectedOption, setSelectedOption] = useState(null);

  const handleCustomGuide = () => {
    router.push({
      pathname: '/(protected)/attractionDetails',
      params: { placeId, placeName }
    });
  };

  const handleAgencyBooking = () => {
    router.push({
      pathname: '/(protected)/agencySelection',
      params: { placeId, placeName }
    });
  };

  const OptionCard = ({ 
    icon, 
    title, 
    description, 
    features, 
    isSelected, 
    onPress,
    accentColor,
    buttonText,
    onButtonPress 
  }) => (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && [styles.cardSelected, { borderColor: accentColor }]
      ]}
      onPress={() => setSelectedOption(title)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      <Text style={styles.cardDescription}>{description}</Text>

      <View style={styles.featuresList}>
        {features.map((feature, idx) => (
          <View key={idx} style={styles.featureItem}>
            <Text style={[styles.featureDot, { color: accentColor }]}>•</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: accentColor }]}
        onPress={onButtonPress}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerSection}>
        <Text style={styles.mainHeader}>How would you like to explore?</Text>
        <Text style={styles.placeName}>{placeName || 'This Location'}</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.cardsContainer}>
        <OptionCard
          icon="👨‍🦱"
          title="Custom Guide"
          description="Personalized experience with an independent local guide"
          features={[
            'One-on-one attention',
            'Flexible itinerary',
            'Local insights & stories',
            'Direct communication'
          ]}
          isSelected={selectedOption === 'Custom Guide'}
          accentColor="#0066ff"
          buttonText="Continue with Custom Guide"
          onButtonPress={handleCustomGuide}
        />

        <OptionCard
          icon="🏛️"
          title="Agency Booking"
          description="Verified agencies with professional guide assignments"
          features={[
            'Verified agencies',
            'Professional guides',
            'Group accommodations',
            'Structured tours'
          ]}
          isSelected={selectedOption === 'Agency Booking'}
          accentColor="#00c853"
          buttonText="Let Agency Decide"
          onButtonPress={handleAgencyBooking}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Not sure? Both options are trusted by thousands of travelers. Choose based on your group size and preferences.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#ffffff',
    marginTop: 30
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center'
  },
  headerSection: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center'
  },
  mainHeader: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5
  },
  placeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0066ff',
    textAlign: 'center',
    marginBottom: 16
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#0066ff',
    borderRadius: 2,
    marginTop: 8
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 24
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    transition: 'all 0.3s ease'
  },
  cardSelected: {
    backgroundColor: '#f8fbff',
    borderWidth: 2,
    shadowOpacity: 0.15,
    elevation: 6
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  icon: {
    fontSize: 32,
    marginRight: 12
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16
  },
  featuresList: {
    marginBottom: 16
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  featureDot: {
    fontSize: 18,
    marginRight: 8,
    fontWeight: 'bold'
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    flex: 1
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  infoBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#0066ff'
  },
  infoText: {
    fontSize: 13,
    color: '#0052cc',
    lineHeight: 18,
    fontWeight: '500'
  }
});

export default BookingChoice;