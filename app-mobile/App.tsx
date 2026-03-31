import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { termData } from './src/data/termData';

export default function App() {
  const count = Object.keys(termData).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 横文字ハンター</Text>
      <Text style={styles.message}>用語データ {count} 件ロード完了</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#555',
  },
});
