import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, SafeAreaView, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenFadeAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonOpacityAnim = useRef(new Animated.Value(1)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  const steps = [
    {
      title: 'Welcome to Loku',
      description: 'Smart location-based reminders that work automatically.',
      icon: '📍',
    },
    {
      title: 'Add Your Places',
      description: 'Save locations you visit often such as home, work, school, or the gym.',
      icon: '🏠',
    },
    {
      title: 'Set Up Triggers',
      description: 'Create reminders for when you arrive or leave places.',
      icon: '⏰',
    },
    {
      title: 'Stay Connected',
      description: 'Share your location updates with trusted contacts for safety.',
      icon: '👥',
    },
  ];

  // Initialize dot animations
  const dotAnims = useRef(
    steps.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      // Fade animation for button-triggered navigation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({ x: nextStep * width, animated: true });
    } else {
      // Last step - trigger "Get Started" animation
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      // Fade animation for button-triggered navigation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(prevStep);
      scrollViewRef.current?.scrollTo({ x: prevStep * width, animated: true });
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const step = Math.round(scrollPosition / width);
    if (step !== currentStep && step >= 0 && step < steps.length) {
      // No animation during swipe - ensure pages are fully visible
      fadeAnim.setValue(1);
      setCurrentStep(step);
    }
  };

  const handleScrollRealTime = (event: any) => {
    // Extract native event from Animated.event listener
    const nativeEvent = event.nativeEvent || event;
    const scrollPosition = nativeEvent.contentOffset?.x ?? 0;
    const step = Math.round(scrollPosition / width);
    if (step !== currentStep && step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  useEffect(() => {
    // Fade in on initial mount
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate dots when currentStep changes
  useEffect(() => {
    dotAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index === currentStep ? 1 : 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // width animation doesn't support native driver
      }).start();
    });
  }, [currentStep]);

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    // Animate button scale up and fade out
    Animated.parallel([
      Animated.timing(buttonScaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After button animation, fade out screen content
      Animated.timing(screenFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Navigate after animations complete
        // TODO: Mark onboarding as complete in settings/store
        (navigation as any).navigate('Home');
      });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.container, { opacity: screenFadeAnim, flex: 1 }]}>

        {/* Horizontal scrollable pages */}
        <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        onScroll={(event) => {
          // Update animated value for animations
          const scrollPosition = event.nativeEvent.contentOffset.x;
          scrollX.setValue(scrollPosition);
          // Update currentStep in real-time
          handleScrollRealTime(event);
        }}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollViewContent, { width: width * steps.length }]}
        snapToInterval={width}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {steps.map((step, index) => (
          <View key={index} style={[styles.page, { width, flexShrink: 0, flexGrow: 0 }]}>
            {index === 0 ? (
              <Animated.View 
                style={{ 
                  flex: 1, 
                  backgroundColor: '#FFFFFF', 
                  width: width,
                  opacity: fadeAnim,
                }}
              >
                <View style={styles.slideInner}>
                  {/* HEADER ILLUSTRATION */}
                  <Animated.Image
                    source={require('../assets/onboarding-header.png')}
                    style={{
                      width: width,
                      height: width * 0.8,
                      resizeMode: 'cover',
                      marginBottom: 24,
                      marginLeft: -24,
                      marginRight: -24,
                      marginTop: -20,
                      transform: [
                        {
                          scale: scrollX.interpolate({
                            inputRange: [0, width],
                            outputRange: [1, 0.75],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateX: scrollX.interpolate({
                            inputRange: [0, width],
                            outputRange: [0, -width * 0.4],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: scrollX.interpolate({
                            inputRange: [0, width],
                            outputRange: [0, -20],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                      opacity: scrollX.interpolate({
                        inputRange: [0, width * 0.4, width * 0.7, width],
                        outputRange: [1, 0.8, 0.4, 0],
                        extrapolate: 'clamp',
                      }),
                    }}
                  />

                  {/* MAIN CONTENT */}
                  <Animated.Text
                    style={{
                      fontSize: 28,
                      fontWeight: '700',
                      textAlign: 'center',
                      color: '#1F2937',
                      marginTop: -20,
                      marginBottom: 12,
                      transform: [
                        {
                          translateX: scrollX.interpolate({
                            inputRange: [0, width],
                            outputRange: [0, -width * 1.2],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: scrollX.interpolate({
                            inputRange: [0, width],
                            outputRange: [0, 30],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          scale: scrollX.interpolate({
                            inputRange: [0, width],
                            outputRange: [1, 0.85],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                      opacity: scrollX.interpolate({
                        inputRange: [0, width * 0.3, width * 0.6, width],
                        outputRange: [1, 0.7, 0.3, 0],
                        extrapolate: 'clamp',
                      }),
                    }}
                  >
                    {step.title}
                  </Animated.Text>

                  <Animated.Text
                    style={{
                      fontSize: 16,
                      color: '#6B7280',
                      textAlign: 'center',
                      marginTop: 0,
                      maxWidth: 320,
                      lineHeight: 24,
                      transform: [
                        {
                          translateX: scrollX.interpolate({
                            inputRange: [0, width],
                            outputRange: [0, -width * 1.1],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: scrollX.interpolate({
                            inputRange: [0, width],
                            outputRange: [0, 25],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          scale: scrollX.interpolate({
                            inputRange: [0, width],
                            outputRange: [1, 0.9],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                      opacity: scrollX.interpolate({
                        inputRange: [0, width * 0.3, width * 0.6, width],
                        outputRange: [1, 0.7, 0.3, 0],
                        extrapolate: 'clamp',
                      }),
                    }}
                  >
                    {step.description}
                  </Animated.Text>
                </View>
              </Animated.View>
            ) : (
              <Animated.View 
                style={{ 
                  flex: 1, 
                  backgroundColor: '#FFFFFF', 
                  width: width,
                  opacity: fadeAnim,
                }}
              >
                <View style={styles.slideInner}>
                  {index === 1 && (
                    <Animated.Image
                      source={require('../assets/onboarding-header2.png')}
                      style={{
                        width: width,
                        height: width * 0.8,
                        resizeMode: 'cover',
                        marginBottom: 24,
                        marginLeft: -20,
                        marginRight: -20,
                        marginTop: -20,
                        position: 'relative',
                        transform: [
                          {
                            scale: scrollX.interpolate({
                              inputRange: [0, width, width * 2],
                              outputRange: [1.3, 1, 0.75],
                              extrapolate: 'clamp',
                            }),
                          },
                          {
                            translateX: scrollX.interpolate({
                              inputRange: [0, width, width * 2],
                              outputRange: [width * 0.4, 0, -width * 0.4],
                              extrapolate: 'clamp',
                            }),
                          },
                          {
                            translateY: scrollX.interpolate({
                              inputRange: [0, width, width * 2],
                              outputRange: [20, 0, -20],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                        opacity: scrollX.interpolate({
                          inputRange: [0, width * 0.3, width * 0.6, width, width * 1.4, width * 1.7, width * 2],
                          outputRange: [0, 0.3, 0.6, 1, 0.6, 0.3, 0],
                          extrapolate: 'clamp',
                        }),
                      }}
                    />
                  )}
                  {index === 2 && (
                    <Animated.Image
                      source={require('../assets/onboarding-header3.png')}
                      style={{
                        width: width,
                        height: width * 0.8,
                        resizeMode: 'cover',
                        marginBottom: 24,
                        marginLeft: -20,
                        marginRight: -20,
                        marginTop: -20,
                        position: 'relative',
                        transform: [
                          {
                            scale: scrollX.interpolate({
                              inputRange: [width, width * 2, width * 3],
                              outputRange: [1.3, 1, 0.75],
                              extrapolate: 'clamp',
                            }),
                          },
                          {
                            translateX: scrollX.interpolate({
                              inputRange: [width, width * 2, width * 3],
                              outputRange: [width * 0.4, 0, -width * 0.4],
                              extrapolate: 'clamp',
                            }),
                          },
                          {
                            translateY: scrollX.interpolate({
                              inputRange: [width, width * 2, width * 3],
                              outputRange: [20, 0, -20],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                        opacity: scrollX.interpolate({
                          inputRange: [width, width * 1.3, width * 1.6, width * 2, width * 2.4, width * 2.7, width * 3],
                          outputRange: [0, 0.3, 0.6, 1, 0.6, 0.3, 0],
                          extrapolate: 'clamp',
                        }),
                      }}
                    />
                  )}
                  {index === 3 && (
                    <Animated.Image
                      source={require('../assets/onboarding-header4.png')}
                      style={{
                        width: width,
                        height: width * 0.8,
                        resizeMode: 'cover',
                        marginBottom: 24,
                        marginLeft: -20,
                        marginRight: -20,
                        marginTop: -20,
                        position: 'relative',
                        transform: [
                          {
                            scale: scrollX.interpolate({
                              inputRange: [width * 2, width * 3],
                              outputRange: [1.3, 1],
                              extrapolate: 'clamp',
                            }),
                          },
                          {
                            translateX: scrollX.interpolate({
                              inputRange: [width * 2, width * 3],
                              outputRange: [width * 0.4, 0],
                              extrapolate: 'clamp',
                            }),
                          },
                          {
                            translateY: scrollX.interpolate({
                              inputRange: [width * 2, width * 3],
                              outputRange: [20, 0],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                        opacity: scrollX.interpolate({
                          inputRange: [width * 2, width * 2.3, width * 2.6, width * 3],
                          outputRange: [0, 0.3, 0.6, 1],
                          extrapolate: 'clamp',
                        }),
                      }}
                    />
                  )}
                  
                  <Animated.Text
                    style={{
                      fontSize: 28,
                      fontWeight: '700',
                      textAlign: 'center',
                      color: '#1F2937',
                      marginTop: (index === 1 || index === 2 || index === 3) ? -20 : 0,
                      marginBottom: 12,
                      transform: index === 1 ? [
                        {
                          translateX: scrollX.interpolate({
                            inputRange: [0, width, width * 2],
                            outputRange: [width * 1.2, 0, -width * 1.2],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: scrollX.interpolate({
                            inputRange: [0, width, width * 2],
                            outputRange: [-30, 0, 30],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          scale: scrollX.interpolate({
                            inputRange: [0, width, width * 2],
                            outputRange: [0.85, 1, 0.85],
                            extrapolate: 'clamp',
                          }),
                        },
                      ] : index === 2 ? [
                        {
                          translateX: scrollX.interpolate({
                            inputRange: [width, width * 2, width * 3],
                            outputRange: [width * 1.2, 0, -width * 1.2],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: scrollX.interpolate({
                            inputRange: [width, width * 2, width * 3],
                            outputRange: [-30, 0, 30],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          scale: scrollX.interpolate({
                            inputRange: [width, width * 2, width * 3],
                            outputRange: [0.85, 1, 0.85],
                            extrapolate: 'clamp',
                          }),
                        },
                      ] : index === 3 ? [
                        {
                          translateX: scrollX.interpolate({
                            inputRange: [width * 2, width * 3],
                            outputRange: [width * 1.2, 0],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: scrollX.interpolate({
                            inputRange: [width * 2, width * 3],
                            outputRange: [-30, 0],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          scale: scrollX.interpolate({
                            inputRange: [width * 2, width * 3],
                            outputRange: [0.85, 1],
                            extrapolate: 'clamp',
                          }),
                        },
                      ] : [],
                      opacity: index === 1 ? scrollX.interpolate({
                        inputRange: [0, width * 0.3, width * 0.6, width, width * 1.4, width * 1.7, width * 2],
                        outputRange: [0, 0.3, 0.7, 1, 0.7, 0.3, 0],
                        extrapolate: 'clamp',
                      }) : index === 2 ? scrollX.interpolate({
                        inputRange: [width, width * 1.3, width * 1.6, width * 2, width * 2.4, width * 2.7, width * 3],
                        outputRange: [0, 0.3, 0.7, 1, 0.7, 0.3, 0],
                        extrapolate: 'clamp',
                      }) : index === 3 ? scrollX.interpolate({
                        inputRange: [width * 2, width * 2.3, width * 2.6, width * 3],
                        outputRange: [0, 0.3, 0.7, 1],
                        extrapolate: 'clamp',
                      }) : 1,
                    }}
                  >
                    {step.title}
                  </Animated.Text>

                  <Animated.Text
                    style={{
                      fontSize: 16,
                      color: '#6B7280',
                      textAlign: 'center',
                      marginTop: 0,
                      maxWidth: 320,
                      lineHeight: 24,
                      transform: index === 1 ? [
                        {
                          translateX: scrollX.interpolate({
                            inputRange: [0, width, width * 2],
                            outputRange: [width * 1.1, 0, -width * 1.1],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: scrollX.interpolate({
                            inputRange: [0, width, width * 2],
                            outputRange: [-25, 0, 25],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          scale: scrollX.interpolate({
                            inputRange: [0, width, width * 2],
                            outputRange: [0.9, 1, 0.9],
                            extrapolate: 'clamp',
                          }),
                        },
                      ] : index === 2 ? [
                        {
                          translateX: scrollX.interpolate({
                            inputRange: [width, width * 2, width * 3],
                            outputRange: [width * 1.1, 0, -width * 1.1],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: scrollX.interpolate({
                            inputRange: [width, width * 2, width * 3],
                            outputRange: [-25, 0, 25],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          scale: scrollX.interpolate({
                            inputRange: [width, width * 2, width * 3],
                            outputRange: [0.9, 1, 0.9],
                            extrapolate: 'clamp',
                          }),
                        },
                      ] : index === 3 ? [
                        {
                          translateX: scrollX.interpolate({
                            inputRange: [width * 2, width * 3],
                            outputRange: [width * 1.1, 0],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: scrollX.interpolate({
                            inputRange: [width * 2, width * 3],
                            outputRange: [-25, 0],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          scale: scrollX.interpolate({
                            inputRange: [width * 2, width * 3],
                            outputRange: [0.9, 1],
                            extrapolate: 'clamp',
                          }),
                        },
                      ] : [],
                      opacity: index === 1 ? scrollX.interpolate({
                        inputRange: [0, width * 0.3, width * 0.6, width, width * 1.4, width * 1.7, width * 2],
                        outputRange: [0, 0.3, 0.7, 1, 0.7, 0.3, 0],
                        extrapolate: 'clamp',
                      }) : index === 2 ? scrollX.interpolate({
                        inputRange: [width, width * 1.3, width * 1.6, width * 2, width * 2.4, width * 2.7, width * 3],
                        outputRange: [0, 0.3, 0.7, 1, 0.7, 0.3, 0],
                        extrapolate: 'clamp',
                      }) : index === 3 ? scrollX.interpolate({
                        inputRange: [width * 2, width * 2.3, width * 2.6, width * 3],
                        outputRange: [0, 0.3, 0.7, 1],
                        extrapolate: 'clamp',
                      }) : 1,
                    }}
                  >
                    {step.description}
                  </Animated.Text>
                </View>
              </Animated.View>
            )}
          </View>
        ))}
      </Animated.ScrollView>

      {/* Progress indicators */}
      <View style={styles.progressContainer}>
        {steps.map((_, index) => {
          const width = dotAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [6, 28],
          });
          const backgroundColor = dotAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['#D1D5DB', '#007AFF'],
          });
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.progressDot,
                {
                  width,
                  backgroundColor,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Navigation buttons and Skip */}
      <View style={[styles.buttonContainer, currentStep === 0 && { gap: 0 }]}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
            onPress={handlePrevious}
          >
            <Text style={styles.buttonSecondaryText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <Animated.View
          style={[
            {
              flex: 1,
              width: '100%',
              transform: [{ scale: buttonScaleAnim }],
              opacity: buttonOpacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonPrimary,
              {
                width: '100%',
                minHeight: 50,
              },
            ]}
            onPress={handleNext}
          >
            <Text style={styles.buttonPrimaryText}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.skipButtonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSkip, styles.buttonFullWidth]}
          onPress={handleSkip}
        >
          <Text style={styles.buttonSkipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexDirection: 'row',
  },
  page: {
    width: width,
    flexShrink: 0,
    flexGrow: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  slideInner: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 12,
  },
  skipButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 0,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonFullWidth: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#F2F2F7',
  },
  buttonPrimaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonSecondaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  buttonSkip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
  },
  buttonSkipText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
});

