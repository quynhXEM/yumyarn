import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import {GoogleSignin} from '@react-native-google-signin/google-signin'
const Signin = () => {
  GoogleSignin.configure({
    webClientId: "254299987381-28gqrb6m1luci16l176tfpmkbtoue0eq.apps.googleusercontent.com",
  })
  const handleSignin = async () => {
    console.log('google signin........')
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true
    })
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      console.log('select.......')
      const user = userInfo.user
      console.log('user info', user)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <View>
      <Text onPress={handleSignin}>login with gg</Text>
    </View>
  )
}

export default Signin
