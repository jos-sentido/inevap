import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  CheckCircle, 
  GraduationCap, 
  Award, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  Star,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import './App.css'

// Import images
import graduadosCelebrando from './assets/graduados_celebrando.jpg'
import graduadoIndividual from './assets/graduado_individual.jpg'
import profesionalOficina from './assets/profesional_oficina.jpg'
import profesionalMujer from './assets/profesional_mujer.jpg'
import profesionalHombre from './assets/profesional_hombre.jpg'
import logoSep from './assets/logo_sep.png'
import logoInevap from './assets/logo_inevap.png'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    licenciatura: '',
    ciudad: '',
    experiencia: '',
    conociste: '',
    comentarios: ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Aquí se enviaría el formulario
    console.log('Formulario enviado:', formData)
    alert('¡Gracias por tu interés! Te contactaremos pronto.')
  }

  const licenciaturas = [
    'Licenciatura en Administración',
    'Licenciatura en Comercio y Negocios Internacionales',
    'Licenciatura en Contaduría',
    'Licenciatura en Derecho',
    'Licenciatura en Pedagogía',
    'Licenciatura en Mercadotecnia',
    'Licenciatura en Educación Preescolar',
    'Ingeniería Industrial',
    'Ingeniería Computacional'
  ]

  const ciudades = ['Guadalajara', 'Cancún', 'Tijuana', 'Monterrey']

  const testimonios = [
    {
      nombre: "Juan Carlos Pérez",
      licenciatura: "Administración",
      testimonio: "Gracias a INEVAP pude obtener mi título sin dejar de trabajar. El proceso fue rápido y profesional.",
      rating: 5
    },
    {
      nombre: "María González",
      licenciatura: "Contaduría",
      testimonio: "Excelente institución. Los exámenes fueron justos y el apoyo constante. 100% recomendado.",
      rating: 5
    },
    {
      nombre: "Carlos Rodríguez",
      licenciatura: "Derecho",
      testimonio: "Cambió mi vida profesional. Ahora tengo mejores oportunidades laborales.",
      rating: 5
    }
  ]

  const faqs = [
    {
      pregunta: "¿Qué es el Acuerdo 286?",
      respuesta: "Es un acuerdo de la SEP que permite acreditar conocimientos adquiridos por experiencia laboral o de forma autodidacta, otorgando títulos con validez oficial."
    },
    {
      pregunta: "¿Cuánto tiempo toma el proceso?",
      respuesta: "El proceso completo puede tomar entre 2-4 meses, dependiendo de las fechas de examen y la preparación del candidato."
    },
    {
      pregunta: "¿Qué validez tiene mi título?",
      respuesta: "El título tiene validez oficial en toda la República Mexicana, avalado por la SEP y reconocido por instituciones públicas y privadas."
    },
    {
      pregunta: "¿Necesito experiencia específica?",
      respuesta: "Sí, se requiere experiencia laboral relacionada con el área de estudio de al menos 3-5 años."
    },
    {
      pregunta: "¿Dónde se presentan los exámenes?",
      respuesta: "Los exámenes se presentan en nuestras sedes de Guadalajara, Cancún, Tijuana y Monterrey, en fines de semana."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={logoInevap} alt="INEVAP" className="h-12 w-auto" />
            </div>
            
            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-gray-700 hover:text-blue-600 transition-colors">Inicio</a>
              <a href="#licenciaturas" className="text-gray-700 hover:text-blue-600 transition-colors">Licenciaturas</a>
              <a href="#proceso" className="text-gray-700 hover:text-blue-600 transition-colors">Proceso</a>
              <a href="#testimonios" className="text-gray-700 hover:text-blue-600 transition-colors">Testimonios</a>
              <a href="#contacto" className="text-gray-700 hover:text-blue-600 transition-colors">Contacto</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <a href="https://wa.me/523339498607" className="flex items-center space-x-2 text-green-600 hover:text-green-700">
                <Phone className="h-4 w-4" />
                <span>33 3949 8607</span>
              </a>
              <Button className="bg-green-600 hover:bg-green-700">
                ¡Inscríbete!
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t">
              <nav className="flex flex-col space-y-4 mt-4">
                <a href="#inicio" className="text-gray-700 hover:text-blue-600">Inicio</a>
                <a href="#licenciaturas" className="text-gray-700 hover:text-blue-600">Licenciaturas</a>
                <a href="#proceso" className="text-gray-700 hover:text-blue-600">Proceso</a>
                <a href="#testimonios" className="text-gray-700 hover:text-blue-600">Testimonios</a>
                <a href="#contacto" className="text-gray-700 hover:text-blue-600">Contacto</a>
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <a href="https://wa.me/523339498607" className="flex items-center space-x-2 text-green-600">
                    <Phone className="h-4 w-4" />
                    <span>33 3949 8607</span>
                  </a>
                  <Button className="bg-green-600 hover:bg-green-700 w-full">
                    ¡Inscríbete!
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <div className="absolute inset-0 bg-black/40"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${graduadosCelebrando})` }}
        ></div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-8">
              <div className="space-y-4">
                <Badge className="bg-yellow-500 text-black font-semibold">
                  98% de Aprobación
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Obtén tu <span className="text-yellow-400">Licenciatura</span> en Solo <span className="text-yellow-400">2 Exámenes</span>
                </h1>
                <p className="text-xl md:text-2xl text-blue-100">
                  Titulación por experiencia laboral con validez oficial SEP
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <span>Avalado por UNIVER de Veracruz</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <span>Acreditado por la SEP</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <span>Sin dejar de trabajar</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <span>Proceso rápido y sencillo</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4">
                  Solicitar Información
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-900 text-lg px-8 py-4">
                  Ver Licenciaturas
                </Button>
              </div>
            </div>

            {/* Formulario Principal */}
            <div className="lg:block">
              <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-center text-blue-900">
                    Solicita Información Gratuita
                  </CardTitle>
                  <CardDescription className="text-center">
                    Te contactaremos en menos de 24 horas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nombre">Nombre completo *</Label>
                        <Input 
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => handleInputChange('nombre', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefono">Teléfono *</Label>
                        <Input 
                          id="telefono"
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => handleInputChange('telefono', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="licenciatura">Licenciatura de interés *</Label>
                        <Select onValueChange={(value) => handleInputChange('licenciatura', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una licenciatura" />
                          </SelectTrigger>
                          <SelectContent>
                            {licenciaturas.map((lic) => (
                              <SelectItem key={lic} value={lic}>{lic}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ciudad">Ciudad *</Label>
                        <Select onValueChange={(value) => handleInputChange('ciudad', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu ciudad" />
                          </SelectTrigger>
                          <SelectContent>
                            {ciudades.map((ciudad) => (
                              <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="experiencia">Años de experiencia laboral</Label>
                      <Select onValueChange={(value) => handleInputChange('experiencia', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tus años de experiencia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-5">3-5 años</SelectItem>
                          <SelectItem value="5-10">5-10 años</SelectItem>
                          <SelectItem value="10+">Más de 10 años</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-lg py-3">
                      Enviar Solicitud
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      Al enviar este formulario aceptas nuestros términos y condiciones
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Problema/Solución */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              ¿Tienes experiencia pero te falta el título?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              INEVAP reconoce tu experiencia profesional y te ayuda a obtener tu licenciatura oficial
            </p>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Mejores Oportunidades</h3>
                <p className="text-gray-600">Accede a mejores puestos de trabajo</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Aumento Salarial</h3>
                <p className="text-gray-600">Incrementa tus ingresos significativamente</p>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Reconocimiento</h3>
                <p className="text-gray-600">Obtén el reconocimiento que mereces</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Crecimiento</h3>
                <p className="text-gray-600">Impulsa tu carrera profesional</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section id="proceso" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Proceso Simple en 4 Pasos
            </h2>
            <p className="text-xl text-gray-600">
              Un camino claro hacia tu título profesional
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Elige tu Licenciatura</h3>
              <p className="text-gray-600">
                9 opciones disponibles con asesoría personalizada para elegir la mejor opción
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Prepárate con Nuestras Guías</h3>
              <p className="text-gray-600">
                Material de estudio especializado y asesorías flexibles adaptadas a tu horario
              </p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Presenta 2 Exámenes</h3>
              <p className="text-gray-600">
                Examen escrito (opción múltiple) y examen oral (caso práctico) en fines de semana
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recibe tu Título Oficial</h3>
              <p className="text-gray-600">
                Título con validez en toda la República Mexicana, reconocido por la SEP
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Licenciaturas */}
      <section id="licenciaturas" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              9 Licenciaturas e Ingenierías Disponibles
            </h2>
            <p className="text-xl text-gray-600">
              Encuentra la licenciatura que se adapte a tu experiencia profesional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {licenciaturas.map((licenciatura, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{licenciatura}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Acredita tus conocimientos y experiencia en esta área profesional
                  </p>
                  <Button variant="outline" className="w-full">
                    Más Información
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ventajas */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por Qué Elegir INEVAP?
            </h2>
            <p className="text-xl text-gray-600">
              Somos líderes en acreditación de conocimientos por experiencia laboral
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">98%</h3>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">de Aprobación</h4>
              <p className="text-gray-600">Tasa de éxito comprobada con metodología efectiva</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-blue-600 mb-2">100%</h3>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Flexibilidad</h4>
              <p className="text-gray-600">Exámenes en fines de semana, sin dejar de trabajar</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-600 mb-2">SEP</h3>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Validez Oficial</h4>
              <p className="text-gray-600">Acuerdo 286 SEP con reconocimiento nacional</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-purple-600 mb-2">+5</h3>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Años de Experiencia</h4>
              <p className="text-gray-600">Miles de profesionales titulados exitosamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section id="testimonios" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lo Que Dicen Nuestros Egresados
            </h2>
            <p className="text-xl text-gray-600">
              Historias reales de éxito profesional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonios.map((testimonio, index) => (
              <Card key={index} className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonio.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonio.testimonio}"</p>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900">{testimonio.nombre}</h4>
                    <p className="text-sm text-gray-500">{testimonio.licenciatura}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-gray-600">
              Resolvemos tus dudas más comunes
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.pregunta}</h3>
                  <p className="text-gray-600">{faq.respuesta}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para Obtener tu Título?
            </h2>
            <p className="text-xl text-blue-100">
              Contáctanos hoy mismo y comienza tu proceso de titulación
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <Phone className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">WhatsApp</h3>
              <a href="https://wa.me/523339498607" className="text-green-400 hover:text-green-300">
                33 3949 8607
              </a>
            </div>
            <div>
              <Mail className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <a href="mailto:info@inevap.com" className="text-blue-400 hover:text-blue-300">
                info@inevap.com
              </a>
            </div>
            <div>
              <MapPin className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sedes</h3>
              <p className="text-blue-100">Guadalajara, Cancún, Tijuana, Monterrey</p>
            </div>
            <div>
              <GraduationCap className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Horarios</h3>
              <p className="text-blue-100">Lun-Vie: 9:00-18:00<br />Sáb: 9:00-14:00</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4">
              Solicitar Información Ahora
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={logoInevap} alt="INEVAP" className="h-8 w-8" />
                <span className="text-2xl font-bold">INEVAP</span>
              </div>
              <p className="text-gray-400 mb-4">
                Instituto de Evaluación y Acreditación Profesional. Líderes en titulación por experiencia laboral.
              </p>
              <div className="flex items-center space-x-4">
                <img src={logoSep} alt="SEP" className="h-12 opacity-80" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Licenciaturas</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Administración</li>
                <li>Contaduría</li>
                <li>Derecho</li>
                <li>Mercadotecnia</li>
                <li>Pedagogía</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Acuerdo 286</a></li>
                <li><a href="#" className="hover:text-white">Proceso</a></li>
                <li><a href="#" className="hover:text-white">Testimonios</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Aviso de Privacidad</a></li>
                <li><a href="#" className="hover:text-white">Términos y Condiciones</a></li>
                <li><a href="#" className="hover:text-white">Política de Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 INEVAP. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

