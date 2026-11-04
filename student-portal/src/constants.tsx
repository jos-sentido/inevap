
import React from 'react';
import {
  FileText,
  CreditCard,
  BookOpen,
  MessageSquare,
  Calendar,
  Award,
  Sparkles
} from 'lucide-react';

export const COLORS = {
  primary: '#2B5299', // Dark Navy from logo
  secondary: '#00ADEF', // Bright blue from brochure
  accent: '#F8FAFC',
  text: '#1E293B',
  border: '#E2E8F0'
};

export const STAGES_CONFIG = [
  {
    id: 0,
    title: 'Bienvenida',
    description: 'Cuéntanos de ti y conoce cómo funciona el proceso.',
    icon: <Sparkles size={20} />
  },
  {
    id: 1,
    title: 'Admisión',
    description: 'Carga de documentos oficiales (INE, CURP, Bachillerato).',
    icon: <FileText size={20} />
  },
  {
    id: 2,
    title: 'Inscripción',
    description: 'Selección de Licenciatura y plan de pagos.',
    icon: <CreditCard size={20} />
  },
  {
    id: 3,
    title: 'Estudio',
    description: 'Acceso a guías y materiales del EGA-286.',
    icon: <BookOpen size={20} />
  },
  {
    id: 4,
    title: 'Preparación Oral',
    description: 'Asistente IA para redacción de Memoria Descriptiva.',
    icon: <MessageSquare size={20} />
  },
  {
    id: 5,
    title: 'Agendado',
    description: 'Selección de fechas para exámenes teórico y oral.',
    icon: <Calendar size={20} />
  },
  {
    id: 6,
    title: 'Certificación',
    description: 'Trámite final de título profesional ante la SEP.',
    icon: <Award size={20} />
  }
];

export const LICENCIATURAS = [
  'Administración',
  'Comercio y Negocios Internacionales',
  'Contaduría',
  'Derecho',
  'Mercadotecnia',
  'Pedagogía',
  'Educación Preescolar',
  'Ingeniería Industrial',
  'Ingeniería Computacional'
];
