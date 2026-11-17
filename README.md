# CampusSwap

## Descripción del proyecto

CampusSwap es una aplicación móvil desarrollada para facilitar la compra, venta e intercambio de productos entre estudiantes universitarios.

El proyecto busca ofrecer un espacio organizado donde los estudiantes puedan publicar productos, consultar artículos disponibles y comunicarse con los vendedores.

## Funcionalidades

- Catálogo de productos con búsqueda y filtros por categoría.
- Visualización de detalles, precios e imágenes.
- Publicación, edición y eliminación de productos.
- Gestión de productos favoritos.
- Perfil de usuario editable.
- Chat para contactar vendedores.
- Lista de conversaciones y consulta de mensajes.
- Almacenamiento de información mediante Firebase Firestore y SQLite.

## Tecnologías utilizadas

- React Native
- Expo Snack
- JavaScript
- Firebase Firestore mediante API REST
- SQLite (expo-sqlite)
- AsyncStorage
- Expo Image Picker

## Arquitectura de datos

**SQLite:** almacenamiento local de información de productos.

**AsyncStorage:** almacenamiento de preferencias y favoritos del usuario.

**Firebase Firestore:** almacenamiento en la nube de productos y conversaciones. La aplicación consulta los cambios mediante solicitudes REST y permite actualizar manualmente las conversaciones.

## Ejecución del proyecto

El proyecto fue desarrollado y probado utilizando Expo Snack y Expo Go.

Para ejecutarlo, se requiere configurar las dependencias y los datos de conexión con Firebase. La versión funcional se encuentra en el proyecto original de Expo Snack.

## Limitaciones y mejoras futuras

- Implementar autenticación de usuarios.
- Configurar reglas de seguridad para producción.
- Incorporar sincronización automática de mensajes.
- Almacenar imágenes en Firebase Storage.
- Preparar la aplicación para su publicación.

## Información académica

**Proyecto:** CampusSwap  
**Asignatura:** Programación de Aplicaciones Móviles  
**Programa:** Ingeniería de Sistemas  
**Estudiante:** Víctor Cruz
