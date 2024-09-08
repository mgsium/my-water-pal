import { Image, StyleSheet, Platform, View, ScrollView, Text } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@rneui/themed';

export default function HomeScreen() {
  return (
    <ThemedView style={{ flexDirection: "row", padding: 30, gap: 15, backgroundColor: '#1ca3ec', minHeight: "100%" }}>
      <ScrollView style={{ flexDirection: "column", gap: 15 }}>
        <ThemedView style={styles.titleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 25 }}>
            <Text style={{ fontSize: 18, fontFamily: "SUSE-600", flex: 1, textAlign: "center" }}>
              Your Water Usage at a Glance
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 15, paddingHorizontal: 65 }}>
            <Ionicons name='water' color="#1ca3ec" size={50}/>
            <Text style={{ fontSize: 50, fontFamily: "SUSE-700", color: "#303030" }}>
              450 L/hr
            </Text>
          </View>
          {/* <View
            style={{
              borderBottomColor: 'grey',
              borderBottomWidth: 2,
              marginVertical: 0
            }}
          /> */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, padding: 5, paddingHorizontal: 60, marginBottom: 20, alignContent: "center" }}>
            <Button
              title="  Flow Rate (L/hr) "
              titleStyle={{ fontFamily: "SUSE-600" }}
              buttonStyle={{ borderRadius: 5, borderTopLeftRadius: 15, borderBottomLeftRadius: 15 }}
              style={{ flex: 1 }}
            />
            <Button
              title=" Volume (L)  "
              titleStyle={{ fontFamily: "SUSE-600" }}
              buttonStyle={{ borderRadius: 5, borderTopRightRadius: 15, borderBottomRightRadius: 15 }}
              style={{ flex: 1 }}
            />
          </View>
        </ThemedView>

        <ThemedView style={styles.stepContainer}>
          <View style={{ flexDirection: "row", paddingTop: 20, paddingHorizontal: 30, borderBottomWidth: 2, paddingBottom: 15, borderColor: "#808080" }}>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Ionicons name="radio-outline" color="red" size={25}/>
              <ThemedText style={{ fontFamily: "SUSE-700", fontSize: 20 }}>&nbsp;&nbsp;Shower Sensor</ThemedText>
            </View>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Ionicons name="settings" size={22} color="#606060" style={{ flex: 1, textAlign: "right" }}/>
            </View>
          </View>
          <ThemedText style={{ paddingVertical: 10, paddingHorizontal: 30 }}>
            Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
            Press{' '}
            <ThemedText type="defaultSemiBold">
              {Platform.select({ ios: 'cmd + d', android: 'cmd + m' })}
            </ThemedText>{' '}
            to open developer tools.
          </ThemedText>
          <Button
              buttonStyle={{ 
                borderBottomRightRadius: 20, 
                borderBottomLeftRadius: 20,
                backgroundColor: "#202020" 
              }}
              containerStyle={{ marginTop: 5 }}
              style={{ flex: 1 }}
            >
            <Ionicons name="chevron-down" size={30} color="white"/>
           </Button>
        </ThemedView>

        <ThemedView style={styles.stepContainer}>
          <View style={{ flexDirection: "row", paddingTop: 20, paddingHorizontal: 30, borderBottomWidth: 2, paddingBottom: 15, borderColor: "#808080" }}>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Ionicons name="cash" color="green" size={25}/>
              <ThemedText style={{ fontFamily: "SUSE-700", fontSize: 20 }}>&nbsp;&nbsp;Purchases</ThemedText>
            </View>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Ionicons name="settings" size={22} color="#606060" style={{ flex: 1, textAlign: "right" }}/>
            </View>
          </View>
          <ThemedText style={{ paddingVertical: 10, paddingHorizontal: 30 }}>
            Tap the Explore tab to learn more about what's included in this starter app.
          </ThemedText>
          <Button
              buttonStyle={{ 
                borderBottomRightRadius: 20, 
                borderBottomLeftRadius: 20,
                backgroundColor: "#202020" 
              }}
              containerStyle={{ marginTop: 5 }}
              style={{ flex: 1 }}
            >
            <Ionicons name="chevron-down" size={30} color="white"/>
           </Button>
        </ThemedView>

        <ThemedView style={{ ...styles.stepContainer, flexDirection: "row", backgroundColor: "#202020", paddingVertical: 25, paddingHorizontal: 30, borderBottomLeftRadius: 50, borderBottomRightRadius: 50 }}>
            <View style={{ flex: 2, height: 60, borderWidth: 0, alignItems: "center", paddingTop: 2.5, paddingRight: 3 }}>
              <Ionicons name="add" size={55} color={"white"}/>
            </View>
            <View style={{ flex: 7, height: 60, borderWidth: 0 }}>
              <Text style={{ fontFamily: "SUSE-400", fontSize: 17, borderWidth: 0, height: "100%", textAlignVertical: "center", color: "white" }}>
                Add a new Source for tracking your water usage.
              </Text>
            </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    borderRadius: 20,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    marginBottom: 15,
    borderColor: "grey",
    marginTop: 30,
    opacity: .8,
    flex: 1
  },
  stepContainer: {
    flex: 1,
    borderRadius: 20,
   // paddingVertical: 25,
   // paddingHorizontal: 30,
    gap: 8,
    marginBottom: 15,
    opacity: .99,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
