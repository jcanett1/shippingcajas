
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
