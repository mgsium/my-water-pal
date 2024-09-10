import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleSheet, Image, Platform, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@rneui/themed';

import Anthropic from '@anthropic-ai/sdk';
import { Skeleton } from '@rneui/base';

export default function TabTwoScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [processingImage, setProcessingImage] = useState(false);
  const [tempImageData, setTempImageData] = useState<any>(null);
  const [uploadingTempImage, setUploadingTempImage] = useState(false);

  const client = new Anthropic({
    apiKey: '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' // process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
  });

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={{...styles.container, width: "60%", marginLeft: "20%"}}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button 
          onPress={requestPermission} 
          title="Grant Permission" 
          titleStyle={{ fontFamily: "SUSE-600", fontSize: 20 }}
          buttonStyle={{ borderRadius: 10, paddingVertical: 15 }}

        />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

 const takePicture  = async () => {
    // Take Image
    const response = await cameraRef.current?.takePictureAsync({ 
      base64: true, 
      quality: .1,
      skipProcessing: true 
    }, );
    // console.log(response);

    const b64 = response!.base64 as string;

    setTempImageData({ base64: b64 });

    setProcessingImage(true);

    // Send to Clause
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with estimating the water consumption involved in the production and shipping of objects shown in images. Your goal is to provide a rough estimate of the total water used, measured in liters.\n\nI am going to tip generously for good estimates.\n\nYou will be provided with an image and, optionally, a text description of the image. Analyze these inputs carefully:\n\n<image>\n"
                },
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": b64
                    }
                },
                {
                    "type": "text",
                    "text": "\n</image>\n\n<description>\n" + "I don't know" + "\n</description>\n\nFollow these steps to complete the task:\n\n1. Identify the primary object in the image. If a description is provided, use it to assist in your identification.\n\n2. Estimate the water consumption for production.\n\n3. Estimate the water consumption for shipping:\n   a. Assume the cheapest shipping route from the likely place of production to the UK.\n   b. Break down the shipping process into steps (e.g., land transport, sea freight).\n   c. For each step, estimate the water consumption in liters.\n   d. Sum up the estimates for all steps.\n\n4. Add your estimates from steps 2 and 3 to get the total water consumption.\n\n5. Present your final estimate as an integer inside <water_consumed> tags.\n\n6. Include what you actually identified the image as, inside <object_descriptor> tags.\n\nBefore providing your final answer, use <scratchpad> tags to show your step-by-step reasoning and calculations. This will help you double-check your estimates and ensure they are realistic. DO NOT HALLUCINATE.\n\nRemember:\n- Use your best judgment for estimates when exact figures are not available.\n- Consider both direct and indirect water usage in your calculations.\n- Be consistent in your units, converting all measurements to liters if necessary.\n- Round your final estimate to the nearest whole number.\n\nHere's an example of how your response should be structured:\n\n<scratchpad>\n1. Object Identification: [Your identification]\n2. Production Water Estimate:\n   [Step-by-step breakdown and calculations]\n3. Shipping Water Estimate:\n   [Step-by-step breakdown and calculations]\n4. Total Estimate: [Sum of production and shipping estimates]\n</scratchpad>\n\n<water_consumed>\n[Your final integer estimate]\n</water_consumed>\n<object_descriptor>\n[Your identification]\n</object_descriptor>\n\nBegin your analysis now."
                }
            ]
        }
    ]
    });
  
    const str = (message.content[0] as any)["text"];
    // console.log(str);

    // Parse Sections of the repsonse
    const scratchpad_re = /<scratchpad>([\s\S]*?)<\/scratchpad>/;
    const volume_re = /<water_consumed>\s*(\d+)\s*<\/water_consumed>/;
    const object_re = /<object_descriptor>\s*(.+?)\s*<\/object_descriptor>/;

    const scratchpad = str.match(scratchpad_re)[1];
    const volume = parseInt(str.match(volume_re)[1]);
    const object = str.match(object_re)[1];

    console.log(scratchpad);

    setTempImageData({ scratchpad: scratchpad, volume: volume, name: object, base64: b64 });
  }

  const uploadTempImage = async () => {
    setUploadingTempImage(true);

    const { scratchpad, volume, name, base64 } = tempImageData;

    await fetch("https://5ufnmq563aqgurhv4lp7fsgap40azmtg.lambda-url.eu-west-2.on.aws/", {
      method: "POST",
      body: JSON.stringify({
        userid: "test_user",
        volume: volume,
        source: "purchases",
        name: name,
        description: scratchpad
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log(data.body);
      setProcessingImage(false);
      setUploadingTempImage(false);
    });

    setTempImageData(null);

  }

  if (tempImageData) console.log(tempImageData.base64.slice(0, 50));

  if (processingImage) return (
    <ThemedView style={{ paddingTop: 80, height: "100%", flexDirection: "column", backgroundColor: "#1ca3ec" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}/>
        <View style={{ flex: 3 }}>
          { tempImageData !== null ? 
              <Image 
                style={{ minHeight: 480, minWidth: 270, maxWidth: 270, maxHeight: 480, borderRadius: 10 }} 
                source={{ uri: `data:image/jpeg;base64,${tempImageData.base64}` }} /> 
            : <Skeleton style={{ minHeight: 480, minWidth: 270, maxWidth: 270, maxHeight: 480, borderRadius: 10 }} />
          }
          </View>
        <View style={{ flex: 1 }}/>
      </View>
      <View style={{ flexDirection: "column", alignItems: "center", backgroundColor: "white", marginTop: 30, padding: 30, borderTopRightRadius: 30, borderTopLeftRadius: 30, height: 400, gap: 20 }}>
        <ThemedText style={{ fontFamily: "SUSE-600", fontSize: 20 }}>We think this is a...</ThemedText>
        {
          tempImageData && tempImageData.name ? 
          <View style={{ flexDirection: "row" }}>
            <Ionicons name="cube" color="orange" size={27} style={{ alignSelf: "center" }}/>
            <Text style={{ fontFamily: "SUSE-700", fontSize: 25 }}>&nbsp;{tempImageData.name}</Text>
          </View>
          : <Skeleton style={{ width: 300, minHeight: 70, borderRadius: 10 }} />
        }
        <ThemedText style={{ fontFamily: "SUSE-600", fontSize: 20 }}>which used...</ThemedText>
        {
          tempImageData && tempImageData.volume ? 
          <View style={{ flexDirection: "row" }}>
            <Ionicons name="water" color="#1ca3ec" size={37} style={{ alignSelf: "center" }}/>
            <Text style={{ fontFamily: "SUSE-700", fontSize: 35 }}>&nbsp;{tempImageData.volume.toFixed(2)}L</Text>          
          </View>
          : <Skeleton style={{ width: 300, minHeight: 70, borderRadius: 10 }} />
        }
        { tempImageData && tempImageData.name && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
                title={
                  <View style={{ flexDirection: "row" }}>
                    <Ionicons name="trash" color="white" size={24}/>
                    {/* <ThemedText style={{ fontFamily: "SUSE-600", fontSize: 20, color: "white" }}>&nbsp;&nbsp;Wrong</ThemedText> */}
                  </View>
                }
                titleStyle={{ fontFamily: "SUSE-600", fontSize: 20 }}
                buttonStyle={{ borderRadius: 10, padding: 15, backgroundColor: "red" }}
                containerStyle={{ flex: 1 }}
                // disabled={this.state.addSourceLoading|| this.state.addSourceData.name === ""}
                onPress={() => {
                  setProcessingImage(false);
                  setTempImageData(null);
                }}
                disabled={uploadingTempImage}
              />
              <Button
                title={
                  uploadingTempImage ? <ActivityIndicator size="large" color="green"/> :
                  <View style={{ flexDirection: "row" }}>
                    <Ionicons name="checkmark-done-outline" color="white" size={24}/>
                    <ThemedText style={{ fontFamily: "SUSE-600", fontSize: 20, color: "white" }}>&nbsp;&nbsp;Looks Correct</ThemedText>
                  </View>
                }
                titleStyle={{ fontFamily: "SUSE-600", fontSize: 20 }}
                buttonStyle={{ borderRadius: 10, padding: 15, backgroundColor: "green" }}
                containerStyle={{ flex: 3 }}
                // disabled={this.state.addSourceLoading|| this.state.addSourceData.name === ""}
                onPress={uploadTempImage}
                disabled={uploadingTempImage}
              />
          </View>
          ) }
      </View>
    </ThemedView>
  )

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={{ borderWidth: 0, borderColor: "red", flex: 1, alignSelf: "flex-end", borderRadius: 10, padding: 10, margin: 10, flexDirection: "column", gap: 10 }}>
        <Button
            title={
              processingImage ? <ActivityIndicator  color="black" size="large"/> 
              : (
                <View style={{ flexDirection: "row" }}>
                  <Ionicons name="camera" color="black" size={22}/>
                  <ThemedText style={{ fontFamily: "SUSE-600", fontSize: 18 }}>&nbsp;&nbsp;Take Picture</ThemedText>
                </View>
              )
            }
            titleStyle={{ fontFamily: "SUSE-600", fontSize: 20, color: "#202020" }}
            buttonStyle={{ borderRadius: 10, padding: 15, backgroundColor: "white" }}
            style={{ flex: 1 }}
            onPress={takePicture}
            disabled={processingImage}
          />
          <Text style={{ color: "white", textAlignVertical: "bottom", fontSize: 16 }}>Take a picture of a purchase and we'll estimate how much water went into it, and log it for you!</Text>
        </View>
        {/* <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.text}>Take Picture</Text>
          </TouchableOpacity>
        </View> */}
      </CameraView>
    </View>
  );

  // return (
  //   <ParallaxScrollView
  //     headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
  //     headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}>
  //     <ThemedView style={styles.titleContainer}>
  //       <ThemedText type="title">Explore</ThemedText>
  //     </ThemedView>
  //     <ThemedText>This app includes example code to help you get started.</ThemedText>
  //     <Collapsible title="File-based routing">
  //       <ThemedText>
  //         This app has two screens:{' '}
  //         <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
  //         <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
  //       </ThemedText>
  //       <ThemedText>
  //         The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
  //         sets up the tab navigator.
  //       </ThemedText>
  //       <ExternalLink href="https://docs.expo.dev/router/introduction">
  //         <ThemedText type="link">Learn more</ThemedText>
  //       </ExternalLink>
  //     </Collapsible>
  //     <Collapsible title="Android, iOS, and web support">
  //       <ThemedText>
  //         You can open this project on Android, iOS, and the web. To open the web version, press{' '}
  //         <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
  //       </ThemedText>
  //     </Collapsible>
  //     <Collapsible title="Images">
  //       <ThemedText>
  //         For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
  //         <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
  //         different screen densities
  //       </ThemedText>
  //       <Image source={require('@/assets/images/react-logo.png')} style={{ alignSelf: 'center' }} />
  //       <ExternalLink href="https://reactnative.dev/docs/images">
  //         <ThemedText type="link">Learn more</ThemedText>
  //       </ExternalLink>
  //     </Collapsible>
  //     <Collapsible title="Custom fonts">
  //       <ThemedText>
  //         Open <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText> to see how to load{' '}
  //         <ThemedText style={{ fontFamily: 'SpaceMono' }}>
  //           custom fonts such as this one.
  //         </ThemedText>
  //       </ThemedText>
  //       <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
  //         <ThemedText type="link">Learn more</ThemedText>
  //       </ExternalLink>
  //     </Collapsible>
  //     <Collapsible title="Light and dark mode components">
  //       <ThemedText>
  //         This template has light and dark mode support. The{' '}
  //         <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
  //         what the user's current color scheme is, and so you can adjust UI colors accordingly.
  //       </ThemedText>
  //       <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
  //         <ThemedText type="link">Learn more</ThemedText>
  //       </ExternalLink>
  //     </Collapsible>
  //     <Collapsible title="Animations">
  //       <ThemedText>
  //         This template includes an example of an animated component. The{' '}
  //         <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
  //         the powerful <ThemedText type="defaultSemiBold">react-native-reanimated</ThemedText> library
  //         to create a waving hand animation.
  //       </ThemedText>
  //       {Platform.select({
  //         ios: (
  //           <ThemedText>
  //             The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
  //             component provides a parallax effect for the header image.
  //           </ThemedText>
  //         ),
  //       })}
  //     </Collapsible>
  //   </ParallaxScrollView>
  // );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    flex: 1,
    justifyContent: 'center'
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontFamily: "SUSE-500"
  },
  camera: {
    flex: 1,
    flexDirection: "row",
    alignContent: "flex-end"
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  }
});
