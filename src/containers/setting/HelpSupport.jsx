import { StyleSheet } from 'react-native'
import React from 'react'
import { View } from 'react-native-ui-lib'
import Wapper from 'components/Wapper'
import { t } from 'lang'
import { useNavigation } from '@react-navigation/native'

const HelpSupport = () => {
  const navigation = useNavigation()
  return (
    <Wapper renderleft funtleft={() => navigation.goBack()} title={t("setting.help")}>
      <View flex bg-white>

      </View>
    </Wapper>
  )
}

export default HelpSupport

const styles = StyleSheet.create({})