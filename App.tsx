import { StatusBar, StyleSheet, Text } from 'react-native'
import React from 'react'
import { View } from 'react-native-ui-lib'
import ScreenGGmap from 'src/testcomponent/ScreenGGmap'
import Signin from 'src/testcomponent/Signin'
import AddAdrressScreen from 'containers/post/AddAdrressScreen'


const App = () => {
  return (
    <View flex>
      {/* <Signin/> */}
      {/* <ImageAndVideoLibary/> */}
      <AddAdrressScreen/>
    </View>

  )
}

export default App

const styles = StyleSheet.create({})