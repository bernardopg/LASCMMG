import { FaFacebook, FaGithub, FaInstagram, FaTwitter } from 'react-icons/fa';

export const socialLinks = [
  {
    name: 'Facebook',
    url: 'https://facebook.com', // Placeholder, update with actual link
    icon: FaFacebook, // Store the component reference
    label: 'Visite nossa página no Facebook',
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com', // Placeholder, update with actual link
    icon: FaInstagram, // Store the component reference
    label: 'Siga-nos no Instagram',
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com', // Placeholder, update with actual link
    icon: FaTwitter, // Store the component reference
    label: 'Siga-nos no Twitter',
  },
  {
    name: 'GitHub',
    url: 'https://github.com', // Placeholder, update with actual link
    icon: FaGithub, // Store the component reference
    label: 'Acesse nosso repositório no GitHub',
  },
];

export const footerLinks = [
  { name: 'Sobre', path: '/about' },
  { name: 'Contato', path: '/contact' },
  { name: 'Política de Privacidade', path: '/privacy' },
  { name: 'Termos de Uso', path: '/terms' },
];
