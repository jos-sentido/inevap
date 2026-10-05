# Wireframe y Estructura - Landing Page INEVAP

## Layout General

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER                               │
│  [LOGO INEVAP]    [MENU]    [WHATSAPP] [INSCRÍBETE]       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     HERO SECTION                           │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │                 │  │  OBTÉN TU LICENCIATURA         │   │
│  │   IMAGEN HERO   │  │  EN SOLO 2 EXÁMENES            │   │
│  │   (Graduados)   │  │                                 │   │
│  │                 │  │  ✓ 98% Aprobación               │   │
│  │                 │  │  ✓ Validez Oficial SEP          │   │
│  │                 │  │  ✓ Sin dejar de trabajar        │   │
│  │                 │  │                                 │   │
│  │                 │  │  [FORMULARIO PRINCIPAL]         │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  PROBLEMA/SOLUCIÓN                         │
│  ¿Tienes experiencia pero te falta el título?              │
│  INEVAP reconoce tu experiencia profesional                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   PROCESO (4 PASOS)                        │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                       │
│  │  1  │  │  2  │  │  3  │  │  4  │                       │
│  │ELIGE│  │PREP.│  │EXAM.│  │TÍTULO│                      │
│  └─────┘  └─────┘  └─────┘  └─────┘                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   LICENCIATURAS                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │Administración│ │ Contaduría  │ │   Derecho   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │Mercadotecnia│ │  Pedagogía  │ │ Ing. Indust.│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    VENTAJAS                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │98% Aprobación│ │ Flexibilidad│ │Validez Oficial│         │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   TESTIMONIOS                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │[FOTO] JUAN  │ │[FOTO] MARÍA │ │[FOTO] CARLOS│           │
│  │"Excelente..." │ │"Recomiendo..."│ │"Cambió mi..."│         │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                FORMULARIO SECUNDARIO                       │
│  "Solicita Información Sin Compromiso"                     │
│  [CAMPOS DEL FORMULARIO]                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        FAQ                                 │
│  ▼ ¿Qué es el Acuerdo 286?                                │
│  ▼ ¿Cuánto tiempo toma el proceso?                        │
│  ▼ ¿Qué validez tiene mi título?                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     CONTACTO                               │
│  WhatsApp: 33 3949 8607                                   │
│  Sedes: Guadalajara, Cancún, Tijuana, Monterrey           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      FOOTER                                │
│  Links legales | Redes sociales | Copyright                │
└─────────────────────────────────────────────────────────────┘
```

## Especificaciones de Diseño

### Responsive Breakpoints
- **Mobile:** 320px - 768px
- **Tablet:** 768px - 1024px
- **Desktop:** 1024px+

### Secciones Principales

#### 1. Header (Sticky)
- **Altura:** 80px
- **Fondo:** Blanco con sombra sutil
- **Logo:** Lado izquierdo
- **Menú:** Centro (desktop) / Hamburger (mobile)
- **CTAs:** Lado derecho

#### 2. Hero Section
- **Altura:** 100vh (desktop) / auto (mobile)
- **Layout:** 50/50 imagen/contenido (desktop) / stack (mobile)
- **Fondo:** Gradiente azul con imagen
- **CTA Principal:** Formulario integrado

#### 3. Secciones de Contenido
- **Padding:** 80px vertical, 20px horizontal
- **Max-width:** 1200px centrado
- **Espaciado:** 40px entre elementos

#### 4. Formularios
- **Estilo:** Cards con sombra
- **Campos:** Input con labels flotantes
- **Validación:** En tiempo real
- **CTAs:** Botones prominentes

### Interacciones y Animaciones

#### Hover States
- **Botones:** Cambio de color y elevación
- **Cards:** Sombra más pronunciada
- **Links:** Subrayado animado

#### Scroll Animations
- **Fade in:** Elementos aparecen al hacer scroll
- **Slide up:** Secciones se deslizan hacia arriba
- **Counter:** Números animados (98% aprobación)

#### Micro-interactions
- **Form focus:** Campos se destacan al enfocar
- **Loading states:** Spinners en envío de formularios
- **Success states:** Checkmarks animados

### Elementos de Confianza

#### Badges y Certificaciones
- **Logo SEP:** Prominente en header y footer
- **Logo UNIVER:** En sección de credenciales
- **Acuerdo 286:** Referencia oficial

#### Social Proof
- **Testimonios:** Con fotos reales
- **Estadísticas:** 98% aprobación destacado
- **Casos de éxito:** Historias específicas

### Optimización para Conversión

#### CTAs Principales
- **Color:** Verde (#10B981) para acción
- **Texto:** Claro y directo
- **Posición:** Above the fold y repetidos

#### Formularios
- **Campos mínimos:** Solo información esencial
- **Validación:** Feedback inmediato
- **Privacidad:** Mensaje de protección de datos

#### Urgencia
- **Fechas límite:** Próximas convocatorias
- **Cupos limitados:** Escasez artificial
- **Ofertas:** Descuentos por tiempo limitado

