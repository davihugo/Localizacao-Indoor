import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

export default function ImageScreen({ route }) {
  const { image } = route.params;

  console.log("Received Image URI: ", image); 

  return (
    <View style={styles.container}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <Text>Nenhum mapa selecionada</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: 300,
    height: 300,
  },
});