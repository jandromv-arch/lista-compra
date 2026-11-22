# Lista & Recetas

PWA de lista de la compra compartida + recetario con cantidades y menú semanal.

- Sin login: se comparte por enlace (cada hogar tiene un código en la URL, `#h=...`).
- Tiempo real y offline (Firebase Firestore).
- Recetas con gramos y macros (kcal/proteína), menú semanal y "generar lo que falta".
- Quién añade y quién compra cada producto; enviar la lista por WhatsApp.

## Configurar
Pega tu `firebaseConfig` en `index.html` (bloque `FIREBASE_CONFIG`). En Firebase:
Firestore Database (producción, `eur3`) + Authentication → Anónimo. Reglas en `firestore.rules`.
