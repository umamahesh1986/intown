
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet,Image, TouchableHighlight  } from 'react-native';

const App = () => {

  const handlePress = () => {
    console.log("Button Pressed!");
  };

  return (
    <View style={styles.container}>
      
      <TouchableHighlight 
  onPress={() => alert("Pressed Highlight")} 
  underlayColor="orange"
>
  <Text style={{ backgroundColor: 'blue', color: 'white', padding: 10 }}>
    TouchableHighlight
  </Text>
</TouchableHighlight>
      </View>
     
  );
  
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 10
  },
  text: {
    color: 'white',
    fontSize: 16
  }
});