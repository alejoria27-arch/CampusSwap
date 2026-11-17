
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
Image,
  StyleSheet,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  iniciarBaseDatos,
  consultarProductosLocales,
  guardarProductoLocal,
  actualizarProductoLocal,
  eliminarProductoLocal,
  contarProductosLocales
} from './database';


// CONFIGURACIÓN FIREBASE
const FIREBASE_PROJECT_ID = 'campusswap-7a0e2';
const FIREBASE_API_KEY = 'AIzaSyAPYAYIy1xUTm65tmuTt2IsSa168eNXXeg';

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/products`;
const FIRESTORE_CHATS_URL = FIRESTORE_URL.replace('/products', '/chats');

export default function App() {


  const [productos, setProductos] = useState([
    {
      id: 'demo1',
      nombre: 'Calculadora científica',
      precio: '45000',
      categoria: 'Tecnología',
      descripcion: 'Calculadora científica en buen estado.',
      vendedor: 'Víctor Cruz',
    },
    {
      id: 'demo2',
      nombre: 'Libro de programación',
      precio: '35000',
      categoria: 'Libros',
      descripcion: 'Libro de programación para estudiantes.',
      vendedor: 'Estudiante CampusSwap',
    },
  ]);

  const [favoritos, setFavoritos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [pantalla, setPantalla] = useState('catalogo');
  const [mensajes, setMensajes] = useState([]);
const [mensajeNuevo, setMensajeNuevo] = useState('');
const [productoChat, setProductoChat] = useState(null);
const [conversaciones, setConversaciones] = useState([]);
const [cargandoConversaciones, setCargandoConversaciones] = useState(false);
const [chatAbierto, setChatAbierto] = useState(false);
const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState(null);
  const [vendedor, setVendedor] = useState('Víctor Cruz');
  const [editando, setEditando] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [dbLista, setDbLista] = useState(false);
  const [totalSQLite, setTotalSQLite] = useState(0);
  const [nombrePerfil, setNombrePerfil] = useState('Víctor Cruz');
const [programaPerfil, setProgramaPerfil] = useState('Ingeniería de Sistemas');
const [editandoPerfil, setEditandoPerfil] = useState(false);

  const modoFirebase = Boolean(FIREBASE_PROJECT_ID && FIREBASE_API_KEY);

  // 2. CARGAR FAVORITOS Y PRODUCTOS
 useEffect(() => {
  async function iniciarAplicacion() {
    try {
      // Inicializar SQLite
      await iniciarBaseDatos();
      setDbLista(true);
      console.log('SQLite conectado correctamente');
      const total = await contarProductosLocales();
setTotalSQLite(total);

      // Consultar productos guardados localmente
      const locales = await consultarProductosLocales();

      if (locales.length > 0) {
        const productosLocalizados = locales.map(item => ({
          id: item.firebase_id,
          nombre: item.nombre,
          precio: String(item.precio),
          categoria: item.categoria,
          descripcion: item.descripcion,
          vendedor: item.vendedor
        }));

        setProductos(productosLocalizados);
      }
    } catch (error) {
      console.log('Error al iniciar SQLite:', error);
    }

    // Cargar favoritos
    await cargarFavoritos();
    await cargarPerfil();

    // Consultar Firebase
    if (modoFirebase) {
      await cargarFirebase();
    }
  }

  iniciarAplicacion();
}, [modoFirebase]);

  async function cargarFavoritos() {
  
    try {
      const guardados = await AsyncStorage.getItem('campusswap_favoritos');
      if (guardados) setFavoritos(JSON.parse(guardados));
    } catch (error) {
      console.log('Error cargando favoritos', error);
    }
  }

  async function guardarFavoritos(lista) {
    setFavoritos(lista);
    try {
      await AsyncStorage.setItem(
        'campusswap_favoritos',
        JSON.stringify(lista)
      );
    } catch (error) {
      console.log('Error guardando favoritos', error);
    }
  }

async function cargarPerfil() {
  try {
    const guardado = await AsyncStorage.getItem('campusswap_perfil');

    if (guardado) {
      const perfil = JSON.parse(guardado);
      setNombrePerfil(perfil.nombre || 'Víctor Cruz');
      setProgramaPerfil(perfil.programa || 'Ingeniería de Sistemas');
    }
  } catch (error) {
    console.log('Error cargando perfil:', error);
  }
}

async function guardarPerfil() {
  if (!nombrePerfil.trim() || !programaPerfil.trim()) {
    Alert.alert('Datos incompletos', 'Completa tu nombre y programa académico.');
    return;
  }

  try {
    await AsyncStorage.setItem(
      'campusswap_perfil',
      JSON.stringify({
        nombre: nombrePerfil.trim(),
        programa: programaPerfil.trim(),
      })
    );

    setEditandoPerfil(false);
    Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.');
  } catch (error) {
    console.log('Error guardando perfil:', error);
    Alert.alert('Error', 'No se pudo guardar el perfil.');
  }
}

  // 3. CONEXIÓN Y LECTURA DE FIRESTORE
  async function cargarFirebase() {
    try {
      setCargando(true);
      const respuesta = await fetch(
        `${FIRESTORE_URL}?key=${FIREBASE_API_KEY}`
      );
      if (!respuesta.ok) throw new Error(await respuesta.text());

      const datos = await respuesta.json();
      const lista = (datos.documents || []).map((documento) => {
        const f = documento.fields || {};
        return {
          id: documento.name.split('/').pop(),
          nombre: f.nombre?.stringValue || '',
          precio: f.precio?.stringValue || '0',
          categoria: f.categoria?.stringValue || '',
          descripcion: f.descripcion?.stringValue || '',
          vendedor: f.vendedor?.stringValue || '',
          imagen: f.imagen?.stringValue || '',
        };
      });
// Guardar los productos de Firebase en SQLite
await Promise.all(
  lista.map(producto => guardarProductoLocal(producto))
);
      setProductos(lista);
      setConectado(true);
    } catch (error) {
      console.log('Error Firestore:', error);
      Alert.alert('Conexión', 'No se pudo conectar con Firestore. Revisa la configuración.');
      setConectado(false);
    } finally {
      setCargando(false);
    }
  }

  function convertirFirestore(producto) {
    return {
      fields: {
        nombre: { stringValue: producto.nombre },
        precio: { stringValue: producto.precio },
        categoria: { stringValue: producto.categoria },
        descripcion: { stringValue: producto.descripcion },
        vendedor: { stringValue: producto.vendedor },
        imagen: { stringValue: producto.imagen || '' },
      },
    };
  }
  function obtenerIdChat(producto) {
  return encodeURIComponent(
    `${producto.id}_${nombrePerfil}_${producto.vendedor}`
  );
}

async function abrirChat(producto) {
  try {
    setCargandoMensajes(true);
    setProductoChat(producto);
    setMensajes([]);
    setMensajeNuevo('');
    setChatAbierto(true);
    setPantalla('chat');

    const chatId = obtenerIdChat(producto);

    const url = `${FIRESTORE_CHATS_URL}/${chatId}?key=${FIREBASE_API_KEY}`;

    const respuesta = await fetch(url);

    if (respuesta.status === 404) {
      setMensajes([]);
      return;
    }

    if (!respuesta.ok) {
      throw new Error(await respuesta.text());
    }

    const datos = await respuesta.json();

    const lista = (
      datos.fields?.mensajes?.arrayValue?.values || []
    ).map((item) => ({
      texto: item.mapValue.fields.texto?.stringValue || '',
      remitente: item.mapValue.fields.remitente?.stringValue || '',
      fecha: item.mapValue.fields.fecha?.stringValue || '',
    }));

    setMensajes(lista);

  } catch (error) {
    console.log('Error abriendo chat:', error);
    Alert.alert('Error', 'No se pudo abrir la conversación.');
    setChatAbierto(false);
    setPantalla('detalle');
  } finally {
    setCargandoMensajes(false);
  }
}

async function enviarMensaje() {
  if (!mensajeNuevo.trim() || !productoChat) {
    return;
  }

  const texto = mensajeNuevo.trim();

  const nuevoMensaje = {
    texto,
    remitente: nombrePerfil,
    fecha: new Date().toISOString(),
  };

  const listaActualizada = [...mensajes, nuevoMensaje];

  try {
    const chatId = obtenerIdChat(productoChat);

    const campos = {
      fields: {
        productoId: {
          stringValue: String(productoChat.id),
        },
        productoNombre: {
          stringValue: productoChat.nombre,
        },
        comprador: {
          stringValue: nombrePerfil,
        },
        vendedor: {
          stringValue: productoChat.vendedor,
        },
        mensajes: {
          arrayValue: {
            values: listaActualizada.map((m) => ({
              mapValue: {
                fields: {
                  texto: { stringValue: m.texto },
                  remitente: { stringValue: m.remitente },
                  fecha: { stringValue: m.fecha },
                },
              },
            })),
          },
        },
      },
    };

    const consulta = await fetch(
      `${FIRESTORE_CHATS_URL}/${chatId}?key=${FIREBASE_API_KEY}`
    );

    let respuesta;

    if (consulta.status === 404) {
      respuesta = await fetch(
        `${FIRESTORE_CHATS_URL}?documentId=${chatId}&key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campos),
        }
      );
    } else if (consulta.ok) {
      respuesta = await fetch(
        `${FIRESTORE_CHATS_URL}/${chatId}?key=${FIREBASE_API_KEY}&updateMask.fieldPaths=mensajes`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campos),
        }
      );
    } else {
      throw new Error(await consulta.text());
    }

    if (!respuesta.ok) {
      throw new Error(await respuesta.text());
    }

    setMensajes(listaActualizada);
    setMensajeNuevo('');

  } catch (error) {
    console.log('Error enviando mensaje:', error);
    Alert.alert('Error', 'No se pudo enviar el mensaje.');
  }
}
async function cargarConversaciones() {
  try {
    setCargandoConversaciones(true);
    const respuesta = await fetch(
      `${FIRESTORE_CHATS_URL}?key=${FIREBASE_API_KEY}`
    );

    if (!respuesta.ok) {
      throw new Error(await respuesta.text());
    }

    const datos = await respuesta.json();

    const lista = (datos.documents || []).map((doc) => {
      const f = doc.fields || {};

      const mensajesChat = (
        f.mensajes?.arrayValue?.values || []
      ).map((item) => ({
        texto: item.mapValue.fields.texto?.stringValue || '',
        remitente: item.mapValue.fields.remitente?.stringValue || '',
        fecha: item.mapValue.fields.fecha?.stringValue || '',
      }));

      return {
        id: doc.name.split('/').pop(),
        producto: {
          id: f.productoId?.stringValue || '',
          nombre: f.productoNombre?.stringValue || '',
          vendedor: f.vendedor?.stringValue || '',
        },
        ultimoMensaje: mensajesChat.length > 0
          ? mensajesChat[mensajesChat.length - 1].texto
          : 'Sin mensajes',
        mensajes: mensajesChat,
      };
    });

    setConversaciones(lista);

  } catch (error) {
  console.log('Error cargando conversaciones:', error);
  Alert.alert('Error', 'No se pudieron cargar las conversaciones.');
} finally {
  setCargandoConversaciones(false);
}
}
// Seleccionar fotografía desde la galería
async function seleccionarImagen() {
  try {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos acceso a tu galería para seleccionar una fotografía.'
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!resultado.canceled) {
      setImagen(resultado.assets[0].uri);
    }
  } catch (error) {
    console.log('Error seleccionando imagen:', error);
    Alert.alert('Error', 'No se pudo seleccionar la fotografía.');
  }
}
  // 4. CREAR PRODUCTO
  async function crearProducto(producto) {
    if (!nombre.trim() || !precio.trim() || Number(precio) <= 0) {
      Alert.alert('Datos incompletos', 'Ingresa un nombre y un precio válido.');
      return;
    }

const nuevo = {
  nombre: nombre.trim(),
  precio: precio.trim(),
  categoria: categoria.trim() || 'General',
  descripcion: descripcion.trim(),
  vendedor: vendedor.trim() || 'Estudiante',
  imagen: imagen || '',
};

    try {
      if (modoFirebase) {
        const respuesta = await fetch(
          `${FIRESTORE_URL}?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(convertirFirestore(nuevo)),
          }
        );
        if (!respuesta.ok) throw new Error(await respuesta.text());
        const resultado = await respuesta.json();
        nuevo.id = resultado.name.split('/').pop();
        setConectado(true);
      } else {
        nuevo.id = Date.now().toString();
      }
await guardarProductoLocal(nuevo);
const total = await contarProductosLocales();
setTotalSQLite(total);
      setProductos((actuales) => [...actuales, nuevo]);
      limpiarFormulario();
      setPantalla('catalogo');
      Alert.alert('Éxito', 'Producto publicado correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el producto en Firestore.');
      console.log(error);
    }
  }

  // 5. EDITAR PRODUCTO
  
async function actualizarProducto() {
  if (!nombre.trim() || !precio.trim() || Number(precio) <= 0) {
    Alert.alert('Datos incompletos', 'Ingresa un nombre y un precio válido.');
    return;
  }

  const actualizado = {
    id: editando,
    nombre: nombre.trim(),
    precio: precio.trim(),
    categoria: categoria.trim() || 'General',
    descripcion: descripcion.trim(),
    vendedor: vendedor.trim() || 'Estudiante',
    imagen: imagen || '',
  };

  try {
    if (modoFirebase) {
      const url = `${FIRESTORE_URL}/${editando}?key=${FIREBASE_API_KEY}&updateMask.fieldPaths=nombre&updateMask.fieldPaths=precio&updateMask.fieldPaths=categoria&updateMask.fieldPaths=descripcion&updateMask.fieldPaths=vendedor&updateMask.fieldPaths=imagen`;

      const respuesta = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(convertirFirestore(actualizado)),
      });

      if (!respuesta.ok) {
        throw new Error(await respuesta.text());
      }
    }

    // Actualizar producto en SQLite
    const resultadoLocal = await actualizarProductoLocal(editando, actualizado);

    // Si no existía en SQLite, guardarlo
    if (resultadoLocal.changes === 0) {
      await guardarProductoLocal(actualizado);
    }

    const total = await contarProductosLocales();
    setTotalSQLite(total);

    setProductos((actuales) =>
      actuales.map((p) => p.id === editando ? actualizado : p)
    );

    limpiarFormulario();
    setPantalla('catalogo');
    Alert.alert('Éxito', 'Producto actualizado.');

  } catch (error) {
    console.log('ERROR AL ACTUALIZAR:', error);
    Alert.alert(
      'Error al actualizar',
      String(error?.message || error)
    );
  }
}


  // 6. ELIMINAR PRODUCTO
  async function eliminarProducto(id) {
    try {
      if (modoFirebase) {
        const respuesta = await fetch(
          `${FIRESTORE_URL}/${id}?key=${FIREBASE_API_KEY}`,
          { method: 'DELETE' }
        );
        if (!respuesta.ok) throw new Error(await respuesta.text());
      }
      // Eliminar también de SQLite
      await eliminarProductoLocal(id);
      const total = await contarProductosLocales();
setTotalSQLite(total);
      setProductos((actuales) => actuales.filter((p) => p.id !== id));
      setFavoritos((actuales) => {
        const nuevaLista = actuales.filter((x) => x !== id);
        AsyncStorage.setItem('campusswap_favoritos', JSON.stringify(nuevaLista));
        return nuevaLista;
      });
      setPantalla('catalogo');
      Alert.alert('Eliminado', 'Producto eliminado correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el producto.');
      console.log(error);
    }
  }

 function prepararEdicion(producto) {
  setEditando(producto.id);
  setNombre(producto.nombre);
  setPrecio(producto.precio);
  setCategoria(producto.categoria);
  setDescripcion(producto.descripcion);
  setVendedor(producto.vendedor);
  setImagen(producto.imagen || null);
  setPantalla('formulario');
}
 function limpiarFormulario() {
  setNombre('');
  setPrecio('');
  setCategoria('');
  setDescripcion('');
  setVendedor(nombrePerfil);
  setEditando(null);
}

  async function cambiarFavorito(id) {
    const nuevaLista = favoritos.includes(id)
      ? favoritos.filter((x) => x !== id)
      : [...favoritos, id];
    await guardarFavoritos(nuevaLista);
  }

  function boton(texto, accion, color = '#173B65') {
    return (
      <TouchableOpacity
        style={[styles.boton, { backgroundColor: color }]}
        onPress={accion}
      >
        <Text style={styles.textoBoton}>{texto}</Text>
      </TouchableOpacity>
    );
  }

const listaVisible = productos.filter((p) => {
  const coincideBusqueda = `${p.nombre} ${p.categoria}`
    .toLowerCase()
    .includes(busqueda.toLowerCase());

  const coincideCategoria =
    categoriaFiltro === 'Todas' ||
    p.categoria.toLowerCase() === categoriaFiltro.toLowerCase();

  if (pantalla === 'favoritos') {
    return coincideBusqueda && coincideCategoria && favoritos.includes(p.id);
  }

  return coincideBusqueda && coincideCategoria;
});
  // 7. INTERFAZ
  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.logo}>CampusSwap</Text>
        <Text style={styles.subtitulo}>
  Productos guardados localmente: {totalSQLite}
</Text>
        <Text style={styles.subtitulo}>Compra, vende e intercambia en tu universidad</Text>
        <Text style={styles.estado}>
          {modoFirebase
            ? conectado ? '● Firestore conectado' : '● Configuración Firebase pendiente o sin conexión'
            : '● Modo demostración local'}
        </Text>
      </View>

      <View style={styles.navegacion}>
        {boton('Catálogo', () => setPantalla('catalogo'))}
        {boton('Favoritos', () => setPantalla('favoritos'), '#456B91')}
        {boton('Publicar +', () => {
          limpiarFormulario();
          setPantalla('formulario');
        }, '#23865B')}
        {boton('Mi perfil', () => setPantalla('perfil'), '#64748B')}
      </View>

      {pantalla === 'catalogo' || pantalla === 'favoritos' ? (
        <ScrollView style={styles.contenido}>
          <TextInput
            style={styles.input}
            placeholder="Buscar producto..."
            value={busqueda}
            onChangeText={setBusqueda}
          />

          <Text style={styles.titulo}>
            {pantalla === 'favoritos' ? 'Mis favoritos' : 'Catálogo de productos'}
          </Text>
                    {pantalla === 'catalogo' && boton(
            'Mis conversaciones',
            () => {
              setPantalla('conversaciones');
              cargarConversaciones();
            },
            '#173B65'
          )}
          <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={{ marginBottom: 15 }}
>
  {['Todas', 'Tecnología', 'Libros', 'Accesorios', 'General'].map((cat) => (
    <TouchableOpacity
      key={cat}
      onPress={() => setCategoriaFiltro(cat)}
      style={{
        backgroundColor: categoriaFiltro === cat ? '#173B65' : '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#173B65',
      }}
    >
      <Text style={{
        color: categoriaFiltro === cat ? '#FFFFFF' : '#173B65',
        fontWeight: 'bold',
      }}>
        {cat}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>

          {cargando && <Text>Cargando productos...</Text>}

          {listaVisible.length === 0 && (
            <Text style={styles.vacio}>No hay productos para mostrar.</Text>
          )}

          
{listaVisible.map((p) => (
  <View key={p.id} style={styles.tarjeta}>

    {p.imagen ? (
      <Image
        source={{ uri: p.imagen }}
        style={{
          width: '100%',
          height: 190,
          borderRadius: 10,
          marginBottom: 12,
        }}
      />
    ) : null}

    <Text style={styles.nombre}>{p.nombre}</Text>

    <Text style={styles.precio}>
      ${Number(p.precio).toLocaleString('es-CO')} COP
    </Text>

    <Text style={styles.detalle}>Categoría: {p.categoria}</Text>
    <Text style={styles.detalle}>Vendedor: {p.vendedor}</Text>

    {boton('Ver detalles', () => {
      setSeleccionado(p);
      setPantalla('detalle');
    })}

    {boton(
      favoritos.includes(p.id) ? '★ Quitar favorito' : '☆ Agregar favorito',
      () => cambiarFavorito(p.id),
      '#C58B23'
    )}

  </View>
))}

          ))}
        </ScrollView>
      ) : null}

      
{pantalla === 'detalle' && seleccionado && (
  <ScrollView style={styles.contenido}>
    <Text style={styles.titulo}>Detalle del producto</Text>

    <View style={styles.tarjeta}>

      {seleccionado.imagen ? (
        <Image
          source={{ uri: seleccionado.imagen }}
          style={{
            width: '100%',
            height: 230,
            borderRadius: 10,
            marginBottom: 12,
          }}
        />
      ) : null}

      <Text style={styles.nombre}>{seleccionado.nombre}</Text>

      <Text style={styles.precio}>
        ${Number(seleccionado.precio).toLocaleString('es-CO')} COP
      </Text>

      <Text style={styles.detalle}>
        Categoría: {seleccionado.categoria}
      </Text>

      <Text style={styles.detalle}>
        Descripción: {seleccionado.descripcion || 'Sin descripción'}
      </Text>

      <Text style={styles.detalle}>
        Vendedor: {seleccionado.vendedor}
      </Text>
      {boton(
  'Contactar vendedor',
  () => abrirChat(seleccionado),
  '#173B65'
)}

      {boton('Editar producto', () => prepararEdicion(seleccionado))}

      {boton('Eliminar producto', () => eliminarProducto(seleccionado.id), '#B83232')}

      {boton('Volver al catálogo', () => setPantalla('catalogo'), '#64748B')}

    </View>
  </ScrollView>
)}

{pantalla === 'chat' && (
  <View style={styles.contenido}>
    <Text style={styles.titulo}>Conversación</Text>

{productoChat && (
  <Text style={styles.detalle}>
    Producto: {productoChat.nombre}
  </Text>
)}
    {boton(
  'Actualizar mensajes',
  () => abrirChat(productoChat),
  '#64748B'
)}

    {productoChat && (
      <View style={styles.tarjeta}>
        <Text style={styles.nombre}>
          {productoChat.nombre}
        </Text>

        <Text style={styles.detalle}>
          Vendedor: {productoChat.vendedor}
        </Text>

        <ScrollView style={{ height: 350 }}>
          {cargandoMensajes ? (
            <Text style={styles.detalle}>
              Cargando mensajes...
            </Text>
          ) : mensajes.length === 0 ? (
            <Text style={styles.detalle}>
              Todavía no hay mensajes. ¡Inicia la conversación!
            </Text>
          ) : (
            mensajes.map((m, index) => (
              <View
                key={index}
                style={{
                  alignSelf:
                    m.remitente === nombrePerfil
                      ? 'flex-end'
                      : 'flex-start',
                  backgroundColor:
                    m.remitente === nombrePerfil
                      ? '#DCEBFA'
                      : '#EAEAEA',
                  padding: 12,
                  borderRadius: 12,
                  marginVertical: 5,
                  maxWidth: '85%',
                }}
              >
               <Text style={{ fontWeight: 'bold' }}>
  {m.remitente === nombrePerfil
    ? 'Tú'
    : m.remitente}
</Text>

                <Text>{m.texto}</Text>
                <Text
  style={{
    fontSize: 10,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 4,
  }}
>
  {m.fecha
    ? new Date(m.fecha).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''}
</Text>
              </View>
            ))
          )}
        </ScrollView>

        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={mensajeNuevo}
          onChangeText={setMensajeNuevo}
        />

        {boton('Enviar mensaje', enviarMensaje, '#173B65')}

        {boton(
          'Volver al producto',
          () => {
            setChatAbierto(false);
            setPantalla('detalle');
          },
          '#64748B'
        )}
      </View>
    )}
  </View>
)}
{pantalla === 'conversaciones' && (
  <ScrollView style={styles.contenido}>
    <Text style={styles.titulo}>Mis conversaciones</Text>
    {boton(
  'Actualizar conversaciones',
  cargarConversaciones,
  '#64748B'
)}
{cargandoConversaciones && (
  <Text style={styles.detalle}>
    Actualizando conversaciones...
  </Text>
)}
    {conversaciones.length === 0 ? (
      <Text style={styles.vacio}>
        Todavía no tienes conversaciones.
      </Text>
    ) : (
      conversaciones.map((c) => (
        <View key={c.id} style={styles.tarjeta}>
          <Text style={styles.nombre}>
            {c.producto.nombre}
          </Text>

          <Text style={styles.detalle}>
            Vendedor: {c.producto.vendedor}
          </Text>

          <Text style={styles.detalle}>
            Último mensaje: {c.ultimoMensaje}
          </Text>
          <Text style={styles.detalle}>
  Mensajes: {c.mensajes.length}
</Text>

          {boton(
            'Abrir conversación',
            () => abrirChat(c.producto),
            '#173B65'
          )}
        </View>
      ))
    )}

    {boton(
      'Volver al catálogo',
      () => setPantalla('catalogo'),
      '#64748B'
    )}
  </ScrollView>
)}
{pantalla === 'perfil' && (
  <ScrollView style={styles.contenido}>
    <Text style={styles.titulo}>Mi perfil</Text>

    <View style={styles.tarjeta}>
      <View style={{
        width: 85,
        height: 85,
        borderRadius: 50,
        backgroundColor: '#173B65',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 15,
      }}>
       <Text style={{
  color: '#FFFFFF',
  fontSize: 32,
  fontWeight: 'bold',
}}>
  {nombrePerfil
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(palabra => palabra[0].toUpperCase())
    .join('')}
</Text>
      </View>

      <Text style={{
        fontSize: 22,
        fontWeight: 'bold',
        color: '#173B65',
        textAlign: 'center',
      }}>
       {nombrePerfil}
      </Text>

      <Text style={{
        color: '#64748B',
        textAlign: 'center',
        marginTop: 5,
      }}>
        Estudiante universitario
      </Text>

      <View style={{
        backgroundColor: '#F2F5F9',
        borderRadius: 10,
        padding: 15,
        marginTop: 20,
      }}>
        <Text style={styles.detalle}>
          Programa: {programaPerfil}
        </Text>
        <Text style={styles.detalle}>
          Aplicación: CampusSwap
        </Text>
        <Text style={styles.detalle}>
          Productos publicados: {
            productos.filter(p => (p.vendedor === nombrePerfil || p.vendedor === 'Víctor Cruz')).length
          }
        </Text>
      </View>
      {editandoPerfil ? (
  <View>
    <TextInput
      style={styles.input}
      placeholder="Nombre del estudiante"
      value={nombrePerfil}
      onChangeText={setNombrePerfil}
    />

    <TextInput
      style={styles.input}
      placeholder="Programa académico"
      value={programaPerfil}
      onChangeText={setProgramaPerfil}
    />

    {boton('Guardar perfil', guardarPerfil, '#23865B')}
    {boton('Cancelar', () => setEditandoPerfil(false), '#64748B')}
  </View>
) : (
  boton('Editar mi perfil', () => setEditandoPerfil(true))
)}
    </View>

    <Text style={styles.titulo}>Mis publicaciones</Text>

    {productos.filter(p => (p.vendedor === nombrePerfil || p.vendedor === 'Víctor Cruz')).length === 0 ? (
      <Text style={styles.vacio}>
        Todavía no tienes productos publicados.
      </Text>
    ) : (
      productos
        .filter(p => (p.vendedor === nombrePerfil || p.vendedor === 'Víctor Cruz'))
        .map(p => (
          <View key={p.id} style={styles.tarjeta}>
            <Text style={styles.nombre}>{p.nombre}</Text>
            <Text style={styles.precio}>
              ${Number(p.precio).toLocaleString('es-CO')} COP
            </Text>
            <Text style={styles.detalle}>
              Categoría: {p.categoria}
            </Text>
            {boton('Ver producto', () => {
              setSeleccionado(p);
              setPantalla('detalle');
            })}
          </View>
        ))
    )}

    {boton('Volver al catálogo', () => setPantalla('catalogo'), '#64748B')}
  </ScrollView>
)}

      {pantalla === 'formulario' && (
        <ScrollView style={styles.contenido}>
          <Text style={styles.titulo}>
            {editando ? 'Editar producto' : 'Publicar producto'}
          </Text>

          <TextInput style={styles.input} placeholder="Nombre del producto"
            value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder="Precio en pesos colombianos"
            value={precio} onChangeText={setPrecio} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Categoría"
            value={categoria} onChangeText={setCategoria} />
          <TextInput style={styles.input} placeholder="Descripción"
            value={descripcion} onChangeText={setDescripcion} multiline />
            {boton('Seleccionar fotografía', seleccionarImagen, '#456B91')}

{imagen && (
  <View style={styles.tarjeta}>
    <Text style={styles.detalle}>Vista previa de la fotografía:</Text>

    <Image
      source={{ uri: imagen }}
      style={{
        width: '100%',
        height: 220,
        borderRadius: 10,
        resizeMode: 'cover',
      }}
    />

    {boton('Quitar fotografía', () => setImagen(null), '#B83232')}
  </View>
)}
          <TextInput style={styles.input} placeholder="Nombre del vendedor"
            value={vendedor} onChangeText={setVendedor} />

          {boton(editando ? 'Guardar cambios' : 'Publicar producto',
            editando ? actualizarProducto : crearProducto, '#23865B')}
          {boton('Cancelar', () => {
            limpiarFormulario();
            setPantalla('catalogo');
          }, '#64748B')}
        </ScrollView>
      )}
    </View>
  );
}

// 8. ESTILOS
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F2F5F9',
  },
  encabezado: {
    backgroundColor: '#173B65',
    padding: 22,
    paddingTop: 38,
  },
  logo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitulo: {
    color: '#E2EAF4',
    marginTop: 5,
    fontSize: 13,
  },
  estado: {
    color: '#B8E6C9',
    fontSize: 12,
    marginTop: 10,
  },
  navegacion: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 7,
    backgroundColor: '#FFFFFF',
  },
  contenido: {
    flex: 1,
    padding: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#173B65',
    marginBottom: 15,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E1E7EF',
  },
  nombre: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#173B65',
    marginBottom: 7,
  },
  precio: {
    color: '#23865B',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  detalle: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 9,
    padding: 13,
    marginBottom: 12,
    fontSize: 15,
    minWidth: 0,
  },
  boton: {
    padding: 11,
    borderRadius: 8,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  vacio: {
    textAlign: 'center',
    color: '#64748B',
    padding: 25,
  },
});
