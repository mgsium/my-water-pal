import { Image, StyleSheet, Platform, View, ScrollView, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Linking} from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Overlay } from '@rneui/themed';
import { Component } from 'react';

import moment from 'moment';
import { BottomSheet } from '@rneui/base';
import { Dropdown } from 'react-native-element-dropdown';

import QRCode from 'react-native-qrcode-svg';
import { LineChart } from 'react-native-chart-kit';

import * as Clipboard from 'expo-clipboard';
import { useSession } from '../ctx';

type State =  { 
  UserId: string, 
  UsageData: any, 
  showNewSourceOverlay: boolean,
  addSourceData: {
    name: string,
    type: number
  },
  addSourceLoading: boolean,
  showSourceSettings: boolean[],
  deletingState: boolean,
  loadingSources: boolean,
  flow_rate: number,
  volume: number,
  summaryMode: number,
  copyingToClipboard: boolean,
  activeEvent: any
}

const config = {
  backgroundGradientFrom: "#1E2923",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#08130D",
  backgroundGradientToOpacity: 0,
  decimalPlaces: 2, // optional, defaults to 2dp
  color: (opacity = 1) => `rgba(47, 149, 202, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(47, 149, 202, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "rgb(47, 149, 202)"
  }
}

const SignOutBtn = () => {
  const { signOut } = useSession();

  return <Button 
    title={<Ionicons name="arrow-back-circle" size={30}/>}
    buttonStyle={{ backgroundColor: "white", borderRadius: 40 }}
    containerStyle={{ flex: 1, alignSelf: "flex-end" }}
    onPress={signOut}
  />
}

export default class HomeScreen extends Component<{}, State> {

  constructor(props: any) {
    super(props);


    this.state = {
      UserId: "test_device",
      UsageData: null,
      showNewSourceOverlay: false,
      addSourceData : { name: "", type: 0 },
      addSourceLoading: false,
      showSourceSettings: [],
      deletingState: false,
      loadingSources: true,
      flow_rate: -1,
      volume: -1,
      summaryMode: 0,
      copyingToClipboard: false,
      activeEvent: null
    }

    this.getUsageData(false);

    this.toggleNewSourceOverlay = this.toggleNewSourceOverlay.bind(this);
    this.increaseLimit = this.increaseLimit.bind(this);
  }

  toggleNewSourceOverlay() {
    this.setState({ showNewSourceOverlay: !this.state.showNewSourceOverlay });
  }

  calculateFlowRate(usageData: any) {
    const now = Date.now();

    const eventsWithDiff = usageData
    .map((x:any) => x.events)
    .reduce((a: any, b: any) => a.concat(b), [])
    .map((x : any) => ({...x, diff: now - x.timestamp}));

    const eventsWithinMonth = eventsWithDiff
    .filter((x : any) => x.diff < 1000 * 60 * 60 * 24 * 30);

    const sum = eventsWithinMonth
    .reduce((partialSum: any, x: any) => partialSum + x.volume, 0);

    const nhours = eventsWithDiff
    .reduce((partialMin: any, x: any) => Math.max(partialMin, x.diff), 3600000);

    // console.log(sum);
    // console.log(nhours);

    return sum * (3600000/nhours);
  }

  calculateVolume(usageData: any) {
    const now = new Date();
    
    const events = usageData
    .map((x: any) => x.events)
    .reduce((a: any, b: any) => a.concat(b), []);

    const eventsThisMonth = events
    .filter((x : any) => {
      const then = (new Date(parseInt(x.timestamp)));
      return then.getMonth() === now.getMonth();
    });

    const sum = eventsThisMonth
    .reduce((partialSum: any, x: any) => partialSum + x.volume, 0);

    return sum;
  }

  getUsageData = async (mounted: boolean = true) => {
   if (mounted) await this.setState({ loadingSources: true });
    await fetch("https://dbwtfjzojadun6k2xullerkj6u0ytwvi.lambda-url.eu-west-2.on.aws/", {
      method: "POST",
      body: JSON.stringify({
        userid: "test_user"
      })
    })
      .then(res => res.json())
      .then(data => {
        // console.log(data.body);
        this.setState({ 
          UsageData: this.structureUsageData(data.body),
          showSourceSettings: data.body.map((_ : any) => false),
          loadingSources: false,
          flow_rate: this.calculateFlowRate(data.body),
          volume: this.calculateVolume(data.body)
        });
      });
  }

  structureUsageData(usageData: any) {
    usageData = usageData.map((x: any) => {
      x.events.sort((x: any, y: any) => y.timestamp - x.timestamp);
      x.events = x.events.reverse();
      x.events = x.events.reduce((partial: any, e: any) => ([
        partial[0].concat([{ ...e, cumulative: e.volume + partial[1] }])
        , e.volume + partial[1]
      ]), [[], 0]);

      // console.log(x.events);

      x.events = x.events[0];

      x.events = x.events.reverse();

      return x;
    })

    return usageData.map((x: any) => ({...x, limit: 10}));
  }

  increaseLimit(i: any) {
    const usageData = this.state.UsageData;
    usageData[i]["limit"] = usageData[i]["limit"] + 20;
    this.setState({ UsageData: usageData });
  }

  updateNewSourceName = (text: string) => {
    const source = this.state.addSourceData;
    if (!source) return;
    source.name = text;
    this.setState({ addSourceData: source}, () => console.log(text));
  }

  truncateName = (name: string) => {
    if (name.length <= 20) return name
    else return `${name.slice(0, 17)}...`; 
  }

  updateNewSourceType = (item: any) => {
    const source = this.state.addSourceData;
    if (!source) return;
    source.type = item["value"];
    this.setState({ addSourceData: source}, () => console.log(item));
  }
  submitNewSource = async () => {
    const source = this.state.addSourceData;
    console.log(source);
    console.log(JSON.stringify({
      userid: "test_user",
      ...source
    }));

    await this.setState({ addSourceLoading: true });
    await fetch("https://3dhn7niyuit5bxu4tycjvjzug40uvxrl.lambda-url.eu-west-2.on.aws/", {
      method: "POST",
      body: JSON.stringify({
        userid: "test_user",
        ...source
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log(data.body);
        this.setState({ 
          addSourceData : { name: "", type: 0 }, 
          addSourceLoading: false,
          showNewSourceOverlay: false 
        }, () => this.getUsageData());
      })
      .catch(e => console.log(e));
  }

  toggleSourceSettings = (i: number) => {
    const showSourceSettings = this.state.showSourceSettings;
    showSourceSettings[i] = !showSourceSettings[i];
    this.setState({ showSourceSettings: showSourceSettings });
  } 

  setActiveEvent = async (e: any) => {
    if (!e || e[0].type === 0) { this.setState({ activeEvent: e }); }
  }

  deleteSource = async (i: number) => {
    const sourceToDelete = this.state.UsageData[i];
    await this.setState({ deletingState : true });
    console.log(i);
    await fetch("https://p3jovkxsauiqs6vgrmibpdhfwe0gwfyp.lambda-url.eu-west-2.on.aws/", {
      method: "POST",
      body: JSON.stringify(sourceToDelete)
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      this.getUsageData();
      this.toggleSourceSettings(i);
      this.setState({ deletingState : false });
    });
  }

  copySetupCode = async (text: string) => {
    await this.setState({ copyingToClipboard: true });
    await Clipboard.setStringAsync(text);
    setTimeout(() => this.setState({ copyingToClipboard: false }), 1000);
  }

  setSummaryMode = async (i: number) => this.setState({ summaryMode: i })

  render() {
    const now = Date.now();
    const days = [4, 3, 2, 1, 0]
    .map((x : number) => now - x * 1000 * 60 * 60 * 24)
    .map((x : number) => (new Date(x)));

    console.log(days);

    let events = [];
    if (this.state.UsageData) 
      events = this.state.UsageData
              .map((x: any) => x.events)
              .reduce((a: any, b: any) => a.concat(b), []);

    const datasets = days
    .map((x : any) =>  events 
      .filter((y: any) => (new Date(parseInt(y.timestamp))).getUTCDay() === x.getUTCDay())
      .reduce((partial: number, x: any) => partial + x.volume, 0));
    
    console.log(datasets);

    return (
      <ThemedView style={{ flexDirection: "row", paddingHorizontal: 30, gap: 15, backgroundColor: '#1ca3ec', minHeight: "100%" }}>
        <ScrollView 
          style={{ flexDirection: "column", gap: 15 }}
          refreshControl={
            <RefreshControl refreshing={this.state.loadingSources} onRefresh={this.getUsageData} />
          }
          >
          <View style={{ flex: 1, flexDirection: "row", gap: 20, marginBottom: 25, marginTop: 65 }}>
            <SignOutBtn/>
            <Text style={{ fontFamily: "montserrat-800", flex: 3, fontSize: 37, color: "white", textAlign: "center", letterSpacing: -2 }}>
              mywaterpal
            </Text>
            <Button 
              title={<Ionicons name="logo-github" size={30} color="white"/>}
              buttonStyle={{ backgroundColor: "black", borderRadius: 40 }}
              containerStyle={{ flex: 1, alignSelf: "flex-end" }}
              onPress={() => Linking.openURL('https://github.com/mgsium/my-water-pal')}
            />
          </View>
          <ThemedView style={styles.titleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 25 }}>
              <Text style={{ fontSize: 18, fontFamily: "SUSE-600", flex: 1, textAlign: "center" }}>
                Your Water Usage at a Glance
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 15, paddingBottom: 5, alignSelf: "center" }}>
              <Ionicons name='water' color="#1ca3ec" size={50}/>
              <Text style={{ fontSize: 50, fontFamily: "SUSE-700", color: "#303030" }}>
                {
                  (() => {
                    if (this.state.flow_rate == -1) return "-"
                    else if (this.state.summaryMode === 0) return `${this.state.flow_rate.toFixed(2)} L/hr`
                    else return `${this.state.volume.toFixed(2)} L`
                  })()
                }
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, alignSelf: "center" }}>
              { this.state.summaryMode === 1 && <Text style={{ color: "#606060", fontFamily: "SUSE-500" }}>This Month</Text> }
            </View>
            {/* <View
              style={{
                borderBottomColor: 'grey',
                borderBottomWidth: 2,
                marginVertical: 0
              }}
            /> */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, padding: 5, paddingHorizontal: 60, marginBottom: 30, alignContent: "center" }}>
              <Button
                title="  Flow Rate (L/hr) "
                titleStyle={{ fontFamily: "SUSE-600" }}
                buttonStyle={{ borderRadius: 5, borderTopLeftRadius: 15, borderBottomLeftRadius: 15 }}
                style={{ flex: 1 }}
                disabled={this.state.summaryMode === 0}
                onPress={() => this.setSummaryMode(0)}
              />
              <Button
                title=" Volume (L)  "
                titleStyle={{ fontFamily: "SUSE-600" }}
                buttonStyle={{ borderRadius: 5, borderTopRightRadius: 15, borderBottomRightRadius: 15 }}
                style={{ flex: 1 }}
                disabled={this.state.summaryMode === 1}
                onPress={() => this.setSummaryMode(1)}
              />
            </View>
          </ThemedView>
          <ThemedView style={{ backgroundColor: "#202020", borderRadius: 20, flex: 1, marginBottom: 15, paddingVertical: 15 }}>
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 }}>
              <Text style={{ fontSize: 18, fontFamily: "SUSE-600", flex: 1, textAlign: "center", color: "grey" }}>
                Past 5 Days
              </Text>
            </View>
            <LineChart
              data={{
                labels: days.map((x: any) => x.toLocaleDateString("en-US")), // labels for past few days
                datasets: [{ data: datasets }] // past few days
              }}
              width={360} // from react-native
              height={220}
              // yAxisLabel="$"
              yAxisSuffix="L"
              yAxisInterval={1} // optional, defaults to 1
              chartConfig={config}
              formatYLabel={(val: string) => Math.round(parseFloat(val)).toString()}
              bezier
              style={{ marginTop: 20 }}
            />
          </ThemedView>
          {
            this.state.loadingSources && (
              <View style={{ padding: 30 }}>
                <ActivityIndicator  color="black" size="large"/> 
              </View>
            )
          }
          { 
            this.state.UsageData &&
            this.state.UsageData.map((sourceData : any, i: any) => (
              <ThemedView style={styles.stepContainer} key={sourceData.sourceid}>
                <View style={{ flexDirection: "row", paddingTop: 20, paddingHorizontal: 30, borderBottomWidth: 2, paddingBottom: 15, borderColor: "#808080" }}>
                  <View style={{ flex: 3, flexDirection: "row" }}>
                    { sourceData.type == 1 ? <Ionicons name="radio-outline" color="red" size={25}/>
                                           : <Ionicons name="cash" color="green" size={25}/> }
                    <ThemedText style={{ fontFamily: "SUSE-700", fontSize: 20 }}>&nbsp;&nbsp;{sourceData.name}</ThemedText>
                  </View>
                  <TouchableOpacity style={{ flex: 1, flexDirection: "row", height: "100%" }} onPress={() => this.toggleSourceSettings(i)}>
                    <Ionicons name="settings" size={22} color="#606060" style={{ flex: 1, textAlign: "right" }}/>
                  </TouchableOpacity>
                </View>
                {
                  sourceData.events.length === 0 && (
                    <View style={{ paddingVertical: 10 }}>
                      <Text style={{ fontFamily: "SUSE-500", fontSize: 16, textAlign: "center", color: "grey" }}>No events to show!</Text>
                    </View>
                  )
                }
                <ScrollView 
                  persistentScrollbar
                  nestedScrollEnabled
                  style={{ maxHeight: 200, flexDirection: "column", padding: 0 }}
                >
                {
                  sourceData.events.slice(0, sourceData["limit"]).map((x : any, i: any) => (
                    <TouchableOpacity 
                      key={x.timestamp} 
                      style={{ flexDirection: 'column', padding: 5, paddingHorizontal: 20, flex: 1 }}
                      onPress={() => { this.setActiveEvent([sourceData, i]) }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>               
                        {
                          sourceData.type !== 0
                          ? <Ionicons name="water" size={20} color="#1ca3ec" style={{ height: -10 }}/>
                          : <Ionicons name="cube" size={20} color="orange" style={{ height: -10 }}/>
                        }
                        <ThemedText style={{ fontFamily: "SUSE-700", fontSize: 20 }}>
                        {
                          sourceData.type === 0 && x.name
                          ? this.truncateName(x.name) : `${x.volume.toFixed(2)}L`
                        }
                        </ThemedText>
                        <ThemedText style={{ fontFamily: "SUSE-500", fontSize: 18, flex: 1, textAlign: "right", color: "grey" }}>
                          { i == 0 && "This Month: "}{x.cumulative.toFixed(2)}L
                        </ThemedText>
                      </View>
                     <ThemedText style={{ fontSize: 12, color: "#707070", marginLeft: 5 }}>
                        {(new Date(parseInt(x.timestamp))).toDateString()} - {moment(new Date(parseInt(x.timestamp))).fromNow()}
                     </ThemedText>
                    </TouchableOpacity>
                  ))
                }
                </ScrollView>
                <Button
                    buttonStyle={{ 
                      borderBottomRightRadius: 20, 
                      borderBottomLeftRadius: 20,
                      backgroundColor: "#202020" 
                    }}
                    containerStyle={{ marginTop: 5 }}
                    style={{ flex: 1 }}
                    onPress={() => this.increaseLimit(i)}
                    disabled={sourceData.limit >= sourceData.events.length}
                  >
                  <Ionicons name="chevron-down" size={30} color="white"/>
                </Button>
                <BottomSheet 
                  isVisible={this.state.showSourceSettings[i]} 
                  onBackdropPress={() => this.toggleSourceSettings(i)}
                >
                  <ThemedView style={{ backgroundColor: "white", width: "100%", height: 400, borderTopRightRadius: 40, borderTopLeftRadius: 40, padding: 30, flexDirection: "column" }}>
                    <View style={{ flex: 1, flexDirection: "row", alignSelf: "center"}}>
                    { sourceData.type == 1 ? <Ionicons name="radio-outline" color="red" size={25}/>
                                            : <Ionicons name="cash" color="green" size={25}/> }
                      <ThemedText style={{ fontFamily: "SUSE-700", fontSize: 22 }}>
                        &nbsp;&nbsp;{sourceData.name}
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flexDirection: "column", flex: 1, gap : 10 }}>
                        <ThemedText style={{ fontFamily: "SUSE-700", fontSize: 18, marginBottom: 10, alignSelf: "center" }}>Setup Code</ThemedText>
                        <ThemedText style={{ fontFamily: "SUSE-500", fontSize: 14, marginBottom: 10, alignSelf: "center", color: "grey" }}>Scan the QR Code or copy the setup code below to link your sensor with this app.</ThemedText>
                        <Button
                          title={
                            // this.state.deletingState ? <ActivityIndicator  color="red" size="large"/> 
                             (
                              <View style={{ flexDirection: "row" }}>
                                <Ionicons name="copy" color="white" size={20}/>
                                <ThemedText style={{ fontFamily: "SUSE-600", fontSize:18, color: "white" }}>&nbsp;&nbsp;{ this.state.copyingToClipboard ? "Copied..." : "Copy"}</ThemedText>
                              </View>
                            )
                          }
                          titleStyle={{ fontFamily: "SUSE-600", fontSize: 20 }}
                          buttonStyle={{ borderRadius: 10, padding: 15, backgroundColor: "black" }}
                          style={{ flex: 1 }}
                          onPress={() => this.copySetupCode(sourceData.sourceid)}
                          disabled={this.state.copyingToClipboard}
                        />
                      </View>
                      <View style={{ padding: 10, flexDirection: "row", alignSelf: "center", borderWidth: 3, borderRadius: 10, borderColor: "grey", marginBottom: 30 }}>
                        <QRCode value={sourceData.sourceid} size={170}/>
                      </View>
                    </View>
                    <Button
                      title={
                        this.state.deletingState ? <ActivityIndicator  color="red" size="large"/> 
                        : (
                          <View style={{ flexDirection: "row" }}>
                            <Ionicons name="trash" color="white" size={20}/>
                            <ThemedText style={{ fontFamily: "SUSE-600", fontSize:18, color: "white" }}>&nbsp;&nbsp;Delete Source</ThemedText>
                          </View>
                        )
                      }
                      titleStyle={{ fontFamily: "SUSE-600", fontSize: 20 }}
                      buttonStyle={{ borderRadius: 10, padding: 15, backgroundColor: "red" }}
                      style={{ flex: 1 }}
                      onPress={() => this.deleteSource(i)}
                      disabled={this.state.deletingState}
                    />
                  </ThemedView>
                </BottomSheet>
              </ThemedView>
            ))
          }

          {/* <ThemedView style={styles.stepContainer}>
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
          </ThemedView> */}

          <ThemedView style={{ ...styles.stepContainer, flexDirection: "row", backgroundColor: "#202020", paddingVertical: 25, paddingHorizontal: 30, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, marginBottom: 30 }}>
              <View style={{ flex: 2, height: 60, borderWidth: 0, alignItems: "center", paddingTop: 2.5, paddingRight: 3 }}>
                <Ionicons name="add" size={55} color={"white"}/>
              </View>
              <TouchableOpacity onPress={this.toggleNewSourceOverlay} style={{ flex: 7, height: 60, borderWidth: 0 }}>
                  <Text style={{ fontFamily: "SUSE-400", fontSize: 17, borderWidth: 0, height: "100%", textAlignVertical: "center", color: "white" }}>
                    Add a new Source for tracking your water usage.
                  </Text>
              </TouchableOpacity>
          </ThemedView>
        </ScrollView>
        <BottomSheet 
          isVisible={this.state.showNewSourceOverlay} 
          onBackdropPress={this.toggleNewSourceOverlay}
        >
          <ThemedView style={{ backgroundColor: "white", width: "100%", height: 400, borderTopRightRadius: 40, borderTopLeftRadius: 40, padding: 30, flexDirection: "column" }}>
            <ThemedText style={{ textAlign: "center", flex: 1, fontFamily: "SUSE-700", fontSize: 22 }}>New Source</ThemedText>
            <View>
              <ThemedText style={{ fontFamily: "SUSE-600", fontSize: 20, marginLeft: 10, marginBottom: 15 }}>Name</ThemedText>
              <Input 
                placeholder='"Downstairs Bathroom"'
                inputContainerStyle={{ borderWidth: 0 }}
                inputStyle={{ borderWidth: 0, borderTopLeftRadius: 10,borderTopRightRadius: 10, borderColor: "grey", backgroundColor: "#f2f2f2", paddingVertical: 10, paddingHorizontal: 20, fontFamily: "SUSE-500" }}
                value={this.state.addSourceData.name}
                onChangeText={(text: string) => this.updateNewSourceName(text)}
                disabled={this.state.addSourceLoading}
              />
            </View>
            <View>
              <ThemedText style={{ fontFamily: "SUSE-600", fontSize: 20, marginLeft: 10, marginBottom: 15 }}>Type</ThemedText>
              <Dropdown
                style={{
                  borderWidth: 0, 
                  margin: 10,
                  marginBottom: 20,
                  paddingVertical: 15,
                  paddingHorizontal: 20,
                  backgroundColor: "#f2f2f2",
                  borderRadius: 10
                }}
                placeholderStyle={{
                  fontFamily: "SUSE-600",
                  fontSize: 18
                }}
                selectedTextStyle={{
                  fontFamily: "SUSE-600",
                  fontSize: 18
                }}
                itemTextStyle={{
                  fontFamily: "SUSE-600",
                  fontSize: 18
                }}
                // inputSearchStyle={styles.inputSearchStyle}
                // iconStyle={styles.iconStyle}
                data={[
                  { label: 'Purchases', value: 0 },
                  { label: 'Sensor', value: 1 },
                ]}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select item"
                searchPlaceholder="Search..."
                value={{ label: "x", value: this.state.addSourceData.type} }
                onChange={item => this.updateNewSourceType(item)}
                // renderLeftIcon={() => (
                //   <AntDesign style={styles.icon} color="black" name="Safety" size={20} />
                // )}
                disable={this.state.addSourceLoading}
              />
            </View>
            <Button
                title={
                  !this.state.addSourceLoading ? "Submit" : <ActivityIndicator  color="black" size="large"/> 
                }
                titleStyle={{ fontFamily: "SUSE-600", fontSize: 20 }}
                buttonStyle={{ borderRadius: 10, padding: 15, backgroundColor: "#101010" }}
                style={{ flex: 1 }}
                disabled={this.state.addSourceLoading|| this.state.addSourceData.name === ""}
                onPress={() => this.submitNewSource()}
              />
          </ThemedView>
        </BottomSheet>
        <BottomSheet 
          isVisible={!!this.state.activeEvent} 
          onBackdropPress={() => this.setActiveEvent(null)}
        >
          <ThemedView style={{ backgroundColor: "white", width: "100%", height: 400, borderTopRightRadius: 40, borderTopLeftRadius: 40, padding: 30, paddingTop: 40, flexDirection: "column" }}>
            <View style={{ flex: 1, flexDirection: "column", paddingHorizontal: 20, gap: 10 }}>
              <View style={{ flexDirection: "row" }}>
              { this.state.activeEvent && this.state.activeEvent[0].type == 1 ? <Ionicons name="water" color="#1ca3ec" size={25}/>
                                      : <Ionicons name="cube" color="orange" size={25}/> }
                <ThemedText style={{ fontFamily: "SUSE-600", fontSize: 22 }}>
                  &nbsp;&nbsp;{
                  this.state.activeEvent 
                  && (this.state.activeEvent[0].type === 0 ?
                    this.state.activeEvent[0]["events"][this.state.activeEvent[1]].name
                    : "Water"
                  )}
                </ThemedText>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Ionicons name="water" color="#1ca3ec" size={25}/>
                <ThemedText style={{ fontFamily: "SUSE-600", fontSize: 22 }}>
                  &nbsp;&nbsp;{this.state.activeEvent 
                  && this.state.activeEvent[0]["events"][this.state.activeEvent[1]].volume.toFixed(2)}L Used
                </ThemedText>
              </View>
              <ThemedText style={{ fontFamily: "SUSE-700", fontSize: 22, marginTop: 15 }}>
                Estimate Notes
              </ThemedText>
              <ScrollView nestedScrollEnabled>
                <ThemedText style={{ fontFamily: "SUSE-500", fontSize: 15, color: "grey" }}>
                    {this.state.activeEvent && this.state.activeEvent[0]["events"][this.state.activeEvent[1]].description}
                </ThemedText>
              </ScrollView>
            </View>
          </ThemedView>
        </BottomSheet>
      </ThemedView>
    );
  }
}

const styles = StyleSheet.create({
  titleContainer: {
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    marginBottom: -15,
    borderColor: "black",
    // marginTop: 60,
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
