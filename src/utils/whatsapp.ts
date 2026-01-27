import { Patient } from '@/types/patient';
import { AppointmentWithClinic } from '@/types/clinic';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface WhatsAppMessage {
  phone: string;
  message: string;
  whatsappUrl: string;
}

export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove all non-numeric characters
  const numbers = phone.replace(/\D/g, '');
  
  // Add Brazil country code if not present
  if (numbers.length === 11) {
    return `55${numbers}`;
  } else if (numbers.length === 10) {
    // Old format without 9
    return `55${numbers}`;
  }
  
  return numbers;
};

export const generateConfirmationMessage = (
  patient: Patient,
  appointment: AppointmentWithClinic
): string => {
  const formattedDate = format(parseISO(appointment.date), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  
  const message = `Olá, ${patient.name.split(' ')[0]}! 👋

Gostaríamos de confirmar sua consulta agendada:

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${appointment.time}
👨‍⚕️ *Profissional:* ${appointment.professional}
📋 *Procedimento:* ${appointment.procedure}

🏥 *Local:*
${appointment.clinic.name}
📍 ${appointment.clinic.address}

Por favor, confirme se você comparecerá à consulta respondendo:
✅ *SIM* - Confirmo minha presença
❌ *NÃO* - Não poderei comparecer

Caso precise reagendar, entre em contato conosco pelo telefone ${appointment.clinic.phone}.

Agradecemos a confirmação! 😊`;

  return message;
};

export const generateWhatsAppUrl = (phone: string, message: string): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

export const prepareWhatsAppMessage = (
  patient: Patient,
  appointment: AppointmentWithClinic
): WhatsAppMessage => {
  const message = generateConfirmationMessage(patient, appointment);
  const formattedPhone = formatPhoneForWhatsApp(patient.phone);
  const whatsappUrl = generateWhatsAppUrl(patient.phone, message);
  
  return {
    phone: formattedPhone,
    message,
    whatsappUrl,
  };
};
