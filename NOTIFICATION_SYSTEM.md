# Sistema de Notificaciones - Ebenezer Tireshop

## Características Principales

### 1. Notificaciones Reactivas en Tiempo Real
- Las notificaciones se actualizan automáticamente sin necesidad de recargar la página
- Los toggles funcionan correctamente y persisten el estado

### 2. Persistencia por Usuario
- Cada usuario tiene sus propias notificaciones guardadas en `localStorage` usando su ID único
- Las notificaciones leídas se mantienen leídas entre sesiones
- Las preferencias (sonido, notificaciones push, notificaciones del navegador) se guardan por usuario

### 3. Notificaciones Proactivas por Rol

#### Administrador (Admin)
- ✅ Inventario bajo (cuando stock < 4 unidades)
- ✅ Nuevas citas reservadas
- ✅ Cambios de estado de citas
- ✅ Servicios completados
- ✅ Alertas del sistema

#### Gerente (Manager)
- ✅ Inventario bajo
- ✅ Nuevas citas reservadas
- ✅ Cambios de estado de citas
- ✅ Servicios completados

#### Empleado (Employee)
- ✅ Nuevas citas reservadas
- ✅ Cambios de estado de citas
- ✅ Servicios completados

### 4. Verificaciones Automáticas
- El sistema verifica el inventario cada 5 minutos
- El sistema verifica citas pendientes cada 5 minutos
- Las notificaciones se muestran automáticamente sin necesidad de entrar a páginas específicas

### 5. Tres Tipos de Notificaciones

#### Notificaciones en la App
- Dropdown en el header con lista de notificaciones
- Contador de notificaciones no leídas
- Colores por prioridad (Urgent, High, Medium, Low)

#### Notificaciones de Sonido
- Sonidos diferenciados por prioridad usando Web Audio API
- Se puede activar/desactivar independientemente

#### Notificaciones del Navegador (Browser Push)
- "Cartelitos" que aparecen aunque la página esté en segundo plano
- Solicita permiso del navegador
- Se puede activar/desactivar independientemente
- Funciona en escritorio, móvil y tablet

### 6. Controles de Usuario

Desde el dropdown de notificaciones puedes:
- ✅ Activar/desactivar todas las notificaciones
- ✅ Activar/desactivar el sonido
- ✅ Activar/desactivar las notificaciones del navegador
- ✅ Marcar notificaciones individuales como leídas
- ✅ Marcar todas las notificaciones como leídas
- ✅ Eliminar notificaciones individuales
- ✅ Eliminar todas las notificaciones

### 7. Responsive Design
- Funciona perfectamente en escritorio (1920px+)
- Optimizado para tablets (768px - 1024px)
- Totalmente funcional en móviles (320px+)
- El dropdown se adapta al tamaño de la pantalla

## Cómo Usar

### Activar Notificaciones del Navegador
1. Haz clic en el ícono de campana en el header
2. Activa "Notificaciones del navegador"
3. Acepta el permiso cuando el navegador lo solicite
4. Ahora recibirás notificaciones aunque la página esté cerrada

### Ver Notificaciones
- El número rojo en la campana indica notificaciones no leídas
- Haz clic en la campana para ver todas las notificaciones
- Haz clic en una notificación para ir a la página relacionada

### Gestionar Notificaciones
- Marca como leída: botón de check verde
- Eliminar: botón de basura rojo
- Las notificaciones desaparecen automáticamente después de ser procesadas

## Eventos que Generan Notificaciones

### Inventario
- Cuando el stock cae por debajo de 4 unidades
- Se verifica automáticamente cada 5 minutos
- Se genera cuando reduces el stock manualmente

### Citas
- Cuando se reserva una nueva cita
- Cuando cambia el estado de una cita (pending → confirmed → in-progress → completed)
- Cuando hay citas pendientes que requieren atención

### Servicios
- Cuando se completa un servicio
- Alertas del sistema según sea necesario

## Soporte Técnico

### Navegadores Soportados
- ✅ Chrome/Edge (escritorio y móvil)
- ✅ Firefox (escritorio y móvil)
- ✅ Safari (escritorio y móvil)
- ✅ Opera

### Dispositivos Soportados
- ✅ Escritorio (Windows, Mac, Linux)
- ✅ Tablets (iPad, Android tablets)
- ✅ Móviles (iPhone, Android)

### Solución de Problemas

**Las notificaciones del navegador no funcionan:**
- Verifica que hayas dado permiso en la configuración del navegador
- En Chrome: Settings → Privacy and Security → Site Settings → Notifications
- En Firefox: Preferences → Privacy & Security → Permissions → Notifications

**El sonido no funciona:**
- Verifica que las notificaciones estén activadas
- Verifica que el sonido esté activado
- Asegúrate de que el volumen del dispositivo esté encendido

**Las notificaciones no persisten:**
- No uses modo incógnito/privado
- Asegúrate de que localStorage esté habilitado en tu navegador
```

```tsx file="" isHidden
