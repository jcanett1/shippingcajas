
## Sistema de Autenticación y Roles

- [ ] Crear tabla `app_users` en Supabase con campos: id, username, password_hash, full_name, role (admin/supervisor/shipping), created_at, updated_at
- [ ] Crear usuario admin inicial en Supabase
- [ ] Página de Login: formulario username + password con validación
- [ ] Context de autenticación (AuthContext) con estado global del usuario
- [ ] Protección de rutas: redirigir a login si no hay sesión
- [ ] Página de gestión de usuarios (Admin y Supervisor)
  - [ ] Admin: ver todos los usuarios, ver contraseñas, agregar, editar, eliminar
  - [ ] Supervisor: ver todos los usuarios, agregar solo perfil shipping, no editar ni eliminar
  - [ ] Shipping: ver lista de usuarios (solo nombres), editar su propio perfil
- [ ] Navbar con info del usuario logueado y botón de logout
- [ ] Permisos en registros de envíos:
  - [ ] Admin: ver todos, editar todos, eliminar todos
  - [ ] Supervisor: ver todos, editar todos, eliminar todos
  - [ ] Shipping: ver todos, editar sus propios registros, NO eliminar
- [ ] Asociar campo `created_by` en tabla shipments al usuario que lo creó

## Login con Email y Nombre de Usuario

- [x] Agregar columna `email` a la tabla `app_users` en Supabase
- [x] Actualizar AuthContext: login acepta username O email
- [x] Actualizar página Login: placeholder indica que acepta usuario o correo
- [x] Actualizar formulario de usuarios: agregar campo EMAIL
- [x] Mostrar email en las tarjetas de usuario

## Campo DESTINATION en Envíos

- [x] Agregar columna `destination` al tipo Shipment en supabase.ts
- [x] Agregar selector DESTINATION en formulario de nuevo envío (obligatorio)
- [x] Validar que DESTINATION esté seleccionado antes de guardar
- [x] Agregar columna DESTINATION en tabla del historial de envíos
- [x] Actualizar modal de edición de envío con campo DESTINATION

## Dropdown de Usuario y Selector de Tema
- [x] Dropdown al hacer clic en el área del usuario en el header
- [x] Opción "Editar Perfil": modal para cambiar nombre y contraseña
- [x] Selector de tema Dark/Light en el dropdown
- [x] Persistir preferencia de tema en localStorage

## Imágenes de Fondo en Login
- [x] Convertir 5 imágenes WebP a JPG optimizado
- [x] Subir imágenes a la carpeta public/images del repositorio
- [x] Carrusel automático de imágenes en el fondo del Login
- [x] Overlay oscuro semitransparente para legibilidad del formulario
- [x] Transición suave entre imágenes (fade)

## Función "Revisado" en Historial de Envíos

- [ ] Agregar campo `reviewed` (boolean) a la tabla `shipments` en Supabase
- [ ] Actualizar tipo Shipment en supabase.ts con campo `reviewed`
- [ ] Agregar botón "Revisado" en acciones del historial, visible solo para admin/supervisor
- [ ] Al marcar revisado, la fila del historial se resalta en verde
