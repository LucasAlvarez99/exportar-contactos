import * as Contacts from "expo-contacts";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as XLSX from "xlsx";

export default function App() {
  const [contactos, setContactos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargarContactos = async () => {
    setCargando(true);
    setMensaje("");

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceso a tus contactos para exportarlos."
        );
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      setContactos(data);
      setMensaje(`${data.length} contactos cargados ✅`);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los contactos: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  const exportarExcel = async () => {
    if (contactos.length === 0) return;
    setCargando(true);

    try {
      const filas = contactos.map((c) => ({
        Nombre: c.name || "Sin nombre",
        Telefono: c.phoneNumbers?.[0]?.number || "Sin número",
      }));

      const hoja = XLSX.utils.json_to_sheet(filas);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Contactos");

      const archivoBase64 = XLSX.write(libro, {
        type: "base64",
        bookType: "xlsx",
      });

      const ruta = FileSystem.documentDirectory + "contactos.xlsx";

      await FileSystem.writeAsStringAsync(ruta, archivoBase64, {
        encoding: "base64",
      });

      const puedeCompartir = await Sharing.isAvailableAsync();
      if (!puedeCompartir) {
        Alert.alert("Error", "El servicio de compartir no está disponible.");
        return;
      }

      await Sharing.shareAsync(ruta, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Exportar contactos",
        UTI: "com.microsoft.excel.xlsx",
      });

      setMensaje("Excel exportado con éxito ✅");
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar el archivo Excel: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  const exportarTxt = async () => {
    if (contactos.length === 0) return;
    setCargando(true);

    try {
      const lineas = ["NOMBRE | TELÉFONO", "─".repeat(40)];

      for (const c of contactos) {
        const nombre = c.name || "Sin nombre";
        const tel = c.phoneNumbers?.[0]?.number || "Sin número";
        lineas.push(`${nombre} | ${tel}`);
      }

      const contenido = lineas.join("\n");

      const ruta = FileSystem.documentDirectory + "contactos.txt";

      await FileSystem.writeAsStringAsync(ruta, contenido, {
        encoding: "utf8",
      });

      const puedeCompartir = await Sharing.isAvailableAsync();
      if (!puedeCompartir) {
        Alert.alert("Error", "El servicio de compartir no está disponible.");
        return;
      }

      await Sharing.shareAsync(ruta, {
        mimeType: "text/plain",
        dialogTitle: "Exportar contactos",
        UTI: "public.plain-text",
      });

      setMensaje("TXT exportado con éxito ✅");
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar el archivo TXT: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.icono}>📋</Text>
      <Text style={styles.titulo}>Exportar Contactos</Text>

      {mensaje !== "" && <Text style={styles.mensaje}>{mensaje}</Text>}

      {cargando ? (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginTop: 30 }}
        />
      ) : (
        <View style={styles.botones}>
          <TouchableOpacity style={styles.boton} onPress={cargarContactos}>
            <Text style={styles.botonTexto}>🔄 Cargar Contactos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.boton,
              styles.botonVerde,
              contactos.length === 0 && styles.botonDesactivado,
            ]}
            onPress={exportarExcel}
            disabled={contactos.length === 0}
          >
            <Text style={styles.botonTexto}>📊 Exportar a Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.boton,
              styles.botonGris,
              contactos.length === 0 && styles.botonDesactivado,
            ]}
            onPress={exportarTxt}
            disabled={contactos.length === 0}
          >
            <Text style={styles.botonTexto}>📄 Exportar a TXT</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#f1f5f9",
  },
  icono: { fontSize: 80 },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 16,
    color: "#1e293b",
  },
  mensaje: {
    fontSize: 16,
    color: "#16a34a",
    marginBottom: 10,
    textAlign: "center",
  },
  botones: { width: "100%", gap: 12, marginTop: 20 },
  boton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  botonVerde: { backgroundColor: "#16a34a" },
  botonGris: { backgroundColor: "#64748b" },
  botonDesactivado: { opacity: 0.4 },
  botonTexto: { color: "white", fontSize: 16, fontWeight: "600" },
});