import { router } from 'expo-router';
import { Text, View, Image } from 'react-native';

import { useSession } from './ctx';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@rneui/base';
import { SvgUri } from 'react-native-svg';

export default function SignIn() {
  const { signIn } = useSession();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#1ca3ec" }}>
     <View>
        <Image
          style={{ width: 130, height: 130, alignSelf: "center" }}
          source={require("../assets/images/icon.png")}
          />
        <Text style={{ fontFamily: "montserrat-800", fontSize: 37, color: "white", textAlign: "center", letterSpacing: -2 }}>
            mywaterpal
        </Text>
        <Button
            title={
                <View style={{ flexDirection: "row" }}>
                    <Ionicons name="arrow-forward-circle" style={{ alignSelf: "center"}} size={22}/>
                    <ThemedText style={{ fontFamily: "SUSE-600", fontSize: 20 }}>&nbsp;&nbsp;Begin Demo</ThemedText>
                </View>
            }
            buttonStyle={{ borderRadius: 10, backgroundColor: 'white', padding: 15 }}
            titleStyle={{ color: "black" }}
            containerStyle={{ marginTop: 40 }}
            onPress={() => {
                signIn();
                // Navigate after signing in. You may want to tweak this to ensure sign-in is
                // successful before navigating.
                router.replace('/');
            }}
            />
      </View>
    </View>
  );
}
