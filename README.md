# INEVAP — Instituto de Evaluación y Acreditación Profesional

Repositorio de trabajo para INEVAP: landing page, estrategia de contenido y
material de investigación para la captación de leads de titulación por
**Acuerdo 286 de la SEP**.

> Proyecto gestionado por **Sentido Branding & Advertising**.

---

## ¿Qué es INEVAP?

INEVAP acredita **licenciaturas e ingenierías por el Acuerdo 286 de la SEP**:
permite a personas con experiencia laboral obtener un título universitario
oficial sin cursar la carrera completa.

- **Sitio:** inevap.com
- **Propuesta de valor:** "Obtén tu título universitario en 2 exámenes"
- **Aval:** Acreditado por la SEP (Acuerdo 286), avalado por UNIVER de Veracruz
- **Tasa de aprobación destacada:** 98%
- **Tiempo del proceso:** ~6 meses promedio
- **WhatsApp:** 33 3949 8607
- **Sedes:** Guadalajara, Cancún, Tijuana, Monterrey

### Público objetivo
Profesionales con experiencia laboral comprobable, autodidactas y personas que
dejaron una licenciatura trunca y necesitan certificar sus conocimientos sin
dejar de trabajar.

### El proceso (Acuerdo 286)
1. Elige perfil educativo e institución evaluadora
2. Inscripción y validación de experiencia
3. Asesorías personalizadas
4. **Examen escrito** (opción múltiple) — fines de semana
5. **Examen oral** (caso práctico ante sinodales)
6. Título profesional con validez oficial nacional

### Carreras disponibles (9)
Administración · Comercio y Negocios Internacionales · Contaduría · Derecho ·
Pedagogía · Mercadotecnia · Educación Preescolar · Ingeniería Industrial ·
Ingeniería Computacional

---

## Estructura del repositorio

```
.
├── INEVAP Landing page/      # Landing en React (Vite + Tailwind + shadcn/ui)
│   ├── App.jsx / App.css     # Componente y estilos principales
│   ├── index.html
│   └── *.md                  # Investigación, wireframe, estructura, guías
├── inevap docs/              # Material de referencia del cliente (ver nota)
└── inevap docs 2/            # Material adicional de referencia (ver nota)
```

### Nota sobre archivos de referencia
Los PDFs pesados y ZIPs (brochures, temarios, sesiones informativas, proceso de
ventas) **no se versionan en git** (ver `.gitignore`) por su tamaño —
GitHub rechaza archivos de más de 100MB. Se conservan en el almacenamiento del
proyecto (Drive/Dropbox) y en local.

---

## Identidad visual

| Elemento | Valor |
|----------|-------|
| Azul institucional | `#1E3A8A` |
| Dorado / Amarillo | `#F59E0B` |
| Verde validación | `#10B981` |
| Gris oscuro | `#374151` |
| Tipografía títulos | Montserrat Bold |
| Tipografía texto | Open Sans Regular |

---

## Mensajes clave (marketing)

- "Concluye la licenciatura y la preparatoria a través del Acuerdo 286 SEP"
- "Muchos tienen el título, pocos tienen tu experiencia"
- "No dejas de trabajar: titulación por experiencia"
- "El 98% de nuestros alumnos aprueba los exámenes"

---

## Stack de la landing

React 18 · Vite · Tailwind CSS · shadcn/ui · Lucide Icons
