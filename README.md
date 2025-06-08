# Tutaviendo - WhatsApp Catalog Platform

Una plataforma moderna para crear catálogos profesionales de WhatsApp. Permite a los usuarios crear tiendas online, gestionar productos y generar catálogos optimizados para compartir por WhatsApp.

## 🚀 Características Principales

### 🏪 Gestión de Tiendas
- **Múltiples tiendas** según el plan del usuario
- **Personalización completa** de diseño y colores
- **URLs amigables** para cada tienda
- **Configuración de pagos y envíos**

### 📦 Gestión de Productos
- **Productos ilimitados** (según plan)
- **Categorías organizadas**
- **Galería de imágenes**
- **Productos destacados**
- **Estados activo/inactivo**

### 🎨 Personalización Avanzada
- **6 paletas de colores predefinidas**
- **Modo claro/oscuro**
- **Tipografías personalizables**
- **Bordes redondeados ajustables**
- **Responsive design**

### 📱 Integración WhatsApp
- **Generación automática de mensajes**
- **Plantillas personalizables**
- **Carrito de compras integrado**
- **Información de contacto y entrega**

### 📊 Analíticas
- **Seguimiento de visitas**
- **Métricas de pedidos**
- **Valor total de ventas**
- **Filtros por fecha** (planes premium)

### 👥 Planes de Usuario
- **Gratuito**: 1 tienda, 10 productos
- **Emprendedor**: 2 tiendas, 30 productos
- **Profesional**: 5 tiendas, 50 productos

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **React Router** para navegación
- **Context API** para estado global

### Backend
- **Supabase** como BaaS
- **PostgreSQL** como base de datos
- **Row Level Security (RLS)**
- **Autenticación integrada**

### Herramientas de Desarrollo
- **Vite** como bundler
- **ESLint** para linting
- **TypeScript** para tipado estático

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/           # Componentes React
│   ├── auth/            # Autenticación
│   ├── catalog/         # Catálogo público
│   ├── dashboard/       # Panel de control
│   ├── layout/          # Layouts y navegación
│   ├── products/        # Gestión de productos
│   ├── settings/        # Configuraciones
│   └── ui/              # Componentes UI reutilizables
├── contexts/            # Context providers
├── lib/                 # Configuraciones de librerías
├── utils/               # Utilidades y helpers
└── types/               # Definiciones de tipos
```

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase

### Configuración

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/tutaviendo.git
cd tutaviendo
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

### Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run lint` - Ejecutar ESLint

## 🗄️ Esquema de Base de Datos

### Tablas Principales

- **users** - Información de usuarios y suscripciones
- **stores** - Configuración de tiendas
- **products** - Productos de cada tienda
- **categories** - Categorías de productos
- **analytics_events** - Eventos de analíticas
- **user_preferences** - Preferencias de usuario

### Tipos Enum

- **user_plan**: `gratuito`, `emprendedor`, `profesional`
- **subscription_status**: `active`, `canceled`, `expired`
- **analytics_event_type**: `visit`, `order`, `product_view`
- **theme_mode**: `light`, `dark`, `system`

## 🔐 Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- **Políticas de acceso** granulares por usuario
- **Autenticación segura** con Supabase Auth
- **Validación de datos** en frontend y backend

## 📱 Funcionalidades Móviles

- **Diseño responsive** para todos los dispositivos
- **Navegación móvil** optimizada
- **Catálogos móviles** nativos
- **Integración WhatsApp** directa

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] Integración con pasarelas de pago
- [ ] Exportación de catálogos PDF
- [ ] API pública para integraciones
- [ ] Aplicación móvil nativa
- [ ] Marketplace de plantillas

### Mejoras Técnicas
- [ ] Tests automatizados
- [ ] CI/CD pipeline
- [ ] Optimización de performance
- [ ] PWA capabilities

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: soporte@tutaviendo.com
- **Documentación**: [docs.tutaviendo.com](https://docs.tutaviendo.com)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/tutaviendo/issues)

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) por el backend
- [Tailwind CSS](https://tailwindcss.com) por los estilos
- [Lucide](https://lucide.dev) por los iconos
- [React](https://reactjs.org) por el framework

---

**Hecho con ❤️ para emprendedores que quieren vender más por WhatsApp**
