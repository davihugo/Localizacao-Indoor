import React, { Component } from "react";
import { Text, View, StyleSheet, Button } from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';

export default class HomeScreen extends Component {
  state = {
    accelerometerData: { x: 0, y: 0, z: 0 },
    distanciaPercorrida: 0,
    last_acel: 0.0,
    last_vel: 0.0,
    isMedindo: false,
    image: null,
  };

  componentDidMount() {
    if (this.state.isMedindo) {
      this.subscribe();
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  subscribe = () => {
    this.setState({
      distanciaPercorrida: 0,
    });

    this._subscription = Accelerometer.addListener((accelerometerData) => {
      this.setState({ accelerometerData });
      this.calculaDistancia(accelerometerData.y);
    });
  };

  unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
    this.lastTime = undefined;
  };

  toggleMedicao = () => {
    this.setState(
      (prevState) => ({
        isMedindo: !prevState.isMedindo,
      }),
      () => {
        if (this.state.isMedindo) {
          this.subscribe();
        } else {
          this.unsubscribe();
          const distanciaPercorrida = this.state.distanciaPercorrida.toFixed(2);
          alert(`Distância percorrida: ${distanciaPercorrida} metros`);
          Speech.speak(`Você percorreu ${distanciaPercorrida} metros`);
        }
      }
    );
  };

  calculaDistancia = (acelY) => {
    const now = new Date().getTime();

    if (this.lastTime === undefined) {
      this.lastTime = now;
      return;
    }

    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (isNaN(dt) || dt <= 0) {
      console.warn("Valor inválido para dt");
      return;
    }

    console.log("Aceleração (antes do filtro):", acelY); // Log dos valores brutos da aceleração

    const filteredAcelY = this.applyLowPassFilter(acelY);

    console.log("Aceleração (após o filtro):", filteredAcelY); // Log dos valores filtrados da aceleração

    if (filteredAcelY > 0.03 && filteredAcelY <= 0.4) {
      console.log("===== NOVA ITERAÇÃO =====");
      console.log("Tempo atual:", now);
      console.log("Último Tempo:", this.lastTime);
      console.log("dt:", dt);
      console.log("Aceleração (acelY):", filteredAcelY);
      console.log("Última Aceleração (last_acel):", this.state.last_acel);
      console.log("Última Velocidade (last_vel):", this.state.last_vel);

      const distanciaPercorrida = this.calculo_trapezio(
        this.state.distanciaPercorrida,
        filteredAcelY,
        dt * 1000000
      );

      console.log("Tempo (t):", dt);
      console.log("Nova Velocidade (vel):", this.state.last_vel);
      console.log("Nova Distância (dist):", distanciaPercorrida);
      console.log("Distância Anterior:", this.state.distanciaPercorrida);
      console.log("Distância Atualizada:", distanciaPercorrida);

      this.setState({ distanciaPercorrida });
    }
  };

  applyLowPassFilter = (acelY) => {
    const alpha = 0.8; 
    const filteredAcelY = alpha * acelY + (1 - alpha) * this.state.last_acel;
    this.setState({ last_acel: filteredAcelY }); 
    return filteredAcelY;
  };

  calculo_trapezio = (dist, filteredAcelY, tempo) => {
    let vel;
    const t = tempo / 1000000.0;

    if (dist === 0.0) {
      this.state.last_vel = 0.0;
      this.state.last_acel = 0.0;
    }

    vel =
      this.state.last_vel + ((this.state.last_acel + filteredAcelY) * t) / 2.0;
    dist = dist + ((this.state.last_vel + vel) * t) / 2.0;

    this.setState({
      last_acel: filteredAcelY,
      last_vel: vel,
    });

    return dist;
  };

  pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      console.log("Image URI: ", result.assets[0].uri); 
      this.setState({ image: result.assets[0].uri }, () => {
        this.props.navigation.navigate('Image', { image: result.assets[0].uri });
      });
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Distância Percorrida:</Text>
        <Text style={styles.text}>
          {this.state.distanciaPercorrida.toFixed(2)} metros
        </Text>
        <Button
          title={this.state.isMedindo ? "Parar Medição" : "Iniciar Medição"}
          onPress={this.toggleMedicao}
        />
        <Button
          title="Escolher Mapa"
          onPress={this.pickImage}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
});